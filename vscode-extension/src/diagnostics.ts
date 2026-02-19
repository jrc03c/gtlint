import * as vscode from 'vscode';
import { Linter } from '@jrc03c/gtlint';
import type { LintMessage, LinterConfig } from '@jrc03c/gtlint';
import { getConfigForDocument } from './configuration';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('gtlint');

// Map from document URI to timeout handle for debouncing
const pendingDiagnostics = new Map<string, NodeJS.Timeout>();

/**
 * Convert LintMessage severity to VSCode DiagnosticSeverity
 */
function toSeverity(severity: 'error' | 'warning' | 'info'): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
    case 'info':
      return vscode.DiagnosticSeverity.Information;
  }
}

/**
 * Convert LintMessage to VSCode Diagnostic
 * Note: LintMessage.line is 1-indexed, VSCode Range is 0-indexed
 * Note: LintMessage.line and LintMessage.column are both 1-indexed; VSCode Range is 0-indexed
 */
function toDiagnostic(message: LintMessage, document: vscode.TextDocument): vscode.Diagnostic {
  // Convert 1-indexed line/column to 0-indexed
  const startLine = Math.max(0, message.line - 1);
  const startColumn = Math.max(0, message.column - 1);

  // Calculate end position
  let endLine = startLine;
  let endColumn = startColumn + 1;

  if (message.endLine !== undefined && message.endColumn !== undefined) {
    endLine = Math.max(0, message.endLine - 1);
    endColumn = Math.max(0, message.endColumn - 1);
  } else {
    // If no end position, extend to end of word or reasonable default
    const line = document.lineAt(startLine);
    const lineText = line.text;
    // Find the end of the word at the error position
    let wordEnd = startColumn;
    while (wordEnd < lineText.length && /\w/.test(lineText[wordEnd])) {
      wordEnd++;
    }
    endColumn = Math.max(wordEnd, startColumn + 1);
  }

  const range = new vscode.Range(
    new vscode.Position(startLine, startColumn),
    new vscode.Position(endLine, endColumn)
  );

  const diagnostic = new vscode.Diagnostic(range, message.message, toSeverity(message.severity));
  diagnostic.source = 'gtlint';
  diagnostic.code = message.ruleId;

  return diagnostic;
}

/**
 * Run linting on a document and update diagnostics
 */
async function lintDocument(document: vscode.TextDocument): Promise<void> {
  // Only lint GuidedTrack files
  if (document.languageId !== 'guidedtrack') {
    return;
  }

  const { linter: linterConfig, settings } = await getConfigForDocument(document);

  if (!settings.enable) {
    diagnosticCollection.delete(document.uri);
    return;
  }

  const source = document.getText();
  const linter = new Linter(linterConfig);
  const result = linter.lint(source, document.uri.fsPath);

  const diagnostics = result.messages.map((msg) => toDiagnostic(msg, document));
  diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Schedule linting with debouncing for on-type linting
 */
export function scheduleLint(document: vscode.TextDocument, delay: number): void {
  const uri = document.uri.toString();

  // Clear any pending lint for this document
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
  }

  // Schedule new lint
  const timeout = setTimeout(() => {
    pendingDiagnostics.delete(uri);
    lintDocument(document);
  }, delay);

  pendingDiagnostics.set(uri, timeout);
}

/**
 * Lint immediately (for on-save)
 */
export function lintNow(document: vscode.TextDocument): void {
  const uri = document.uri.toString();

  // Clear any pending lint
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
    pendingDiagnostics.delete(uri);
  }

  lintDocument(document);
}

/**
 * Clear diagnostics for a document
 */
export function clearDiagnostics(document: vscode.TextDocument): void {
  const uri = document.uri.toString();

  // Clear any pending lint
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
    pendingDiagnostics.delete(uri);
  }

  diagnosticCollection.delete(document.uri);
}

/**
 * Get the diagnostic collection (for use by code actions)
 */
export function getDiagnosticCollection(): vscode.DiagnosticCollection {
  return diagnosticCollection;
}

/**
 * Lint all open GuidedTrack documents
 */
export function lintAllOpen(): void {
  for (const document of vscode.workspace.textDocuments) {
    if (document.languageId === 'guidedtrack') {
      lintDocument(document);
    }
  }
}

/**
 * Dispose of the diagnostic collection
 */
export function dispose(): void {
  // Clear all pending timeouts
  for (const timeout of pendingDiagnostics.values()) {
    clearTimeout(timeout);
  }
  pendingDiagnostics.clear();

  diagnosticCollection.dispose();
}
