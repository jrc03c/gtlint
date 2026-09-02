import { describe, it, expect } from 'vitest';
import { Linter } from '../../linter.js';

describe('valid-link', () => {
  const linter = new Linter({
    lint: {
      'valid-link': 'warn',
      'no-undefined-vars': 'off',
      'no-unused-vars': 'off',
      'valid-keyword': 'off',
      'valid-sub-keyword': 'off',
      'correct-indentation': 'off',
      'required-subkeywords': 'off',
      'no-empty-blocks': 'off',
      'no-inline-argument': 'off',
    },
  });

  const findings = (code: string) =>
    linter.lint(code).messages.filter((m) => m.ruleId === 'valid-link');

  // -------------------------------------------------------------------------
  // Links that work
  // -------------------------------------------------------------------------

  it('accepts a link in plain text', () => {
    expect(findings('See [here|https://example.com/foo] for details\n')).toHaveLength(0);
  });

  it('accepts a link in *question:', () => {
    expect(findings('*question: Read [this|https://example.com] first\n')).toHaveLength(0);
  });

  it('accepts a link in *maintain:', () => {
    expect(findings('*maintain: [Home|https://example.com]\n')).toHaveLength(0);
  });

  it('accepts a link in *caption:', () => {
    const code = '*image: photo.png\n\t*caption: [Source|https://example.com]\n';
    expect(findings(code)).toHaveLength(0);
  });

  it('accepts a link in an answer option', () => {
    const code = '*question: Pick one\n\t*answers\n\t\t[a|https://example.com]\n';
    expect(findings(code)).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // URLs GuidedTrack will not linkify
  // -------------------------------------------------------------------------

  it('reports a link with no scheme', () => {
    const msgs = findings('See [here|www.example.com] for details\n');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toContain('http://');
    expect(msgs[0].column).toBe(5);
  });

  it('reports the right column on an indented line', () => {
    const msgs = findings('*question: Pick one\n\t*answers\n\t\t[a|www.example.com]\n');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].line).toBe(3);
    expect(msgs[0].column).toBe(3);
  });

  it('reports the right column in a keyword argument', () => {
    const msgs = findings('\t*button: Go [now|https://example.com]\n');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].column).toBe(14);
  });

  it('reports a relative URL', () => {
    expect(findings('Go [here|/programs/42]\n')).toHaveLength(1);
  });

  it('reports a link whose display text contains a pipe', () => {
    expect(findings('Go [a|b|https://example.com]\n')).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Keywords that do not format their text at all
  // -------------------------------------------------------------------------

  it('reports a link in *button:, which renders it literally', () => {
    const msgs = findings('*button: [Go|https://example.com]\n');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].message).toContain('`*button:` does not format its text');
  });

  it('reports a link in *header:', () => {
    expect(findings('*header: [Go|https://example.com]\n')).toHaveLength(1);
  });

  it('reports a link in *tip:', () => {
    const code = '*question: How are you?\n\t*tip: see [here|https://example.com]\n';
    expect(findings(code)).toHaveLength(1);
  });

  // -------------------------------------------------------------------------
  // Places the rule deliberately stays quiet
  // -------------------------------------------------------------------------

  it('ignores links inside expressions, which may be displayed elsewhere', () => {
    expect(findings('*set: blurb = "Read [here|https://example.com]"\n')).toHaveLength(0);
    expect(findings('>> blurb = "Read [here|https://example.com]"\n')).toHaveLength(0);
  });

  it('ignores comments', () => {
    expect(findings('-- todo: link to [here|www.example.com]\n')).toHaveLength(0);
  });

  it('ignores email fields, which are rendered outside the interpreter', () => {
    const code = '*email\n\t*subject: [Read|https://example.com]\n\t*to: someone@example.com\n';
    expect(findings(code)).toHaveLength(0);
  });

  it('does not mistake array indexing for link markup', () => {
    expect(findings('*set: x = items[1|2]\n')).toHaveLength(0);
  });

  it('reports each link on a line with several', () => {
    expect(findings('[a|www.a.com] and [b|www.b.com]\n')).toHaveLength(2);
  });
});
