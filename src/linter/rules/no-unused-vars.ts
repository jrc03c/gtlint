import type { LintRule, RuleContext } from '../linter.js';
import type { Program, Statement, Expression, KeywordStatement, SubKeyword, TextContent } from '../../parser/ast.js';

interface VarInfo {
  name: string;
  line: number;
  column: number;
  usages: number;
  source?: 'from-parent' | 'from-child';
  /** Earliest line where this variable is read (only tracked for directive vars) */
  firstReadLine?: number;
  /** Earliest line where this variable is defined in code (only tracked for directive vars) */
  firstDefineLine?: number;
  /** Column of the earliest in-code definition (only tracked for directive vars) */
  firstDefineColumn?: number;
}

export const noUnusedVars: LintRule = {
  name: 'no-unused-vars',
  description: 'Warn about variables that are never used',
  severity: 'warning',

  create(context: RuleContext) {
    const definedVars = new Map<string, VarInfo>();

    function addDefinition(name: string, line: number, column: number): void {
      const existing = definedVars.get(name);
      if (!existing) {
        definedVars.set(name, { name, line, column, usages: 0 });
      } else if (existing.source && existing.firstDefineLine === undefined) {
        // First in-code definition of a directive-declared variable
        existing.firstDefineLine = line;
        existing.firstDefineColumn = column;
      }
    }

    function addUsage(name: string, readLine?: number): void {
      const info = definedVars.get(name);
      if (info) {
        info.usages++;
        if (info.source && readLine !== undefined &&
            (info.firstReadLine === undefined || readLine < info.firstReadLine)) {
          info.firstReadLine = readLine;
        }
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

    // Walk an assignment target (IndexExpression/MemberExpression chain),
    // collecting usages only from index sub-expressions — the root object
    // is a write target and should not count as a usage.
    function collectAssignmentTargetUsages(node: Expression): void {
      if (node.type === 'IndexExpression') {
        collectAssignmentTargetUsages(node.object);
        collectUsages(node.index, false);
      } else if (node.type === 'MemberExpression') {
        collectAssignmentTargetUsages(node.object);
      }
      // For Identifier (root object): intentionally not collected as a usage
    }

    function collectUsages(node: Program | Statement | Expression | SubKeyword | TextContent, isAssignmentContext = false): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === 'Identifier') {
        addUsage(node.name, node.loc.start.line);
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
          // For simple assignments (>> x = ...), skip the left side entirely.
          // For compound targets (>> x["key"] = ..., >> x.prop = ...), only
          // index sub-expressions are usages — the root object is a write target.
          if (node.left.type !== 'Identifier') {
            collectAssignmentTargetUsages(node.left);
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
          addUsage(match[1], node.loc.start.line);
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
        // Register @from-parent / @from-child variables as definitions
        // (before the AST walk so they're tracked for usage counting)
        const fromParentVars = context.getFromParentVars();
        const fromChildVars = context.getFromChildVars();
        for (const [name, line] of fromParentVars) {
          if (!definedVars.has(name)) {
            definedVars.set(name, { name, line, column: 0, usages: 0, source: 'from-parent' });
          }
        }
        for (const [name, line] of fromChildVars) {
          if (!definedVars.has(name)) {
            definedVars.set(name, { name, line, column: 0, usages: 0, source: 'from-child' });
          }
        }

        // First pass: collect all variable definitions
        collectDefinitions(node);

        // Second pass: collect all variable usages
        collectUsages(node);

        // Get variables from directives
        const toParentVars = context.getToParentVars();
        const toChildVars = context.getToChildVars();

        // Report unused variables
        for (const [name, info] of definedVars) {
          if (toParentVars.has(name) || toChildVars.has(name)) continue;

          if (info.source) {
            // Directive-declared variable (@from-parent / @from-child)
            const directive = info.source === 'from-parent' ? '@from-parent' : '@from-child';
            if (info.usages === 0) {
              // Never referenced at all
              context.report({
                message: `'${name}' is declared in ${directive} but never used`,
                line: info.line,
                column: info.column,
              });
            } else if (info.source === 'from-parent' &&
                       info.firstDefineLine !== undefined &&
                       (info.firstReadLine === undefined || info.firstDefineLine < info.firstReadLine)) {
              // Overwritten before being read — parent-provided value is ignored.
              // Only checked for @from-parent: the parent's value definitively exists
              // at program start, so overwriting it is likely a mistake. For @from-child,
              // writing before the *program: call is a common pattern (setting defaults).
              context.report({
                message: `'${name}' is declared in ${directive} but its value is overwritten before being read`,
                line: info.firstDefineLine,
                column: info.firstDefineColumn ?? 0,
              });
            }
          } else {
            // Regular in-code variable
            if (info.usages === 0) {
              context.report({
                message: `'${name}' is defined but never used`,
                line: info.line,
                column: info.column,
              });
            }
          }
        }
      },
    };
  },
};
