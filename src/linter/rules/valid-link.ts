import type { LintRule, RuleContext } from '../linter.js';
import type { Program } from '../../parser/ast.js';
import {
  KEYWORD_SPECS,
  keywordArgumentIsProse,
  subKeywordValueIsProse,
} from '../../language/keyword-spec.js';
import { findLinks } from '../../language/markup.js';

/**
 * Argument and value types that can hold an expression, where a `[text|url]`
 * may legitimately sit inside a string that is displayed somewhere else:
 *
 *     *set: blurb = "Read more [here|https://example.com]"
 *
 * Those are left alone; this rule only looks at text that is rendered where it
 * is written.
 */
const EXPRESSION_TYPES = new Set([
  'expression',
  'variable',
  'iteration',
  'number',
  'percent',
  'duration',
  'datetime',
  'collection',
  'association',
  'label',
  'url',
  'program-name',
  'service-name',
  'event-name',
]);

/** Every keyword or sub-keyword name whose value may be an expression. */
const EXPRESSION_NAMES: ReadonlySet<string> = (() => {
  const names = new Set<string>();

  for (const [keyword, spec] of Object.entries(KEYWORD_SPECS)) {
    if (EXPRESSION_TYPES.has(spec.argument.type)) names.add(keyword);

    for (const [subKeyword, subSpec] of Object.entries(spec.subKeywords ?? {})) {
      if (EXPRESSION_TYPES.has(subSpec.valueType)) names.add(subKeyword);
    }
  }

  return names;
})();

/**
 * `*email` bodies are rendered server-side rather than by the interpreter, so
 * this rule makes no claim about what markup survives in an email.
 */
const UNVERIFIED_NAMES = new Set(['subject', 'body', 'to']);

const KEYWORD_LINE = /^\*([a-zA-Z][a-zA-Z0-9_-]*):[ \t]*(.*)$/;

export const validLink: LintRule = {
  name: 'valid-link',
  description: 'Disallow links that GuidedTrack renders as literal text',
  severity: 'warning',

  create(context: RuleContext) {
    return {
      Program(_node: Program) {
        const lines = context.getSourceCode().split(/\r?\n/);

        lines.forEach((line, lineIndex) => {
          const trimmed = line.trimStart();
          if (trimmed.length === 0) return;

          // Whole-line comments and expression lines hold code, not display text.
          if (trimmed.startsWith('--') || trimmed.startsWith('>>')) return;

          const keywordMatch = trimmed.match(KEYWORD_LINE);

          // Anything that is not `*keyword: value` is a plain text line, an
          // answer option, or a list item — all of which GuidedTrack formats.
          if (!keywordMatch) {
            checkLinks(line, 0, lineIndex + 1, true, null, context);
            return;
          }

          const [, name, value] = keywordMatch;
          const keyword = name.toLowerCase();

          if (EXPRESSION_NAMES.has(keyword) || UNVERIFIED_NAMES.has(keyword)) return;

          const isProse = keywordArgumentIsProse(keyword) || subKeywordValueIsProse(keyword);
          const valueOffset = line.length - value.length;

          checkLinks(value, valueOffset, lineIndex + 1, isProse, keyword, context);
        });
      },
    };
  },
};

function checkLinks(
  text: string,
  offset: number,
  line: number,
  isProse: boolean,
  keyword: string | null,
  context: RuleContext
): void {
  for (const link of findLinks(text)) {
    const column = offset + link.start + 1;

    if (!isProse) {
      context.report({
        message:
          `\`*${keyword}:\` does not format its text, so \`${link.raw}\` is shown to the ` +
          `participant exactly as written, brackets and all. Links only work in plain text, ` +
          `answer options, \`*question:\`, \`*maintain:\`, and \`*caption:\`.`,
        line,
        column,
        endColumn: column + link.raw.length,
      });
      continue;
    }

    if (!link.valid) {
      context.report({
        message:
          `\`${link.raw}\` is not a link GuidedTrack recognizes, so it is shown as literal ` +
          `text. Link URLs must start with \`http://\` or \`https://\`.`,
        line,
        column,
        endColumn: column + link.raw.length,
      });
    }
  }
}
