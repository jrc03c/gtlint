import { DEFAULT_LINTER_CONFIG } from '../types.js';
import { tokenize } from '../lexer/index.js';
import { parse } from '../parser/index.js';
import { rules } from './rules/index.js';
import { parseDirectives, isRuleDisabled } from './directives.js';
export class Linter {
    config;
    messages = [];
    source = '';
    constructor(config = {}) {
        this.config = {
            ...DEFAULT_LINTER_CONFIG,
            ...config,
            rules: {
                ...DEFAULT_LINTER_CONFIG.rules,
                ...config.rules,
            },
            format: {
                ...DEFAULT_LINTER_CONFIG.format,
                ...config.format,
            },
        };
    }
    lint(source, filePath = '<unknown>') {
        this.messages = [];
        this.source = source;
        // Parse directives (disable comments, @from-parent, @from-child, @to-parent, @to-child)
        const directives = parseDirectives(source);
        // Tokenize
        const tokens = tokenize(source);
        // Parse
        const ast = parse(tokens);
        // Run rules
        for (const [ruleName, severity] of Object.entries(this.config.rules)) {
            if (severity === 'off')
                continue;
            const rule = rules[ruleName];
            if (!rule)
                continue;
            const context = {
                report: (descriptor) => {
                    this.messages.push({
                        ruleId: ruleName,
                        severity: severity === 'error' ? 'error' : severity === 'warn' ? 'warning' : 'info',
                        message: descriptor.message,
                        line: descriptor.line,
                        column: descriptor.column,
                        endLine: descriptor.endLine,
                        endColumn: descriptor.endColumn,
                        fix: descriptor.fix,
                    });
                },
                getSourceCode: () => source,
                getFromParentVars: () => directives.fromParentVars,
                getFromChildVars: () => directives.fromChildVars,
                getToParentVars: () => directives.toParentVars,
                getToChildVars: () => directives.toChildVars,
            };
            const visitor = rule.create(context);
            // Visit the AST
            this.visitNode(ast, visitor);
        }
        // Filter out messages for disabled lines
        this.messages = this.messages.filter(msg => !isRuleDisabled(directives, msg.line, msg.ruleId));
        // Sort messages by line and column
        this.messages.sort((a, b) => {
            if (a.line !== b.line)
                return a.line - b.line;
            return a.column - b.column;
        });
        // Calculate counts
        let errorCount = 0;
        let warningCount = 0;
        let fixableErrorCount = 0;
        let fixableWarningCount = 0;
        for (const msg of this.messages) {
            if (msg.severity === 'error') {
                errorCount++;
                if (msg.fix)
                    fixableErrorCount++;
            }
            else if (msg.severity === 'warning') {
                warningCount++;
                if (msg.fix)
                    fixableWarningCount++;
            }
        }
        return {
            filePath,
            messages: this.messages,
            errorCount,
            warningCount,
            fixableErrorCount,
            fixableWarningCount,
            source,
        };
    }
    fix(source) {
        const result = this.lint(source);
        if (result.fixableErrorCount + result.fixableWarningCount === 0) {
            return source;
        }
        // Collect fixes and sort by range (reverse order for safe replacement)
        const fixes = result.messages
            .filter(m => m.fix)
            .map(m => m.fix)
            .sort((a, b) => b.range[0] - a.range[0]);
        let output = source;
        for (const fix of fixes) {
            output = output.slice(0, fix.range[0]) + fix.text + output.slice(fix.range[1]);
        }
        return output;
    }
    visitNode(node, visitor) {
        if (!node || typeof node !== 'object')
            return;
        // Call the visitor for this node type
        const handler = visitor[node.type];
        if (handler) {
            handler(node);
        }
        // Visit children based on node type
        if (node.type === 'Program') {
            for (const stmt of node.body) {
                this.visitNode(stmt, visitor);
            }
        }
        else if (node.type === 'KeywordStatement') {
            if (node.argument && typeof node.argument === 'object') {
                this.visitNode(node.argument, visitor);
            }
            for (const sub of node.subKeywords) {
                this.visitNode(sub, visitor);
            }
            for (const stmt of node.body) {
                this.visitNode(stmt, visitor);
            }
        }
        else if (node.type === 'SubKeyword') {
            if (node.argument && typeof node.argument === 'object') {
                this.visitNode(node.argument, visitor);
            }
            for (const stmt of node.body) {
                this.visitNode(stmt, visitor);
            }
        }
        else if (node.type === 'ExpressionStatement') {
            this.visitNode(node.expression, visitor);
        }
        else if (node.type === 'AnswerOption') {
            this.visitNode(node.text, visitor);
            for (const stmt of node.body) {
                this.visitNode(stmt, visitor);
            }
        }
        else if (node.type === 'TextStatement') {
            for (const part of node.parts) {
                if (typeof part !== 'string') {
                    this.visitNode(part, visitor);
                }
            }
        }
        else if (node.type === 'TextContent') {
            for (const part of node.parts) {
                if (typeof part !== 'string') {
                    this.visitNode(part, visitor);
                }
            }
        }
        else if (node.type === 'BinaryExpression') {
            this.visitNode(node.left, visitor);
            this.visitNode(node.right, visitor);
        }
        else if (node.type === 'UnaryExpression') {
            this.visitNode(node.argument, visitor);
        }
        else if (node.type === 'MemberExpression') {
            this.visitNode(node.object, visitor);
            this.visitNode(node.property, visitor);
        }
        else if (node.type === 'CallExpression') {
            this.visitNode(node.callee, visitor);
            for (const arg of node.arguments) {
                this.visitNode(arg, visitor);
            }
        }
        else if (node.type === 'IndexExpression') {
            this.visitNode(node.object, visitor);
            this.visitNode(node.index, visitor);
        }
        else if (node.type === 'ArrayExpression') {
            for (const elem of node.elements) {
                this.visitNode(elem, visitor);
            }
        }
        else if (node.type === 'ObjectExpression') {
            for (const prop of node.properties) {
                this.visitNode(prop.key, visitor);
                this.visitNode(prop.value, visitor);
            }
        }
    }
}
export function lint(source, config) {
    const linter = new Linter(config);
    return linter.lint(source);
}
//# sourceMappingURL=linter.js.map