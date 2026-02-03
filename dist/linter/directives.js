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
export function parseDirectives(source) {
    const lines = source.split('\n');
    const state = {
        disabledLines: new Map(),
        expectedVars: new Set(),
        returnedVars: new Set(),
    };
    // Track active disable regions
    // Key: 'all' or rule name, Value: start line
    const activeDisables = new Map();
    // Track next-line disables
    let nextLineDisable = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1; // 1-indexed
        // Apply next-line disable from previous line
        if (nextLineDisable !== null) {
            state.disabledLines.set(lineNum, nextLineDisable);
            nextLineDisable = null;
        }
        // Check for comment directives
        const commentMatch = line.match(/^\s*--\s*(.+)$/);
        if (!commentMatch)
            continue;
        const commentContent = commentMatch[1].trim();
        // Parse gtlint-disable-next-line
        if (commentContent.startsWith('gtlint-disable-next-line')) {
            const rulesStr = commentContent.slice('gtlint-disable-next-line'.length).trim();
            if (rulesStr) {
                nextLineDisable = parseRuleList(rulesStr);
            }
            else {
                nextLineDisable = 'all';
            }
            continue;
        }
        // Parse gtlint-disable
        if (commentContent.startsWith('gtlint-disable')) {
            const rulesStr = commentContent.slice('gtlint-disable'.length).trim();
            if (rulesStr) {
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    activeDisables.set(rule, lineNum);
                }
            }
            else {
                activeDisables.set('all', lineNum);
            }
            continue;
        }
        // Parse gtlint-enable
        if (commentContent.startsWith('gtlint-enable')) {
            const rulesStr = commentContent.slice('gtlint-enable'.length).trim();
            if (rulesStr) {
                // Re-enable specific rules
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    const startLine = activeDisables.get(rule);
                    if (startLine !== undefined) {
                        // Mark all lines in the region as disabled for this rule
                        addDisabledRegion(state, startLine, lineNum - 1, new Set([rule]));
                        activeDisables.delete(rule);
                    }
                }
            }
            else {
                // Re-enable all rules
                for (const [key, startLine] of activeDisables) {
                    if (key === 'all') {
                        addDisabledRegion(state, startLine, lineNum - 1, 'all');
                    }
                    else {
                        addDisabledRegion(state, startLine, lineNum - 1, new Set([key]));
                    }
                }
                activeDisables.clear();
            }
            continue;
        }
        // Parse @expects
        if (commentContent.startsWith('@expects:')) {
            const varsStr = commentContent.slice('@expects:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.expectedVars.add(v);
            }
            continue;
        }
        // Parse @returns
        if (commentContent.startsWith('@returns:')) {
            const varsStr = commentContent.slice('@returns:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.returnedVars.add(v);
            }
            continue;
        }
    }
    // Handle any unclosed disable regions (extend to end of file)
    const totalLines = lines.length;
    for (const [key, startLine] of activeDisables) {
        if (key === 'all') {
            addDisabledRegion(state, startLine, totalLines, 'all');
        }
        else {
            addDisabledRegion(state, startLine, totalLines, new Set([key]));
        }
    }
    return state;
}
function parseRuleList(str) {
    return new Set(str.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0));
}
function parseVarList(str) {
    return str.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
}
function addDisabledRegion(state, startLine, endLine, rules) {
    for (let line = startLine; line <= endLine; line++) {
        const existing = state.disabledLines.get(line);
        if (rules === 'all') {
            state.disabledLines.set(line, 'all');
        }
        else if (existing === 'all') {
            // Already all disabled, keep it
        }
        else if (existing) {
            // Merge rule sets
            for (const rule of rules) {
                existing.add(rule);
            }
        }
        else {
            state.disabledLines.set(line, new Set(rules));
        }
    }
}
/**
 * Check if a rule is disabled at a given line.
 */
export function isRuleDisabled(state, line, ruleId) {
    const disabled = state.disabledLines.get(line);
    if (!disabled)
        return false;
    if (disabled === 'all')
        return true;
    return disabled.has(ruleId);
}
/**
 * Check if a variable is declared as expected input.
 */
export function isExpectedVar(state, varName) {
    return state.expectedVars.has(varName);
}
/**
 * Check if a variable is declared as returned output.
 */
export function isReturnedVar(state, varName) {
    return state.returnedVars.has(varName);
}
//# sourceMappingURL=directives.js.map