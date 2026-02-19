import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { LinterConfig, FormatterConfig } from '@jrc03c/gtlint';
import {
  DEFAULT_LINTER_CONFIG,
  DEFAULT_FORMATTER_CONFIG,
} from '@jrc03c/gtlint';

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
  lint: Record<string, 'off' | 'warn' | 'error'>;
  format: Partial<FormatterConfig>;
}

const CONFIG_FILENAMES = ['gtlint.config.js', 'gtlint.config.mjs'];

// Cache for loaded config files, keyed by absolute config path
const configCache = new Map<string, { lint?: Record<string, 'off' | 'warn' | 'error'>; format?: Partial<FormatterConfig> } | null>();
let configWatcher: vscode.FileSystemWatcher | undefined;

/**
 * Initialize the FileSystemWatcher that invalidates cached configs when
 * config files are created, changed, or deleted.
 * @param onInvalidate Optional callback invoked after cache invalidation
 */
export function initConfigWatcher(onInvalidate?: () => void): vscode.Disposable {
  if (configWatcher) return configWatcher;

  const pattern = `**/{${CONFIG_FILENAMES.join(',')}}`;
  configWatcher = vscode.workspace.createFileSystemWatcher(pattern);

  const invalidate = (uri: vscode.Uri) => {
    configCache.delete(uri.fsPath);
    onInvalidate?.();
  };
  configWatcher.onDidChange(invalidate);
  configWatcher.onDidCreate(invalidate);
  configWatcher.onDidDelete(invalidate);

  return configWatcher;
}

/**
 * Dispose of the config watcher and clear the cache.
 */
export function disposeConfigWatcher(): void {
  configWatcher?.dispose();
  configWatcher = undefined;
  configCache.clear();
}

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
    lint: config.get<Record<string, 'off' | 'warn' | 'error'>>('lint', {}),
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
 * Load a gtlint.config.js file (cached; invalidated by FileSystemWatcher)
 */
async function loadConfigFile(
  configPath: string
): Promise<{ lint?: Record<string, 'off' | 'warn' | 'error'>; format?: Partial<FormatterConfig> } | null> {
  if (configCache.has(configPath)) {
    return configCache.get(configPath)!;
  }

  try {
    // Clear require cache so the fresh file content is loaded
    delete require.cache[require.resolve(configPath)];
    // Use require for CommonJS compatibility in VSCode extension
    const module = require(configPath);
    const result = module.default || module;
    configCache.set(configPath, result);
    return result;
  } catch (error) {
    console.error(`Failed to load GTLint config: ${configPath}`, error);
    configCache.set(configPath, null);
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
  let rules = { ...DEFAULT_LINTER_CONFIG.lint };
  let format = { ...DEFAULT_FORMATTER_CONFIG };

  // Only load config files in trusted workspaces (they execute arbitrary JS)
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const searchDir = workspaceFolder?.uri.fsPath || path.dirname(document.uri.fsPath);
  const configPath = vscode.workspace.isTrusted ? findConfigFile(searchDir) : null;

  if (configPath) {
    const fileConfig = await loadConfigFile(configPath);
    if (fileConfig) {
      if (fileConfig.lint) {
        rules = { ...rules, ...normalizeRuleKeys(fileConfig.lint) };
      }
      if (fileConfig.format) {
        format = { ...format, ...fileConfig.format };
      }
    }
  }

  // Apply VSCode settings (override config file)
  rules = { ...rules, ...normalizeRuleKeys(vscodeSettings.lint) };
  format = { ...format, ...vscodeSettings.format };

  const linterConfig: LinterConfig = {
    lint: rules,
    format,
    ignore: DEFAULT_LINTER_CONFIG.ignore,
  };

  return {
    linter: linterConfig,
    formatter: format,
    settings: vscodeSettings,
  };
}
