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
        vscode.StatusBarAlignment.Right
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
    // registering a new view
    const treeDataProvider = new HarpoonTreeDataProvider();
    const treeView = vscode.window.createTreeView("harpoonview", {
        treeDataProvider,
        showCollapseAll: true,
    });

    treeView.onDidChangeVisibility(() => {
        if (treeView.visible) {
            treeDataProvider.refresh();
        }
    });

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
                const fileType = filePath.split("").pop() || "default";

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
                    treeDataProvider.refresh();
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
    const moveMarkedFileDisposable = vscode.commands.registerCommand(
        "harpoon.moveMarkedFile",
        (selectedFile: string) => treeDataProvider.moveMarkedFile(selectedFile)
    );
    context.subscriptions.push(deleteMarkedFileDisposable);
    context.subscriptions.push(moveMarkedFileDisposable);
    context.subscriptions.push(treeView);
    context.subscriptions.push(disposable);
}

class HarpoonTreeDataProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<
        undefined | null | void | string
    > = new vscode.EventEmitter<undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<
        undefined | null | void | string
    > = this._onDidChangeTreeData.event;

    getTreeItem(element: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
        };
    }

    getChildren(element?: string | undefined): vscode.ProviderResult<string[]> {
        return harpoonFiles.map((markedFile) => markedFile.relPath);
    }

    moveMarkedFile(selectedFile: string) {
        vscode.window
            .showInputBox({
                prompt: "Enter the new index value for the marked file",
                value: "1", //default value
            })
            .then((value) => {
                if (value) {
                    const newIndex = parseInt(value);
                    if (
                        !isNaN(newIndex) &&
                        newIndex > 0 &&
                        newIndex <= harpoonFiles.length
                    ) {
                        // Move the file to the new index
                        const index = harpoonFiles.findIndex(
                            (file) => file.relPath === selectedFile
                        );
                        if (index !== -1) {
                            const [movedFile] = harpoonFiles.splice(index, 1);
                            harpoonFiles.splice(newIndex - 1, 0, movedFile);
                            this.refresh();
                        }
                    } else {
                        vscode.window.showErrorMessage(
                            "Invalid index. Please enter a valid index."
                        );
                    }
                }
            });
    }

    deleteMarkedFile(selectedFile: string) {
        const index = harpoonFiles.findIndex(
            (file) => file.relPath === selectedFile
        );
        if (index !== -1) {
            harpoonFiles.splice(index, 1);
            this.refresh();
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire("");
    }
}

// This method is called when your extension is deactivated
export function deactivate() {}
