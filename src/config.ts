import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { pathToFileURL } from 'url';
import type { LinterConfig, FormatterConfig } from './types.js';
import { DEFAULT_LINTER_CONFIG, DEFAULT_FORMATTER_CONFIG } from './types.js';

/**
 * Convert camelCase to kebab-case (e.g., noUnusedVars → no-unused-vars).
 * Strings that are already kebab-case pass through unchanged.
 */
function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

/**
 * Normalize rule keys from camelCase (config file convention) to
 * kebab-case (internal convention). Keys already in kebab-case are
 * unaffected.
 */
type RuleSeverity = 'off' | 'warn' | 'error';

function normalizeRuleKeys(
  rules: Record<string, string>
): Record<string, RuleSeverity> {
  const normalized: Record<string, RuleSeverity> = {};
  for (const [key, value] of Object.entries(rules)) {
    normalized[camelToKebab(key)] = value as RuleSeverity;
  }
  return normalized;
}

export interface GTLintConfig {
  lint?: LinterConfig['lint'];
  format?: Partial<FormatterConfig>;
  ignore?: string[];
}

const CONFIG_FILENAMES = [
  'gtlint.config.js',
  'gtlint.config.mjs',
];

/**
 * Find a config file by searching up the directory tree
 */
export function findConfigFile(startDir: string): string | null {
  let currentDir = resolve(startDir);
  const root = dirname(currentDir);

  while (currentDir !== root) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = resolve(currentDir, filename);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  // Check root directory
  for (const filename of CONFIG_FILENAMES) {
    const configPath = resolve(currentDir, filename);
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Load a config file
 */
export async function loadConfigFile(configPath: string): Promise<GTLintConfig> {
  try {
    const fileUrl = pathToFileURL(resolve(configPath)).href;
    const module = await import(fileUrl);
    return module.default || module;
  } catch (error) {
    throw new Error(`Failed to load config file: ${configPath}\n${error}`);
  }
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: GTLintConfig): {
  linter: LinterConfig;
  formatter: FormatterConfig;
  ignore: string[];
} {
  const linterConfig: LinterConfig = {
    ...DEFAULT_LINTER_CONFIG,
    lint: {
      ...DEFAULT_LINTER_CONFIG.lint,
      ...(userConfig.lint ? normalizeRuleKeys(userConfig.lint) : {}),
    },
    format: {
      ...DEFAULT_LINTER_CONFIG.format,
      ...userConfig.format,
    },
  };

  const formatterConfig: FormatterConfig = {
    ...DEFAULT_FORMATTER_CONFIG,
    ...userConfig.format,
  };

  const ignore = userConfig.ignore || ['**/node_modules/**', '**/dist/**'];

  return { linter: linterConfig, formatter: formatterConfig, ignore };
}

/**
 * Load config from a directory or specific file path
 */
export async function loadConfig(pathOrDir: string): Promise<{
  linter: LinterConfig;
  formatter: FormatterConfig;
  ignore: string[];
  configPath: string | null;
}> {
  let configPath: string | null = null;

  // If path points to a config file, use it directly
  if (pathOrDir.endsWith('.js') || pathOrDir.endsWith('.mjs')) {
    if (existsSync(pathOrDir)) {
      configPath = pathOrDir;
    }
  } else {
    // Search for config file
    configPath = findConfigFile(pathOrDir);
  }

  if (configPath) {
    const userConfig = await loadConfigFile(configPath);
    return { ...mergeConfig(userConfig), configPath };
  }

  // No config file found, use defaults
  return {
    linter: DEFAULT_LINTER_CONFIG,
    formatter: DEFAULT_FORMATTER_CONFIG,
    ignore: ['**/node_modules/**', '**/dist/**'],
    configPath: null,
  };
}
