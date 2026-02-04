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
 * - `-- @from-parent: var1, var2` - Variables received from parent program (suppresses no-undefined-vars)
 * - `-- @from-child: var1, var2` - Variables received from child program (suppresses no-undefined-vars)
 * - `-- @to-parent: var1, var2` - Variables sent to parent program (suppresses no-unused-vars)
 * - `-- @to-child: var1, var2` - Variables sent to child program (suppresses no-unused-vars)
 */
export interface DirectiveState {
    /** Map of line number to set of disabled rule names (empty set = all rules disabled) */
    disabledLines: Map<number, Set<string> | 'all'>;
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
 * Check if a rule is disabled at a given line.
 */
export declare function isRuleDisabled(state: DirectiveState, line: number, ruleId: string): boolean;
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