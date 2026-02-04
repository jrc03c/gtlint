import * as vscode from 'vscode';
import type { LinterConfig, FormatterConfig } from 'gt-lint';
export interface GTLintSettings {
    enable: boolean;
    lintOnType: boolean;
    lintOnTypeDelay: number;
    lintOnSave: boolean;
    formatOnSave: boolean;
    rules: Record<string, 'off' | 'warn' | 'error'>;
    format: Partial<FormatterConfig>;
}
/**
 * Get VSCode settings for GTLint
 */
export declare function getVSCodeSettings(): GTLintSettings;
/**
 * Build the merged configuration for a document
 * Priority: gtlint.config.js > VSCode workspace settings > defaults
 */
export declare function getConfigForDocument(document: vscode.TextDocument): Promise<{
    linter: LinterConfig;
    formatter: FormatterConfig;
    settings: GTLintSettings;
}>;
//# sourceMappingURL=configuration.d.ts.map