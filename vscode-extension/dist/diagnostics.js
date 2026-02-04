"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleLint = scheduleLint;
exports.lintNow = lintNow;
exports.clearDiagnostics = clearDiagnostics;
exports.getDiagnosticCollection = getDiagnosticCollection;
exports.lintAllOpen = lintAllOpen;
exports.dispose = dispose;
const vscode = __importStar(require("vscode"));
const gt_lint_1 = require("gt-lint");
const configuration_1 = require("./configuration");
const diagnosticCollection = vscode.languages.createDiagnosticCollection('gtlint');
// Map from document URI to timeout handle for debouncing
const pendingDiagnostics = new Map();
/**
 * Convert LintMessage severity to VSCode DiagnosticSeverity
 */
function toSeverity(severity) {
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
 * Note: LintMessage.column is 0-indexed, same as VSCode
 */
function toDiagnostic(message, document) {
    // Convert 1-indexed line to 0-indexed
    const startLine = Math.max(0, message.line - 1);
    const startColumn = message.column;
    // Calculate end position
    let endLine = startLine;
    let endColumn = startColumn + 1;
    if (message.endLine !== undefined && message.endColumn !== undefined) {
        endLine = Math.max(0, message.endLine - 1);
        endColumn = message.endColumn;
    }
    else {
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
    const range = new vscode.Range(new vscode.Position(startLine, startColumn), new vscode.Position(endLine, endColumn));
    const diagnostic = new vscode.Diagnostic(range, message.message, toSeverity(message.severity));
    diagnostic.source = 'gtlint';
    diagnostic.code = message.ruleId;
    return diagnostic;
}
/**
 * Run linting on a document and update diagnostics
 */
async function lintDocument(document) {
    // Only lint GuidedTrack files
    if (document.languageId !== 'guidedtrack') {
        return;
    }
    const { linter: linterConfig, settings } = await (0, configuration_1.getConfigForDocument)(document);
    if (!settings.enable) {
        diagnosticCollection.delete(document.uri);
        return;
    }
    const source = document.getText();
    const linter = new gt_lint_1.Linter(linterConfig);
    const result = linter.lint(source, document.uri.fsPath);
    const diagnostics = result.messages.map((msg) => toDiagnostic(msg, document));
    diagnosticCollection.set(document.uri, diagnostics);
}
/**
 * Schedule linting with debouncing for on-type linting
 */
function scheduleLint(document, delay) {
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
function lintNow(document) {
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
function clearDiagnostics(document) {
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
function getDiagnosticCollection() {
    return diagnosticCollection;
}
/**
 * Lint all open GuidedTrack documents
 */
function lintAllOpen() {
    for (const document of vscode.workspace.textDocuments) {
        if (document.languageId === 'guidedtrack') {
            lintDocument(document);
        }
    }
}
/**
 * Dispose of the diagnostic collection
 */
function dispose() {
    // Clear all pending timeouts
    for (const timeout of pendingDiagnostics.values()) {
        clearTimeout(timeout);
    }
    pendingDiagnostics.clear();
    diagnosticCollection.dispose();
}
//# sourceMappingURL=diagnostics.js.map