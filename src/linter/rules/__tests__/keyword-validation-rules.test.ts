import { describe, it, expect } from 'vitest';
import { Linter } from '../../linter.js';

// Helper to create a linter with only specific rules enabled
function createLinter(rules: Record<string, 'error' | 'warn' | 'off'>) {
  return new Linter({
    lint: {
      'no-undefined-vars': 'off',
      'no-unused-vars': 'off',
      'valid-keyword': 'off',
      'valid-sub-keyword': 'off',
      'no-invalid-goto': 'off',
      'indent-style': 'off',
      'no-unclosed-string': 'off',
      'no-unclosed-bracket': 'off',
      'no-single-quotes': 'off',
      'no-unreachable-code': 'off',
      'required-subkeywords': 'off',
      'valid-subkeyword-value': 'off',
      'no-inline-argument': 'off',
      'goto-needs-reset-in-events': 'off',
      'purchase-subkeyword-constraints': 'off',
      ...rules,
    },
  });
}

describe('required-subkeywords rule', () => {
  const linter = createLinter({
    'required-subkeywords': 'error',
  });

  it('should report missing required sub-keywords for *chart:', () => {
    const result = linter.lint(`
*chart: My Chart
	Some text
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('*chart:');
    expect(result.messages[0].message).toContain('*type:');
    expect(result.messages[0].message).toContain('*data:');
  });

  it('should not report when *chart: has all required sub-keywords', () => {
    const result = linter.lint(`
*chart: My Chart
	*type: bar
	*data: [[1, 2], [3, 4]]
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should report missing required sub-keywords for *service:', () => {
    const result = linter.lint(`
*service: My API
	*path: /api/test
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('*service:');
    expect(result.messages[0].message).toContain('*method:');
  });

  it('should not report when *service: has all required sub-keywords', () => {
    const result = linter.lint(`
*service: My API
	*path: /api/test
	*method: GET
	*success
		>> data = it
	*error
		>> err = it
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should report missing required sub-keywords for *email', () => {
    const result = linter.lint(`
*email
	*to: test@example.com
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('*email');
    expect(result.messages[0].message).toContain('*subject:');
    expect(result.messages[0].message).toContain('*body:');
  });

  it('should report missing required sub-keywords for *database:', () => {
    const result = linter.lint(`
*database: request
	*what: email
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('*database:');
    expect(result.messages[0].message).toContain('*success');
  });
});

describe('valid-subkeyword-value rule', () => {
  const linter = createLinter({
    'valid-subkeyword-value': 'error',
  });

  it('should report invalid *type: value for *chart:', () => {
    const result = linter.lint(`
*chart: My Chart
	*type: pie
	*data: [[1, 2]]
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("Invalid value 'pie'");
    expect(result.messages[0].message).toContain('bar, line, scatter');
  });

  it('should accept valid *type: value for *chart:', () => {
    const result = linter.lint(`
*chart: My Chart
	*type: scatter
	*data: [[1, 2]]
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should report invalid *type: value for *question:', () => {
    const result = linter.lint(`
*question: What is your name?
	*type: dropdown
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("Invalid value 'dropdown'");
  });

  it('should accept valid *type: values for *question:', () => {
    const result = linter.lint(`
*question: Pick a date
	*type: calendar
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should report invalid *method: value for *service:', () => {
    const result = linter.lint(`
*service: My API
	*path: /test
	*method: SEND
	*success
		>> x = 1
	*error
		>> x = 2
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("Invalid value 'SEND'");
    expect(result.messages[0].message).toContain('CONNECT, DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT, TRACE');
  });

  it('should report invalid yes-no value', () => {
    const result = linter.lint(`
*audio: https://example.com/audio.mp3
	*start: true
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("Invalid value 'true'");
    expect(result.messages[0].message).toContain("'yes' or 'no'");
  });

  it('should accept valid yes-no values', () => {
    const result = linter.lint(`
*audio: https://example.com/audio.mp3
	*start: yes
	*hide: no
`);
    expect(result.messages).toHaveLength(0);
  });
});

describe('no-inline-argument rule', () => {
  const linter = createLinter({
    'no-inline-argument': 'error',
  });

  it('should report inline argument on *page', () => {
    const result = linter.lint(`
*page: some argument
	Hello world
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("'*page' should not have an inline argument");
  });

  it('should not report *page without argument', () => {
    const result = linter.lint(`
*page
	Hello world
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should report inline argument on *html', () => {
    const result = linter.lint(`
*html: something
	<div>Test</div>
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("'*html' should not have an inline argument");
  });

  it('should report inline argument on *clear', () => {
    const result = linter.lint(`
*clear: something
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("'*clear' should not have an inline argument");
  });

  it('should not report *clear without argument', () => {
    const result = linter.lint(`
*clear
`);
    expect(result.messages).toHaveLength(0);
  });
});

describe('goto-needs-reset-in-events rule', () => {
  const linter = createLinter({
    'goto-needs-reset-in-events': 'warn',
  });

  it('should warn about *goto: without *reset inside *events', () => {
    const result = linter.lint(`
*events
	myEvent
		>> x = 5
		*goto: someLabel
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("'*goto:' inside '*events' should have '*reset'");
    expect(result.messages[0].severity).toBe('warning');
  });

  it('should not warn when *goto: has *reset inside *events', () => {
    const result = linter.lint(`
*events
	myEvent
		>> x = 5
		*goto: someLabel
			*reset
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should not warn about *goto: outside *events', () => {
    const result = linter.lint(`
*label: start

*question: Continue?
	Yes
		*goto: start
	No
`);
    expect(result.messages).toHaveLength(0);
  });
});

describe('purchase-subkeyword-constraints rule', () => {
  const linter = createLinter({
    'purchase-subkeyword-constraints': 'error',
  });

  it('should report *purchase without a mode sub-keyword', () => {
    const result = linter.lint(`
*purchase
	*success
		>> x = 1
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('must have exactly one of');
  });

  it('should report *purchase with multiple mode sub-keywords', () => {
    const result = linter.lint(`
*purchase
	*status
	*frequency: recurring
	*success
		>> x = 1
	*error
		>> x = 2
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain('cannot have multiple mode sub-keywords');
  });

  it('should report *purchase with *status but missing *success/*error', () => {
    const result = linter.lint(`
*purchase
	*status
`);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].message).toContain("'*purchase' with '*status' requires");
    expect(result.messages[0].message).toContain('*success');
    expect(result.messages[0].message).toContain('*error');
  });

  it('should not report *purchase with *management (no success/error needed)', () => {
    const result = linter.lint(`
*purchase
	*management
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should not report valid *purchase with *status and callbacks', () => {
    const result = linter.lint(`
*purchase
	*status
	*success
		>> subscribed = it
	*error
		>> err = it
`);
    expect(result.messages).toHaveLength(0);
  });

  it('should not report valid *purchase with *frequency and callbacks', () => {
    const result = linter.lint(`
*purchase: myPlan
	*frequency: recurring
	*success
		>> subscribed = 1
	*error
		>> subscribed = 0
`);
    expect(result.messages).toHaveLength(0);
  });
});
