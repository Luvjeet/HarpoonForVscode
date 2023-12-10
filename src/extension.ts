import * as vscode from "vscode";

type MarkedFile = {
    relPath: string;
    absPath: string;
};

const harpoonFiles: MarkedFile[] = [];

function handleOpenMarkedFileAtIndex(index: number) {
    if (index > 0 && index <= harpoonFiles.length) {
        const filePath = harpoonFiles[index - 1].absPath;
        vscode.workspace.openTextDocument(filePath).then((document) => {
            vscode.window.showTextDocument(document);
        });
    } else {
        vscode.window.showWarningMessage("No marked files available.");
    }
}
function showTemporaryMessage(message: string, duration: number) {
    // Create a status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = message;
    statusBarItem.show();

    // Set a timeout to hide the status bar item after the specified duration
    setTimeout(() => {
        statusBarItem.hide();
        statusBarItem.dispose(); // Dispose the status bar item to clean up resources
    }, duration);
}

export function activate(context: vscode.ExtensionContext) {
    let refreshCommandDisposable: vscode.Disposable | undefined;

    function registerRefreshCommand() {
        if (!refreshCommandDisposable) {
            refreshCommandDisposable = vscode.commands.registerCommand(
                "harpoon.refreshTree",
                () => treeDataProvider.refresh()
            );
            context.subscriptions.push(refreshCommandDisposable);
        }
    }
    const openMarkedFileDisposable = vscode.commands.registerCommand(
        "harpoon.openMarkedFileAtIndex",
        ({ index }: { index: number }) => handleOpenMarkedFileAtIndex(index)
    );
    context.subscriptions.push(openMarkedFileDisposable);
    const disposable = vscode.commands.registerCommand(
        "harpoon.markfile",
        () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const filePath = activeEditor.document.fileName as string;
                const relativePath = vscode.workspace.asRelativePath(filePath);

                const isMarked: boolean = harpoonFiles.some(
                    (currentFile: MarkedFile) =>
                        currentFile.relPath === relativePath
                );

                if (!isMarked) {
                    harpoonFiles.push({
                        relPath: relativePath,
                        absPath: filePath,
                    });
                    // Update harpoon
                    registerRefreshCommand();
                    showTemporaryMessage(`Marked File: ${relativePath}`, 2000);
                    const areMarkedFilesAvailable = harpoonFiles.length > 0;
                    if (areMarkedFilesAvailable) {
                        handleOpenMarkedFileAtIndex;
                    }
                    // Set context variable based on whether there are marked files
                    vscode.commands.executeCommand(
                        "setContext",
                        "harpoonFilesAvailable",
                        areMarkedFilesAvailable
                    );
                } else {
                    showTemporaryMessage("Already marked!", 2000);
                }
            } else {
                vscode.window.showWarningMessage("Please Wait...");
            }
        }
    );
    const deleteMarkedFileDisposable = vscode.commands.registerCommand(
        "harpoon.deleteMarkedFile",
        (selectedFile: string) =>
            treeDataProvider.deleteMarkedFile(selectedFile)
    );
    context.subscriptions.push(deleteMarkedFileDisposable);

    // registering a new view
    const treeDataProvider = new HarpoonTreeDataProvider();
    const treeView = vscode.window.createTreeView("harpoonview", {
        treeDataProvider,
    });

    treeView.onDidChangeVisibility(() => {
        if (treeView.visible) {
            treeDataProvider.refresh();
        }
    });
    context.subscriptions.push(treeView);
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
        return harpoonFiles.map((markedFile) => markedFile.relPath);
    }

    deleteMarkedFile(selectedFile: string) {
        const index = harpoonFiles.findIndex(
            (file) => file.absPath === selectedFile
        );
        if (index !== -1) {
            harpoonFiles.splice(index, 1);
            this.refresh();
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire("harpoon.refreshTree");
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
