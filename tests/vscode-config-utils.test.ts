import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  camelToKebab,
  normalizeRuleKeys,
  isFileIgnored,
  findConfigFile,
} from '../vscode-extension/src/config-utils';

describe('VS Code config-utils', () => {
  describe('camelToKebab', () => {
    it('should convert camelCase to kebab-case', () => {
      expect(camelToKebab('noUnusedVars')).toBe('no-unused-vars');
    });

    it('should pass through already-kebab-case strings', () => {
      expect(camelToKebab('no-unused-vars')).toBe('no-unused-vars');
    });

    it('should pass through lowercase strings', () => {
      expect(camelToKebab('lowercase')).toBe('lowercase');
    });

    it('should handle a single uppercase letter', () => {
      expect(camelToKebab('noA')).toBe('no-a');
    });

    it('should handle consecutive uppercase letters', () => {
      expect(camelToKebab('parseJSON')).toBe('parse-j-s-o-n');
    });

    it('should handle empty string', () => {
      expect(camelToKebab('')).toBe('');
    });
  });

  describe('normalizeRuleKeys', () => {
    it('should normalize camelCase keys to kebab-case', () => {
      const result = normalizeRuleKeys({ noUnusedVars: 'off', validKeyword: 'error' });
      expect(result).toEqual({ 'no-unused-vars': 'off', 'valid-keyword': 'error' });
    });

    it('should pass through kebab-case keys unchanged', () => {
      const result = normalizeRuleKeys({ 'no-unused-vars': 'off' });
      expect(result).toEqual({ 'no-unused-vars': 'off' });
    });

    it('should handle mixed camelCase and kebab-case keys', () => {
      const result = normalizeRuleKeys({
        noUnusedVars: 'off',
        'valid-keyword': 'warn',
      });
      expect(result).toEqual({
        'no-unused-vars': 'off',
        'valid-keyword': 'warn',
      });
    });

    it('should return empty object for empty input', () => {
      expect(normalizeRuleKeys({})).toEqual({});
    });
  });

  describe('isFileIgnored', () => {
    it('should return true for a file matching an ignore pattern', () => {
      expect(isFileIgnored('/project/dist/out.js', ['dist/**'], '/project')).toBe(true);
    });

    it('should return false for a file not matching any pattern', () => {
      expect(isFileIgnored('/project/src/main.ts', ['dist/**'], '/project')).toBe(false);
    });

    it('should return false for a file outside the base directory', () => {
      expect(isFileIgnored('/other/file.ts', ['**/*.ts'], '/project')).toBe(false);
    });

    it('should match when first of multiple patterns matches', () => {
      expect(isFileIgnored('/project/dist/out.js', ['dist/**', 'build/**'], '/project')).toBe(true);
    });

    it('should match when second of multiple patterns matches', () => {
      expect(isFileIgnored('/project/build/out.js', ['dist/**', 'build/**'], '/project')).toBe(true);
    });

    it('should return false when patterns array is empty', () => {
      expect(isFileIgnored('/project/src/main.ts', [], '/project')).toBe(false);
    });

    it('should match a file directly in the base directory', () => {
      expect(isFileIgnored('/project/notes.txt', ['*.txt'], '/project')).toBe(true);
    });
  });

  describe('findConfigFile', () => {
    let tmpDir: string;

    beforeEach(() => {
      tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-vscode-config-'));
    });

    afterEach(() => {
      rmSync(tmpDir, { recursive: true });
    });

    it('should find gtlint.config.js in the start directory', () => {
      writeFileSync(join(tmpDir, 'gtlint.config.js'), 'module.exports = {};');

      const result = findConfigFile(tmpDir);
      expect(result).toBe(join(tmpDir, 'gtlint.config.js'));
    });

    it('should find gtlint.config.mjs in the start directory', () => {
      writeFileSync(join(tmpDir, 'gtlint.config.mjs'), 'export default {};');

      const result = findConfigFile(tmpDir);
      expect(result).toBe(join(tmpDir, 'gtlint.config.mjs'));
    });

    it('should find config in a parent directory', () => {
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
});
