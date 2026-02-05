import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer/index.js';
import { parse } from '../src/parser/index.js';

describe('Parser', () => {
  describe('Program structure', () => {
    it('should parse empty input', () => {
      const tokens = tokenize('');
      const ast = parse(tokens);

      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(0);
    });

    it('should parse a simple text line', () => {
      const tokens = tokenize('Hello world');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('TextStatement');
    });

    it('should parse a comment', () => {
      const tokens = tokenize('-- this is a comment');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('CommentStatement');
    });
  });

  describe('Keywords', () => {
    it('should parse a simple keyword', () => {
      const tokens = tokenize('*button: Click me');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('KeywordStatement');
      const stmt = ast.body[0] as any;
      expect(stmt.keyword).toBe('button');
    });

    it('should parse keyword with body', () => {
      const code = '*if: x > 0\n\tHello';
      const tokens = tokenize(code);
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const ifStmt = ast.body[0] as any;
      expect(ifStmt.type).toBe('KeywordStatement');
      expect(ifStmt.keyword).toBe('if');
      expect(ifStmt.body.length).toBeGreaterThan(0);
    });

    it('should parse nested keywords', () => {
      const code = '*if: x > 0\n\t*if: y > 0\n\t\tNested';
      const tokens = tokenize(code);
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const outerIf = ast.body[0] as any;
      expect(outerIf.keyword).toBe('if');
      expect(outerIf.body.length).toBeGreaterThan(0);
    });
  });

  describe('Sub-keywords', () => {
    it('should parse question with save sub-keyword', () => {
      const code = '*question: What?\n\t*save: answer';
      const tokens = tokenize(code);
      const ast = parse(tokens);

      const question = ast.body[0] as any;
      expect(question.type).toBe('KeywordStatement');
      expect(question.keyword).toBe('question');
      expect(question.subKeywords.length).toBeGreaterThan(0);
      expect(question.subKeywords[0].keyword).toBe('save');
    });
  });

  describe('Expressions', () => {
    it('should parse assignment expression', () => {
      const tokens = tokenize('>> x = 5');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('ExpressionStatement');
    });

    it('should parse binary expression', () => {
      const tokens = tokenize('>> x = 1 + 2');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('BinaryExpression');
    });

    it('should parse comparison expression', () => {
      const tokens = tokenize('>> result = a > b');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('BinaryExpression');
    });

    it('should parse logical expression', () => {
      const tokens = tokenize('>> result = a and b');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('BinaryExpression');
      expect(stmt.expression.operator).toBe('and');
    });

    it('should parse unary expression', () => {
      const tokens = tokenize('>> result = not x');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.type).toBe('BinaryExpression'); // assignment
      expect(stmt.expression.right.type).toBe('UnaryExpression');
    });

    it('should respect operator precedence', () => {
      const tokens = tokenize('>> x = 1 + 2 * 3');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      // The right side should be: (1 + (2 * 3))
      const assignRight = stmt.expression.right;
      expect(assignRight.type).toBe('BinaryExpression');
      expect(assignRight.operator).toBe('+');
      expect(assignRight.right.type).toBe('BinaryExpression');
      expect(assignRight.right.operator).toBe('*');
    });

    it('should parse parenthesized expressions', () => {
      const tokens = tokenize('>> x = (1 + 2) * 3');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      const assignRight = stmt.expression.right;
      expect(assignRight.type).toBe('BinaryExpression');
      expect(assignRight.operator).toBe('*');
    });
  });

  describe('Literals', () => {
    it('should parse string literals', () => {
      const tokens = tokenize('>> x = "hello"');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('Literal');
      expect(stmt.expression.right.value).toBe('hello');
    });

    it('should parse number literals', () => {
      const tokens = tokenize('>> x = 42');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('Literal');
      expect(stmt.expression.right.value).toBe(42);
    });

    it('should parse array literals', () => {
      const tokens = tokenize('>> x = [1, 2, 3]');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('ArrayExpression');
      expect(stmt.expression.right.elements).toHaveLength(3);
    });

    it('should parse object literals (associations)', () => {
      const tokens = tokenize('>> x = {"key" -> "value"}');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('ObjectExpression');
      expect(stmt.expression.right.properties).toHaveLength(1);
    });
  });

  describe('Member and call expressions', () => {
    it('should parse member expression with dot', () => {
      const tokens = tokenize('>> x = arr.size');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('MemberExpression');
      expect(stmt.expression.right.computed).toBe(false);
    });

    it('should parse call expression', () => {
      const tokens = tokenize('>> x = str.split(",")');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('CallExpression');
    });

    it('should parse index expression', () => {
      const tokens = tokenize('>> x = arr[0]');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('IndexExpression');
    });

    it('should parse chained member expressions', () => {
      const tokens = tokenize('>> x = obj.arr[0].value');
      const ast = parse(tokens);

      const stmt = ast.body[0] as any;
      expect(stmt.expression.right.type).toBe('MemberExpression');
    });
  });

  describe('Labels and gotos', () => {
    it('should parse label definition', () => {
      const tokens = tokenize('*label: myLabel');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const label = ast.body[0] as any;
      expect(label.type).toBe('KeywordStatement');
      expect(label.keyword).toBe('label');
    });

    it('should parse goto statement', () => {
      const tokens = tokenize('*goto: myLabel');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const gotoStmt = ast.body[0] as any;
      expect(gotoStmt.type).toBe('KeywordStatement');
      expect(gotoStmt.keyword).toBe('goto');
    });
  });

  describe('Interpolation in arguments', () => {
    it('should parse keyword with interpolation-only argument', () => {
      const tokens = tokenize('*question: {myVar}');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('KeywordStatement');
      expect(stmt.keyword).toBe('question');
      expect(stmt.argument).not.toBeNull();
      expect(stmt.argument.type).toBe('TextContent');
    });

    it('should parse keyword with interpolation argument and sub-keywords', () => {
      const code = '*question: {myVar}\n\t*save: answer';
      const tokens = tokenize(code);
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const stmt = ast.body[0] as any;
      expect(stmt.type).toBe('KeywordStatement');
      expect(stmt.keyword).toBe('question');
      expect(stmt.argument).not.toBeNull();
      expect(stmt.subKeywords).toHaveLength(1);
      expect(stmt.subKeywords[0].keyword).toBe('save');
    });

    it('should parse standalone text line starting with interpolation', () => {
      const tokens = tokenize('{myVar} is the value');
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      expect(ast.body[0].type).toBe('TextStatement');
    });
  });

  describe('Complex programs', () => {
    it('should parse a question with multiple answer options', () => {
      const code = `*question: Pick a color
\tRed
\tGreen
\tBlue`;
      const tokens = tokenize(code);
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(1);
      const question = ast.body[0] as any;
      expect(question.type).toBe('KeywordStatement');
      expect(question.keyword).toBe('question');
    });

    it('should parse conditional with else', () => {
      const code = `*if: x > 0
\tPositive
*if: x < 0
\tNegative`;
      const tokens = tokenize(code);
      const ast = parse(tokens);

      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].type).toBe('KeywordStatement');
      expect(ast.body[1].type).toBe('KeywordStatement');
    });
  });
});
