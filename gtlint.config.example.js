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
  },

  // Files/directories to ignore
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.min.gt',
  ],
};
