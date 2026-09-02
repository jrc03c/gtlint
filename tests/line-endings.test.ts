import { describe, it, expect } from 'vitest';
import { detectLineEnding, normalizeLineEndings, applyLineEnding } from '../src/line-endings.js';
import { parseDirectives, isFormatDisabled, isRuleDisabled } from '../src/linter/directives.js';
import { Linter } from '../src/linter/linter.js';
import { Formatter, format } from '../src/formatter/index.js';

describe('Line ending utilities', () => {
  describe('detectLineEnding', () => {
    it('should detect LF in an LF file', () => {
      expect(detectLineEnding('a\nb\nc\n')).toBe('\n');
    });

    it('should detect CRLF in a CRLF file', () => {
      expect(detectLineEnding('a\r\nb\r\nc\r\n')).toBe('\r\n');
    });

    it('should default to LF when there are no line breaks', () => {
      expect(detectLineEnding('a')).toBe('\n');
      expect(detectLineEnding('')).toBe('\n');
    });

    it('should pick the majority ending in a mixed file', () => {
      expect(detectLineEnding('a\r\nb\r\nc\n')).toBe('\r\n');
      expect(detectLineEnding('a\nb\nc\r\n')).toBe('\n');
    });
  });

  describe('normalizeLineEndings', () => {
    it('should convert CRLF to LF', () => {
      expect(normalizeLineEndings('a\r\nb\r\n')).toBe('a\nb\n');
    });

    it('should leave LF untouched', () => {
      expect(normalizeLineEndings('a\nb\n')).toBe('a\nb\n');
    });

    it('should convert a lone CR to LF', () => {
      expect(normalizeLineEndings('a\rb\r')).toBe('a\nb\n');
    });

    it('should not touch a CR that is not a line break in disguise', () => {
      // After normalization no CR should survive anywhere.
      expect(normalizeLineEndings('a\r\n\r\nb')).toBe('a\n\nb');
    });
  });

  describe('applyLineEnding', () => {
    it('should convert LF source to CRLF', () => {
      expect(applyLineEnding('a\nb\n', '\r\n')).toBe('a\r\nb\r\n');
    });

    it('should leave LF source as LF', () => {
      expect(applyLineEnding('a\nb\n', '\n')).toBe('a\nb\n');
    });

    it('should not double up CRs when applied twice', () => {
      const once = applyLineEnding('a\nb\n', '\r\n');
      expect(applyLineEnding(normalizeLineEndings(once), '\r\n')).toBe('a\r\nb\r\n');
    });
  });
});

describe('CRLF handling', () => {
  const crlf = (s: string) => s.replace(/\n/g, '\r\n');

  describe('directives', () => {
    it('should parse @gtlint-disable regions in a CRLF file', () => {
      const source = crlf('-- @gtlint-disable\n*set: x\n-- @gtlint-enable\n');
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
    });

    it('should parse @gtformat-disable regions in a CRLF file', () => {
      const source = crlf('-- @gtformat-disable\n>> x = {  1  }\n-- @gtformat-enable\n');
      const state = parseDirectives(source);

      expect(isFormatDisabled(state, 2)).toBe(true);
    });

    it('should parse @from-parent variables in a CRLF file', () => {
      const source = crlf('-- @from-parent: alpha, beta\n');
      const state = parseDirectives(source);

      expect([...state.fromParentVars.keys()]).toEqual(['alpha', 'beta']);
    });

    it('should parse @to-parent variables in a CRLF file', () => {
      const source = crlf('-- @to-parent: alpha, beta\n');
      const state = parseDirectives(source);

      expect([...state.toParentVars]).toEqual(['alpha', 'beta']);
    });

    it('should parse @to-child variables in a CRLF file', () => {
      const source = crlf('-- @to-child: alpha, beta\n');
      const state = parseDirectives(source);

      expect([...state.toChildVars]).toEqual(['alpha', 'beta']);
    });

    it('should parse @gtlint-disable-next-line in a CRLF file', () => {
      const source = crlf('-- @gtlint-disable-next-line\n*set: x\n');
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
    });
  });

  describe('linter', () => {
    it('should report the same messages for LF and CRLF sources', () => {
      const lf = '-- @from-parent: given\n-- @to-parent: result\n*set: result = given + 1\n*set: unused = 2\n';
      const linter = new Linter();

      const lfMessages = linter.lint(lf).messages;
      const crlfMessages = linter.lint(crlf(lf)).messages;

      expect(crlfMessages).toEqual(lfMessages);
    });

    it('should not invent undefined-variable errors in a CRLF file', () => {
      const source = crlf('-- @from-parent: given\n*display: given\n');
      const messages = new Linter().lint(source).messages;

      expect(messages.filter((m) => m.ruleId === 'no-undefined-vars')).toEqual([]);
    });
  });

  describe('formatter', () => {
    it('should preserve CRLF endings by default', () => {
      const result = format(crlf('*set: x = 1\n*set: y = 2\n'));

      expect(result).toBe(crlf('*set: x = 1\n*set: y = 2\n'));
    });

    it('should preserve LF endings by default', () => {
      const result = format('*set: x = 1\n*set: y = 2\n');

      expect(result).toBe('*set: x = 1\n*set: y = 2\n');
    });

    it('should trim trailing whitespace in a CRLF file', () => {
      const result = format(crlf('Hello world   \n'));

      expect(result).toBe(crlf('Hello world\n'));
    });

    it('should respect @gtformat-disable in a CRLF file', () => {
      const source = crlf('-- @gtformat-disable\n{{ something }}\n-- @gtformat-enable\n');
      const result = format(source);

      expect(result).toBe(source);
    });

    it('should produce the same content for LF and CRLF input', () => {
      const lf = '*set: x   =   1\nHello   \n';

      expect(normalizeLineEndings(format(crlf(lf)))).toBe(format(lf));
    });

    it('should add a final newline using the detected ending', () => {
      const result = format('*set: x = 1\r\n*set: y = 2');

      expect(result).toBe('*set: x = 1\r\n*set: y = 2\r\n');
    });

    it('should normalize to LF when lineEndings is "lf"', () => {
      const formatter = new Formatter({ lineEndings: 'lf' });
      const result = formatter.format(crlf('*set: x = 1\n*set: y = 2\n'));

      expect(result).toBe('*set: x = 1\n*set: y = 2\n');
    });

    it('should convert to CRLF when lineEndings is "crlf"', () => {
      const formatter = new Formatter({ lineEndings: 'crlf' });
      const result = formatter.format('*set: x = 1\n*set: y = 2\n');

      expect(result).toBe(crlf('*set: x = 1\n*set: y = 2\n'));
    });

    it('should normalize mixed endings to the detected majority when preserving', () => {
      const formatter = new Formatter({ lineEndings: 'preserve' });
      const result = formatter.format('a\r\nb\r\nc\n');

      expect(result).toBe('a\r\nb\r\nc\r\n');
    });
  });
});
