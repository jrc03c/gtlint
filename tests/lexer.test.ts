import { describe, it, expect } from 'vitest';
import { tokenize, TokenType } from '../src/lexer/index.js';

describe('Lexer', () => {
  describe('Basic tokens', () => {
    it('should tokenize empty input', () => {
      const tokens = tokenize('');
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should tokenize a comment', () => {
      const tokens = tokenize('-- this is a comment');
      expect(tokens[0].type).toBe(TokenType.COMMENT);
      expect(tokens[0].value).toBe('-- this is a comment');
    });

    it('should tokenize a simple keyword', () => {
      const tokens = tokenize('*button');
      expect(tokens[0].type).toBe(TokenType.KEYWORD);
      expect(tokens[0].value).toBe('*button');
    });

    it('should tokenize a keyword with colon and argument', () => {
      const tokens = tokenize('*question: What is your name?');
      expect(tokens[0].type).toBe(TokenType.KEYWORD);
      expect(tokens[0].value).toBe('*question:');
      expect(tokens[1].type).toBe(TokenType.TEXT);
    });
  });

  describe('Indentation', () => {
    it('should track indentation with tabs', () => {
      const code = '*if: x > 0\n\tHello';
      const tokens = tokenize(code);

      // Find the INDENT token
      const indentToken = tokens.find(t => t.type === TokenType.INDENT);
      expect(indentToken).toBeDefined();
    });

    it('should emit DEDENT tokens when indentation decreases', () => {
      const code = '*if: x > 0\n\tHello\nWorld';
      const tokens = tokenize(code);

      const dedentToken = tokens.find(t => t.type === TokenType.DEDENT);
      expect(dedentToken).toBeDefined();
    });
  });

  describe('Expressions', () => {
    it('should tokenize expression lines', () => {
      const tokens = tokenize('>> x = 5');
      expect(tokens[0].type).toBe(TokenType.EXPRESSION_START);
      expect(tokens[1].type).toBe(TokenType.IDENTIFIER);
      expect(tokens[1].value).toBe('x');
    });

    it('should tokenize numbers', () => {
      const tokens = tokenize('>> x = 123');
      const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
      expect(numberToken).toBeDefined();
      expect(numberToken?.value).toBe('123');
    });

    it('should tokenize floating point numbers', () => {
      const tokens = tokenize('>> x = 3.14');
      const numberToken = tokens.find(t => t.type === TokenType.NUMBER);
      expect(numberToken).toBeDefined();
      expect(numberToken?.value).toBe('3.14');
    });

    it('should tokenize strings', () => {
      const tokens = tokenize('>> x = "hello"');
      const stringToken = tokens.find(t => t.type === TokenType.STRING);
      expect(stringToken).toBeDefined();
      expect(stringToken?.value).toBe('"hello"');
    });

    it('should NOT tokenize single-quoted strings (double quotes only)', () => {
      const tokens = tokenize(">> x = 'world'");
      const stringToken = tokens.find(t => t.type === TokenType.STRING);
      // Single quotes are not valid in GuidedTrack - only double quotes
      expect(stringToken).toBeUndefined();
    });

    it('should tokenize operators', () => {
      const tokens = tokenize('>> x = 1 + 2 * 3');
      const plusToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === '+');
      const timesToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === '*');
      expect(plusToken).toBeDefined();
      expect(timesToken).toBeDefined();
    });

    it('should tokenize comparison operators', () => {
      const tokens = tokenize('>> x = a >= b');
      const geToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === '>=');
      expect(geToken).toBeDefined();
    });

    it('should tokenize arrow operator', () => {
      const tokens = tokenize('>> x = {"key" -> "value"}');
      const arrowToken = tokens.find(t => t.type === TokenType.ARROW);
      expect(arrowToken).toBeDefined();
    });
  });

  describe('Keywords and sub-keywords', () => {
    it('should distinguish keywords from sub-keywords', () => {
      const code = '*question: Q1\n\t*save: answer';
      const tokens = tokenize(code);

      const keyword = tokens.find(t => t.type === TokenType.KEYWORD);
      const subKeyword = tokens.find(t => t.type === TokenType.SUB_KEYWORD);

      expect(keyword?.value).toBe('*question:');
      expect(subKeyword?.value).toBe('*save:');
    });

    it('should tokenize label definitions', () => {
      const tokens = tokenize('*label: myLabel');
      expect(tokens[0].type).toBe(TokenType.KEYWORD);
      expect(tokens[0].value).toBe('*label:');
    });
  });

  describe('Brackets and punctuation', () => {
    it('should tokenize array literals', () => {
      const tokens = tokenize('>> x = [1, 2, 3]');

      const lbracket = tokens.find(t => t.type === TokenType.LBRACKET);
      const rbracket = tokens.find(t => t.type === TokenType.RBRACKET);
      const comma = tokens.find(t => t.type === TokenType.COMMA);

      expect(lbracket).toBeDefined();
      expect(rbracket).toBeDefined();
      expect(comma).toBeDefined();
    });

    it('should tokenize parentheses', () => {
      const tokens = tokenize('>> x = (1 + 2) * 3');

      const lparen = tokens.find(t => t.type === TokenType.LPAREN);
      const rparen = tokens.find(t => t.type === TokenType.RPAREN);

      expect(lparen).toBeDefined();
      expect(rparen).toBeDefined();
    });

    it('should tokenize object literals', () => {
      const tokens = tokenize('>> x = {"a" -> 1}');

      const lbrace = tokens.find(t => t.type === TokenType.LBRACE);
      const rbrace = tokens.find(t => t.type === TokenType.RBRACE);

      expect(lbrace).toBeDefined();
      expect(rbrace).toBeDefined();
    });
  });

  describe('Text and interpolation', () => {
    it('should tokenize plain text', () => {
      const tokens = tokenize('Hello world');
      expect(tokens[0].type).toBe(TokenType.TEXT);
      expect(tokens[0].value).toBe('Hello world');
    });

    it('should tokenize text with interpolation', () => {
      const tokens = tokenize('Hello {name}!');
      expect(tokens[0].type).toBe(TokenType.TEXT);
      // The text token should capture the whole line
    });
  });

  describe('Answer options', () => {
    it('should tokenize answer options', () => {
      const code = '*question: Pick one\n\tOption A\n\tOption B';
      const tokens = tokenize(code);

      // Should have the question keyword and text tokens for options
      const textTokens = tokens.filter(t => t.type === TokenType.TEXT);
      expect(textTokens.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Boolean and special values', () => {
    it('should tokenize boolean keywords', () => {
      const tokens = tokenize('>> x = not y');
      const notToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === 'not');
      expect(notToken).toBeDefined();
    });

    it('should tokenize and/or operators', () => {
      const code = '>> result = a and b or c';
      const tokens = tokenize(code);

      const andToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === 'and');
      const orToken = tokens.find(t => t.type === TokenType.OPERATOR && t.value === 'or');

      expect(andToken).toBeDefined();
      expect(orToken).toBeDefined();
    });
  });

  describe('Text that looks like markup', () => {
    const textValues = (code: string) =>
      tokenize(code)
        .filter((t) => t.type === TokenType.TEXT)
        .map((t) => t.value);

    it('should keep a URL in a keyword argument in one piece', () => {
      expect(textValues('*button: [Go|https://example.com/a/b]')).toEqual([
        '[Go|https://example.com/a/b]',
      ]);
    });

    it('should keep a URL in plain text in one piece', () => {
      expect(textValues('[Click here|https://example.com/foo] to learn more!')).toEqual([
        '[Click here|https://example.com/foo] to learn more!',
      ]);
    });

    it('should not split a division expression at the slashes', () => {
      expect(textValues('*set: x = 10 / 2 / 5')).toEqual(['x = 10 / 2 / 5']);
      expect(textValues('*if: a / b / c > 1')).toEqual(['a / b / c > 1']);
    });

    it('should not split a date at the slashes', () => {
      expect(textValues('*button: Due 1/2/2026')).toEqual(['Due 1/2/2026']);
    });

    it('should scan a line of bold text as text rather than a keyword', () => {
      const tokens = tokenize('*This is bold* and this is regular.');
      expect(tokens[0].type).toBe(TokenType.TEXT);
      expect(tokens[0].value).toBe('*This is bold* and this is regular.');
    });

    it('should scan a line starting with italics as one run of text', () => {
      expect(textValues('/italic/ start')).toEqual(['/italic/ start']);
    });

    it('should still tokenize a keyword whose argument contains an asterisk', () => {
      const tokens = tokenize('*button: 2 * 3 * 4');
      expect(tokens[0].type).toBe(TokenType.KEYWORD);
      expect(tokens[0].value).toBe('*button:');
      expect(textValues('*button: 2 * 3 * 4')).toEqual(['2 * 3 * 4']);
    });
  });

  describe('Error handling', () => {
    it('should handle unclosed strings gracefully', () => {
      const tokens = tokenize('>> x = "unclosed');
      // Should not throw, should produce some tokens
      expect(tokens.length).toBeGreaterThan(0);
    });
  });
});
