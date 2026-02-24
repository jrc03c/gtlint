# GTLint ✨

**GTLint** is a linter, formatter, and syntax highlighter for the [GuidedTrack](https://guidedtrack.com) language, inspired by ESLint and Prettier. It can be used at the command line or installed as a VSCode extension.

- [Overview](#overview)
- [Disclaimer](#disclaimer)
- [VSCode Extension](#vscode-extension)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Settings](#settings)
- [Command Line](#command-line)
  - [Installation](#installation-1)
  - [Usage](#usage-1)
  - [Options](#options)
- [Configuration](#configuration)
- [Lint Rules](#lint-rules)
- [Formatter](#formatter)
- [Directives](#directives)
- [Tests](#tests)
- [Feedback](#feedback)
- [License](#license)

![VSCode extension](https://github.com/user-attachments/assets/71fc166f-1980-4e2d-a84f-41188f6e0dbe)

![CLI tool](https://github.com/user-attachments/assets/06734d44-794c-475c-b5e2-c389a5f5a34c)

# Overview

GTLint's **linter** flags these things:

- unrecognized keywords
- invalid sub-keywords
- invalid sub-keyword values
- invalid keyword arguments (inline arguments on keywords that don't accept them)
- missing required sub-keywords
- invalid sub-keyword combinations under `*purchase`
- empty blocks (e.g., `*if: 0 < 1` without a body)
- undefined variables
- unused variables
- nonexistent labels (in `*goto`)
- duplicate labels
- unused labels
- unreachable code
- unclosed strings
- unclosed brackets
- single quotes instead of double quotes around string literals
- spaces instead of tabs for indentation
- incorrect indentation levels
- `*goto` inside `*events` without `*reset`

GTLint's **formatter** does these things:

- trims trailing whitespace (per-line)
- collapses consecutive empty lines
- adds spaces around operators (e.g., `+`, `=`, `>`, etc.)
- adds spaces around arrows (`->`) in associations
- adds spaces after commas in collections and associations
- normalizes spacing immediately inside braces, brackets, and parens
- normalizes `>>` to be followed by a single space
- collapses runs of whitespace in expressions
- inserts a final newline at the end of the file

Virtually all of these behaviors can be modified by using a [configuration](#configuration) file and/or inline [directives](#directives).

# Disclaimer

This tool was written almost exclusively by [Claude Code](https://claude.com/product/claude-code). [Josh Castle](https://github.com/jrc03c) directed Claude Code and made a few small changes to `CLAUDE.md`, `README.md`, and the GuidedTrack files in the `samples` directory; but virtually everything else was written by Claude Code.

# VSCode Extension

## Installation

(1) Download the `.vsix` file from here:

[https://github.com/jrc03c/gtlint/releases/latest/download/gtlint.vsix](https://github.com/jrc03c/gtlint/releases/latest/download/gtlint.vsix)

(2) In VSCode, open the command palette and search for "vsix":

![](https://github.com/user-attachments/assets/03128194-04c5-4991-9acd-e9efb3e38ec9)

Select "Extensions: Install from VSIX...".

(3) Select the `gtlint.vsix` file that you downloaded in the first step.

## Usage

The linter works while you write code in `.gt` files and will show errors as soon as it detects them. The formatter will format code in `.gt` files on save (if enabled). The extension also provides **autocomplete for directives** — type `-- @` in a comment to see suggestions for all available directives and rule names.

Two commands are available via the command palette:

- **GTLint: Lint File** — Lint the current `.gt` file
- **GTLint: Format File** — Format the current `.gt` file

See the [Settings](#settings) section below for more info about how to control the extension's behavior, and the [Configuration](#configuration) section for project-wide settings via config files.

## Settings

The VSCode extension exposes these settings (accessible via `Preferences: Open Settings` or `settings.json`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `gtlint.enable` | `boolean` | `true` | Enable/disable GTLint entirely |
| `gtlint.lintOnType` | `boolean` | `true` | Lint files as you type |
| `gtlint.lintOnTypeDelay` | `number` | `300` | Delay in milliseconds before linting after typing |
| `gtlint.lintOnSave` | `boolean` | `true` | Lint files when saved |
| `gtlint.formatOnSave` | `boolean` | `false` | Format files when saved (also requires `editor.formatOnSave` to be `true`) |
| `gtlint.lint` | `object` | `{}` | Override lint rule severities (e.g., `{ "no-unused-vars": "off" }`) |
| `gtlint.format` | `object` | `{}` | Override formatter settings (e.g., `{ "spaceAroundOperators": false }`) |

**Configuration precedence** (highest to lowest):

1. VSCode workspace/user settings (`gtlint.*`)
2. Project config file (`gtlint.config.js` or `gtlint.config.mjs`)
3. Built-in defaults

> **NOTE:** Config files are only loaded in [trusted workspaces](https://code.visualstudio.com/docs/editor/workspace-trust) since they execute arbitrary JavaScript.

# Command Line

## Installation

> **NOTE:** Requires [Node.js](https://nodejs.org/en) v18 or later.

In a specific project:

```bash
npm install --save-dev @jrc03c/gtlint
```

Or globally:

```bash
npm install -g @jrc03c/gtlint
```

## Usage

> **NOTE:** When installed in a specific project, GTLint must be invoked with `npx gtlint`. When installed globally, it can be invoked with just `gtlint`. The examples below assume that it has been installed in a specific project.

**Syntax:**

```
# lint:
npx gtlint lint [options] [files]

# format:
npx gtlint format [options] [files]
```

**Show help:**

```bash
npx gtlint
```

**Lint:**

```bash
# show errors and warnings in a particular file
npx gtlint lint path/to/some-file.gt

# show all errors and warnings in all *.gt files in a directory (recursive)
npx gtlint lint path/to/some-dir
```

**Format:**

```bash
# print formatted output to stdout (does not modify files)
npx gtlint format path/to/some-file.gt

# format a specific file in-place
npx gtlint format --write path/to/some-file.gt

# format all *.gt files in a directory in-place (recursive)
npx gtlint format --write path/to/some-dir
```

## Options

**Lint options:**

| Option | Description |
|---|---|
| `--quiet` | Only report errors (suppress warnings) |
| `--format <type>` | Output format: `stylish` (default), `json`, or `compact` |

**Format options:**

| Option | Description |
|---|---|
| `--write` | Write formatted output back to files (without this flag, formatted output is printed to stdout) |

**Common options:**

| Option | Description |
|---|---|
| `--config <path>` | Path to a config file (default: searches up from CWD) |
| `--help`, `-h` | Show help message |
| `--version`, `-v` | Show version number |

**Exit codes:**

- `0` — Success (no lint errors)
- `1` — Lint errors were found

# Configuration

The linter's and formatter's default behaviors can be controlled by settings in a config file at the root of a repository. GTLint looks for these filenames, searching upward from the current directory:

- `gtlint.config.js`
- `gtlint.config.mjs`

Here's a sample configuration file containing all of the default values:

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

  // files/directories to ignore (glob patterns)
  ignore: [
    "**/node_modules/**",
    "**/dist/**",
  ],
}
```

Lint rules can have these values:

- `"off"` - Disable the rule
- `"warn"` - Show as warning (doesn't fail linting)
- `"error"` - Show as error (fails linting with exit code 1)

# Lint Rules

| Rule | Default | Description |
|---|---|---|
| `correctIndentation` | `error` | Validate indentation levels |
| `gotoNeedsResetInEvents` | `warn` | Ensure `*goto` inside `*events` has `*reset` |
| `indentStyle` | `error` | Enforce tabs for indentation (not spaces) |
| `noDuplicateLabels` | `error` | Disallow duplicate `*label` definitions |
| `noEmptyBlocks` | `error` | Disallow empty keyword blocks |
| `noInlineArgument` | `error` | Ensure keywords that should not have inline arguments do not have them |
| `noInvalidGoto` | `error` | Ensure `*goto` targets exist as `*label` definitions |
| `noSingleQuotes` | `error` | Disallow single quotes for strings (use double quotes) |
| `noUnclosedBracket` | `error` | Detect unclosed brackets and braces |
| `noUnclosedString` | `error` | Detect unclosed string literals |
| `noUndefinedVars` | `error` | Disallow use of undefined variables |
| `noUnreachableCode` | `warn` | Disallow unreachable code after control flow statements |
| `noUnusedLabels` | `warn` | Detect labels that are never referenced by a `*goto` |
| `noUnusedVars` | `warn` | Warn about variables that are never used |
| `purchaseSubkeywordConstraints` | `error` | Ensure `*purchase` has correct sub-keyword combinations |
| `requiredSubkeywords` | `error` | Ensure keywords have all required sub-keywords |
| `validKeyword` | `error` | Ensure keywords are valid GuidedTrack keywords |
| `validSubKeyword` | `error` | Ensure sub-keywords are valid under their parent keyword |
| `validSubkeywordValue` | `error` | Ensure sub-keyword values are valid |

> **NOTE:** Config files use camelCase rule names (e.g., `noUnusedVars`). Inline directives use kebab-case (e.g., `no-unused-vars`). Both forms are accepted in config files.

# Formatter

The formatter normalizes whitespace and spacing in `.gt` files. Its behavior is controlled by the `format` section of the config file. Here are the available options:

| Option | Type | Default | Description |
|---|---|---|---|
| `insertFinalNewline` | `boolean` | `true` | Insert a newline at the end of the file |
| `spaceAfterComma` | `boolean` | `true` | Add a space after commas in collections and associations |
| `spaceAroundArrow` | `boolean` | `true` | Add spaces around `->` in associations |
| `spaceAroundOperators` | `boolean` | `true` | Add spaces around operators (`+`, `-`, `=`, `<`, `>`, etc.) |
| `spaceInsideBraces` | `number` | `0` | Number of spaces inside curly braces (`{ }`) |
| `spaceInsideBrackets` | `number` | `0` | Number of spaces inside square brackets (`[ ]`) |
| `spaceInsideParens` | `number` | `0` | Number of spaces inside parentheses (`( )`) |
| `trimTrailingWhitespace` | `boolean` | `true` | Trim trailing whitespace from each line |

The formatter also performs these always-on behaviors (not configurable):

- Collapses consecutive empty lines (keeps at most one)
- Normalizes `>>` to be followed by a single space
- Collapses runs of whitespace in expressions

> **NOTE:** On text lines (lines that are not keyword or expression lines), spacing inside braces is not modified since braces are used for variable interpolation (e.g., `Your name is {name}`).

# Directives

The linter's and formatter's behaviors can also be overridden by inline _directives_ written directly into `.gt` files. Directives are always commented out. For example:

```
-- @to-child: email_address
>> email_address = "someone@example.com"
*program: Add to Mailing List
```

Here are the available directives and what they do:

**Combined (lint + format):**

- **`@gt-disable`**<br>
  Disable lint + format until `@gt-enable` or EOF

- **`@gt-enable`**<br>
  Re-enable lint + format

- **`@gt-disable-next-line`**<br>
  Disable lint + format for next line only

- **`@gt-disable-next-line rule1, rule2`**<br>
  Disable specific lint rules + format for next line

**Lint-only:**

- **`@gtlint-disable`**<br>
  Disable all lint rules until `@gtlint-enable` or EOF

- **`@gtlint-disable rule1, rule2`**<br>
  Disable specific lint rules

- **`@gtlint-enable`**<br>
  Re-enable all lint rules

- **`@gtlint-enable rule1`**<br>
  Re-enable specific lint rule

- **`@gtlint-disable-next-line`**<br>
  Disable all lint rules for next line

- **`@gtlint-disable-next-line rule1, rule2`**<br>
  Disable specific rules for next line

- **`@from-child: var1, var2, ...`**<br>
  Do not mark listed variables as undefined (because they are defined in a child program); warns if a listed variable is never used

- **`@from-parent: var1, var2, ...`**<br>
  Do not mark listed variables as undefined (because they are defined in a parent program); warns if a listed variable is never used or if its value is overwritten before being read

- **`@from-url: var1, var2, ...`**<br>
  Do not mark listed variables as undefined (because they are defined in URL query string parameters); warns if a listed variable is never used or if its value is overwritten before being read

- **`@to-child: var1, var2, ...`**<br>
  Do not mark listed variables as unused (because they will be used in a child program)

- **`@to-parent: var1, var2, ...`**<br>
  Do not mark listed variables as unused (because they will be used in a parent program)

- **`@to-csv: var1, var2, ...`**<br>
  Do not mark listed variables as unused (because they will be saved in the root program's CSV)

> **NOTE:** Inline directive rule names always use kebab-case (e.g., `no-unused-vars`), even though config files use camelCase.

**Format-only:**

- **`@gtformat-disable`**<br>
  Disable formatting until `@gtformat-enable` or EOF

- **`@gtformat-enable`**<br>
  Re-enable formatting

> **NOTE:** `@gtformat-*` directives don't support rule lists since formatting isn't rule-based.

# Tests

```bash
pnpm test
```

The test suite includes integration tests that exercise real GuidedTrack programs from a git submodule (`submodules/gt-lib`). This submodule points to a private repository and is optional. If it's not initialized, those tests are skipped automatically. All other tests will run normally.

# Feedback

If you run into bugs or have feature requests, please [open an issue](https://github.com/jrc03c/gtlint/issues).

# License

MIT
