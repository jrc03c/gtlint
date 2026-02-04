import * as vscode from 'vscode';
export declare class GTLintCodeActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds: vscode.CodeActionKind[];
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, _token: vscode.CancellationToken): Promise<vscode.CodeAction[]>;
    private getMessageRange;
    private getFixTitle;
    private createQuickFix;
}
//# sourceMappingURL=codeActions.d.ts.map