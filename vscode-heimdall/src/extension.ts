import * as vscode from 'vscode';
<<<<<<< HEAD
import { initializeAPIClient, autoCompleteTrigger, monitorModifiedLines } from './tracker';

export function activate(context: vscode.ExtensionContext) {
    initializeAPIClient();

=======
import {autoCompleteTrigger, monitorModifiedLines } from './tracker';

export function activate(context: vscode.ExtensionContext) {
>>>>>>> 3f160f910e770c54e0582b6ffeb281b7dc6962ae
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
<<<<<<< HEAD

=======
>>>>>>> 3f160f910e770c54e0582b6ffeb281b7dc6962ae
export function deactivate() { }