import type { LintRule } from '../linter.js';
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
export declare const validSubkeywordValue: LintRule;
//# sourceMappingURL=valid-subkeyword-value.d.ts.map