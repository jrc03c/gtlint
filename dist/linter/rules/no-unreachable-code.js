/**
 * Evaluates an expression to determine if it's a constant value.
 * Returns the constant value if known, or undefined if the value cannot be determined.
 */
function evaluateConstantExpression(expr) {
    // Handle true/false identifiers
    if (expr.type === 'Identifier') {
        if (expr.name === 'true') {
            return true;
        }
        if (expr.name === 'false') {
            return false;
        }
        // Any other identifier we can't evaluate
        return undefined;
    }
    if (expr.type === 'Literal') {
        if (typeof expr.value === 'boolean') {
            return expr.value;
        }
        if (typeof expr.value === 'number') {
            return expr.value !== 0;
        }
        if (typeof expr.value === 'string') {
            return expr.value !== '';
        }
        if (expr.value === null) {
            return false;
        }
    }
    if (expr.type === 'BinaryExpression') {
        const left = evaluateConstantExpression(expr.left);
        const right = evaluateConstantExpression(expr.right);
        // If we can't evaluate both sides, we can't determine the result
        if (left === undefined || right === undefined) {
            return undefined;
        }
        // Get numeric values for comparison
        const leftNum = typeof expr.left === 'object' && expr.left.type === 'Literal' ?
            (typeof expr.left.value === 'number' ? expr.left.value : undefined) : undefined;
        const rightNum = typeof expr.right === 'object' && expr.right.type === 'Literal' ?
            (typeof expr.right.value === 'number' ? expr.right.value : undefined) : undefined;
        switch (expr.operator) {
            case '==':
            case '=':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum === rightNum;
                }
                return left === right;
            case '!=':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum !== rightNum;
                }
                return left !== right;
            case '>':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum > rightNum;
                }
                return undefined;
            case '>=':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum >= rightNum;
                }
                return undefined;
            case '<':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum < rightNum;
                }
                return undefined;
            case '<=':
                if (leftNum !== undefined && rightNum !== undefined) {
                    return leftNum <= rightNum;
                }
                return undefined;
            case 'and':
                return left && right;
            case 'or':
                return left || right;
            default:
                return undefined;
        }
    }
    if (expr.type === 'UnaryExpression') {
        const arg = evaluateConstantExpression(expr.argument);
        if (arg === undefined)
            return undefined;
        switch (expr.operator) {
            case 'not':
            case '!':
                return !arg;
            default:
                return undefined;
        }
    }
    // For identifiers and other expressions, we can't determine the value
    return undefined;
}
export const noUnreachableCode = {
    name: 'no-unreachable-code',
    description: 'Disallow unreachable code after control flow statements',
    severity: 'warning',
    create(context) {
        /**
         * Check if a statement is a label (which makes code after goto reachable)
         */
        function isLabel(stmt) {
            return stmt.type === 'KeywordStatement' && stmt.keyword === 'label';
        }
        /**
         * Check if a statement is an unconditional transfer (goto without condition)
         * Note: *program: is like a function call - it returns, so it's NOT an unconditional transfer
         */
        function isUnconditionalTransfer(stmt) {
            return stmt.keyword === 'goto';
        }
        /**
         * Check a block of statements for unreachable code
         */
        function checkBlock(statements) {
            let foundUnconditionalTransfer = false;
            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                // If we found an unconditional transfer, check if the next statement is a label or comment
                if (foundUnconditionalTransfer) {
                    // Skip comments (they don't affect control flow)
                    if (stmt.type === 'CommentStatement') {
                        continue;
                    }
                    if (!isLabel(stmt)) {
                        context.report({
                            message: 'Unreachable code after unconditional transfer',
                            line: stmt.loc.start.line,
                            column: stmt.loc.start.column,
                        });
                    }
                    foundUnconditionalTransfer = false;
                }
                if (stmt.type === 'KeywordStatement') {
                    // Check for unconditional transfers
                    if (isUnconditionalTransfer(stmt)) {
                        foundUnconditionalTransfer = true;
                    }
                    // Check if/elseif/else blocks
                    if (stmt.keyword === 'if' || stmt.keyword === 'elseif') {
                        if (stmt.argument) {
                            const conditionValue = evaluateConstantExpression(stmt.argument);
                            if (conditionValue === false) {
                                // The body of this if/elseif is unreachable (but we still need to check nested blocks)
                                // Report on the first non-else/elseif statement in the body
                                for (const bodyStmt of stmt.body) {
                                    if (bodyStmt.type !== 'KeywordStatement' ||
                                        (bodyStmt.keyword !== 'else' && bodyStmt.keyword !== 'elseif')) {
                                        context.report({
                                            message: 'Unreachable code - condition is always false',
                                            line: bodyStmt.loc.start.line,
                                            column: bodyStmt.loc.start.column,
                                        });
                                        break;
                                    }
                                }
                            }
                            else if (conditionValue === true && stmt.keyword === 'if') {
                                // If the condition is always true, check for unreachable else/elseif in the body
                                for (const bodyStmt of stmt.body) {
                                    if (bodyStmt.type === 'KeywordStatement' &&
                                        (bodyStmt.keyword === 'else' || bodyStmt.keyword === 'elseif')) {
                                        context.report({
                                            message: 'Unreachable code - previous condition is always true',
                                            line: bodyStmt.loc.start.line,
                                            column: bodyStmt.loc.start.column,
                                        });
                                    }
                                }
                            }
                        }
                        // Recursively check the body (this will handle nested blocks in else/elseif)
                        checkBlock(stmt.body);
                    }
                    // Check while loops
                    if (stmt.keyword === 'while' && stmt.argument) {
                        const conditionValue = evaluateConstantExpression(stmt.argument);
                        if (conditionValue === false && stmt.body.length > 0) {
                            context.report({
                                message: 'Unreachable code - loop condition is always false',
                                line: stmt.body[0].loc.start.line,
                                column: stmt.body[0].loc.start.column,
                            });
                        }
                        // Always check body (may have nested blocks)
                        checkBlock(stmt.body);
                    }
                    // Check other keyword bodies (for, question, etc.)
                    // Skip if, elseif, while (already handled above)
                    if (stmt.keyword !== 'if' && stmt.keyword !== 'elseif' && stmt.keyword !== 'while') {
                        checkBlock(stmt.body);
                        for (const sub of stmt.subKeywords) {
                            checkBlock(sub.body);
                        }
                    }
                }
                // Check answer option bodies
                if (stmt.type === 'AnswerOption') {
                    checkBlock(stmt.body);
                }
            }
            // If we ended with an unconditional transfer, that's okay (no code after it in this block)
        }
        return {
            Program(node) {
                checkBlock(node.body);
            },
        };
    },
};
//# sourceMappingURL=no-unreachable-code.js.map