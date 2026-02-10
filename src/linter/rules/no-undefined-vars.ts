import type { LintRule, RuleContext } from '../linter.js';
import type { Program, Statement, Expression, KeywordStatement, SubKeyword, TextContent } from '../../parser/ast.js';

export const noUndefinedVars: LintRule = {
  name: 'no-undefined-vars',
  description: 'Disallow use of undefined variables',
  severity: 'error',

  create(context: RuleContext) {
    const definedVars = new Set<string>();
    const usedVars: Array<{ name: string; line: number; column: number }> = [];

    // Built-in variables and functions
    const builtins = new Set([
      'it', 'true', 'false', 'calendar', 'data',
      'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years',
    ]);

    function collectDefinitions(node: Program | Statement | Expression | SubKeyword | TextContent): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === 'KeywordStatement') {
        const kw = node as KeywordStatement;

        // *label: defines a label
        if (kw.keyword === 'label' && kw.argument && kw.argument.type === 'TextContent') {
          const text = kw.argument.parts.find(p => typeof p === 'string') as string | undefined;
          if (text) {
            definedVars.add(text.trim());
          }
        }

        // *for: defines loop variables
        if (kw.keyword === 'for' && kw.argument && kw.argument.type === 'BinaryExpression') {
          // for: x in collection or for: i, x in collection
          collectForVars(kw.argument);
        }

        // *set: defines a variable
        if (kw.keyword === 'set' && kw.argument && kw.argument.type === 'TextContent') {
          const text = kw.argument.parts.find(p => typeof p === 'string') as string | undefined;
          if (text) {
            definedVars.add(text.trim());
          }
        }

        // Check sub-keywords for *save:
        for (const sub of kw.subKeywords) {
          if (sub.keyword === 'save' && sub.argument && sub.argument.type === 'TextContent') {
            const text = sub.argument.parts.find(p => typeof p === 'string') as string | undefined;
            if (text) {
              definedVars.add(text.trim());
            }
          }
          collectDefinitions(sub);
        }

        // Recurse into body
        for (const stmt of kw.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === 'ExpressionStatement') {
        // Check for assignments
        if (node.expression.type === 'BinaryExpression' && node.expression.operator === '=') {
          if (node.expression.left.type === 'Identifier') {
            definedVars.add(node.expression.left.name);
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

    function collectForVars(expr: Expression): void {
      if (expr.type === 'BinaryExpression' && expr.operator.toLowerCase() === 'in') {
        // Left side contains the loop variable(s)
        if (expr.left.type === 'Identifier') {
          definedVars.add(expr.left.name);
        } else if (expr.left.type === 'BinaryExpression' && expr.left.operator === ',') {
          // index, value pattern - collect from both sides of comma
          collectForVars(expr.left);
        }
      } else if (expr.type === 'BinaryExpression' && expr.operator === ',') {
        // Comma-separated variables: collect from both sides
        collectForVars(expr.left);
        collectForVars(expr.right);
      } else if (expr.type === 'Identifier') {
        definedVars.add(expr.name);
      }
    }

    function collectUsages(node: Program | Statement | Expression | SubKeyword | TextContent, isAssignmentContext = false): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === 'Identifier') {
        usedVars.push({
          name: node.name,
          line: node.loc.start.line,
          column: node.loc.start.column,
        });
      } else if (node.type === 'KeywordStatement') {
        const kw = node as KeywordStatement;
        if (kw.argument) {
          // Keyword arguments are never assignment contexts (e.g., *if:, *while:)
          collectUsages(kw.argument, false);
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
        // Top-level expressions (>> ...) are assignment contexts
        collectUsages(node.expression, true);
      } else if (node.type === 'BinaryExpression') {
        // In assignment context, = is assignment; otherwise it's comparison
        if (node.operator === '=' && isAssignmentContext) {
          // Don't report the left side of assignments as usage
          collectUsages(node.right, false);
        } else {
          // In comparison or other binary ops, check both sides
          collectUsages(node.left, false);
          collectUsages(node.right, false);
        }
      } else if (node.type === 'UnaryExpression') {
        collectUsages(node.argument, false);
      } else if (node.type === 'MemberExpression') {
        collectUsages(node.object, false);
        // Don't collect property as usage
      } else if (node.type === 'CallExpression') {
        collectUsages(node.callee, false);
        for (const arg of node.arguments) {
          collectUsages(arg, false);
        }
      } else if (node.type === 'IndexExpression') {
        collectUsages(node.object, false);
        collectUsages(node.index, false);
      } else if (node.type === 'ArrayExpression') {
        for (const elem of node.elements) {
          collectUsages(elem, false);
        }
      } else if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
          collectUsages(prop.key, false);
          collectUsages(prop.value, false);
        }
      } else if (node.type === 'Literal' && typeof node.value === 'string' && node.raw.startsWith('"')) {
        // Extract interpolated variable references from double-quoted string literals
        const regex = /\{([a-zA-Z_]\w*)/g;
        let match;
        while ((match = regex.exec(node.value)) !== null) {
          // +1 for opening quote, +match.index for position within string content, +1 for opening brace
          usedVars.push({
            name: match[1],
            line: node.loc.start.line,
            column: node.loc.start.column + 1 + match.index + 1,
          });
        }
      } else if (node.type === 'InterpolatedString') {
        for (const part of node.parts) {
          if (typeof part !== 'string') {
            collectUsages(part, false);
          }
        }
      } else if (node.type === 'TextContent' || node.type === 'TextStatement') {
        for (const part of node.parts) {
          if (typeof part !== 'string') {
            collectUsages(part, false);
          }
        }
      } else if (node.type === 'AnswerOption') {
        collectUsages(node.text, false);
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

        // Get variables from directives
        const fromParentVars = context.getFromParentVars();
        const fromChildVars = context.getFromChildVars();

        // Report undefined variables
        for (const usage of usedVars) {
          // A variable is considered defined if:
          // - It's defined in this program
          // - It's a built-in
          // - It comes from parent (@from-parent)
          // - It comes from child (@from-child)
          if (!definedVars.has(usage.name) &&
              !builtins.has(usage.name) &&
              !fromParentVars.has(usage.name) &&
              !fromChildVars.has(usage.name)) {
            context.report({
              message: `'${usage.name}' is not defined`,
              line: usage.line,
              column: usage.column,
            });
          }
        }
      },
    };
  },
};
