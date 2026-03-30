export enum TokenType {
  // Structure
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  EOF = 'EOF',

  // Keywords & Identifiers
  KEYWORD = 'KEYWORD',
  SUB_KEYWORD = 'SUB_KEYWORD',
  EXPRESSION_START = 'EXPRESSION_START',
  LABEL_DEF = 'LABEL_DEF',

  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Operators
  OPERATOR = 'OPERATOR',
  ARROW = 'ARROW',

  // Punctuation
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  LBRACKET = 'LBRACKET',
  RBRACKET = 'RBRACKET',
  LBRACE = 'LBRACE',
  RBRACE = 'RBRACE',
  COMMA = 'COMMA',
  DOT = 'DOT',
  COLON = 'COLON',
  DOUBLE_COLON = 'DOUBLE_COLON',

  // Other
  IDENTIFIER = 'IDENTIFIER',
  TEXT = 'TEXT',
  COMMENT = 'COMMENT',
  INTERPOLATION_START = 'INTERPOLATION_START',
  INTERPOLATION_END = 'INTERPOLATION_END',

  // Errors
  ERROR = 'ERROR',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
  offset: number;
  endLine: number;
  endColumn: number;
  endOffset: number;
}

export function createToken(
  type: TokenType,
  value: string,
  line: number,
  column: number,
  offset: number,
  endLine: number,
  endColumn: number,
  endOffset: number
): Token {
  return {
    type,
    value,
    line,
    column,
    offset,
    endLine,
    endColumn,
    endOffset,
  };
}

// GuidedTrack keywords
export const KEYWORDS = new Set([
  'audio',
  'button',
  'chart',
  'clear',
  'component',
  'database',
  'email',
  'events',
  'experiment',
  'for',
  'goto',
  'group',
  'header',
  'html',
  'if',
  'image',
  'label',
  'list',
  'login',
  'maintain',
  'navigation',
  'page',
  'points',
  'program',
  'progress',
  'purchase',
  'question',
  'quit',
  'randomize',
  'repeat',
  'return',
  'service',
  'set',
  'settings',
  'share',
  'summary',
  'switch',
  'trigger',
  'video',
  'wait',
  'while',
]);

// Sub-keywords that can appear under various parent keywords
export const SUB_KEYWORDS = new Set([
  'after',
  'answers',
  'back',
  'before',
  'blank',
  'body',
  'cancel',
  'caption',
  'classes',
  'click',
  'confirm',
  'countdown',
  'data',
  'date',
  'default',
  'description',
  'error',
  'every',
  'everytime',
  'frequency',
  'hide',
  'icon',
  'identifier',
  'management',
  'max',
  'menu',
  'method',
  'min',
  'multiple',
  'name',
  'other',
  'path',
  'placeholder',
  'required',
  'reset',
  'save',
  'searchable',
  'send',
  'shuffle',
  'start',
  'startup',
  'status',
  'subject',
  'success',
  'tags',
  'throwaway',
  'time',
  'tip',
  'to',
  'trendline',
  'type',
  'until',
  'what',
  'when',
  'with',
  'xaxis',
  'yaxis',
]);

// Operators
export const OPERATORS = new Set([
  '+',
  '-',
  '*',
  '/',
  '%',
  '=',
  '<',
  '>',
  '<=',
  '>=',
  'and',
  'or',
  'not',
  'in',
]);
