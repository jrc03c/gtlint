import type { SourceLocation } from '../types.js';

export type ASTNode =
  | Program
  | Statement
  | Expression
  | SubKeyword
  | TextContent;

export type Statement =
  | KeywordStatement
  | ExpressionStatement
  | TextStatement
  | CommentStatement
  | AnswerOption;

export type Expression =
  | BinaryExpression
  | UnaryExpression
  | MemberExpression
  | CallExpression
  | IndexExpression
  | Identifier
  | Literal
  | ArrayExpression
  | ObjectExpression
  | InterpolatedString;

export interface BaseNode {
  type: string;
  loc: SourceLocation;
}

export interface Program extends BaseNode {
  type: 'Program';
  body: Statement[];
}

export interface KeywordStatement extends BaseNode {
  type: 'KeywordStatement';
  keyword: string;
  argument: Expression | TextContent | null;
  subKeywords: SubKeyword[];
  body: Statement[];
}

export interface SubKeyword extends BaseNode {
  type: 'SubKeyword';
  keyword: string;
  argument: Expression | TextContent | null;
  body: Statement[];
}

export interface ExpressionStatement extends BaseNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface TextStatement extends BaseNode {
  type: 'TextStatement';
  parts: (string | Expression)[];
}

export interface TextContent extends BaseNode {
  type: 'TextContent';
  parts: (string | Expression)[];
}

export interface CommentStatement extends BaseNode {
  type: 'CommentStatement';
  value: string;
}

export interface AnswerOption extends BaseNode {
  type: 'AnswerOption';
  text: TextContent;
  body: Statement[];
}

export interface BinaryExpression extends BaseNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression extends BaseNode {
  type: 'UnaryExpression';
  operator: string;
  argument: Expression;
}

export interface MemberExpression extends BaseNode {
  type: 'MemberExpression';
  object: Expression;
  property: Identifier;
  computed: boolean;
}

export interface CallExpression extends BaseNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface IndexExpression extends BaseNode {
  type: 'IndexExpression';
  object: Expression;
  index: Expression;
}

export interface Identifier extends BaseNode {
  type: 'Identifier';
  name: string;
}

export interface Literal extends BaseNode {
  type: 'Literal';
  value: string | number | boolean | null;
  raw: string;
}

export interface ArrayExpression extends BaseNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpression extends BaseNode {
  type: 'ObjectExpression';
  properties: Property[];
}

export interface Property extends BaseNode {
  type: 'Property';
  key: Expression;
  value: Expression;
}

export interface InterpolatedString extends BaseNode {
  type: 'InterpolatedString';
  parts: (string | Expression)[];
}

export function createProgram(body: Statement[], loc: SourceLocation): Program {
  return { type: 'Program', body, loc };
}

export function createKeywordStatement(
  keyword: string,
  argument: Expression | TextContent | null,
  subKeywords: SubKeyword[],
  body: Statement[],
  loc: SourceLocation
): KeywordStatement {
  return { type: 'KeywordStatement', keyword, argument, subKeywords, body, loc };
}

export function createSubKeyword(
  keyword: string,
  argument: Expression | TextContent | null,
  body: Statement[],
  loc: SourceLocation
): SubKeyword {
  return { type: 'SubKeyword', keyword, argument, body, loc };
}

export function createExpressionStatement(expression: Expression, loc: SourceLocation): ExpressionStatement {
  return { type: 'ExpressionStatement', expression, loc };
}

export function createTextStatement(parts: (string | Expression)[], loc: SourceLocation): TextStatement {
  return { type: 'TextStatement', parts, loc };
}

export function createTextContent(parts: (string | Expression)[], loc: SourceLocation): TextContent {
  return { type: 'TextContent', parts, loc };
}

export function createCommentStatement(value: string, loc: SourceLocation): CommentStatement {
  return { type: 'CommentStatement', value, loc };
}

export function createAnswerOption(text: TextContent, body: Statement[], loc: SourceLocation): AnswerOption {
  return { type: 'AnswerOption', text, body, loc };
}

export function createBinaryExpression(
  operator: string,
  left: Expression,
  right: Expression,
  loc: SourceLocation
): BinaryExpression {
  return { type: 'BinaryExpression', operator, left, right, loc };
}

export function createUnaryExpression(operator: string, argument: Expression, loc: SourceLocation): UnaryExpression {
  return { type: 'UnaryExpression', operator, argument, loc };
}

export function createMemberExpression(
  object: Expression,
  property: Identifier,
  loc: SourceLocation,
  computed: boolean = false
): MemberExpression {
  return { type: 'MemberExpression', object, property, computed, loc };
}

export function createCallExpression(
  callee: Expression,
  args: Expression[],
  loc: SourceLocation
): CallExpression {
  return { type: 'CallExpression', callee, arguments: args, loc };
}

export function createIndexExpression(
  object: Expression,
  index: Expression,
  loc: SourceLocation
): IndexExpression {
  return { type: 'IndexExpression', object, index, loc };
}

export function createIdentifier(name: string, loc: SourceLocation): Identifier {
  return { type: 'Identifier', name, loc };
}

export function createLiteral(value: string | number | boolean | null, raw: string, loc: SourceLocation): Literal {
  return { type: 'Literal', value, raw, loc };
}

export function createArrayExpression(elements: Expression[], loc: SourceLocation): ArrayExpression {
  return { type: 'ArrayExpression', elements, loc };
}

export function createObjectExpression(properties: Property[], loc: SourceLocation): ObjectExpression {
  return { type: 'ObjectExpression', properties, loc };
}

export function createProperty(key: Expression, value: Expression, loc: SourceLocation): Property {
  return { type: 'Property', key, value, loc };
}

export function createInterpolatedString(parts: (string | Expression)[], loc: SourceLocation): InterpolatedString {
  return { type: 'InterpolatedString', parts, loc };
}
