# Introduction

This repository contains the code for **GTLint**, a linter and formatter for the GuidedTrack language. Here are some important links:

- [GuidedTrack home page](https://guidedtrack.com)
- [GuidedTrack documentation](https://docs.guidedtrack.com)

Also note that there are some useful reference files in the repository:

- The `/samples` directory contains a few different programs written in the GuidedTrack language. The programs all contain valid code and are in use in production.
- The `/gt.pdf` file is a PDF copy of the [Function & Keyword API](https://docs.guidedtrack.com/api/) page of the GuidedTrack documentation site linked above. It represents the most concise overview of the keywords and data types used in the language.

# Submodules — Read-Only

The `/submodules/` directory contains external Git submodules (e.g., `gt-lib`). These are **read-only** reference repositories:

- **Never modify** files under `/submodules/`. We don't have (and don't want to test) push access to upstream repos.
- After cloning this repository, run `git submodule update --init` to populate the submodule contents.
- Submodule data is used for integration tests and keyword auditing — see `tests/gt-lib-fixtures.test.ts` and `tests/keyword-audit.test.ts`.

# What is GuidedTrack?

GuidedTrack is both a domain-specific language and a service for creating simple web apps, forms, surveys, and other interactive web tools. It was originally designed to help accelerate psychology research by making it faster and easier for researchers (who may or may not have computer programming experience) to create and deploy web-based surveys.

Since this repository is mostly focused on creating a linter and formatter for the language, this document won't spend any time describing the look and feel of the programs created with the language; nor will it spend any time describing how one uses the web service. Instead, it will focus solely on the language itself.

The language is designed to feel similar to Python. It uses _only_ tabs for indentation, and whitespace is significant. The language does not enforce a particular case for variable names; i.e., variables can use `camelCase` or `snake_case` or any other case. Please examine the files in the `/samples` folder for a taste of what it looks like.

# ESLint and Prettier

The goal of this project is to produce a linter and formatter for the GuidedTrack language that mimics the functionalities of ESLint and Prettier for the web languages. It should be usable both at the command line and in IDEs (e.g., VSCode) via extensions.

Ideally, it will be installable via NPM/pnpm, like this:

```bash
pnpm add @jrc03c/gt-lint
```

And it should have a simple command line API that can be invoked with `npx` and look something like this:

```bash
npx gt-lint lint [options] [paths]
npx gt-lint format [options] [paths]
```

Also, it should produce extensions for IDEs like VSCode. These extensions should show warnings and errors in the same way that ESLint does (e.g., by underlining bits of code in orange or red), and they should automatically format code on save or on keyboard shortcut. Both the linter and the formatter should allow for configuration via a file in JS, JSON, or YAML formats (called something like `gtlint.config.js`). (It doesn't necessarily need to support all three formats; it could opinionatedly pick one.)

# Current Project Status

## What's Been Built

The core infrastructure for GTLint is now in place:

### Lexer (`src/lexer/`)

- Tokenizes GuidedTrack source code into tokens
- Handles keywords, sub-keywords, operators, strings, numbers, comments
- Tracks indentation (INDENT/DEDENT tokens) for Python-like syntax
- Supports string interpolation with `{variable}` syntax
- Supports text formatting: bold (`*text*`) and italic (`/text/`)
- Context-aware formatting: URLs/paths in keywords like `*image:`, `*audio:`, `*path:` don't apply formatting

### Parser (`src/parser/`)

- Converts token stream into an Abstract Syntax Tree (AST)
- AST node types include:
  - `KeywordStatement` - for `*keyword:` statements with optional sub-keywords and body
  - `ExpressionStatement` - for `>> variable = expression` assignments
  - `TextStatement` - for plain text content with interpolations
  - `CommentStatement` - for `--` comments
  - `AnswerOption` - for multiple-choice answer options
- Expression types: Binary, Unary, Member, Call, Index, Array, Object, Identifier, Literal, InterpolatedString

### Linter (`src/linter/`)

- Rule-based linting system inspired by ESLint
- Current rules:
  - `indent-style` - enforces tab-only indentation
  - `no-undefined-vars` - detects use of undefined variables
  - `no-unused-vars` - warns about defined but unused variables
  - `no-invalid-goto` - checks `*goto:` references valid `*label:` targets
  - `no-duplicate-labels` - detects duplicate `*label:` definitions
  - `no-unreachable-code` - detects unreachable code (constant false conditions, code after `*goto:`)
  - `valid-keyword` - validates keyword names against known set
  - `valid-sub-keyword` - validates sub-keyword names
  - `no-unclosed-string` - detects unclosed string literals
  - `no-unclosed-bracket` - detects unclosed brackets/braces/parentheses
  - `no-single-quotes` - enforces double quotes for strings
  - `correct-indentation` - validates indentation levels (over-indentation, body not allowed)
- Supports inline directive comments with three prefix types:
  - `@gt-*` directives affect both linting and formatting
  - `@gtlint-*` directives affect linting only
  - `@gtformat-*` directives affect formatting only

### Formatter (`src/formatter/`)

- Automatically formats GuidedTrack code
- Configurable options for spacing, trailing whitespace, final newline
- Configurable spaces inside braces (`spaceInsideBraces`), brackets (`spaceInsideBrackets`), and parentheses (`spaceInsideParens`) — each independently configurable, defaults to 0; empty pairs are never padded; string interpolation braces in text lines are unaffected
- Normalizes blank lines: collapses multiple consecutive blank lines to at most one (does not insert blank lines — the author controls blank line placement)
- Respects `@gtformat-disable` and `@gt-disable` directive regions

### CLI (`src/cli.ts`)

- Command-line interface with `gtlint lint` and `gtlint format` commands
- Glob pattern support for linting/formatting multiple files
- Configuration file support (`gtlint.config.js`)

### VSCode Extension (`vscode-extension/`)

- Syntax highlighting for `.gt` files
  - Keywords, sub-keywords, operators, strings, numbers, comments
  - Bold text formatting (`*text*`) rendered in bold
  - Italic text formatting (`/text/`) rendered in italics
  - Context-aware: formatting disabled for URL/path keywords
  - Embedded HTML syntax highlighting in `*html` blocks (delegates to VSCode's built-in HTML grammar)
- Integration with the linter (shows diagnostics in editor)
- Language configuration (brackets, comments, auto-closing pairs)

### Language Specification (`src/language/`)

- Formal TypeScript specification of all GuidedTrack keywords
- Defines for each keyword:
  - Argument requirements (required/optional, type: url, text, number, expression, etc.)
  - Body requirements (whether indented content is allowed/required)
  - Valid sub-keywords with their value types
  - Required sub-keywords (e.g., `*chart:` requires `*type:` and `*data:`)
  - Mutually exclusive sub-keywords (e.g., `*purchase` needs exactly one of `*status`/`*frequency`/`*management`)
  - Conditional requirements (e.g., if `*status` is used, then `*success` and `*error` are required)
- Helper functions for querying the specification

### Integration Tests (`tests/gt-lib-fixtures.test.ts`, `tests/keyword-audit.test.ts`)

- Fixture-based integration tests using 162 `.gt` files from the `gt-lib` submodule
- Lexer/parser crash tests: every fixture is tokenized and parsed without throwing
- Linter false-positive detection: valid fixtures are checked for `errorCount === 0`
- Known false positives (37 fixtures) are tracked with `it.fails` so they remain visible
- Error-case fixtures (20 fixtures with intentionally invalid GT) are excluded from linter checks
- Keyword audit test compares gt-lib's canonical keyword list against our `KEYWORDS`, `SUB_KEYWORDS`, and `KEYWORD_SPECS`
- Documents 11 sub-keywords missing from our lexer, 2 extra sub-keywords from docs, and 4 intentionally excluded internal keywords

## Key Design Decisions

1. **Tab-only indentation**: GuidedTrack uses only tabs (not spaces) for indentation, enforced by the `indent-style` rule
2. **Keywords prefix**: Keywords start with `*` (e.g., `*if:`, `*question:`)
3. **Expressions prefix**: Variable assignments start with `>>` (e.g., `>> x = 5`)
4. **Comments**: Single-line comments start with `--`
5. **String interpolation**: Variables in text use `{variable}` syntax
6. **Collections**: Arrays use `[]`, objects/associations use `{}` or `{ key -> value }` syntax
7. **Sub-keywords**: Many keywords support nested sub-keywords (e.g., `*question:` can have `*save:`, `*type:`, etc.)
8. **No else clause**: GuidedTrack has no `*else:` keyword - use multiple `*if:` statements
9. **Boolean values**: No `true`/`false` literals - use 1/0, `*set:`, or `"true".decode("JSON")`
10. **`*program:` returns**: `*program:` calls a subprogram and returns (unlike `*goto:` which transfers control)
11. **Text formatting**: Bold (`*text*`) and italic (`/text/`) formatting in visible text contexts only
12. **Context-aware lexing**: Formatting markers are context-aware - disabled in URL/path keywords to avoid conflicts with file paths

## Reference Files

- `/samples` - Production GuidedTrack programs demonstrating real-world usage
- `/gt.pdf` - API reference for all keywords, sub-keywords, and built-in functions
- `/LANGUAGE_SPEC.md` - Concise language specification (see below)
- `/src/language/keyword-spec.ts` - Formal TypeScript specification of all keywords, their argument requirements, valid sub-keywords, and constraints (used by lint rules)
- `/submodules/gt-lib/` - External Ruby gem for GuidedTrack (read-only submodule); contains 162 `.gt` fixture files and canonical keyword definitions
- `/TODO.md` - Task tracking for bugs, features, and ideas

# Guidelines

- Feel free to ask clarifying questions at any time.
- Feel free to update this document as needed to record comments, questions, clarifications, design decisions, or anything else that seems important for you to be able to reference later. You're welcome, too, to rewrite anything I've already written in this document to make it clearer, better organized, etc.
- The documentation website linked at the top of this document is quite large and sprawling, and I would recommend _not_ consulting it unless I'm unable to answer some specific question you might have. But between the sample programs, the `gt.pdf` file, the `LANGUAGE_SPEC.md`, and myself, I suspect that most of your questions about the language will be answerable without needing to consult the website.

# Post-Change Checklist

**After completing any feature, bug fix, or significant change, always perform these steps:**

## 1. Update Documentation

Review and update these Markdown files to ensure they reflect the changes:

- `/CLAUDE.md` - Update "Current Project Status" section if features were added/changed
- `/LANGUAGE_SPEC.md` - Update if language behavior or directives changed
- `/README.md` - Update user-facing documentation (usage, rules, configuration, etc.)

## 2. Bump Version and Rebuild

Update the semantic version number in both package.json files and rebuild the VSCode extension:

```bash
# Version numbers are in:
# - /package.json
# - /vscode-extension/package.json

# After updating versions, rebuild the .vsix file:
cd vscode-extension && pnpm run package
```

**Version bump guidelines (semver):**

- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor improvements
- **Minor** (0.1.0 → 0.2.0): New features, new rules, new directives
- **Major** (0.1.0 → 1.0.0): Breaking changes, major rewrites

The `.vsix` file will be created at `vscode-extension/dist/gt-lint.vsix` and is committed to the repository for easy installation.
