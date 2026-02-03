/**
 * Parses and tracks linter directives from comments.
 *
 * Supported directives:
 * - `-- gtlint-disable` - Disable all rules until re-enabled
 * - `-- gtlint-disable rule1, rule2` - Disable specific rules
 * - `-- gtlint-enable` - Re-enable all rules
 * - `-- gtlint-enable rule1` - Re-enable specific rule
 * - `-- gtlint-disable-next-line` - Disable all rules for next line
 * - `-- gtlint-disable-next-line rule1, rule2` - Disable specific rules for next line
 * - `-- @expects: var1, var2` - Declare expected input variables (suppresses no-undefined-vars)
 * - `-- @returns: var1, var2` - Declare returned output variables (suppresses no-unused-vars)
 */
export interface DirectiveState {
    /** Map of line number to set of disabled rule names (empty set = all rules disabled) */
    disabledLines: Map<number, Set<string> | 'all'>;
    /** Variables declared as expected inputs */
    expectedVars: Set<string>;
    /** Variables declared as returned outputs */
    returnedVars: Set<string>;
}
export declare function parseDirectives(source: string): DirectiveState;
/**
 * Check if a rule is disabled at a given line.
 */
export declare function isRuleDisabled(state: DirectiveState, line: number, ruleId: string): boolean;
/**
 * Check if a variable is declared as expected input.
 */
export declare function isExpectedVar(state: DirectiveState, varName: string): boolean;
/**
 * Check if a variable is declared as returned output.
 */
export declare function isReturnedVar(state: DirectiveState, varName: string): boolean;
//# sourceMappingURL=directives.d.ts.map