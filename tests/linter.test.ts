import { describe, it, expect } from 'vitest';
import { Linter, lint } from '../src/linter/index.js';

describe('Linter', () => {
  describe('Basic linting', () => {
    it('should return no errors for valid code', () => {
      const source = `*question: What is your name?
\t*save: name`;
      const result = lint(source);

      // Should have minimal errors (possibly no-unused-vars warning)
      expect(result.errorCount).toBe(0);
    });

    it('should return results object with expected properties', () => {
      const result = lint('Hello world');

      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('errorCount');
      expect(result).toHaveProperty('warningCount');
      expect(result).toHaveProperty('fixableErrorCount');
      expect(result).toHaveProperty('fixableWarningCount');
      expect(result).toHaveProperty('source');
    });
  });

  describe('valid-keyword rule', () => {
    it('should report error for invalid keyword', () => {
      const source = '*invalidkeyword: test';
      const result = lint(source);

      const invalidKeywordError = result.messages.find(m => m.ruleId === 'valid-keyword');
      expect(invalidKeywordError).toBeDefined();
      expect(invalidKeywordError?.severity).toBe('error');
    });

    it('should not report error for valid keyword', () => {
      const source = '*button: Click me';
      const result = lint(source);

      const invalidKeywordError = result.messages.find(m => m.ruleId === 'valid-keyword');
      expect(invalidKeywordError).toBeUndefined();
    });
  });

  describe('valid-sub-keyword rule', () => {
    it('should report error for sub-keyword under wrong parent', () => {
      const source = `*button: Click
\t*save: value`;
      const result = lint(source);

      const invalidSubKeywordError = result.messages.find(m => m.ruleId === 'valid-sub-keyword');
      expect(invalidSubKeywordError).toBeDefined();
    });

    it('should not report error for valid sub-keyword', () => {
      const source = `*question: What?
\t*save: answer`;
      const result = lint(source);

      const invalidSubKeywordError = result.messages.find(m => m.ruleId === 'valid-sub-keyword');
      expect(invalidSubKeywordError).toBeUndefined();
    });
  });

  describe('no-undefined-vars rule', () => {
    it('should report error for undefined variable', () => {
      const source = '>> y = undefinedVar + 1';
      const result = lint(source);

      const undefinedVarError = result.messages.find(m => m.ruleId === 'no-undefined-vars');
      expect(undefinedVarError).toBeDefined();
    });

    it('should not report error for defined variable', () => {
      const source = `>> x = 5
>> y = x + 1`;
      const result = lint(source);

      const undefinedVarError = result.messages.find(m =>
        m.ruleId === 'no-undefined-vars' && m.message.includes('x')
      );
      expect(undefinedVarError).toBeUndefined();
    });
  });

  describe('no-unused-vars rule', () => {
    it('should report warning for unused variable', () => {
      const source = '>> unusedVar = 5';
      const result = lint(source);

      const unusedVarWarning = result.messages.find(m => m.ruleId === 'no-unused-vars');
      expect(unusedVarWarning).toBeDefined();
      expect(unusedVarWarning?.severity).toBe('warning');
    });

    it('should not report warning for used variable', () => {
      const source = `>> x = 5
>> y = x + 1`;
      const result = lint(source);

      const unusedXWarning = result.messages.find(m =>
        m.ruleId === 'no-unused-vars' && m.message.includes("'x'")
      );
      expect(unusedXWarning).toBeUndefined();
    });

    it('should not report warning for variable used in interpolated string', () => {
      const source = `>> response = {}
>> error_message = "Error: {response}"`;
      const result = lint(source);

      const unusedWarning = result.messages.find(m =>
        m.ruleId === 'no-unused-vars' && m.message.includes("'response'")
      );
      expect(unusedWarning).toBeUndefined();
    });
  });

  describe('no-invalid-goto rule', () => {
    it('should report error for goto to non-existent label', () => {
      const source = '*goto: nonExistentLabel';
      const result = lint(source);

      const gotoError = result.messages.find(m => m.ruleId === 'no-invalid-goto');
      expect(gotoError).toBeDefined();
      expect(gotoError?.severity).toBe('error');
    });

    it('should not report error for goto to existing label', () => {
      const source = `*label: myLabel
*goto: myLabel`;
      const result = lint(source);

      const gotoError = result.messages.find(m => m.ruleId === 'no-invalid-goto');
      expect(gotoError).toBeUndefined();
    });
  });

  describe('indent-style rule', () => {
    it('should report error for space indentation', () => {
      const source = `*if: true
    IndentedWithSpaces`;
      const result = lint(source);

      const indentError = result.messages.find(m => m.ruleId === 'indent-style');
      expect(indentError).toBeDefined();
    });

    it('should not report error for tab indentation', () => {
      const source = `*if: true
\tIndentedWithTab`;
      const result = lint(source);

      const indentError = result.messages.find(m => m.ruleId === 'indent-style');
      expect(indentError).toBeUndefined();
    });
  });

  describe('no-unclosed-string rule', () => {
    it('should report error for unclosed string', () => {
      const source = '>> x = "unclosed string';
      const result = lint(source);

      const unclosedError = result.messages.find(m => m.ruleId === 'no-unclosed-string');
      expect(unclosedError).toBeDefined();
    });

    it('should not report error for closed string', () => {
      const source = '>> x = "closed string"';
      const result = lint(source);

      const unclosedError = result.messages.find(m => m.ruleId === 'no-unclosed-string');
      expect(unclosedError).toBeUndefined();
    });
  });

  describe('no-unclosed-bracket rule', () => {
    it('should report error for unclosed bracket', () => {
      const source = '>> x = [1, 2, 3';
      const result = lint(source);

      const unclosedError = result.messages.find(m => m.ruleId === 'no-unclosed-bracket');
      expect(unclosedError).toBeDefined();
    });

    it('should report error for mismatched brackets', () => {
      const source = '>> x = [1, 2, 3)';
      const result = lint(source);

      const mismatchError = result.messages.find(m =>
        m.ruleId === 'no-unclosed-bracket' && m.message.includes('Mismatched')
      );
      expect(mismatchError).toBeDefined();
    });

    it('should not report error for balanced brackets', () => {
      const source = '>> x = [1, 2, 3]';
      const result = lint(source);

      const bracketError = result.messages.find(m => m.ruleId === 'no-unclosed-bracket');
      expect(bracketError).toBeUndefined();
    });
  });

  describe('Linter configuration', () => {
    it('should respect rule severity configuration', () => {
      const source = '>> unusedVar = 5';
      const result = lint(source, {
        rules: {
          'no-unused-vars': 'off',
        },
      });

      const unusedVarWarning = result.messages.find(m => m.ruleId === 'no-unused-vars');
      expect(unusedVarWarning).toBeUndefined();
    });

    it('should allow changing rule severity', () => {
      const source = '>> unusedVar = 5';
      const result = lint(source, {
        rules: {
          'no-unused-vars': 'error',
        },
      });

      const unusedVarError = result.messages.find(m => m.ruleId === 'no-unused-vars');
      expect(unusedVarError?.severity).toBe('error');
    });
  });

  describe('Auto-fix', () => {
    it('should have fix method on Linter', () => {
      const linter = new Linter();
      expect(typeof linter.fix).toBe('function');
    });

    it('should return source unchanged if no fixable issues', () => {
      const linter = new Linter();
      const source = 'Hello world';
      const fixed = linter.fix(source);

      expect(fixed).toBe(source);
    });
  });
});
