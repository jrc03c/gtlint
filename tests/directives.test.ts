import { describe, it, expect } from 'vitest';
import { parseDirectives, isRuleDisabled, isFromParentVar, isFromChildVar, isToParentVar, isToChildVar } from '../src/linter/directives.js';
import { Linter } from '../src/linter/linter.js';

describe('Directives Parser', () => {
  describe('gtlint-disable / gtlint-enable', () => {
    it('should disable all rules in a region', () => {
      const source = `-- gtlint-disable
*set: x
-- gtlint-enable`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(true);
      expect(isRuleDisabled(state, 3, 'no-unused-vars')).toBe(false);
    });

    it('should disable specific rules in a region', () => {
      const source = `-- gtlint-disable no-unused-vars
*set: x
-- gtlint-enable`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(false);
    });

    it('should handle multiple specific rules', () => {
      const source = `-- gtlint-disable no-unused-vars, no-undefined-vars
*set: x
-- gtlint-enable`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'valid-keyword')).toBe(false);
    });

    it('should re-enable specific rules while keeping others disabled', () => {
      const source = `-- gtlint-disable no-unused-vars, no-undefined-vars
*set: x
-- gtlint-enable no-unused-vars
*set: y
-- gtlint-enable`;
      const state = parseDirectives(source);

      // Line 2: both disabled
      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(true);

      // Line 4: no-unused-vars re-enabled, no-undefined-vars still disabled
      expect(isRuleDisabled(state, 4, 'no-unused-vars')).toBe(false);
      expect(isRuleDisabled(state, 4, 'no-undefined-vars')).toBe(true);

      // Line 5: all re-enabled
      expect(isRuleDisabled(state, 5, 'no-undefined-vars')).toBe(false);
    });

    it('should handle unclosed disable regions (until end of file)', () => {
      const source = `-- gtlint-disable no-unused-vars
*set: x
*set: y`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 3, 'no-unused-vars')).toBe(true);
    });
  });

  describe('gtlint-disable-next-line', () => {
    it('should disable all rules for the next line only', () => {
      const source = `-- gtlint-disable-next-line
*set: x
*set: y`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(true);
      expect(isRuleDisabled(state, 3, 'no-unused-vars')).toBe(false);
    });

    it('should disable specific rules for the next line only', () => {
      const source = `-- gtlint-disable-next-line no-unused-vars
*set: x
*set: y`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(false);
      expect(isRuleDisabled(state, 3, 'no-unused-vars')).toBe(false);
    });

    it('should handle multiple rules in disable-next-line', () => {
      const source = `-- gtlint-disable-next-line no-unused-vars, no-undefined-vars
*set: x = y`;
      const state = parseDirectives(source);

      expect(isRuleDisabled(state, 2, 'no-unused-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'no-undefined-vars')).toBe(true);
      expect(isRuleDisabled(state, 2, 'valid-keyword')).toBe(false);
    });
  });

  describe('@from-parent directive', () => {
    it('should parse variables from parent', () => {
      const source = `-- @from-parent: inputVar1, inputVar2
*if: inputVar1 > 0`;
      const state = parseDirectives(source);

      expect(isFromParentVar(state, 'inputVar1')).toBe(true);
      expect(isFromParentVar(state, 'inputVar2')).toBe(true);
      expect(isFromParentVar(state, 'otherVar')).toBe(false);
    });

    it('should handle multiple @from-parent directives', () => {
      const source = `-- @from-parent: var1
-- @from-parent: var2, var3`;
      const state = parseDirectives(source);

      expect(isFromParentVar(state, 'var1')).toBe(true);
      expect(isFromParentVar(state, 'var2')).toBe(true);
      expect(isFromParentVar(state, 'var3')).toBe(true);
    });
  });

  describe('@from-child directive', () => {
    it('should parse variables from child', () => {
      const source = `-- @from-child: result, status
*if: result = "success"`;
      const state = parseDirectives(source);

      expect(isFromChildVar(state, 'result')).toBe(true);
      expect(isFromChildVar(state, 'status')).toBe(true);
      expect(isFromChildVar(state, 'otherVar')).toBe(false);
    });
  });

  describe('@to-parent directive', () => {
    it('should parse variables sent to parent', () => {
      const source = `-- @to-parent: outputVar1, outputVar2
>> outputVar1 = 42`;
      const state = parseDirectives(source);

      expect(isToParentVar(state, 'outputVar1')).toBe(true);
      expect(isToParentVar(state, 'outputVar2')).toBe(true);
      expect(isToParentVar(state, 'otherVar')).toBe(false);
    });
  });

  describe('@to-child directive', () => {
    it('should parse variables sent to child', () => {
      const source = `-- @to-child: email_address, user_id
>> email_address = "test@example.com"`;
      const state = parseDirectives(source);

      expect(isToChildVar(state, 'email_address')).toBe(true);
      expect(isToChildVar(state, 'user_id')).toBe(true);
      expect(isToChildVar(state, 'otherVar')).toBe(false);
    });
  });
});

describe('Linter with Directives', () => {
  describe('gtlint-disable', () => {
    it('should suppress all warnings in disabled region', () => {
      const linter = new Linter();
      const source = `-- gtlint-disable
>> x = undefinedVar
-- gtlint-enable`;
      const result = linter.lint(source);

      expect(result.messages).toHaveLength(0);
    });

    it('should suppress specific rule in disabled region', () => {
      const linter = new Linter();
      const source = `-- gtlint-disable no-undefined-vars
>> x = undefinedVar
-- gtlint-enable`;
      const result = linter.lint(source);

      // Should have unused-vars warning but not undefined-vars
      const undefinedVarsMessages = result.messages.filter(m => m.ruleId === 'no-undefined-vars');
      const unusedVarsMessages = result.messages.filter(m => m.ruleId === 'no-unused-vars');

      expect(undefinedVarsMessages).toHaveLength(0);
      expect(unusedVarsMessages.length).toBeGreaterThan(0);
    });
  });

  describe('gtlint-disable-next-line', () => {
    it('should suppress warnings for next line only', () => {
      const linter = new Linter();
      const source = `-- gtlint-disable-next-line
>> x = undefinedVar1
>> y = undefinedVar2`;
      const result = linter.lint(source);

      // Line 2 should be suppressed, line 3 should report
      const line2Messages = result.messages.filter(m => m.line === 2);
      const line3Messages = result.messages.filter(m => m.line === 3);

      expect(line2Messages).toHaveLength(0);
      expect(line3Messages.length).toBeGreaterThan(0);
    });
  });

  describe('@from-parent directive', () => {
    it('should suppress no-undefined-vars for variables from parent', () => {
      const linter = new Linter();
      const source = `-- @from-parent: inputVar
>> x = inputVar`;
      const result = linter.lint(source);

      // inputVar should not be reported as undefined
      const undefinedMessages = result.messages.filter(
        m => m.ruleId === 'no-undefined-vars' && m.message.includes('inputVar')
      );

      expect(undefinedMessages).toHaveLength(0);
    });

    it('should still report truly undefined variables', () => {
      const linter = new Linter();
      const source = `-- @from-parent: inputVar
>> x = otherVar`;
      const result = linter.lint(source);

      // otherVar should still be reported as undefined
      const undefinedMessages = result.messages.filter(
        m => m.ruleId === 'no-undefined-vars' && m.message.includes('otherVar')
      );

      expect(undefinedMessages).toHaveLength(1);
    });
  });

  describe('@from-child directive', () => {
    it('should suppress no-undefined-vars for variables from child', () => {
      const linter = new Linter();
      const source = `-- @from-child: was_added
*if: was_added = "yes"
	Success!`;
      const result = linter.lint(source);

      // was_added should not be reported as undefined
      const undefinedMessages = result.messages.filter(
        m => m.ruleId === 'no-undefined-vars' && m.message.includes('was_added')
      );

      expect(undefinedMessages).toHaveLength(0);
    });
  });

  describe('@to-parent directive', () => {
    it('should suppress no-unused-vars for variables sent to parent', () => {
      const linter = new Linter();
      const source = `-- @to-parent: outputVar
>> outputVar = 42`;
      const result = linter.lint(source);

      // outputVar should not be reported as unused
      const unusedMessages = result.messages.filter(
        m => m.ruleId === 'no-unused-vars' && m.message.includes('outputVar')
      );

      expect(unusedMessages).toHaveLength(0);
    });

    it('should still report truly unused variables', () => {
      const linter = new Linter();
      const source = `-- @to-parent: outputVar
>> outputVar = 42
>> otherVar = 10`;
      const result = linter.lint(source);

      // otherVar should still be reported as unused
      const unusedMessages = result.messages.filter(
        m => m.ruleId === 'no-unused-vars' && m.message.includes('otherVar')
      );

      expect(unusedMessages).toHaveLength(1);
    });
  });

  describe('@to-child directive', () => {
    it('should suppress no-unused-vars for variables sent to child', () => {
      const linter = new Linter();
      const source = `-- @to-child: email_address
>> email_address = "test@example.com"
*program: Add Email`;
      const result = linter.lint(source);

      // email_address should not be reported as unused
      const unusedMessages = result.messages.filter(
        m => m.ruleId === 'no-unused-vars' && m.message.includes('email_address')
      );

      expect(unusedMessages).toHaveLength(0);
    });
  });

  describe('combined directives', () => {
    it('should handle parent program with @to-child and @from-child', () => {
      const linter = new Linter();
      const source = `-- @to-child: email_address
-- @from-child: was_added
>> email_address = "someone@example.com"
*program: Add Email Address to Mailing List
*if: was_added = "yes"
	We added you to our mailing list!`;
      const result = linter.lint(source);

      // Both email_address (unused) and was_added (undefined) should be suppressed
      expect(result.messages).toHaveLength(0);
    });

    it('should handle child program with @from-parent and @to-parent', () => {
      const linter = new Linter();
      const source = `-- @from-parent: email_address
-- @to-parent: was_added
>> was_added = "no"
*if: email_address
	>> was_added = "yes"`;
      const result = linter.lint(source);

      // Both email_address (undefined) and was_added (unused) should be suppressed
      expect(result.messages).toHaveLength(0);
    });
  });
});
