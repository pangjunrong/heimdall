import * as vscode from 'vscode';

let trackedInsertions: Record<string, string> = {};

 // This wrapper method is called when the user triggers the auto-complete action from GitHub Copilot
export async function autoCompleteTrigger(context: vscode.ExtensionContext) {
    // We track the before & after caret position to determine the range of text that was auto-completed
    const editor = vscode.window.activeTextEditor;
    const start = editor ? editor.selection.start : undefined;
    await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
    const end = editor ? editor.selection.end : undefined;

    let textBetween = '';
    if (editor && start && end) {
        const range = new vscode.Range(start, end);
        textBetween = editor.document.getText(range);
    }
    await evaluateUse(start?.line, end?.line, textBetween);
}

export function monitorModifiedLines() {
    const timeouts: Record<number, NodeJS.Timeout> = {};
    let lastLine: number | undefined = undefined;

    return vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        const currentLine = editor.selection.active.line;

        // Check if the last line was tracked and has changed
        if (
            lastLine !== undefined &&
            trackedInsertions[lastLine] !== undefined &&
            editor.document.lineAt(lastLine).text !== trackedInsertions[lastLine]
        ) {
            if (timeouts[lastLine]) {
                clearTimeout(timeouts[lastLine]);
            }
            // Use a closure to capture the correct line number
            const lineToCheck = lastLine;
            timeouts[lineToCheck] = setTimeout(() => {
                const lineText = editor.document.lineAt(lineToCheck).text;
                logMetric("There was change detected on a generated line.", { line: lineToCheck, lineText });
                delete timeouts[lineToCheck];
                delete trackedInsertions[lineToCheck];
            }, 5000);
        }

        lastLine = currentLine;
    });
}

async function evaluateUse(startLine: number | undefined, endLine: number | undefined, textBetween: string) {
    // We split the text into lines and track the insertions
    if (typeof startLine === 'number' && typeof endLine === 'number' && textBetween) {
        const newlineMatch = textBetween.match(/\r\n|\n|\r/);
        const newline = newlineMatch ? newlineMatch[0] : '\n';
        const splitLines = textBetween.split(newline);
        for (let i = 0; i < splitLines.length; i++) {
            const lineNumber = startLine + i;
            trackedInsertions[lineNumber] = splitLines[i];
        }

        console.log("The tracked insertions are:", {
            trackedInsertions
        });
    }
    if (textBetween) {
        logMetric("Auto-Complete Triggered!", {
            startLine: startLine !== undefined ? startLine + 1 : undefined,
            endLine: endLine !== undefined ? endLine + 1 : undefined,
            textBetween,
            timestamp: new Date().toLocaleString()
        });
    }
}

function logMetric(eventType: string, data: any = null) {
    vscode.window.showInformationMessage(`Event: ${eventType}, Data: ${JSON.stringify(data)}`);
}
