import streamlit as st
import asyncio
import websockets
import json

st.title("Live Metrics Dashboard")

placeholder = st.empty()

async def listen():
    uri = "ws://localhost:8000/ws/metrics"
    async with websockets.connect(uri) as websocket:
        while True:
            data = await websocket.recv()
            metric = json.loads(data)
            placeholder.write(metric)

def run():
    asyncio.run(listen())

st.button("Start Streaming", on_click=run)