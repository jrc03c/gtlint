// gtlint.config.js - Example configuration file
// Copy this to gtlint.config.js and customize as needed

export default {
  // Lint rule configuration
  // Values: 'error', 'warn', 'off'
  // Rule names use camelCase in config files (kebab-case is also accepted)
  lint: {
    noUndefinedVars: 'error',
    noUnusedVars: 'warn',
    validKeyword: 'error',
    validLink: 'warn',
    validSubKeyword: 'error',
    noInvalidGoto: 'error',
    indentStyle: 'error',
    noUnclosedString: 'error',
    noUnclosedBracket: 'error',
  },

  // Formatter configuration
  format: {
    spaceAroundOperators: true,
    spaceAfterComma: true,
    spaceAroundArrow: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,

    // Line endings to write: 'preserve' (keep whatever the file uses),
    // 'lf', or 'crlf'
    lineEndings: 'preserve',
  },

  // Files/directories to ignore
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.min.gt',
  ],
};
