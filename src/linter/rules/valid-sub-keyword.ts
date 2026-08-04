import type { LintRule, RuleContext } from '../linter.js';
import type { Program, KeywordStatement, SubKeyword } from '../../parser/ast.js';
import { SUB_KEYWORDS } from '../../lexer/tokens.js';
import { CLASSES_KEYWORDS } from '../../language/keyword-spec.js';

// Map of parent keywords to their valid sub-keywords, beyond the universal
// ones applied below
const KEYWORD_SUB_KEYWORDS: Record<string, Set<string>> = {
  audio: new Set(['start', 'hide']),
  chart: new Set(['type', 'data', 'xaxis', 'yaxis', 'trendline', 'min', 'max']),
  component: new Set(['click', 'with', 'header']),
  database: new Set(['what', 'success', 'error']),
  email: new Set(['subject', 'body', 'to', 'when', 'every', 'until', 'identifier', 'cancel']),
  events: new Set(['startup']),
  experiment: new Set(['group']),
  goto: new Set(['reset']),
  image: new Set(['caption', 'description']),
  login: new Set(['required']),
  navigation: new Set(['name', 'icon']),
  purchase: new Set(['status', 'frequency', 'management', 'success', 'error']),
  question: new Set([
    'type', 'shuffle', 'save', 'tip', 'confirm', 'searchable', 'throwaway',
    'countdown', 'tags', 'answers', 'blank', 'multiple', 'default', 'before',
    'after', 'min', 'max', 'time', 'date', 'placeholder', 'other', 'icon', 'image',
  ]),
  randomize: new Set(['everytime', 'name', 'group']),
  service: new Set(['path', 'method', 'send', 'success', 'error']),
  settings: new Set(['back', 'menu']),
  switch: new Set(['reset']),
  trigger: new Set(['send']),
};

for (const keyword of CLASSES_KEYWORDS) {
  const subs = KEYWORD_SUB_KEYWORDS[keyword] ?? (KEYWORD_SUB_KEYWORDS[keyword] = new Set());
  subs.add('classes');
}

export const validSubKeyword: LintRule = {
  name: 'valid-sub-keyword',
  description: 'Ensure sub-keywords are valid under their parent keyword',
  severity: 'error',

  create(context: RuleContext) {
    function checkSubKeywords(parent: KeywordStatement): void {
      const parentKeyword = parent.keyword.toLowerCase();
      const validSubs = KEYWORD_SUB_KEYWORDS[parentKeyword];

      for (const sub of parent.subKeywords) {
        const subKeyword = sub.keyword.toLowerCase();

        // First check if it's a valid sub-keyword at all
        if (!SUB_KEYWORDS.has(subKeyword)) {
          context.report({
            message: `'*${subKeyword}' is not a valid sub-keyword`,
            line: sub.loc.start.line,
            column: sub.loc.start.column,
          });
          continue;
        }

        // Check if parent keyword supports sub-keywords
        if (!validSubs) {
          context.report({
            message: `'*${parentKeyword}' does not support sub-keywords`,
            line: sub.loc.start.line,
            column: sub.loc.start.column,
          });
          continue;
        }

        // Then check if it's valid for this parent
        if (!validSubs.has(subKeyword)) {
          context.report({
            message: `'*${subKeyword}' is not a valid sub-keyword for '*${parentKeyword}'`,
            line: sub.loc.start.line,
            column: sub.loc.start.column,
          });
        }
      }
    }

    function visit(node: Program | KeywordStatement): void {
      if (node.type === 'Program') {
        for (const stmt of node.body) {
          if (stmt.type === 'KeywordStatement') {
            visit(stmt);
          }
        }
      } else if (node.type === 'KeywordStatement') {
        checkSubKeywords(node);
        for (const stmt of node.body) {
          if (stmt.type === 'KeywordStatement') {
            visit(stmt);
          }
        }
      }
    }

    return {
      Program(node: Program) {
        visit(node);
      },
    };
  },
};
