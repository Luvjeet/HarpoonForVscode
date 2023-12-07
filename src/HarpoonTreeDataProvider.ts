import * as vscode from "vscode";

class HarpoonTreeDataProvider implements vscode.TreeDataProvider<string> {
    private _onDidChangeTreeData: vscode.EventEmitter<string | null> =
        new vscode.EventEmitter<string | null>();
    public get onDidChangeTreeData(): vscode.EventEmitter<string | null> {
        return this._onDidChangeTreeData;
    }
    public set onDidChangeTreeData(value: vscode.EventEmitter<string | null>) {
        this._onDidChangeTreeData = value;
    }
    readonly onDidChangeTreeData: vscode.Event<string | null> =
        this.onDidChangeTreeData.event;

    getTreeItem(element: string): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return {
            label: element,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
        };
    }

    getChildren(element?: string | undefined): vscode.ProviderResult<string[]> {
        return markedFiles.map((markedFile) => markedFile.filePath);
    }

    refresh(): void {
        this.onDidChangeTreeData.fire(null);
    }
}
