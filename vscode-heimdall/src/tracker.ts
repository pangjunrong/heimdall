import * as vscode from 'vscode';

export async function evaluateUse(startLine: number | undefined, endLine: number | undefined, textBetween: string) {
    
    if (textBetween) {
        logMetric("Auto-Complete Triggered!", {
            startLine,
            endLine,
            textBetween,
            timestamp: new Date().toLocaleString()
        });
    }
}

export async function autoCompleteTrigger(context: vscode.ExtensionContext) {
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

function logMetric(eventType: string, data: any = null) {
    vscode.window.showInformationMessage(`Event: ${eventType}, Data: ${JSON.stringify(data)}`);
}