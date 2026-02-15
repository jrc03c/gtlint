import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync, rmSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BIN = join(ROOT, 'bin', 'gtlint.js');
const FIXTURES = join(ROOT, 'tests', 'fixtures', 'cli');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')).version;

function runCLI(args: string[], options?: { cwd?: string }) {
  const result = spawnSync('node', [BIN, ...args], {
    cwd: options?.cwd ?? ROOT,
    encoding: 'utf-8',
    timeout: 10_000,
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? -1,
  };
}

describe('CLI', () => {
  describe('Help & version', () => {
    it('no args prints help and exits 0', () => {
      const r = runCLI([]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('Usage:');
      expect(r.stdout).toContain('gtlint lint');
    });

    it('--help prints help and exits 0', () => {
      const r = runCLI(['--help']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('Usage:');
    });

    it('-h prints help and exits 0', () => {
      const r = runCLI(['-h']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('Usage:');
    });

    it('--version prints version and exits 0', () => {
      const r = runCLI(['--version']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.trim()).toBe(`gtlint v${VERSION}`);
    });

    it('-v prints version and exits 0', () => {
      const r = runCLI(['-v']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.trim()).toBe(`gtlint v${VERSION}`);
    });
  });

  describe('Lint command', () => {
    it('clean file produces no output and exits 0', () => {
      const r = runCLI(['lint', join(FIXTURES, 'clean.gt')]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.trim()).toBe('');
    });

    it('file with errors exits 1', () => {
      const r = runCLI(['lint', join(FIXTURES, 'has-errors.gt')]);
      expect(r.exitCode).toBe(1);
      expect(r.stdout).toContain('error');
    });

    it('file with only warnings exits 0', () => {
      const r = runCLI(['lint', join(FIXTURES, 'has-warnings.gt')]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('warning');
    });

    it('lints directory recursively', () => {
      const r = runCLI(['lint', FIXTURES]);
      // Directory contains has-errors.gt → exit 1
      expect(r.exitCode).toBe(1);
      // Should process multiple files — error file appears in output
      expect(r.stdout).toContain('has-errors.gt');
    });

    it('lints current directory by default when no files given', () => {
      const r = runCLI(['lint'], { cwd: FIXTURES });
      // FIXTURES contains has-errors.gt → exit 1
      expect(r.exitCode).toBe(1);
    });
  });

  describe('Lint output formats', () => {
    it('--format json outputs valid JSON with expected structure', () => {
      const r = runCLI(['lint', '--format', 'json', join(FIXTURES, 'has-errors.gt')]);
      expect(r.exitCode).toBe(1);

      const parsed = JSON.parse(r.stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
      expect(parsed[0]).toHaveProperty('filePath');
      expect(parsed[0]).toHaveProperty('messages');
      expect(parsed[0]).toHaveProperty('errorCount');
      expect(parsed[0]).toHaveProperty('warningCount');
      expect(parsed[0].errorCount).toBeGreaterThan(0);
    });

    it('--format compact outputs filepath:line:col: severity: message [rule]', () => {
      const r = runCLI(['lint', '--format', 'compact', join(FIXTURES, 'has-errors.gt')]);
      expect(r.exitCode).toBe(1);

      const lines = r.stdout.trim().split('\n');
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        expect(line).toMatch(/.+:\d+:\d+: (error|warning): .+ \[.+\]/);
      }
    });

    it('default (stylish) format contains file path and rule IDs', () => {
      const r = runCLI(['lint', join(FIXTURES, 'has-errors.gt')]);
      expect(r.stdout).toContain('has-errors.gt');
      expect(r.stdout).toContain('valid-keyword');
    });
  });

  describe('Lint options', () => {
    it('--quiet suppresses warnings but shows errors', () => {
      const r = runCLI(['lint', '--quiet', join(FIXTURES, 'has-errors.gt')]);
      expect(r.exitCode).toBe(1);
      expect(r.stdout).toContain('error');
      expect(r.stdout).not.toContain('warning');
    });

    it('--config respects config that disables a rule', () => {
      const configPath = join(FIXTURES, 'disable-unused-vars.mjs');
      const r = runCLI(['lint', '--config', configPath, join(FIXTURES, 'has-warnings.gt')]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.trim()).toBe('');
    });
  });

  describe('Format command', () => {
    it('prints formatted output to stdout without modifying file', () => {
      const fixturePath = join(FIXTURES, 'needs-formatting.gt');
      const before = readFileSync(fixturePath, 'utf-8');

      const r = runCLI(['format', fixturePath]);

      expect(r.exitCode).toBe(0);
      expect(r.stdout).toBe('Hello world\n');

      const after = readFileSync(fixturePath, 'utf-8');
      expect(after).toBe(before);
    });

    it('--write modifies file in place', () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-'));
      const tmpFile = join(tmpDir, 'test.gt');
      copyFileSync(join(FIXTURES, 'needs-formatting.gt'), tmpFile);

      try {
        const before = readFileSync(tmpFile, 'utf-8');
        const r = runCLI(['format', '--write', tmpFile]);
        const after = readFileSync(tmpFile, 'utf-8');

        expect(r.exitCode).toBe(0);
        expect(r.stdout).toContain('Formatted:');
        expect(after).not.toBe(before);
        expect(after).toBe('Hello world\n');
      } finally {
        rmSync(tmpDir, { recursive: true });
      }
    });
  });

  describe('Edge cases', () => {
    it('nonexistent file prints "No .gt files found" and exits 0', () => {
      const r = runCLI(['lint', '/nonexistent/path/file.gt']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('No .gt files found');
    });

    it('non-.gt file prints "No .gt files found" and exits 0', () => {
      const r = runCLI(['lint', join(ROOT, 'package.json')]);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('No .gt files found');
    });

    it('empty .gt file does not crash', () => {
      const tmpDir = mkdtempSync(join(tmpdir(), 'gtlint-'));
      const tmpFile = join(tmpDir, 'empty.gt');
      writeFileSync(tmpFile, '');

      try {
        const r = runCLI(['lint', tmpFile]);
        expect(r.exitCode).toBe(0);
      } finally {
        rmSync(tmpDir, { recursive: true });
      }
    });

    it('unrecognized argument (no command) prints help and exits 0', () => {
      const r = runCLI(['foobar']);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('Usage:');
    });

    it('unknown flag does not crash', () => {
      const r = runCLI(['lint', '--foobar', join(FIXTURES, 'clean.gt')]);
      expect(r.exitCode).toBe(0);
    });
  });
});
