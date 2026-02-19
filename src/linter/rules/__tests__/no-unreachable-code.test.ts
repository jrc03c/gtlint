import { describe, it, expect } from 'vitest';
import { Linter } from '../../linter.js';

describe('no-unreachable-code', () => {
  const linter = new Linter({
    lint: {
      'no-unreachable-code': 'warn',
      'no-undefined-vars': 'off',
      'no-unused-vars': 'off',
      'valid-keyword': 'off',
      'valid-sub-keyword': 'off',
    },
  });

  it('should detect unreachable code after goto', () => {
    const code = `
*goto: end

This text is unreachable

*label: end
Done
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('Unreachable code after unconditional transfer');
  });

  it('should not flag code after goto when next statement is a label', () => {
    const code = `
*goto: end

*label: end
Done
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(0);
  });

  it('should detect unreachable code in false condition', () => {
    const code = `
*if: false
	This is unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('condition is always false');
  });

  it('should detect unreachable code with constant comparison', () => {
    const code = `
*if: 5 > 10
	This is unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('condition is always false');
  });

  it('should detect unreachable else after always-true condition', () => {
    const code = `
*if: true
	Reachable
	*else:
		This is unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('previous condition is always true');
  });

  it('should detect unreachable elseif after always-true condition', () => {
    const code = `
*if: true
	Reachable
	*elseif: x > 0
		This is unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('previous condition is always true');
  });

  it('should detect unreachable while loop body', () => {
    const code = `
*while: false
	This loop never runs
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('loop condition is always false');
  });

  it('should NOT flag code after program call (program is like a function call)', () => {
    const code = `
*program: some-program

This text is reachable (program calls return)

Done
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(0);
  });

  it('should NOT flag code when variable could be from parent', () => {
    const code = `
-- @from-parent: x
*if: x > 5
	This might be reachable
`;
    const result = linter.lint(code);
    // We can't determine if x > 5, so no error
    expect(result.messages).toHaveLength(0);
  });

  it('should NOT flag code when condition uses variables', () => {
    const code = `
>> x = 5
*if: x > 10
	This might be reachable (x could be modified by user input, parent program, etc)
`;
    const result = linter.lint(code);
    // We're conservative - we don't track variable modifications across statements
    expect(result.messages).toHaveLength(0);
  });

  it('should handle nested blocks correctly', () => {
    const code = `
*if: true
	Reachable
	*if: false
		Unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('condition is always false');
  });

  it('should handle logical operators in conditions', () => {
    const code = `
*if: true and false
	Unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('condition is always false');
  });

  it('should handle logical OR correctly', () => {
    const code = `
*if: true or false
	Reachable
	*else:
		Unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('previous condition is always true');
  });

  it('should handle unary not operator', () => {
    const code = `
*if: not true
	Unreachable
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('condition is always false');
  });

  it('should NOT flag reachable code', () => {
    const code = `
*if: x > 5
	This is reachable

*question: What is your name?
	*save: name

*if: name = "Alice"
	Hi Alice
`;
    const result = linter.lint(code);
    expect(result.messages).toHaveLength(0);
  });
});
