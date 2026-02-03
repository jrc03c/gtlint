import type { LintRule, RuleContext } from '../linter.js';
import type { Program, Statement, Expression, KeywordStatement, SubKeyword, TextContent } from '../../parser/ast.js';

interface VarInfo {
  name: string;
  line: number;
  column: number;
  usages: number;
}

export const noUnusedVars: LintRule = {
  name: 'no-unused-vars',
  description: 'Warn about variables that are never used',
  severity: 'warning',

  create(context: RuleContext) {
    const definedVars = new Map<string, VarInfo>();

    function addDefinition(name: string, line: number, column: number): void {
      if (!definedVars.has(name)) {
        definedVars.set(name, { name, line, column, usages: 0 });
      }
    }

    function addUsage(name: string): void {
      const info = definedVars.get(name);
      if (info) {
        info.usages++;
      }
    }

    function collectDefinitions(node: Program | Statement | Expression | SubKeyword | TextContent): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === 'KeywordStatement') {
        const kw = node as KeywordStatement;

        // *for: defines loop variables
        if (kw.keyword === 'for' && kw.argument && kw.argument.type === 'BinaryExpression') {
          collectForVars(kw.argument, kw.loc.start.line, kw.loc.start.column);
        }

        // *set: defines a variable
        if (kw.keyword === 'set' && kw.argument && kw.argument.type === 'TextContent') {
          const text = kw.argument.parts.find(p => typeof p === 'string') as string | undefined;
          if (text) {
            addDefinition(text.trim(), kw.loc.start.line, kw.loc.start.column);
          }
        }

        // Check sub-keywords for *save:
        for (const sub of kw.subKeywords) {
          if (sub.keyword === 'save' && sub.argument && sub.argument.type === 'TextContent') {
            const text = sub.argument.parts.find(p => typeof p === 'string') as string | undefined;
            if (text) {
              addDefinition(text.trim(), sub.loc.start.line, sub.loc.start.column);
            }
          }
          collectDefinitions(sub);
        }

        for (const stmt of kw.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === 'ExpressionStatement') {
        if (node.expression.type === 'BinaryExpression' && node.expression.operator === '=') {
          if (node.expression.left.type === 'Identifier') {
            addDefinition(
              node.expression.left.name,
              node.expression.left.loc.start.line,
              node.expression.left.loc.start.column
            );
          }
        }
      } else if (node.type === 'AnswerOption') {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === 'SubKeyword') {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      }
    }

    function collectForVars(expr: Expression, line: number, column: number): void {
      if (expr.type === 'BinaryExpression' && expr.operator.toLowerCase() === 'in') {
        if (expr.left.type === 'Identifier') {
          addDefinition(expr.left.name, line, column);
        } else if (expr.left.type === 'BinaryExpression' && expr.left.operator === ',') {
          collectForVars(expr.left, line, column);
        }
      } else if (expr.type === 'Identifier') {
        addDefinition(expr.name, line, column);
      }
    }

    function collectUsages(node: Program | Statement | Expression | SubKeyword | TextContent): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === 'Identifier') {
        addUsage(node.name);
      } else if (node.type === 'KeywordStatement') {
        const kw = node as KeywordStatement;
        if (kw.argument) {
          collectUsages(kw.argument);
        }
        for (const sub of kw.subKeywords) {
          collectUsages(sub);
        }
        for (const stmt of kw.body) {
          collectUsages(stmt);
        }
      } else if (node.type === 'SubKeyword') {
        if (node.argument) {
          collectUsages(node.argument);
        }
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === 'ExpressionStatement') {
        collectUsages(node.expression);
      } else if (node.type === 'BinaryExpression') {
        // For assignments, only count the right side as usage
        if (node.operator === '=') {
          collectUsages(node.right);
        } else {
          collectUsages(node.left);
          collectUsages(node.right);
        }
      } else if (node.type === 'UnaryExpression') {
        collectUsages(node.argument);
      } else if (node.type === 'MemberExpression') {
        collectUsages(node.object);
      } else if (node.type === 'CallExpression') {
        collectUsages(node.callee);
        for (const arg of node.arguments) {
          collectUsages(arg);
        }
      } else if (node.type === 'IndexExpression') {
        collectUsages(node.object);
        collectUsages(node.index);
      } else if (node.type === 'ArrayExpression') {
        for (const elem of node.elements) {
          collectUsages(elem);
        }
      } else if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
          collectUsages(prop.key);
          collectUsages(prop.value);
        }
      } else if (node.type === 'TextContent' || node.type === 'TextStatement') {
        for (const part of node.parts) {
          if (typeof part !== 'string') {
            collectUsages(part);
          }
        }
      } else if (node.type === 'AnswerOption') {
        collectUsages(node.text);
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      }
    }

    return {
      Program(node: Program) {
        // First pass: collect all variable definitions
        collectDefinitions(node);

        // Second pass: collect all variable usages
        collectUsages(node);

        // Report unused variables
        for (const [name, info] of definedVars) {
          if (info.usages === 0) {
            context.report({
              message: `'${name}' is defined but never used`,
              line: info.line,
              column: info.column,
            });
          }
        }
      },
    };
  },
};
