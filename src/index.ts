// GTLint - A linter and formatter for the GuidedTrack language

// Lexer exports
export { tokenize, Token, TokenType, KEYWORDS, SUB_KEYWORDS } from './lexer/index.js';

// Parser exports
export { parse } from './parser/index.js';
export type {
  ASTNode,
  Program,
  Statement,
  KeywordStatement,
  SubKeyword,
  ExpressionStatement,
  TextStatement,
  CommentStatement,
  AnswerOption,
  Expression,
  BinaryExpression,
  UnaryExpression,
  MemberExpression,
  CallExpression,
  IndexExpression,
  Identifier,
  Literal,
  ArrayExpression,
  ObjectExpression,
  TextContent,
} from './parser/ast.js';
export type { SourceLocation } from './types.js';

// Linter exports
export { Linter, lint } from './linter/index.js';
export type { LintRule, RuleContext, RuleVisitor, ReportDescriptor } from './linter/index.js';
export { rules, getRule, getAllRules } from './linter/index.js';

// Formatter exports
export { Formatter, format } from './formatter/index.js';

// Types exports
export type {
  LintMessage,
  LintResult,
  LinterConfig,
  FormatterConfig,
  Fix,
} from './types.js';
export { DEFAULT_LINTER_CONFIG, DEFAULT_FORMATTER_CONFIG } from './types.js';
