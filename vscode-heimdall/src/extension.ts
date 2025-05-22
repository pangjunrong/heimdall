import * as vscode from 'vscode';
import {autoCompleteTrigger, monitorModifiedLines } from './tracker';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand("heimdall.startExtension", () => {
            vscode.window.showInformationMessage("Heimdall is now ready to start tracking heuristics.");
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand("heimdall.evaluateUse", () => {
            autoCompleteTrigger(context);
        })
    );
    context.subscriptions.push(
        monitorModifiedLines()
    );
}
export function deactivate() { }