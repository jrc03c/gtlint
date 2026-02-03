import type { Program, ASTNode } from '../parser/ast.js';
import type { LintMessage, LintResult, LinterConfig, Fix } from '../types.js';
import { DEFAULT_LINTER_CONFIG } from '../types.js';
import { tokenize } from '../lexer/index.js';
import { parse } from '../parser/index.js';
import { rules } from './rules/index.js';

export interface ReportDescriptor {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: Fix;
}

export interface RuleContext {
  report(descriptor: ReportDescriptor): void;
  getSourceCode(): string;
}

export interface RuleVisitor {
  [nodeType: string]: (node: any) => void;
}

export interface LintRule {
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  create(context: RuleContext): RuleVisitor;
}

export class Linter {
  private config: LinterConfig;
  private messages: LintMessage[] = [];
  private source: string = '';

  constructor(config: Partial<LinterConfig> = {}) {
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

  lint(source: string, filePath: string = '<unknown>'): LintResult {
    this.messages = [];
    this.source = source;

    // Tokenize
    const tokens = tokenize(source);

    // Parse
    const ast = parse(tokens);

    // Run rules
    for (const [ruleName, severity] of Object.entries(this.config.rules)) {
      if (severity === 'off') continue;

      const rule = rules[ruleName];
      if (!rule) continue;

      const context: RuleContext = {
        report: (descriptor: ReportDescriptor) => {
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
      };

      const visitor = rule.create(context);

      // Visit the AST
      this.visitNode(ast, visitor);
    }

    // Sort messages by line and column
    this.messages.sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
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
        if (msg.fix) fixableErrorCount++;
      } else if (msg.severity === 'warning') {
        warningCount++;
        if (msg.fix) fixableWarningCount++;
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

  fix(source: string): string {
    const result = this.lint(source);
    if (result.fixableErrorCount + result.fixableWarningCount === 0) {
      return source;
    }

    // Collect fixes and sort by range (reverse order for safe replacement)
    const fixes = result.messages
      .filter(m => m.fix)
      .map(m => m.fix!)
      .sort((a, b) => b.range[0] - a.range[0]);

    let output = source;
    for (const fix of fixes) {
      output = output.slice(0, fix.range[0]) + fix.text + output.slice(fix.range[1]);
    }

    return output;
  }

  private visitNode(node: ASTNode, visitor: RuleVisitor): void {
    if (!node || typeof node !== 'object') return;

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
    } else if (node.type === 'KeywordStatement') {
      if (node.argument && typeof node.argument === 'object') {
        this.visitNode(node.argument as ASTNode, visitor);
      }
      for (const sub of node.subKeywords) {
        this.visitNode(sub, visitor);
      }
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === 'SubKeyword') {
      if (node.argument && typeof node.argument === 'object') {
        this.visitNode(node.argument as ASTNode, visitor);
      }
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === 'ExpressionStatement') {
      this.visitNode(node.expression, visitor);
    } else if (node.type === 'AnswerOption') {
      this.visitNode(node.text, visitor);
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === 'TextStatement') {
      for (const part of node.parts) {
        if (typeof part !== 'string') {
          this.visitNode(part, visitor);
        }
      }
    } else if (node.type === 'TextContent') {
      for (const part of node.parts) {
        if (typeof part !== 'string') {
          this.visitNode(part, visitor);
        }
      }
    } else if (node.type === 'BinaryExpression') {
      this.visitNode(node.left, visitor);
      this.visitNode(node.right, visitor);
    } else if (node.type === 'UnaryExpression') {
      this.visitNode(node.argument, visitor);
    } else if (node.type === 'MemberExpression') {
      this.visitNode(node.object, visitor);
      this.visitNode(node.property, visitor);
    } else if (node.type === 'CallExpression') {
      this.visitNode(node.callee, visitor);
      for (const arg of node.arguments) {
        this.visitNode(arg, visitor);
      }
    } else if (node.type === 'IndexExpression') {
      this.visitNode(node.object, visitor);
      this.visitNode(node.index, visitor);
    } else if (node.type === 'ArrayExpression') {
      for (const elem of node.elements) {
        this.visitNode(elem, visitor);
      }
    } else if (node.type === 'ObjectExpression') {
      for (const prop of node.properties) {
        this.visitNode(prop.key, visitor);
        this.visitNode(prop.value, visitor);
      }
    }
  }
}

export function lint(source: string, config?: Partial<LinterConfig>): LintResult {
  const linter = new Linter(config);
  return linter.lint(source);
}
