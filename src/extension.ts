import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

type MarkedFile = {
    path: string;
};

const harpoonFiles: MarkedFile[] = [];

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        "harpoon.markfile",
        () => {
            const activateEditor = vscode.window.activeTextEditor;

            if (activateEditor) {
                const filePath = activateEditor.document.fileName as string;

                const isMarked: boolean = harpoonFiles.some(
                    (currentFile: MarkedFile) =>
                        currentFile.path === relativePath
                );

                const relativePath = vscode.workspace.asRelativePath(filePath);
                if (isMarked) {
                    return vscode.window.showInformationMessage(
                        "Already marked!"
                    );
                }
                harpoonFiles.push({ path: relativePath });
                // Update harpoon
                vscode.commands.executeCommand("harpoon.refresh");
                vscode.window.showInformationMessage(
                    `Marked File: ${relativePath}`
                );
            } else {
                console.error("Chale ja bsdk");
            }
        }
    );
    let newView = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        10
    );
    newView.command = "harpoon.focus";
    newView.text = "HARPOON";
    newView.show();

    // registering a new view
    const treeDataProvider = new HarpoonTreeDataProvider();
    vscode.window.createTreeView("harpoonview", { treeDataProvider });

    context.subscriptions.push(newView);
    context.subscriptions.push(disposable);
}

class HarpoonTreeDataProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | null> =
        new vscode.EventEmitter<string | null>();
    readonly onDidChangeTreeData: vscode.Event<string | null> =
        this._onDidChangeTreeData.event;

    getTreeItem(element: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
        };
    }

    getChildren(element?: string | undefined): vscode.ProviderResult<string[]> {
        return harpoonFiles.map((markedFile) => markedFile.path);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(null);
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
