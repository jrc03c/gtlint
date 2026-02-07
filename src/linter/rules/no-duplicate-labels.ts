import type { LintRule, RuleContext } from '../linter.js';
import type { Program, KeywordStatement, Statement } from '../../parser/ast.js';

export const noDuplicateLabels: LintRule = {
  name: 'no-duplicate-labels',
  description: 'Disallow duplicate *label definitions',
  severity: 'error',

  create(context: RuleContext) {
    const labelDefinitions: Array<{ name: string; line: number; column: number }> = [];

    function collectLabels(node: Program | Statement): void {
      if (!node || typeof node !== 'object') return;

      if (node.type === 'Program') {
        for (const stmt of node.body) {
          collectLabels(stmt);
        }
      } else if (node.type === 'KeywordStatement') {
        const kw = node as KeywordStatement;

        if (kw.keyword === 'label' && kw.argument) {
          let labelName = '';
          if (kw.argument.type === 'TextContent') {
            const text = kw.argument.parts.find(p => typeof p === 'string') as string | undefined;
            if (text) {
              labelName = text.trim();
            }
          } else if (kw.argument.type === 'Identifier') {
            labelName = kw.argument.name;
          }
          if (labelName) {
            labelDefinitions.push({
              name: labelName,
              line: kw.loc.start.line,
              column: kw.loc.start.column,
            });
          }
        }

        // Recurse into body
        for (const stmt of kw.body) {
          collectLabels(stmt);
        }

        // Recurse into sub-keywords
        for (const sub of kw.subKeywords) {
          for (const stmt of sub.body) {
            collectLabels(stmt);
          }
        }
      } else if (node.type === 'AnswerOption') {
        for (const stmt of node.body) {
          collectLabels(stmt);
        }
      }
    }

    return {
      Program(node: Program) {
        collectLabels(node);

        // Group labels by name and report duplicates
        const seen = new Map<string, { line: number; column: number }>();

        for (const label of labelDefinitions) {
          const first = seen.get(label.name);
          if (first) {
            context.report({
              message: `Duplicate label '${label.name}' (first defined on line ${first.line})`,
              line: label.line,
              column: label.column,
            });
          } else {
            seen.set(label.name, { line: label.line, column: label.column });
          }
        }
      },
    };
  },
};
