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
export function parseDirectives(source) {
    const lines = source.split('\n');
    const state = {
        lintDisabledLines: new Map(),
        formatDisabledLines: new Set(),
        fromParentVars: new Set(),
        fromChildVars: new Set(),
        toParentVars: new Set(),
        toChildVars: new Set(),
    };
    // Track active disable regions
    // Key: 'all' or rule name, Value: start line
    const activeLintDisables = new Map();
    // For format: just track start line (no rule granularity)
    let formatDisableStart = null;
    // Track next-line disables
    let nextLineLintDisable = null;
    let nextLineFormatDisable = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1; // 1-indexed
        // Apply next-line disables from previous line
        if (nextLineLintDisable !== null) {
            state.lintDisabledLines.set(lineNum, nextLineLintDisable);
            nextLineLintDisable = null;
        }
        if (nextLineFormatDisable) {
            state.formatDisabledLines.add(lineNum);
            nextLineFormatDisable = false;
        }
        // Check for comment directives
        const commentMatch = line.match(/^\s*--\s*(.+)$/);
        if (!commentMatch)
            continue;
        const commentContent = commentMatch[1].trim();
        // Parse @gt-disable-next-line (combined lint + format)
        if (commentContent.startsWith('@gt-disable-next-line')) {
            const rulesStr = commentContent.slice('@gt-disable-next-line'.length).trim();
            if (rulesStr) {
                nextLineLintDisable = parseRuleList(rulesStr);
            }
            else {
                nextLineLintDisable = 'all';
            }
            nextLineFormatDisable = true;
            continue;
        }
        // Parse @gt-disable (combined lint + format)
        if (commentContent.startsWith('@gt-disable') && !commentContent.startsWith('@gt-disable-next-line')) {
            const rulesStr = commentContent.slice('@gt-disable'.length).trim();
            if (rulesStr) {
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    activeLintDisables.set(rule, lineNum);
                }
            }
            else {
                activeLintDisables.set('all', lineNum);
            }
            // Also disable format
            if (formatDisableStart === null) {
                formatDisableStart = lineNum;
            }
            continue;
        }
        // Parse @gt-enable (combined lint + format)
        if (commentContent.startsWith('@gt-enable')) {
            const rulesStr = commentContent.slice('@gt-enable'.length).trim();
            if (rulesStr) {
                // Re-enable specific lint rules
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    const startLine = activeLintDisables.get(rule);
                    if (startLine !== undefined) {
                        addLintDisabledRegion(state, startLine, lineNum - 1, new Set([rule]));
                        activeLintDisables.delete(rule);
                    }
                }
            }
            else {
                // Re-enable all lint rules
                for (const [key, startLine] of activeLintDisables) {
                    if (key === 'all') {
                        addLintDisabledRegion(state, startLine, lineNum - 1, 'all');
                    }
                    else {
                        addLintDisabledRegion(state, startLine, lineNum - 1, new Set([key]));
                    }
                }
                activeLintDisables.clear();
            }
            // Also re-enable format
            if (formatDisableStart !== null) {
                addFormatDisabledRegion(state, formatDisableStart, lineNum - 1);
                formatDisableStart = null;
            }
            continue;
        }
        // Parse @gtlint-disable-next-line
        if (commentContent.startsWith('@gtlint-disable-next-line')) {
            const rulesStr = commentContent.slice('@gtlint-disable-next-line'.length).trim();
            if (rulesStr) {
                nextLineLintDisable = parseRuleList(rulesStr);
            }
            else {
                nextLineLintDisable = 'all';
            }
            continue;
        }
        // Parse @gtlint-disable
        if (commentContent.startsWith('@gtlint-disable') && !commentContent.startsWith('@gtlint-disable-next-line')) {
            const rulesStr = commentContent.slice('@gtlint-disable'.length).trim();
            if (rulesStr) {
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    activeLintDisables.set(rule, lineNum);
                }
            }
            else {
                activeLintDisables.set('all', lineNum);
            }
            continue;
        }
        // Parse @gtlint-enable
        if (commentContent.startsWith('@gtlint-enable')) {
            const rulesStr = commentContent.slice('@gtlint-enable'.length).trim();
            if (rulesStr) {
                // Re-enable specific rules
                const rules = parseRuleList(rulesStr);
                for (const rule of rules) {
                    const startLine = activeLintDisables.get(rule);
                    if (startLine !== undefined) {
                        // Mark all lines in the region as disabled for this rule
                        addLintDisabledRegion(state, startLine, lineNum - 1, new Set([rule]));
                        activeLintDisables.delete(rule);
                    }
                }
            }
            else {
                // Re-enable all rules
                for (const [key, startLine] of activeLintDisables) {
                    if (key === 'all') {
                        addLintDisabledRegion(state, startLine, lineNum - 1, 'all');
                    }
                    else {
                        addLintDisabledRegion(state, startLine, lineNum - 1, new Set([key]));
                    }
                }
                activeLintDisables.clear();
            }
            continue;
        }
        // Parse @gtformat-disable
        if (commentContent.startsWith('@gtformat-disable') && !commentContent.startsWith('@gtformat-disable-next-line')) {
            if (formatDisableStart === null) {
                formatDisableStart = lineNum;
            }
            continue;
        }
        // Parse @gtformat-enable
        if (commentContent.startsWith('@gtformat-enable')) {
            if (formatDisableStart !== null) {
                addFormatDisabledRegion(state, formatDisableStart, lineNum - 1);
                formatDisableStart = null;
            }
            continue;
        }
        // Parse @from-parent
        if (commentContent.startsWith('@from-parent:')) {
            const varsStr = commentContent.slice('@from-parent:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.fromParentVars.add(v);
            }
            continue;
        }
        // Parse @from-child
        if (commentContent.startsWith('@from-child:')) {
            const varsStr = commentContent.slice('@from-child:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.fromChildVars.add(v);
            }
            continue;
        }
        // Parse @to-parent
        if (commentContent.startsWith('@to-parent:')) {
            const varsStr = commentContent.slice('@to-parent:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.toParentVars.add(v);
            }
            continue;
        }
        // Parse @to-child
        if (commentContent.startsWith('@to-child:')) {
            const varsStr = commentContent.slice('@to-child:'.length).trim();
            const vars = parseVarList(varsStr);
            for (const v of vars) {
                state.toChildVars.add(v);
            }
            continue;
        }
    }
    // Handle any unclosed disable regions (extend to end of file)
    const totalLines = lines.length;
    for (const [key, startLine] of activeLintDisables) {
        if (key === 'all') {
            addLintDisabledRegion(state, startLine, totalLines, 'all');
        }
        else {
            addLintDisabledRegion(state, startLine, totalLines, new Set([key]));
        }
    }
    if (formatDisableStart !== null) {
        addFormatDisabledRegion(state, formatDisableStart, totalLines);
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
function addLintDisabledRegion(state, startLine, endLine, rules) {
    for (let line = startLine; line <= endLine; line++) {
        const existing = state.lintDisabledLines.get(line);
        if (rules === 'all') {
            state.lintDisabledLines.set(line, 'all');
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
            state.lintDisabledLines.set(line, new Set(rules));
        }
    }
}
function addFormatDisabledRegion(state, startLine, endLine) {
    for (let line = startLine; line <= endLine; line++) {
        state.formatDisabledLines.add(line);
    }
}
/**
 * Check if a lint rule is disabled at a given line.
 */
export function isRuleDisabled(state, line, ruleId) {
    const disabled = state.lintDisabledLines.get(line);
    if (!disabled)
        return false;
    if (disabled === 'all')
        return true;
    return disabled.has(ruleId);
}
/**
 * Check if formatting is disabled at a given line.
 */
export function isFormatDisabled(state, line) {
    return state.formatDisabledLines.has(line);
}
/**
 * Check if a variable is received from parent program.
 */
export function isFromParentVar(state, varName) {
    return state.fromParentVars.has(varName);
}
/**
 * Check if a variable is received from child program.
 */
export function isFromChildVar(state, varName) {
    return state.fromChildVars.has(varName);
}
/**
 * Check if a variable is sent to parent program.
 */
export function isToParentVar(state, varName) {
    return state.toParentVars.has(varName);
}
/**
 * Check if a variable is sent to child program.
 */
export function isToChildVar(state, varName) {
    return state.toChildVars.has(varName);
}
//# sourceMappingURL=directives.js.map