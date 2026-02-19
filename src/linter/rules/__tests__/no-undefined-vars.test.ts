import { describe, it, expect } from 'vitest';
import { Linter } from '../../linter.js';

describe('no-undefined-vars', () => {
  const linter = new Linter({
    lint: {
      'no-undefined-vars': 'error',
      'no-unused-vars': 'off',
      'no-unreachable-code': 'off',
      'valid-keyword': 'off',
      'valid-sub-keyword': 'off',
    },
  });

  function getMessages(code: string) {
    return linter.lint(code).messages.filter(m => m.ruleId === 'no-undefined-vars');
  }

  describe('use before define', () => {
    it('should report variable used before assignment', () => {
      const code = `*if: x > 0
\tX is positive!

>> x = 7`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'x' is used before it is defined");
      expect(msgs[0].line).toBe(1);
    });

    it('should report variable used before *set:', () => {
      const code = `The value is {x}.
*set: x
\t5`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'x' is used before it is defined");
    });

    it('should NOT report variable used after assignment', () => {
      const code = `>> x = 7
*if: x > 0
\tX is positive!`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });

    it('should NOT report variable used on the same line as its definition', () => {
      const code = `>> x = x + 1`;
      const msgs = getMessages(code);
      // Same-line: we don't flag this (would require column-level analysis)
      expect(msgs).toHaveLength(0);
    });

    it('should use earliest definition when variable is defined multiple times', () => {
      const code = `>> x = 1
*if: x > 0
\tX is positive!
>> x = 10`;
      const msgs = getMessages(code);
      // x is first defined on line 1, used on line 2 — no error
      expect(msgs).toHaveLength(0);
    });

    it('should report when usage comes before earliest of multiple definitions', () => {
      const code = `*if: x > 0
\tX is positive!
>> x = 1
>> x = 10`;
      const msgs = getMessages(code);
      // x first defined on line 3, used on line 1
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'x' is used before it is defined");
      expect(msgs[0].line).toBe(1);
    });

    it('should handle *for: loop variable used before the loop', () => {
      const code = `The value is {item}.
>> items = [1, 2, 3]
*for: item in items
\t{item}`;
      const msgs = getMessages(code);
      // 'item' on line 1 is used before its definition on line 3
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'item' is used before it is defined");
      expect(msgs[0].line).toBe(1);
    });

    it('should NOT report *for: loop variable used inside the loop body', () => {
      const code = `>> items = [1, 2, 3]
*for: item in items
\tThe value is {item}.`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });

    it('should handle *save: variable used before the question', () => {
      const code = `The name is {name}.
*question: What is your name?
\t*save: name`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'name' is used before it is defined");
      expect(msgs[0].line).toBe(1);
    });

    it('should NOT report *save: variable used after the question', () => {
      const code = `*question: What is your name?
\t*save: name
The name is {name}.`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });

    it('should NOT report @from-parent variables regardless of position', () => {
      const code = `-- @from-parent: x
*if: x > 0
\tX is positive!`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });

    it('should NOT report @from-child variables regardless of position', () => {
      const code = `-- @from-child: result
The result is {result}.`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });
  });

  describe('expression-type sub-keyword arguments', () => {
    it('should report undefined variable in *send: under *trigger', () => {
      const code = `*trigger: foo-event
\t*send: x`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'x' is not defined");
    });

    it('should NOT report defined variable in *send: under *trigger', () => {
      const code = `>> x = 42
*trigger: foo-event
\t*send: x`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });

    it('should report undefined variable in *send: under *service', () => {
      const code = `*service: MyAPI
\t*path: /endpoint
\t*method: POST
\t*send: payload
\t*success
\t\t>> result = it
\t*error
\t\t>> err = it`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'payload' is not defined");
    });

    it('should report undefined variable in *data: under *chart', () => {
      const code = `*chart: My Chart
\t*type: bar
\t*data: chartData`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'chartData' is not defined");
    });

    it('should report undefined variable in *answers: under *question', () => {
      const code = `*question: Pick one
\t*answers: options`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'options' is not defined");
    });

    it('should report undefined variable in *default: under *question', () => {
      const code = `*question: Pick one
\t*type: text
\t*default: savedValue`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'savedValue' is not defined");
    });

    it('should report undefined variable in *with: under *component', () => {
      const code = `*component
\t*with: myData
\tContent here`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'myData' is not defined");
    });

    it('should NOT report defined variable in *with: under *component', () => {
      const code = `>> myData = 42
*component
\t*with: myData
\tContent here`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });
  });

  describe('completely undefined (existing behavior)', () => {
    it('should still report completely undefined variables', () => {
      const code = `*if: neverDefined > 0
\tSomething`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].message).toContain("'neverDefined' is not defined");
    });

    it('should NOT report builtin variables', () => {
      const code = `*if: it > 0
\tSomething`;
      const msgs = getMessages(code);
      expect(msgs).toHaveLength(0);
    });
  });
});
