export interface SourceLocation {
  start: Position;
  end: Position;
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface LintMessage {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  fix?: Fix;
}

export interface Fix {
  range: [number, number];
  text: string;
}

export interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
  warningCount: number;
  fixableErrorCount: number;
  fixableWarningCount: number;
  source?: string;
  output?: string;
}

export interface FormatterConfig {
  spaceAroundOperators: boolean;
  spaceAfterComma: boolean;
  spaceAroundArrow: boolean;
  spaceInsideBraces: number;
  spaceInsideBrackets: number;
  spaceInsideParens: number;
  trimTrailingWhitespace: boolean;
  insertFinalNewline: boolean;
}

export interface LinterConfig {
  rules: Record<string, 'off' | 'warn' | 'error'>;
  format: FormatterConfig;
  ignore: string[];
}

export const DEFAULT_FORMATTER_CONFIG: FormatterConfig = {
  spaceAroundOperators: true,
  spaceAfterComma: true,
  spaceAroundArrow: true,
  spaceInsideBraces: 0,
  spaceInsideBrackets: 0,
  spaceInsideParens: 0,
  trimTrailingWhitespace: true,
  insertFinalNewline: true,
};

export const DEFAULT_LINTER_CONFIG: LinterConfig = {
  rules: {
    'no-undefined-vars': 'error',
    'no-unused-vars': 'warn',
    'valid-keyword': 'error',
    'valid-sub-keyword': 'error',
    'no-invalid-goto': 'error',
    'indent-style': 'error',
    'no-unclosed-string': 'error',
    'no-unclosed-bracket': 'error',
    'no-single-quotes': 'error',
    'no-unreachable-code': 'warn',
    'required-subkeywords': 'error',
    'valid-subkeyword-value': 'error',
    'no-inline-argument': 'error',
    'goto-needs-reset-in-events': 'warn',
    'purchase-subkeyword-constraints': 'error',
    'correct-indentation': 'error',
  },
  format: DEFAULT_FORMATTER_CONFIG,
  ignore: ['**/node_modules/**', '**/dist/**'],
};
