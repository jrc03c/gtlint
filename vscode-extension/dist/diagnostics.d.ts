import * as vscode from 'vscode';
/**
 * Schedule linting with debouncing for on-type linting
 */
export declare function scheduleLint(document: vscode.TextDocument, delay: number): void;
/**
 * Lint immediately (for on-save)
 */
export declare function lintNow(document: vscode.TextDocument): void;
/**
 * Clear diagnostics for a document
 */
export declare function clearDiagnostics(document: vscode.TextDocument): void;
/**
 * Get the diagnostic collection (for use by code actions)
 */
export declare function getDiagnosticCollection(): vscode.DiagnosticCollection;
/**
 * Lint all open GuidedTrack documents
 */
export declare function lintAllOpen(): void;
/**
 * Dispose of the diagnostic collection
 */
export declare function dispose(): void;
//# sourceMappingURL=diagnostics.d.ts.map