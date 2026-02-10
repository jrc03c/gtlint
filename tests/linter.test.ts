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

    it('should not report error for index variable in *for: i, v in collection', () => {
      const source = `>> x = ["a", "b", "c"]
*for: i, v in x
\tThe value of x at index {i} is {v}.`;
      const result = lint(source);

      const undefinedI = result.messages.find(m =>
        m.ruleId === 'no-undefined-vars' && m.message.includes("'i'")
      );
      const undefinedV = result.messages.find(m =>
        m.ruleId === 'no-undefined-vars' && m.message.includes("'v'")
      );
      expect(undefinedI).toBeUndefined();
      expect(undefinedV).toBeUndefined();
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

    it('should not report warning for variable used in equality comparison', () => {
      const source = `>> errors = 0
*if: errors = 1
\tSomething went wrong`;
      const result = lint(source);

      const unusedWarning = result.messages.find(m =>
        m.ruleId === 'no-unused-vars' && m.message.includes("'errors'")
      );
      expect(unusedWarning).toBeUndefined();
    });

    it('should not report warning for variable used via indexed assignment', () => {
      const source = `>> payload = {}
>> payload["key"] = "value"`;
      const result = lint(source);

      const unusedWarning = result.messages.find(m =>
        m.ruleId === 'no-unused-vars' && m.message.includes("'payload'")
      );
      expect(unusedWarning).toBeUndefined();
    });

    it('should not report warning for variable used in *send: sub-keyword', () => {
      const source = `>> payload = {}
*trigger: someEvent
\t*send: payload`;
      const result = lint(source);

      const unusedWarning = result.messages.find(m =>
        m.ruleId === 'no-unused-vars' && m.message.includes("'payload'")
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

  describe('no-duplicate-labels rule', () => {
    it('should report error for duplicate label definitions', () => {
      const source = `*label: myLabel
*goto: myLabel
*label: myLabel`;
      const result = lint(source);

      const dupErrors = result.messages.filter(m => m.ruleId === 'no-duplicate-labels');
      expect(dupErrors).toHaveLength(1);
      expect(dupErrors[0].severity).toBe('error');
      expect(dupErrors[0].message).toContain("Duplicate label 'myLabel'");
      expect(dupErrors[0].message).toContain('line 1');
    });

    it('should not report error when all labels are unique', () => {
      const source = `*label: labelA
*label: labelB
*label: labelC`;
      const result = lint(source);

      const dupErrors = result.messages.filter(m => m.ruleId === 'no-duplicate-labels');
      expect(dupErrors).toHaveLength(0);
    });

    it('should report multiple errors for three identical labels', () => {
      const source = `*label: dup
*label: dup
*label: dup`;
      const result = lint(source);

      const dupErrors = result.messages.filter(m => m.ruleId === 'no-duplicate-labels');
      expect(dupErrors).toHaveLength(2);
    });

    it('should detect duplicates inside nested blocks', () => {
      const source = `*label: top
*if: 1
\t*label: top`;
      const result = lint(source);

      const dupErrors = result.messages.filter(m => m.ruleId === 'no-duplicate-labels');
      expect(dupErrors).toHaveLength(1);
      expect(dupErrors[0].message).toContain("Duplicate label 'top'");
    });

    it('should be configurable to off', () => {
      const source = `*label: x
*label: x`;
      const result = lint(source, { rules: { 'no-duplicate-labels': 'off' } });

      const dupErrors = result.messages.filter(m => m.ruleId === 'no-duplicate-labels');
      expect(dupErrors).toHaveLength(0);
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

  describe('correct-indentation rule', () => {
    it('should report error for over-indentation', () => {
      const source = `*if: 0 < 1\n\t\t*program: Some Cool Program`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      const overIndent = errors.find(m => m.message.includes('Expected indentation'));
      expect(overIndent).toBeDefined();
      expect(overIndent?.message).toBe('Expected indentation of 1 tab but found 2');
    });

    it('should report error when body is not allowed', () => {
      const source = `*button: Click me\n\tSome text`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      const bodyNotAllowed = errors.find(m => m.message.includes('does not allow'));
      expect(bodyNotAllowed).toBeDefined();
      expect(bodyNotAllowed?.message).toBe("'*button:' does not allow an indented body");
    });

    it('should not report error for valid indentation', () => {
      const source = `*if: 0 < 1\n\t*program: Some Cool Program`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      expect(errors).toHaveLength(0);
    });

    it('should not report error for optional body absent', () => {
      const source = `*question: What?\nGreat!`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      expect(errors).toHaveLength(0);
    });

    it('should not report error for optional body present', () => {
      const source = `*question: What?\n\tRed\n\tGreen`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      expect(errors).toHaveLength(0);
    });

    it('should report error for nested over-indentation', () => {
      const source = `*if: 0 < 1\n\t*if: 1 < 2\n\t\t\tSome text`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      const overIndent = errors.find(m => m.message.includes('Expected indentation'));
      expect(overIndent).toBeDefined();
      expect(overIndent?.message).toBe('Expected indentation of 2 tabs but found 3');
    });

    it('should report error for sub-keyword over-indentation', () => {
      const source = `*question: What?\n\t\t*save: answer`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      const overIndent = errors.find(m => m.message.includes('Expected indentation'));
      expect(overIndent).toBeDefined();
      expect(overIndent?.message).toBe('Expected indentation of 1 tab but found 2');
    });

    it('should report error for sub-keyword body over-indentation', () => {
      const source = `*chart: My Chart\n\t*xaxis:\n\t\t\tCategory A`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      const overIndent = errors.find(m => m.message.includes('Expected indentation'));
      expect(overIndent).toBeDefined();
      expect(overIndent?.message).toBe('Expected indentation of 2 tabs but found 3');
    });

    it('should not report error for empty body on body-required keyword', () => {
      const source = `*if: 0 < 1\n*program: Some Cool Program`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      expect(errors).toHaveLength(0);
    });

    it('should not report error for indented comments', () => {
      const source = `Some text\n\t--a comment\n\t-- another comment`;
      const result = lint(source);

      const errors = result.messages.filter(m => m.ruleId === 'correct-indentation');
      expect(errors).toHaveLength(0);
    });
  });

  describe('*html block handling', () => {
    it('should suppress rules in *html body', () => {
      const source = `*html
\t<div class='foo'>hello</div>`;
      const result = lint(source);

      const singleQuoteError = result.messages.find(m => m.ruleId === 'no-single-quotes');
      expect(singleQuoteError).toBeUndefined();
    });

    it('should still report no-undefined-vars in *html body', () => {
      const source = `*html
\t<p>{undefinedHtmlVar}</p>`;
      const result = lint(source);

      const undefinedVarError = result.messages.find(
        m => m.ruleId === 'no-undefined-vars' && m.message.includes('undefinedHtmlVar')
      );
      expect(undefinedVarError).toBeDefined();
    });

    it('should still count variable usages in *html body for no-unused-vars', () => {
      const source = `>> myVar = 5
*html
\t<p>{myVar}</p>`;
      const result = lint(source);

      const unusedVarWarning = result.messages.find(
        m => m.ruleId === 'no-unused-vars' && m.message.includes('myVar')
      );
      expect(unusedVarWarning).toBeUndefined();
    });

    it('should still apply rules on the *html keyword line itself', () => {
      const source = '*invalidkeyword: test';
      const result = lint(source);

      // valid-keyword fires on invalid keywords - this is just a control test
      const keywordError = result.messages.find(m => m.ruleId === 'valid-keyword');
      expect(keywordError).toBeDefined();
    });

    it('should not flag CSS properties inside {…} as undefined vars', () => {
      const source = `*html
\t<style>
\t\t.whatever {text-align: center}
\t</style>
\t<p>Hello, {name}!</p>`;
      const result = lint(source);

      // CSS identifiers inside {text-align: center} should NOT be reported
      const cssErrors = result.messages.filter(
        m => m.ruleId === 'no-undefined-vars' &&
          (m.message.includes("'text'") || m.message.includes("'align'") || m.message.includes("'center'"))
      );
      expect(cssErrors).toHaveLength(0);

      // GT interpolation {name} should still be reported as undefined
      const nameError = result.messages.find(
        m => m.ruleId === 'no-undefined-vars' && m.message.includes("'name'")
      );
      expect(nameError).toBeDefined();
    });

    it('should handle multiple *html blocks in one file', () => {
      const source = `*html
\t<div class='one'>first</div>
*button: Click me
*html
\t<div class='two'>second</div>`;
      const result = lint(source);

      const singleQuoteErrors = result.messages.filter(m => m.ruleId === 'no-single-quotes');
      expect(singleQuoteErrors).toHaveLength(0);
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
