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

// import * as vscode from 'vscode';

// let trackedInsertions: Record<string, string> = {};
// let mostRecentChange: { line: string, text: string } | null = null;

// export function startTracking(context: vscode.ExtensionContext) {
//     const timeouts: Record<string, NodeJS.Timeout> = {};

//     // Listen for the execution of the 'editor.action.inlineSuggest' command
//     context.subscriptions.push(
//         vscode.commands.registerCommand('editor.action.inlineSuggest', async (...args) => {
//             logMetric("editor.action.inlineSuggest command executed.", { args });
//         })
//     );
//      vscode.window.in
//     vscode.window.onDidChangeTextEditorInlineCompletionVisible(event => {
//         if (event.visible) {
//             logMetric("VSCode Copilot suggestion is visible.", {
//                 document: event.textEditor.document.uri.fsPath,
//                 timestamp: new Date().toLocaleString()
//             });
//         }
//     });
//     vscode.workspace.onDidChangeTextDocument(event => {
//         const doc = event.document;
//         const changes = event.contentChanges;
//         const totalLength = changes.reduce((sum, change) => sum + change.text.length, 0);

//         if (changes !== null && totalLength > 1) {
//             logMetric("A non-typing change was detected.");
//             changes.forEach(change => {
//                 const text = change.text;
//                 const line = `${doc.uri.fsPath}:${change.range.start.line}`;
//                 mostRecentChange = { line, text };

//                 const lines = text.split(/\r?\n/);
//                 let currentLineOffset = change.range.start.line;

//                 lines.forEach((lineText, index) => {
//                     if (index > 0) {
//                         currentLineOffset++;
//                     }

//                     const line = `${doc.uri.fsPath}:${currentLineOffset}`;
//                     trackedInsertions[line] = lineText;
//                 });
//             });
//         }

//         changes.forEach(change => {
//             const line = `${doc.uri.fsPath}:${change.range.start.line}`;
//             if (trackedInsertions[line]) {
//                 logMetric("You are on a line with AI-generated code.");
//                 const prevLine = trackedInsertions[line];
//                 const newLine = doc.lineAt(change.range.start.line).text;

//                 if (timeouts[line]) {
//                     clearTimeout(timeouts[line]);
//                 }

//                 timeouts[line] = setTimeout(() => {
//                     const isChanged = prevLine !== newLine;
//                     logMetric("AI code was modified by user.", { line, isChanged });
//                     delete timeouts[line];
//                 }, 5000);
//                 trackedInsertions[line] = newLine;
//             }
//         });
//     });
// }

// export async function evaluateUse(textBetween: string) {
//     if (mostRecentChange) {
//         logMetric("Auto-Complete Triggered!", {
//             line,
//             textBetween,
//             timestamp: new Date().toLocaleString()
//         });
//     }
// }

// export async function autoCompleteTrigger(startLine: numbercontext: vscode.ExtensionContext) {
//     const editor = vscode.window.activeTextEditor;
//     const start = editor ? editor.selection.start : undefined;
//     await vscode.commands.executeCommand('editor.action.inlineSuggest.commit');
//     const end = editor ? editor.selection.end : undefined;

//     let textBetween = '';
//     if (editor && start && end) {
//         const range = new vscode.Range(start, end);
//         textBetween = editor.document.getText(range);
//     }
//     await evaluateUse(start?.line, end?.line, textBetween);
// }

// function logMetric(eventType: string, data: any = null) {
//     vscode.window.showInformationMessage(`Event: ${eventType}, Data: ${JSON.stringify(data)}`);
// }