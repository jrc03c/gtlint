import { getKeywordSpec } from '../../language/keyword-spec.js';
/**
 * Rule: valid-subkeyword-value
 *
 * Validates that sub-keyword values are valid for their type.
 * Currently checks:
 * - Enum values (e.g., *type: must be one of: bar, line, scatter for *chart:)
 * - Yes/no values (e.g., *start: must be "yes" or "no")
 *
 * Examples of violations:
 * - `*chart:` with `*type: pie` (not a valid chart type)
 * - `*question:` with `*type: dropdown` (not a valid question type)
 * - `*service:` with `*method: SEND` (not a valid method)
 */
export const validSubkeywordValue = {
    name: 'valid-subkeyword-value',
    description: 'Ensure sub-keyword values are valid',
    severity: 'error',
    create(context) {
        function getArgumentValue(argument) {
            if (!argument)
                return null;
            if (argument.type === 'Literal') {
                const lit = argument;
                return typeof lit.value === 'string' ? lit.value : String(lit.value);
            }
            if (argument.type === 'TextContent') {
                const tc = argument;
                // Only handle simple text content (no interpolations)
                if (tc.parts.length === 1 && typeof tc.parts[0] === 'string') {
                    return tc.parts[0].trim();
                }
            }
            return null;
        }
        function checkSubKeyword(parentKeyword, sub) {
            const spec = getKeywordSpec(parentKeyword);
            if (!spec?.subKeywords)
                return;
            const subKeyword = sub.keyword.toLowerCase();
            const subSpec = spec.subKeywords[subKeyword];
            if (!subSpec)
                return;
            const value = getArgumentValue(sub.argument);
            // Check enum values
            if (subSpec.valueType === 'enum' && subSpec.enumValues && value !== null) {
                const normalizedValue = value.toLowerCase();
                const validValues = subSpec.enumValues.map((v) => v.toLowerCase());
                if (!validValues.includes(normalizedValue)) {
                    const validList = subSpec.enumValues.join(', ');
                    context.report({
                        message: `Invalid value '${value}' for '*${subKeyword}:'. Valid values are: ${validList}`,
                        line: sub.loc.start.line,
                        column: sub.loc.start.column,
                    });
                }
            }
            // Check yes-no values
            if (subSpec.valueType === 'yes-no' && value !== null) {
                const normalizedValue = value.toLowerCase();
                if (normalizedValue !== 'yes' && normalizedValue !== 'no') {
                    context.report({
                        message: `Invalid value '${value}' for '*${subKeyword}:'. Expected 'yes' or 'no'`,
                        line: sub.loc.start.line,
                        column: sub.loc.start.column,
                    });
                }
            }
        }
        function checkKeyword(node) {
            const keyword = node.keyword.toLowerCase();
            for (const sub of node.subKeywords) {
                checkSubKeyword(keyword, sub);
            }
        }
        function visit(node) {
            if (node.type === 'Program') {
                for (const stmt of node.body) {
                    if (stmt.type === 'KeywordStatement') {
                        visit(stmt);
                    }
                }
            }
            else if (node.type === 'KeywordStatement') {
                checkKeyword(node);
                for (const stmt of node.body) {
                    if (stmt.type === 'KeywordStatement') {
                        visit(stmt);
                    }
                }
            }
        }
        return {
            Program(node) {
                visit(node);
            },
        };
    },
};
//# sourceMappingURL=valid-subkeyword-value.js.map