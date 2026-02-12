import { getKeywordSpec } from '../../language/keyword-spec.js';
/**
 * Rule: no-empty-blocks
 *
 * Detects empty control flow and body-required keyword blocks.
 * An empty block is likely an authoring mistake where the body was left blank.
 *
 * Examples of violations:
 * - `*if: x > 5` with no indented body
 * - `*while: running` with no indented body
 * - `*page:` with no indented body
 * - `*else:` with no indented body
 */
export const noEmptyBlocks = {
    name: 'no-empty-blocks',
    description: 'Disallow empty keyword blocks',
    severity: 'error',
    create(context) {
        return {
            KeywordStatement(node) {
                if (node.body.length > 0 || node.subKeywords.length > 0)
                    return;
                const keyword = node.keyword.toLowerCase();
                // else and elseif are not in KEYWORD_SPECS but should always have a body
                if (keyword === 'else' || keyword === 'elseif') {
                    context.report({
                        message: `\`*${keyword}:\` block is empty`,
                        line: node.loc.start.line,
                        column: node.loc.start.column,
                    });
                    return;
                }
                const spec = getKeywordSpec(keyword);
                if (spec?.body.required && node.body.length === 0) {
                    context.report({
                        message: `\`*${keyword}:\` block is empty`,
                        line: node.loc.start.line,
                        column: node.loc.start.column,
                    });
                }
            },
        };
    },
};
//# sourceMappingURL=no-empty-blocks.js.map