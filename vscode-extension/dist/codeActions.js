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
exports.GTLintCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
const gt_lint_1 = require("gt-lint");
const configuration_1 = require("./configuration");
class GTLintCodeActionProvider {
    async provideCodeActions(document, range, context, _token) {
        const { linter: linterConfig, settings } = await (0, configuration_1.getConfigForDocument)(document);
        if (!settings.enable) {
            return [];
        }
        // Get lint results to find fixes
        const source = document.getText();
        const linter = new gt_lint_1.Linter(linterConfig);
        const result = linter.lint(source, document.uri.fsPath);
        const actions = [];
        // Find messages that overlap with the requested range and have fixes
        for (const message of result.messages) {
            if (!message.fix) {
                continue;
            }
            // Check if this message is within the requested range
            const messageRange = this.getMessageRange(message, document);
            if (!messageRange.intersection(range)) {
                continue;
            }
            // Create a quick fix action
            const action = this.createQuickFix(document, message, message.fix);
            actions.push(action);
        }
        // Also check for diagnostics from the context (in case our cached results are stale)
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.source !== 'gtlint') {
                continue;
            }
            // Find the corresponding message with fix
            const message = result.messages.find((m) => m.ruleId === diagnostic.code &&
                m.line - 1 === diagnostic.range.start.line &&
                m.fix);
            if (message?.fix) {
                // Check we haven't already added this fix
                const alreadyAdded = actions.some((a) => a.title === `Fix: ${message.message}` ||
                    a.title === this.getFixTitle(message));
                if (!alreadyAdded) {
                    const action = this.createQuickFix(document, message, message.fix);
                    action.diagnostics = [diagnostic];
                    actions.push(action);
                }
            }
        }
        return actions;
    }
    getMessageRange(message, document) {
        const startLine = Math.max(0, message.line - 1);
        const startColumn = message.column;
        const endLine = message.endLine !== undefined ? Math.max(0, message.endLine - 1) : startLine;
        const endColumn = message.endColumn !== undefined ? message.endColumn : startColumn + 1;
        return new vscode.Range(new vscode.Position(startLine, startColumn), new vscode.Position(endLine, endColumn));
    }
    getFixTitle(message) {
        // Create a user-friendly title based on the rule
        switch (message.ruleId) {
            case 'no-undefined-vars':
                return `Define variable mentioned in error`;
            case 'indent-style':
                return `Fix indentation`;
            case 'no-unclosed-string':
                return `Close string`;
            case 'no-unclosed-bracket':
                return `Close bracket`;
            default:
                return `Fix: ${message.message}`;
        }
    }
    createQuickFix(document, message, fix) {
        const title = this.getFixTitle(message);
        const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
        // Convert fix range (character offsets) to VSCode range
        const startPos = document.positionAt(fix.range[0]);
        const endPos = document.positionAt(fix.range[1]);
        const range = new vscode.Range(startPos, endPos);
        // Create the edit
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, range, fix.text);
        action.edit = edit;
        // Mark as preferred if it's the only fix for this diagnostic
        action.isPreferred = true;
        return action;
    }
}
exports.GTLintCodeActionProvider = GTLintCodeActionProvider;
GTLintCodeActionProvider.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
//# sourceMappingURL=codeActions.js.map