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
      } else if (expr.type === 'BinaryExpression' && expr.operator === ',') {
        // Comma-separated variables: collect from both sides
        collectForVars(expr.left, line, column);
        collectForVars(expr.right, line, column);
      } else if (expr.type === 'Identifier') {
        addDefinition(expr.name, line, column);
      }
    }

    // Sub-keywords that take expression arguments (variable references)
    const expressionSubKeywords = new Set(['send', 'default', 'answers', 'data']);

    function collectUsages(node: Program | Statement | Expression | SubKeyword | TextContent, isAssignmentContext = false): void {
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
        // Recognize variable references in expression-taking sub-keywords
        if (expressionSubKeywords.has(node.keyword) && node.argument && node.argument.type === 'TextContent') {
          for (const part of node.argument.parts) {
            if (typeof part === 'string' && /^[a-zA-Z_]\w*$/.test(part.trim())) {
              addUsage(part.trim());
            }
          }
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
          // For simple assignments (>> x = ...), skip the left side entirely.
          // For compound targets (>> x["key"] = ..., >> x.prop = ...), the
          // object is still a usage — only a bare Identifier is skipped.
          if (node.left.type !== 'Identifier') {
            collectUsages(node.left, false);
          }
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
          addUsage(match[1]);
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
        const toParentVars = context.getToParentVars();
        const toChildVars = context.getToChildVars();

        // Report unused variables
        for (const [name, info] of definedVars) {
          // A variable is considered used if:
          // - It's used within this program
          // - It's sent to parent (@to-parent)
          // - It's sent to child (@to-child)
          if (info.usages === 0 &&
              !toParentVars.has(name) &&
              !toChildVars.has(name)) {
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
