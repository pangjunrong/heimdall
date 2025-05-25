from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import sqlite3
import os
import asyncio
import json

# SQLite setup (persistent, WAL mode)
SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), '../db/metrics.sqlite3')
os.makedirs(os.path.dirname(SQLITE_DB_PATH), exist_ok=True)
conn = sqlite3.connect(SQLITE_DB_PATH, check_same_thread=False)
conn.execute('PRAGMA journal_mode=WAL;')
conn.execute('''
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    data TEXT
)
''')
# Add a table to store last lineText for each line
conn.execute('''
CREATE TABLE IF NOT EXISTS line_vectors (
    line INTEGER PRIMARY KEY,
    lineText TEXT
)
''')

# Levenshtein distance function
# (pure python, no external dependency)
def levenshtein(a, b):
    if a == b:
        return 0
    if len(a) == 0:
        return len(b)
    if len(b) == 0:
        return len(a)
    v0 = list(range(len(b) + 1))
    v1 = [0] * (len(b) + 1)
    for i in range(len(a)):
        v1[0] = i + 1
        for j in range(len(b)):
            cost = 0 if a[i] == b[j] else 1
            v1[j + 1] = min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost)
        v0, v1 = v1, v0
    return v0[len(b)]

# FastAPI app
app = FastAPI()

# Store connected WebSocket clients
dashboard_clients = set()

@app.get('/metrics')
def list_metrics():
    results = conn.execute('SELECT id, event_type, data FROM metrics').fetchall()
    out = []
    for r in results:
        try:
            data = json.loads(r[2])
            line = data.get('line')
            lineText = data.get('lineText')
            # Get last lineText for this line
            cur = conn.execute('SELECT lineText FROM line_vectors WHERE line = ?', (line,))
            row = cur.fetchone()
            percent_change = None
            if row:
                prev = row[0]
                dist = levenshtein(prev, lineText)
                max_len = max(len(prev), len(lineText))
                percent_change = (dist / max_len) * 100 if max_len > 0 else 0
            # Update last lineText
            conn.execute('INSERT OR REPLACE INTO line_vectors (line, lineText) VALUES (?, ?)', (line, lineText))
            conn.commit()
            out.append({"id": r[0], "event_type": r[1], "data": data, "percent_change": percent_change})
        except Exception:
            out.append({"id": r[0], "event_type": r[1], "data": r[2], "percent_change": None})
    return out

@app.websocket('/ws/metrics')
async def websocket_metrics(websocket: WebSocket):
    await websocket.accept()
    dashboard_clients.add(websocket)
    try:
        last_id = 0
        while True:
            await asyncio.sleep(1)  # Poll every second
            results = conn.execute('SELECT id, event_type, data FROM metrics WHERE id > ? ORDER BY id ASC', (last_id,)).fetchall()
            for r in results:
                try:
                    data = json.loads(r[2])
                    line = data.get('line')
                    lineText = data.get('lineText')
                    cur = conn.execute('SELECT lineText FROM line_vectors WHERE line = ?', (line,))
                    row = cur.fetchone()
                    percent_change = None
                    if row:
                        prev = row[0]
                        dist = levenshtein(prev, lineText)
                        max_len = max(len(prev), len(lineText))
                        percent_change = (dist / max_len) * 100 if max_len > 0 else 0
                    conn.execute('INSERT OR REPLACE INTO line_vectors (line, lineText) VALUES (?, ?)', (line, lineText))
                    conn.commit()
                    await websocket.send_json({"id": r[0], "event_type": r[1], "data": data, "percent_change": percent_change})
                except Exception:
                    await websocket.send_json({"id": r[0], "event_type": r[1], "data": r[2], "percent_change": None})
                last_id = r[0]
    except WebSocketDisconnect:
        dashboard_clients.remove(websocket)
    except Exception:
        dashboard_clients.remove(websocket)
        raise