import type { LintRule, RuleContext } from '../linter.js';
import type { Program } from '../../parser/ast.js';

export const noStrayColon: LintRule = {
  name: 'no-stray-colon',
  description: 'Detect stray colons in expressions',
  severity: 'error',

  create(context: RuleContext) {
    return {
      Program(_node: Program) {
        const source = context.getSourceCode();
        const lines = source.split('\n');

        // Keywords whose arguments are expressions
        const exprKeywords = ['if', 'while', 'for', 'wait'];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          const trimmedLine = line.trim();

          // Determine expression start position within the line
          let exprStart = -1;

          if (trimmedLine.startsWith('>>')) {
            exprStart = line.indexOf('>>') + 2;
          } else if (trimmedLine.startsWith('*')) {
            for (const keyword of exprKeywords) {
              const prefix = `*${keyword}:`;
              if (trimmedLine.toLowerCase().startsWith(prefix)) {
                exprStart = line.indexOf(':') + 1;
                break;
              }
            }
          }

          if (exprStart === -1) continue;

          // Scan the expression portion for stray colons
          let inString = false;

          for (let j = exprStart; j < line.length; j++) {
            const ch = line[j];

            // Stop at comment
            if (!inString && ch === '-' && line[j + 1] === '-') {
              break;
            }

            // Handle strings
            if (!inString && ch === '"') {
              inString = true;
              continue;
            }
            if (inString && ch === '"') {
              inString = false;
              continue;
            }
            if (inString) continue;

            // Skip :: (valid namespace access)
            if (ch === ':' && line[j + 1] === ':') {
              j++; // skip the second colon too
              continue;
            }

            // Single colon outside a string and not part of :: is stray
            if (ch === ':') {
              context.report({
                message: 'Stray colon in expression',
                line: lineNumber,
                column: j + 1,
              });
            }
          }
        }
      },
    };
  },
};
