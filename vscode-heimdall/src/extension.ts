import * as vscode from 'vscode';
import {autoCompleteTrigger } from './tracker';

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
}
export function deactivate() { }