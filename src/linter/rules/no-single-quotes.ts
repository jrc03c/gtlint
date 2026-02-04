import type { LintRule, RuleContext } from '../linter.js';
import type { Program } from '../../parser/ast.js';

export const noSingleQuotes: LintRule = {
  name: 'no-single-quotes',
  description: 'Disallow single quotes for strings (use double quotes)',
  severity: 'error',

  create(context: RuleContext) {
    return {
      Program(_node: Program) {
        const source = context.getSourceCode();
        const lines = source.split(/\r?\n/);

        lines.forEach((line, lineIndex) => {
          const lineNumber = lineIndex + 1;
          const trimmedLine = line.trimStart();

          // Skip blank lines
          if (trimmedLine.length === 0) return;

          // Skip comments (allowed to have single quotes)
          if (trimmedLine.startsWith('--')) return;

          // Check for expression lines (>> ...)
          if (trimmedLine.startsWith('>>')) {
            checkExpressionForSingleQuotes(line, lineNumber, context);
            return;
          }

          // Check for conditional keywords (*if:, *while:, etc.) with expressions
          const conditionalMatch = trimmedLine.match(/^\*(?:if|while|for):\s*(.+)$/);
          if (conditionalMatch) {
            const expression = conditionalMatch[1];
            const exprStartCol = line.indexOf(expression) + 1;
            checkStringForSingleQuotes(expression, lineNumber, exprStartCol, context);
            return;
          }

          // Check for *path: lines (they may contain expressions with strings)
          const pathMatch = trimmedLine.match(/^\*path:\s*(.+)$/);
          if (pathMatch) {
            const pathValue = pathMatch[1];
            const pathStartCol = line.indexOf(pathValue) + 1;
            checkStringForSingleQuotes(pathValue, lineNumber, pathStartCol, context);
            return;
          }

          // All other lines (visible text, keyword arguments, answer options) are allowed to have single quotes
        });
      },
    };
  },
};

function checkExpressionForSingleQuotes(line: string, lineNumber: number, context: RuleContext): void {
  const exprMatch = line.match(/^(\t*)>>\s*(.+)$/);
  if (!exprMatch) return;

  const expression = exprMatch[2];
  const exprStartCol = line.indexOf(expression) + 1;

  checkStringForSingleQuotes(expression, lineNumber, exprStartCol, context);
}

function checkStringForSingleQuotes(text: string, lineNumber: number, startCol: number, context: RuleContext): void {
  let inDoubleQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    // Toggle double quote state
    if (ch === '"') {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }

    // If we find a single quote outside of double quotes, that's an error
    if (ch === "'" && !inDoubleQuotes) {
      context.report({
        message: "Single quotes are not valid for strings in GuidedTrack. Use double quotes instead.",
        line: lineNumber,
        column: startCol + i,
      });
    }
  }
}
