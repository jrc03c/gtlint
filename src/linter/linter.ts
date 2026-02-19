import type { Program, ASTNode, KeywordStatement } from '../parser/ast.js';
import type { LintMessage, LintResult, LinterConfig } from '../types.js';
import { DEFAULT_LINTER_CONFIG } from '../types.js';
import { tokenize } from '../lexer/index.js';
import { parse } from '../parser/index.js';
import { rules } from './rules/index.js';
import { parseDirectives, isRuleDisabled, type DirectiveState } from './directives.js';

interface LineRange {
  start: number;
  end: number;
}

/**
 * Walk the AST to find `*html` keyword statements and collect
 * { start, end } line ranges for their body content (excluding
 * the `*html` keyword line itself).
 */
function computeHtmlBodyRanges(ast: Program): LineRange[] {
  const ranges: LineRange[] = [];

  function walk(node: ASTNode): void {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'KeywordStatement') {
      const kw = node as KeywordStatement;
      if (kw.keyword === 'html' && kw.body.length > 0) {
        const bodyStart = kw.body[0].loc.start.line;
        const bodyEnd = kw.loc.end.line;
        ranges.push({ start: bodyStart, end: bodyEnd });
      }
      // Recurse into body in case of nested *html blocks
      if (kw.argument && typeof kw.argument === 'object') walk(kw.argument as ASTNode);
      for (const sub of kw.subKeywords) walk(sub);
      for (const stmt of kw.body) walk(stmt);
    } else if (node.type === 'Program') {
      for (const stmt of (node as Program).body) walk(stmt);
    } else if (node.type === 'SubKeyword') {
      for (const stmt of (node as any).body) walk(stmt);
    } else if (node.type === 'AnswerOption') {
      for (const stmt of (node as any).body) walk(stmt);
    }
  }

  walk(ast);
  return ranges;
}

/**
 * Check whether a variable reference at `column` on `sourceLine` is inside
 * a genuine GuidedTrack `{variable}` interpolation vs CSS/JS braces
 * (e.g., `.foo {color: red}`).
 *
 * Heuristic: if the content between the enclosing `{` and `}` contains
 * a top-level `:` (outside of string literals), it's likely CSS — GT
 * expressions never use `:` as an operator.
 */
function isLikelyGTInterpolation(sourceLine: string, column: number): boolean {
  let i = 0;
  while (i < sourceLine.length) {
    if (sourceLine[i] === '{') {
      const braceStart = i;
      let depth = 1;
      let j = i + 1;
      let hasColon = false;
      let inStr = false;
      let strCh = '';
      while (j < sourceLine.length && depth > 0) {
        const ch = sourceLine[j];
        if (inStr) {
          if (ch === strCh) inStr = false;
        } else if (ch === '"' || ch === "'") {
          inStr = true;
          strCh = ch;
        } else if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
        } else if (ch === ':' && depth === 1) {
          hasColon = true;
        }
        j++;
      }
      const braceEnd = j - 1;
      if (column > braceStart && column < braceEnd) {
        return !hasColon;
      }
      i = j;
    } else {
      i++;
    }
  }
  return true;
}

export interface ReportDescriptor {
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface RuleContext {
  report(descriptor: ReportDescriptor): void;
  getSourceCode(): string;
  /** Variables received from parent program (@from-parent); name → directive line number */
  getFromParentVars(): Map<string, number>;
  /** Variables received from child program (@from-child); name → directive line number */
  getFromChildVars(): Map<string, number>;
  /** Variables sent to parent program (@to-parent) */
  getToParentVars(): Set<string>;
  /** Variables sent to child program (@to-child) */
  getToChildVars(): Set<string>;
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
      lint: {
        ...DEFAULT_LINTER_CONFIG.lint,
        ...config.lint,
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

    // Parse directives (disable comments, @from-parent, @from-child, @to-parent, @to-child)
    const directives = parseDirectives(source);

    // Tokenize
    const tokens = tokenize(source);

    // Parse
    const ast = parse(tokens);

    // Run rules
    for (const [ruleName, severity] of Object.entries(this.config.lint)) {
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
    this.messages = this.messages.filter(
      msg => !isRuleDisabled(directives, msg.line, msg.ruleId)
    );

    // Filter out messages inside *html block bodies.
    // Only keep no-undefined-vars for genuine GT interpolations (not CSS braces).
    const htmlBodyRanges = computeHtmlBodyRanges(ast);
    if (htmlBodyRanges.length > 0) {
      const sourceLines = source.split('\n');
      this.messages = this.messages.filter(msg => {
        const inHtml = htmlBodyRanges.some(r => msg.line >= r.start && msg.line <= r.end);
        if (!inHtml) return true;
        if (msg.ruleId === 'no-undefined-vars') {
          const line = sourceLines[msg.line - 1] || '';
          return isLikelyGTInterpolation(line, msg.column);
        }
        return false;
      });
    }

    // Sort messages by line and column
    this.messages.sort((a, b) => {
      if (a.line !== b.line) return a.line - b.line;
      return a.column - b.column;
    });

    // Calculate counts
    let errorCount = 0;
    let warningCount = 0;

    for (const msg of this.messages) {
      if (msg.severity === 'error') {
        errorCount++;
      } else if (msg.severity === 'warning') {
        warningCount++;
      }
    }

    return {
      filePath,
      messages: this.messages,
      errorCount,
      warningCount,
      source,
    };
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
