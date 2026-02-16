# GTLint

GTLint is a linter, formatter, and syntax highlighter for the [GuidedTrack](https://guidedtrack.com) language, inspired by ESLint and Prettier. It can be used at the command line or installed as a VSCode extension.

- [Intro](#intro)
- [Disclaimer](#disclaimer)
- [VSCode extension](#vscode-extension)
  - [Installation](#installation)
  - [Usage](#usage)
- [Command Line](#command-line)
  - [Installation](#installation-1)
  - [Usage](#usage-1)
- [Configuration](#configuration)
- [Directives](#directives)
- [Tests](#tests)
- [License](#license)

![](https://github.com/user-attachments/assets/71fc166f-1980-4e2d-a84f-41188f6e0dbe)

# Disclaimer

This tool was written almost exclusively by [Claude Code](https://claude.com/product/claude-code). [Josh Castle](https://github.com/jrc03c) directed Claude Code and made a few small changes to `CLAUDE.md`, `README.md`, and the GuidedTrack files in the `samples` directory; but GTLint itself was written entirely by Claude Code.

# VSCode extension

## Installation

(1) Clone the repo, install dependencies, and build the `.vsix` file:

```bash
pnpm install && cd vscode-extension && pnpm run package
```

(2) In VSCode, navigate to the Extensions pane, click on the tri-dot menu, and select "Install from VSIX...".

![](https://github.com/user-attachments/assets/f1ec5ba1-9027-475d-b9a8-29666d5d26fc)

(3) Select the `vscode-extension/dist/gt-lint.vsix` file that was built in step 1.

## Usage

The linter works while you write code in `.gt` files and will show errors as soon as it detects them.

The formatter will format code in `.gt` files on save.

# Command Line

## Installation

> **NOTE:** Requires [Node](https://nodejs.org/en).

In a specific project:

```bash
npm install --save-dev @jrc03c/gt-lint
```

Or globally:

```bash
npm install -g @jrc03c/gt-lint
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
# format a specific file
npx gtlint format path/to/some-file.gt

# format all *.gt files in a directory (recursive)
npx gtlint format path/to/some-dir
```

# Configuration

The linter's and formatter's default behaviors can be controlled by settings in a `gtlint.config.js` file at the root of a repository. Here's a sample configuration file containing all of the default values:

```js
export default {
  // formatter settings
  format: {
    insertFinalNewline: true,
    spaceAfterComma: true,
    spaceAroundArrow: true,
    spaceAroundOperators: true,
    trimTrailingWhitespace: true,
  },

  // linter settings
  rules: {
    correctIndentation: "error",
    indentStyle: "error",
    noDuplicateLabels: "error",
    noInvalidGoto: "error",
    noSingleQuotes: "warn",
    noUnclosedBracket: "error",
    noUnclosedString: "error",
    noUndefinedVars: "error",
    noUnusedVars: "warn",
    validKeyword: "error",
    validSubKeyword: "error",
  },
}
```

Linter rules can have these values:

- `"off"` or `0` - Disable the rule
- `"warn"` or `1` - Show as warning (doesn't fail linting)
- `"error"` or `2` - Show as error (fails linting)

# Directives

The linter's and formatter's behaviors can also be overridden by inline _directives_ written directly into `.gt` files. Directives are always commented out. For example:

```
-- @to-child: email_address
>> email_address = "someone@example.com"
*program: Add to Mailing List
```

Here are the available directives and what they do:

**Combined (lint + format):**

- `@gt-disable` = Disable lint + format until `@gt-enable` or EOF
- `@gt-enable` = Re-enable lint + format
- `@gt-disable-next-line` = Disable lint + format for next line only
- `@gt-disable-next-line rule1, rule2` = Disable specific lint rules + format for next line

**Lint-only:**

- `@gtlint-disable` = Disable all lint rules until `@gtlint-enable` or EOF
- `@gtlint-disable rule1, rule2` = Disable specific lint rules
- `@gtlint-enable` = Re-enable all lint rules
- `@gtlint-enable rule1` = Re-enable specific lint rule
- `@gtlint-disable-next-line` = Disable all lint rules for next line
- `@gtlint-disable-next-line rule1, rule2` = Disable specific rules for next line
- `@from-child: var1, var2, ...` = Do not mark listed variables as undefined (because they are defined in a child program)
- `@from-parent: var1, var2, ...` = Do not mark listed variables as undefined (because they are defined in a parent program)
- `@from-url: var1, var2, ...` = Do not mark listed variables as undefined (because they are defined in URL query string parameters)
- `@to-child: var1, var2, ...` = Do not mark listed variables as unused (because they will be used in a child program)
- `@to-parent: var1, var2, ...` = Do not mark listed variables as unused (because they will be used in a parent program)
- `@to-csv: var1, var2, ...` = Do not mark listed variables as unused (because they will be saved in the root program's CSV)

> **NOTE:** Inline directive rule names always use kebab-case (e.g., `no-unused-vars`), even though config files use camelCase.

**Format-only:**

- `@gtformat-disable` = Disable formatting until `@gtformat-enable` or EOF
- `@gtformat-enable` = Re-enable formatting

> **NOTE:** `@gtformat-*` directives don't support rule lists since formatting isn't rule-based.

# Tests

```bash
pnpm test
```

The test suite includes integration tests that exercise real GuidedTrack programs from a git submodule (`submodules/gt-lib`). This submodule points to a private repository and is optional. If it's not initialized, those tests are skipped automatically. All other tests will run normally.

# Feedback

If you run into bugs or have feature requests, please [open an issue](https://github.com/jrc03c/gt-lint/issues).

# License

MIT
