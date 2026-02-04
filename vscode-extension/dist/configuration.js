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
exports.getVSCodeSettings = getVSCodeSettings;
exports.getConfigForDocument = getConfigForDocument;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const gt_lint_1 = require("gt-lint");
const CONFIG_FILENAMES = ['gtlint.config.js', 'gtlint.config.mjs'];
/**
 * Get VSCode settings for GTLint
 */
function getVSCodeSettings() {
    const config = vscode.workspace.getConfiguration('gtlint');
    return {
        enable: config.get('enable', true),
        lintOnType: config.get('lintOnType', true),
        lintOnTypeDelay: config.get('lintOnTypeDelay', 300),
        lintOnSave: config.get('lintOnSave', true),
        formatOnSave: config.get('formatOnSave', false),
        rules: config.get('rules', {}),
        format: config.get('format', {}),
    };
}
/**
 * Find config file by searching up from a directory
 */
function findConfigFile(startDir) {
    let currentDir = path.resolve(startDir);
    // eslint-disable-next-line no-constant-condition
    while (true) {
        for (const filename of CONFIG_FILENAMES) {
            const configPath = path.join(currentDir, filename);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir)
            break;
        currentDir = parentDir;
    }
    return null;
}
/**
 * Load a gtlint.config.js file
 */
async function loadConfigFile(configPath) {
    try {
        // Clear require cache to pick up changes
        delete require.cache[require.resolve(configPath)];
        // Use require for CommonJS compatibility in VSCode extension
        const module = require(configPath);
        return module.default || module;
    }
    catch (error) {
        console.error(`Failed to load GTLint config: ${configPath}`, error);
        return null;
    }
}
/**
 * Build the merged configuration for a document
 * Priority: gtlint.config.js > VSCode workspace settings > defaults
 */
async function getConfigForDocument(document) {
    const vscodeSettings = getVSCodeSettings();
    // Start with defaults
    let rules = { ...gt_lint_1.DEFAULT_LINTER_CONFIG.rules };
    let format = { ...gt_lint_1.DEFAULT_FORMATTER_CONFIG };
    // Try to find and load gtlint.config.js
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const searchDir = workspaceFolder?.uri.fsPath || path.dirname(document.uri.fsPath);
    const configPath = findConfigFile(searchDir);
    if (configPath) {
        const fileConfig = await loadConfigFile(configPath);
        if (fileConfig) {
            if (fileConfig.rules) {
                rules = { ...rules, ...fileConfig.rules };
            }
            if (fileConfig.format) {
                format = { ...format, ...fileConfig.format };
            }
        }
    }
    // Apply VSCode settings (override config file)
    rules = { ...rules, ...vscodeSettings.rules };
    format = { ...format, ...vscodeSettings.format };
    const linterConfig = {
        rules,
        format,
        ignore: gt_lint_1.DEFAULT_LINTER_CONFIG.ignore,
    };
    return {
        linter: linterConfig,
        formatter: format,
        settings: vscodeSettings,
    };
}
//# sourceMappingURL=configuration.js.map