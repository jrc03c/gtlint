import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { LinterConfig, FormatterConfig } from 'gt-lint';
import {
  DEFAULT_LINTER_CONFIG,
  DEFAULT_FORMATTER_CONFIG,
} from 'gt-lint';

/**
 * Convert camelCase to kebab-case (e.g., noUnusedVars → no-unused-vars).
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

function normalizeRuleKeys(
  rules: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(rules)) {
    normalized[camelToKebab(key)] = value;
  }
  return normalized;
}

export interface GTLintSettings {
  enable: boolean;
  lintOnType: boolean;
  lintOnTypeDelay: number;
  lintOnSave: boolean;
  formatOnSave: boolean;
  rules: Record<string, 'off' | 'warn' | 'error'>;
  format: Partial<FormatterConfig>;
}

const CONFIG_FILENAMES = ['gtlint.config.js', 'gtlint.config.mjs'];

/**
 * Get VSCode settings for GTLint
 */
export function getVSCodeSettings(): GTLintSettings {
  const config = vscode.workspace.getConfiguration('gtlint');
  return {
    enable: config.get<boolean>('enable', true),
    lintOnType: config.get<boolean>('lintOnType', true),
    lintOnTypeDelay: config.get<number>('lintOnTypeDelay', 300),
    lintOnSave: config.get<boolean>('lintOnSave', true),
    formatOnSave: config.get<boolean>('formatOnSave', false),
    rules: config.get<Record<string, 'off' | 'warn' | 'error'>>('rules', {}),
    format: config.get<Partial<FormatterConfig>>('format', {}),
  };
}

/**
 * Find config file by searching up from a directory
 */
function findConfigFile(startDir: string): string | null {
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
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Load a gtlint.config.js file
 */
async function loadConfigFile(
  configPath: string
): Promise<{ rules?: Record<string, 'off' | 'warn' | 'error'>; format?: Partial<FormatterConfig> } | null> {
  try {
    // Clear require cache to pick up changes
    delete require.cache[require.resolve(configPath)];
    // Use require for CommonJS compatibility in VSCode extension
    const module = require(configPath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load GTLint config: ${configPath}`, error);
    return null;
  }
}

/**
 * Build the merged configuration for a document
 * Priority: gtlint.config.js > VSCode workspace settings > defaults
 */
export async function getConfigForDocument(document: vscode.TextDocument): Promise<{
  linter: LinterConfig;
  formatter: FormatterConfig;
  settings: GTLintSettings;
}> {
  const vscodeSettings = getVSCodeSettings();

  // Start with defaults
  let rules = { ...DEFAULT_LINTER_CONFIG.rules };
  let format = { ...DEFAULT_FORMATTER_CONFIG };

  // Only load config files in trusted workspaces (they execute arbitrary JS)
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const searchDir = workspaceFolder?.uri.fsPath || path.dirname(document.uri.fsPath);
  const configPath = vscode.workspace.isTrusted ? findConfigFile(searchDir) : null;

  if (configPath) {
    const fileConfig = await loadConfigFile(configPath);
    if (fileConfig) {
      if (fileConfig.rules) {
        rules = { ...rules, ...normalizeRuleKeys(fileConfig.rules) };
      }
      if (fileConfig.format) {
        format = { ...format, ...fileConfig.format };
      }
    }
  }

  // Apply VSCode settings (override config file)
  rules = { ...rules, ...normalizeRuleKeys(vscodeSettings.rules) };
  format = { ...format, ...vscodeSettings.format };

  const linterConfig: LinterConfig = {
    rules,
    format,
    ignore: DEFAULT_LINTER_CONFIG.ignore,
  };

  return {
    linter: linterConfig,
    formatter: format,
    settings: vscodeSettings,
  };
}
