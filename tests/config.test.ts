import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { findConfigFile, loadConfigFile, loadConfig, mergeConfig } from '../src/config.js';
import { DEFAULT_LINTER_CONFIG, DEFAULT_FORMATTER_CONFIG } from '../src/types.js';

describe('Config', () => {
  describe('mergeConfig', () => {
    it('should return defaults when given empty config', () => {
      const result = mergeConfig({});

      expect(result.linter.lint).toEqual(DEFAULT_LINTER_CONFIG.lint);
      expect(result.formatter).toEqual(DEFAULT_FORMATTER_CONFIG);
      expect(result.ignore).toEqual(['**/node_modules/**', '**/dist/**']);
    });

    it('should merge user lint overrides with defaults', () => {
      const result = mergeConfig({
        lint: { 'no-unused-vars': 'off' },
      });

      expect(result.linter.lint['no-unused-vars']).toBe('off');
      // Other rules should keep defaults
      expect(result.linter.lint['valid-keyword']).toBe('error');
      expect(result.linter.lint['no-undefined-vars']).toBe('error');
    });

    it('should merge user format overrides with defaults', () => {
      const result = mergeConfig({
        format: { spaceAroundOperators: false },
      });

      expect(result.formatter.spaceAroundOperators).toBe(false);
      // Other format options should keep defaults
      expect(result.formatter.insertFinalNewline).toBe(true);
      expect(result.formatter.trimTrailingWhitespace).toBe(true);
    });

    it('should replace default ignore when user provides ignore', () => {
      const result = mergeConfig({
        ignore: ['**/ignored/**'],
      });

      expect(result.ignore).toEqual(['**/ignored/**']);
      // Should NOT contain the defaults
      expect(result.ignore).not.toContain('**/node_modules/**');
    });

    it('should normalize camelCase rule keys to kebab-case', () => {
      const result = mergeConfig({
        lint: { noUnusedVars: 'off' },
      });

      expect(result.linter.lint['no-unused-vars']).toBe('off');
    });

    it('should pass through already-kebab-case keys unchanged', () => {
      const result = mergeConfig({
        lint: { 'no-unused-vars': 'off' },
      });

      expect(result.linter.lint['no-unused-vars']).toBe('off');
    });

    it('should handle mixed camelCase and kebab-case keys', () => {
      const result = mergeConfig({
        lint: {
          noUnusedVars: 'off',
          'valid-keyword': 'warn',
        },
      });

      expect(result.linter.lint['no-unused-vars']).toBe('off');
      expect(result.linter.lint['valid-keyword']).toBe('warn');
    });
  });

  describe('findConfigFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-config-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true });
    });

    it('should find gtlint.config.mjs in the start directory', () => {
      writeFileSync(join(tmpDir, 'gtlint.config.mjs'), 'export default {};');

      const result = findConfigFile(tmpDir);
      expect(result).toBe(join(tmpDir, 'gtlint.config.mjs'));
    });

    it('should find gtlint.config.js in a parent directory', () => {
      writeFileSync(join(tmpDir, 'gtlint.config.js'), 'module.exports = {};');
      const childDir = join(tmpDir, 'child');
      mkdirSync(childDir);

      const result = findConfigFile(childDir);
      expect(result).toBe(join(tmpDir, 'gtlint.config.js'));
    });

    it('should prefer .js over .mjs when both exist', () => {
      writeFileSync(join(tmpDir, 'gtlint.config.js'), 'module.exports = {};');
      writeFileSync(join(tmpDir, 'gtlint.config.mjs'), 'export default {};');

      const result = findConfigFile(tmpDir);
      expect(result).toBe(join(tmpDir, 'gtlint.config.js'));
    });

    it('should return null when no config file exists', () => {
      const result = findConfigFile(tmpDir);
      expect(result).toBeNull();
    });
  });

  describe('loadConfigFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-config-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true });
    });

    it('should load a valid .mjs config and return its default export', async () => {
      const configPath = join(tmpDir, 'gtlint.config.mjs');
      writeFileSync(configPath, `export default { lint: { 'no-unused-vars': 'off' } };`);

      const result = await loadConfigFile(configPath);
      expect(result).toEqual({ lint: { 'no-unused-vars': 'off' } });
    });

    it('should throw on nonexistent file', async () => {
      await expect(
        loadConfigFile(join(tmpDir, 'nonexistent.mjs'))
      ).rejects.toThrow('Failed to load config file');
    });
  });

  describe('loadConfig', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-config-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true });
    });

    it('should load and merge config given a direct path to a .mjs file', async () => {
      const configPath = join(tmpDir, 'gtlint.config.mjs');
      writeFileSync(configPath, `export default { lint: { 'no-unused-vars': 'off' } };`);

      const result = await loadConfig(configPath);
      expect(result.configPath).toBe(configPath);
      expect(result.linter.lint['no-unused-vars']).toBe('off');
      // Other rules should still have defaults
      expect(result.linter.lint['valid-keyword']).toBe('error');
    });

    it('should return defaults with configPath: null when directory has no config', async () => {
      const result = await loadConfig(tmpDir);

      expect(result.configPath).toBeNull();
      expect(result.linter).toEqual(DEFAULT_LINTER_CONFIG);
      expect(result.formatter).toEqual(DEFAULT_FORMATTER_CONFIG);
    });

    it('should find and load config from a directory containing a config file', async () => {
      const configPath = join(tmpDir, 'gtlint.config.mjs');
      writeFileSync(configPath, `export default { lint: { 'valid-keyword': 'warn' } };`);

      const result = await loadConfig(tmpDir);
      expect(result.configPath).toBe(configPath);
      expect(result.linter.lint['valid-keyword']).toBe('warn');
    });
  });
});
