import * as vscode from 'vscode';
import APIClient from './network/client';

let apiClient: APIClient;
let trackedInsertions: Record<string, string> = {};

// TEMPORARY DEFINITIONS - TESTING PURPOSES
const SERVER_ADDRESS = 'localhost:50051';
const PROTO_PATH = './network/metric.proto';
const PACKAGE_NAME = 'heimdall';
const SERVICE_NAME = 'metricService';
const METHOD_NAME = 'SendMetric';

export function initializeAPIClient() {
    try {
        apiClient = APIClient.getInstance(SERVER_ADDRESS, PROTO_PATH, PACKAGE_NAME, SERVICE_NAME);
        vscode.window.showInformationMessage('✅ gRPC Client Initialized Successfully');
    } catch (error) {
        console.error('❌ Failed to Initialize gRPC Client:', error);
        vscode.window.showInformationMessage(`Failed to Initialize gRPC Client: ${error}`);
    }
}

// This wrapper method is called when the user triggers the auto-complete action from GitHub Copilot
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

export function monitorModifiedLines() {
    const timeouts: Record<number, NodeJS.Timeout> = {};
    let lastLine: number | undefined = undefined;

    return vscode.window.onDidChangeTextEditorSelection(event => {
        const editor = event.textEditor;
        const currentLine = editor.selection.active.line;

        if (
            lastLine !== undefined &&
            trackedInsertions[lastLine] !== undefined &&
            editor.document.lineAt(lastLine).text !== trackedInsertions[lastLine]
        ) {
            if (timeouts[lastLine]) {
                clearTimeout(timeouts[lastLine]);
            }
            const lineToCheck = lastLine;
            timeouts[lineToCheck] = setTimeout(() => {
                const lineText = editor.document.lineAt(lineToCheck).text;
                sendMetric("There was change detected on a generated line.", { line: lineToCheck, lineText });
                delete timeouts[lineToCheck];
                delete trackedInsertions[lineToCheck];
            }, 5000);
        }

        lastLine = currentLine;
    });
}

async function evaluateUse(startLine: number | undefined, endLine: number | undefined, textBetween: string) {
    if (typeof startLine === 'number' && typeof endLine === 'number' && textBetween) {
        const newlineMatch = textBetween.match(/\r\n|\n|\r/);
        const newline = newlineMatch ? newlineMatch[0] : '\n';
        const splitLines = textBetween.split(newline);
        for (let i = 0; i < splitLines.length; i++) {
            const lineNumber = startLine + i;
            trackedInsertions[lineNumber] = splitLines[i];
        }
    }
    if (textBetween) {
        await sendMetric("Auto-Complete Triggered!", {
            startLine: startLine !== undefined ? startLine + 1 : undefined,
            endLine: endLine !== undefined ? endLine + 1 : undefined,
            textBetween,
            timestamp: new Date().toISOString()
        });
    }
}

async function sendMetric(eventType: string, data: any = null) {
    try {
        console.log(`📤 Sending Metric: ${eventType}`);
        console.log(`📊 Data:`, data);

        const response = await apiClient.sendMessage(METHOD_NAME, {
            eventType,
            data: JSON.stringify(data)
        });

        console.log('📥 gRPC Response:', response);
        vscode.window.showInformationMessage(`Metric Sent: ${eventType}`);
    } catch (error) {
        console.error('❌ gRPC Error:', error);
        vscode.window.showErrorMessage(`Failed to Send Metric: ${error}`);
    }
}