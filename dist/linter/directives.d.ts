/**
 * Parses and tracks linter and formatter directives from comments.
 *
 * Supported directives:
 *
 * Combined (affects both linting and formatting):
 * - `-- @gt-disable` - Disable both lint and format until `@gt-enable` or EOF
 * - `-- @gt-enable` - Re-enable both lint and format
 * - `-- @gt-disable-next-line` - Disable both lint and format for next line only
 * - `-- @gt-disable-next-line rule1, rule2` - Disable specific lint rules and format for next line
 *
 * Lint-only:
 * - `-- @gtlint-disable` - Disable all lint rules until `@gtlint-enable` or EOF
 * - `-- @gtlint-disable rule1, rule2` - Disable specific lint rules
 * - `-- @gtlint-enable` - Re-enable all lint rules
 * - `-- @gtlint-enable rule1` - Re-enable specific lint rule
 * - `-- @gtlint-disable-next-line` - Disable all lint rules for next line
 * - `-- @gtlint-disable-next-line rule1, rule2` - Disable specific lint rules for next line
 *
 * Format-only:
 * - `-- @gtformat-disable` - Disable formatting until `@gtformat-enable` or EOF
 * - `-- @gtformat-enable` - Re-enable formatting
 *
 * Variable tracking:
 * - `-- @from-parent: var1, var2` - Variables received from parent program (suppresses no-undefined-vars)
 * - `-- @from-child: var1, var2` - Variables received from child program (suppresses no-undefined-vars)
 * - `-- @to-parent: var1, var2` - Variables sent to parent program (suppresses no-unused-vars)
 * - `-- @to-child: var1, var2` - Variables sent to child program (suppresses no-unused-vars)
 */
export interface DirectiveState {
    /** Map of line number to set of disabled lint rule names (empty set = all rules disabled) */
    lintDisabledLines: Map<number, Set<string> | 'all'>;
    /** Set of line numbers where formatting is disabled */
    formatDisabledLines: Set<number>;
    /** Variables received from parent program */
    fromParentVars: Set<string>;
    /** Variables received from child program */
    fromChildVars: Set<string>;
    /** Variables sent to parent program */
    toParentVars: Set<string>;
    /** Variables sent to child program */
    toChildVars: Set<string>;
}
export declare function parseDirectives(source: string): DirectiveState;
/**
 * Check if a lint rule is disabled at a given line.
 */
export declare function isRuleDisabled(state: DirectiveState, line: number, ruleId: string): boolean;
/**
 * Check if formatting is disabled at a given line.
 */
export declare function isFormatDisabled(state: DirectiveState, line: number): boolean;
/**
 * Check if a variable is received from parent program.
 */
export declare function isFromParentVar(state: DirectiveState, varName: string): boolean;
/**
 * Check if a variable is received from child program.
 */
export declare function isFromChildVar(state: DirectiveState, varName: string): boolean;
/**
 * Check if a variable is sent to parent program.
 */
export declare function isToParentVar(state: DirectiveState, varName: string): boolean;
/**
 * Check if a variable is sent to child program.
 */
export declare function isToChildVar(state: DirectiveState, varName: string): boolean;
//# sourceMappingURL=directives.d.ts.map