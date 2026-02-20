import type { LintRule, RuleContext } from '../linter.js';
import type { Program, Statement, KeywordStatement, AnswerOption, SubKeyword } from '../../parser/ast.js';
import { getKeywordSpec } from '../../language/keyword-spec.js';

/**
 * Rule: correct-indentation
 *
 * Validates indentation *levels* in GuidedTrack code. Detects two classes of errors:
 *
 * 1. **Body not allowed** — content is indented under a keyword that forbids bodies
 *    (e.g., indented text under `*button:`)
 * 2. **Over-indentation** — content is indented more levels than expected
 *    (e.g., 2 tabs under `*if:` instead of 1)
 *
 * Over-indentation is only checked for statements inside a keyword body, sub-keyword
 * body, or answer option body — not at the top-level Program body. The parser may
 * flatten certain constructs (e.g., answer options after `*question:`, sub-keywords
 * separated by comments) to the program level, making top-level indentation checks
 * unreliable.
 *
 * Comments are excluded from over-indentation checks since they can be indented
 * freely for readability.
 */
export const correctIndentation: LintRule = {
  name: 'correct-indentation',
  description: 'Validate indentation levels',
  severity: 'error',

  create(context: RuleContext) {
    return {
      Program(node: Program) {
        const source = context.getSourceCode();
        const lines = source.split('\n');

        // At the program level, don't check over-indentation for most statement
        // types — the parser may flatten certain constructs (e.g., answer options
        // after `*question:`, sub-keywords separated by comments) to the program
        // level, making top-level indentation checks unreliable for those.
        //
        // However, we DO check ExpressionStatements (>> lines) because they can
        // never legitimately be indented at the top level. The parser doesn't
        // flatten expression statements from keyword bodies.
        //
        // We also do a source-level check for lines indented directly under >>
        // lines, since >> never allows an indented body regardless of context.
        for (const stmt of node.body) {
          if (stmt.type === 'KeywordStatement') {
            const actualIndent = getIndentLevel(lines, stmt.loc.start.line);
            walkKeyword(stmt, actualIndent, lines, context);
          } else if (stmt.type === 'AnswerOption') {
            const actualIndent = getIndentLevel(lines, stmt.loc.start.line);
            walkAnswerOption(stmt, actualIndent, lines, context);
          } else if (stmt.type === 'ExpressionStatement') {
            const actualIndent = getIndentLevel(lines, stmt.loc.start.line);
            if (actualIndent > 0) {
              context.report({
                message: `Unexpected indentation (expected 0 tabs but found ${actualIndent})`,
                line: stmt.loc.start.line,
                column: 1,
              });
            }
          }
        }
      },
    };
  },
};

function getIndentLevel(lines: string[], lineNumber: number): number {
  const line = lines[lineNumber - 1]; // loc.start.line is 1-indexed
  if (!line) return 0;
  let tabs = 0;
  while (tabs < line.length && line[tabs] === '\t') tabs++;
  return tabs;
}

function walkStatements(
  statements: Statement[],
  expectedIndent: number,
  lines: string[],
  context: RuleContext,
): void {
  for (const stmt of statements) {
    // Skip indentation checks for comments — they can be indented freely
    if (stmt.type === 'CommentStatement') continue;

    const actualIndent = getIndentLevel(lines, stmt.loc.start.line);

    // Check over-indentation
    if (actualIndent > expectedIndent) {
      context.report({
        message: `Expected indentation of ${expectedIndent} ${expectedIndent === 1 ? 'tab' : 'tabs'} but found ${actualIndent}`,
        line: stmt.loc.start.line,
        column: 1,
      });
    }

    if (stmt.type === 'KeywordStatement') {
      walkKeyword(stmt, expectedIndent, lines, context);
    } else if (stmt.type === 'AnswerOption') {
      walkAnswerOption(stmt, expectedIndent, lines, context);
    }
  }
}

function walkKeyword(
  node: KeywordStatement,
  expectedIndent: number,
  lines: string[],
  context: RuleContext,
): void {
  const spec = getKeywordSpec(node.keyword);

  // Check: body not allowed
  if (spec && !spec.body.allowed && node.body.length > 0) {
    const firstBodyStmt = node.body[0];
    context.report({
      message: `'*${node.keyword}:' does not allow an indented body`,
      line: firstBodyStmt.loc.start.line,
      column: firstBodyStmt.loc.start.column,
    });
  }

  // Recurse into body
  walkStatements(node.body, expectedIndent + 1, lines, context);

  // Check sub-keywords
  for (const sub of node.subKeywords) {
    walkSubKeyword(sub, expectedIndent, lines, context);
  }
}

function walkSubKeyword(
  sub: SubKeyword,
  parentIndent: number,
  lines: string[],
  context: RuleContext,
): void {
  const expectedSubIndent = parentIndent + 1;
  const actualSubIndent = getIndentLevel(lines, sub.loc.start.line);

  if (actualSubIndent > expectedSubIndent) {
    context.report({
      message: `Expected indentation of ${expectedSubIndent} ${expectedSubIndent === 1 ? 'tab' : 'tabs'} but found ${actualSubIndent}`,
      line: sub.loc.start.line,
      column: 1,
    });
  }

  // Recurse into sub-keyword body
  walkStatements(sub.body, parentIndent + 2, lines, context);
}

function walkAnswerOption(
  node: AnswerOption,
  expectedIndent: number,
  lines: string[],
  context: RuleContext,
): void {
  walkStatements(node.body, expectedIndent + 1, lines, context);
}
