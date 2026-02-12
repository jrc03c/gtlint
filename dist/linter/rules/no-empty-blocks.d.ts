import type { LintRule } from '../linter.js';
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
export declare const noEmptyBlocks: LintRule;
//# sourceMappingURL=no-empty-blocks.d.ts.map