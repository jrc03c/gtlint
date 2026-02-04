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
exports.GTLintFormatterProvider = void 0;
const vscode = __importStar(require("vscode"));
const gt_lint_1 = require("gt-lint");
const configuration_1 = require("./configuration");
class GTLintFormatterProvider {
    async provideDocumentFormattingEdits(document, _options, _token) {
        const { formatter: formatterConfig, settings } = await (0, configuration_1.getConfigForDocument)(document);
        if (!settings.enable) {
            return [];
        }
        const source = document.getText();
        const formatter = new gt_lint_1.Formatter(formatterConfig);
        const formatted = formatter.format(source);
        // If no changes, return empty array
        if (formatted === source) {
            return [];
        }
        // Replace entire document
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(source.length));
        return [vscode.TextEdit.replace(fullRange, formatted)];
    }
}
exports.GTLintFormatterProvider = GTLintFormatterProvider;
//# sourceMappingURL=formatter.js.map