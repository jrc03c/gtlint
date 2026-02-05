import type { LintRule, RuleContext } from '../linter.js';
import type { Program } from '../../parser/ast.js';

interface BracketInfo {
  char: string;
  line: number;
  column: number;
}

export const noUnclosedBracket: LintRule = {
  name: 'no-unclosed-bracket',
  description: 'Detect unclosed brackets/braces',
  severity: 'error',

  create(context: RuleContext) {
    return {
      Program(_node: Program) {
        const source = context.getSourceCode();
        const lines = source.split('\n');

        const stack: BracketInfo[] = [];
        const pairs: Record<string, string> = {
          '(': ')',
          '[': ']',
          '{': '}',
        };
        const closers: Record<string, string> = {
          ')': '(',
          ']': '[',
          '}': '{',
        };

        // Expression keywords that are followed by expressions
        const exprKeywords = ['if', 'while', 'for', 'repeat', 'goto', 'return'];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          const trimmedLine = line.trim();

          // Only check brackets in expression contexts:
          // 1. Lines starting with >>
          // 2. Lines starting with expression keywords (*if:, *while:, etc.)
          let isExpressionContext = false;
          if (trimmedLine.startsWith('>>')) {
            isExpressionContext = true;
          } else if (trimmedLine.startsWith('*')) {
            // Check if it's an expression keyword
            for (const keyword of exprKeywords) {
              if (trimmedLine.toLowerCase().startsWith(`*${keyword}:`)) {
                isExpressionContext = true;
                break;
              }
            }
          }

          // Skip checking if not in an expression context
          if (!isExpressionContext) continue;

          let inString = false;
          let stringChar = '';

          for (let j = 0; j < line.length; j++) {
            const ch = line[j];

            // Skip if in comment
            if (!inString && ch === '-' && line[j + 1] === '-') {
              break;
            }

            // Handle strings
            if (!inString && (ch === '"' || ch === "'")) {
              inString = true;
              stringChar = ch;
              continue;
            }
            if (inString && ch === stringChar) {
              inString = false;
              stringChar = '';
              continue;
            }

            // Skip bracket checking inside strings
            if (inString) continue;

            // Opening brackets
            if (pairs[ch]) {
              stack.push({ char: ch, line: lineNumber, column: j + 1 });
            }

            // Closing brackets
            if (closers[ch]) {
              if (stack.length === 0) {
                context.report({
                  message: `Unexpected closing bracket '${ch}'`,
                  line: lineNumber,
                  column: j + 1,
                });
              } else {
                const top = stack.pop()!;
                if (pairs[top.char] !== ch) {
                  context.report({
                    message: `Mismatched brackets: expected '${pairs[top.char]}' but found '${ch}'`,
                    line: lineNumber,
                    column: j + 1,
                  });
                  // Put back the opener since it's not matched
                  stack.push(top);
                }
              }
            }
          }
        }

        // Report any unclosed brackets
        for (const bracket of stack) {
          context.report({
            message: `Unclosed bracket '${bracket.char}' (missing '${pairs[bracket.char]}')`,
            line: bracket.line,
            column: bracket.column,
          });
        }
      },
    };
  },
};
