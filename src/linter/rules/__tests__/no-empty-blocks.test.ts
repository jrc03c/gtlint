import { describe, it, expect } from 'vitest';
import { Linter } from '../../linter.js';

describe('no-empty-blocks', () => {
  const linter = new Linter({
    rules: {
      'no-empty-blocks': 'error',
      'no-undefined-vars': 'off',
      'no-unused-vars': 'off',
      'valid-keyword': 'off',
      'valid-sub-keyword': 'off',
      'correct-indentation': 'off',
      'required-subkeywords': 'off',
    },
  });

  // -------------------------------------------------------------------------
  // Detection: empty control flow blocks
  // -------------------------------------------------------------------------

  it('should detect empty *if block', () => {
    const code = `*if: x > 5\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*if:` block is empty');
  });

  it('should detect empty *while block', () => {
    const code = `*while: running\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*while:` block is empty');
  });

  it('should detect empty *for block', () => {
    const code = `*for: item in items\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*for:` block is empty');
  });

  it('should detect empty *repeat block', () => {
    const code = `*repeat: 3\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*repeat:` block is empty');
  });

  it('should detect empty *else block', () => {
    const code = `*if: x > 5\n\tSomething\n\t*else:\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*else:` block is empty');
  });

  it('should detect empty *elseif block', () => {
    const code = `*if: x > 5\n\tSomething\n\t*elseif: x > 3\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*elseif:` block is empty');
  });

  // -------------------------------------------------------------------------
  // Detection: other body-required keywords
  // -------------------------------------------------------------------------

  it('should detect empty *page block', () => {
    const code = `*page:\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*page:` block is empty');
  });

  it('should detect empty *html block', () => {
    const code = `*html:\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*html:` block is empty');
  });

  it('should detect empty *service block', () => {
    const code = `*service: My API\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*service:` block is empty');
  });

  // -------------------------------------------------------------------------
  // No false positives
  // -------------------------------------------------------------------------

  it('should NOT flag non-empty *if block', () => {
    const code = `*if: x > 5\n\tHello\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(0);
  });

  it('should NOT flag non-empty *page block', () => {
    const code = `*page:\n\tWelcome\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(0);
  });

  it('should NOT flag keywords without required bodies', () => {
    const code = `*button: Click me\n*goto: end\n*label: end\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(0);
  });

  it('should NOT flag *question (body not required)', () => {
    const code = `*question: What is your name?\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // Nested blocks
  // -------------------------------------------------------------------------

  it('should detect empty block inside non-empty parent', () => {
    const code = `*if: x > 5\n\t*if: y > 3\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toBe('`*if:` block is empty');
  });

  it('should detect multiple empty blocks', () => {
    const code = `*if: x > 5\n*while: running\n`;
    const result = linter.lint(code);
    const msgs = result.messages.filter(m => m.ruleId === 'no-empty-blocks');
    expect(msgs).toHaveLength(2);
  });
});
