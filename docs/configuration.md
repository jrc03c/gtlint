# Configuration

GTLint's linter and formatter can be configured using a `gtlint.config.js` file at the root of your repository. If no config file is found, GTLint uses sensible defaults.

## Config File

Create a `gtlint.config.js` (or `gtlint.config.mjs`) file in the root of your project and export a default object:

```js
export default {
  format: {
    // formatter options here
  },
  lint: {
    // lint rule severity levels here
  },
  ignore: [
    // file patterns to skip
  ],
}
```

The config file uses ESM `export default` syntax. GTLint searches for the config file starting from the current directory and walking up the directory tree until one is found.

## Full Example (All Defaults)

Below is a complete config file showing every option at its default value. You only need to include the settings you want to change.

```js
export default {
  // formatter settings
  format: {
    insertFinalNewline: true,
    spaceAfterComma: true,
    spaceAroundArrow: true,
    spaceAroundOperators: true,
    spaceInsideBraces: 0,
    spaceInsideBrackets: 0,
    spaceInsideParens: 0,
    trimTrailingWhitespace: true,
  },

  // linter settings
  lint: {
    correctIndentation: "error",
    gotoNeedsResetInEvents: "warn",
    indentStyle: "error",
    noDuplicateLabels: "error",
    noEmptyBlocks: "error",
    noInlineArgument: "error",
    noInvalidGoto: "error",
    noSingleQuotes: "error",
    noUnclosedBracket: "error",
    noUnclosedString: "error",
    noUndefinedVars: "error",
    noUnreachableCode: "warn",
    noUnusedLabels: "warn",
    noUnusedVars: "warn",
    purchaseSubkeywordConstraints: "error",
    requiredSubkeywords: "error",
    validKeyword: "error",
    validSubKeyword: "error",
    validSubkeywordValue: "error",
  },

  // files and directories to skip
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
  ],
}
```

## Lint Rule Severity

Each lint rule can be set to one of three severity levels:

| Value | Meaning |
|---|---|
| `"off"` | Disable the rule entirely |
| `"warn"` | Report as a warning (does not cause `gtlint lint` to exit with an error code) |
| `"error"` | Report as an error (causes `gtlint lint` to exit with a non-zero code) |

**Example** -- disable a rule and downgrade another to a warning:

```js
export default {
  lint: {
    noSingleQuotes: "off",
    noEmptyBlocks: "warn",
  },
}
```

For a description of every lint rule, see the [Rules](/rules) page.

## Format Options

The `format` object controls how the formatter transforms your code. All format options have sensible defaults, so you only need to include the ones you want to change.

### Boolean Options

| Option | Default | Description |
|---|---|---|
| `insertFinalNewline` | `true` | Ensure the file ends with a newline character. |
| `spaceAfterComma` | `true` | Insert a space after commas (e.g., `a, b, c`). |
| `spaceAroundArrow` | `true` | Insert spaces around the arrow operator `->` (e.g., `a -> b`). |
| `spaceAroundOperators` | `true` | Insert spaces around arithmetic and comparison operators (e.g., `x + 1`). |
| `trimTrailingWhitespace` | `true` | Remove trailing whitespace from every line. |

### Numeric Options

These options control how many spaces are inserted inside grouping characters. Set to `0` for no extra spacing, or a positive number for that many spaces on each side.

| Option | Default | Description |
|---|---|---|
| `spaceInsideBraces` | `0` | Spaces inside curly braces `{ }`. For example, `1` produces `{ x }` instead of `{x}`. |
| `spaceInsideBrackets` | `0` | Spaces inside square brackets `[ ]`. For example, `1` produces `[ x ]` instead of `[x]`. |
| `spaceInsideParens` | `0` | Spaces inside parentheses `( )`. For example, `1` produces `( x )` instead of `(x)`. |

For a full explanation of formatter behaviors, see the [Formatter](/formatter) page.

## Ignoring Files

Use the `ignore` array to specify glob patterns for files and directories that GTLint should skip entirely. By default, `node_modules` and `dist` directories are ignored.

```js
export default {
  ignore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.min.gt',
  ],
}
```

::: warning
Setting `ignore` **replaces** the defaults rather than merging with them. If you add custom patterns, include `'**/node_modules/**'` and `'**/dist/**'` in your list to keep the default exclusions.
:::

## Rule Name Conventions

::: tip camelCase vs. kebab-case
Config files use **camelCase** rule names (e.g., `noUnusedVars`). Inline directives use **kebab-case** (e.g., `no-unused-vars`). Both formats are accepted in config files -- GTLint normalizes them automatically.
:::

For inline directives that configure rules within your GuidedTrack source files, see the [Directives](/directives) page.
