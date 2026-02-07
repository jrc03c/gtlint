export const DEFAULT_FORMATTER_CONFIG = {
    spaceAroundOperators: true,
    spaceAfterComma: true,
    spaceAroundArrow: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
};
export const DEFAULT_LINTER_CONFIG = {
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
//# sourceMappingURL=types.js.map