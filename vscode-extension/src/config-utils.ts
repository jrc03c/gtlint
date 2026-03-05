import * as path from 'path';
import * as fs from 'fs';
import { minimatch } from 'minimatch';

export const CONFIG_FILENAMES = ['gtlint.config.js', 'gtlint.config.mjs'];

/**
 * Convert camelCase to kebab-case (e.g., noUnusedVars → no-unused-vars).
 */
export function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
}

export function normalizeRuleKeys(
  rules: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(rules)) {
    normalized[camelToKebab(key)] = value;
  }
  return normalized;
}

/**
 * Check whether a file path matches any of the ignore glob patterns.
 * Patterns are matched against the file's path relative to the config
 * directory (or workspace root if no config file was found).
 */
export function isFileIgnored(filePath: string, ignorePatterns: string[], baseDir: string): boolean {
  const relativePath = path.relative(baseDir, filePath);
  // Skip if the file is outside the base directory
  if (relativePath.startsWith('..')) return false;
  // Normalize to forward slashes for consistent glob matching
  const normalizedPath = relativePath.split(path.sep).join('/');
  return ignorePatterns.some(pattern => minimatch(normalizedPath, pattern));
}

/**
 * Find config file by searching up from a directory
 */
export function findConfigFile(startDir: string): string | null {
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
