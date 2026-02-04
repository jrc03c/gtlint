# Introduction

This repository contains the code for **GTLint**, a linter and formatter for the GuidedTrack language. Here are some important links:

- [GuidedTrack home page](https://guidedtrack.com)
- [GuidedTrack documentation](https://docs.guidedtrack.com)

Also note that there are some useful reference files in the repository:

- The `/samples` directory contains a few different programs written in the GuidedTrack language. The programs all contain valid code and are in use in production.
- The `/gt.pdf` file is a PDF copy of the [Function & Keyword API](https://docs.guidedtrack.com/api/) page of the GuidedTrack documentation site linked above. It represents the most concise overview of the keywords and data types used in the language.

# What is GuidedTrack?

GuidedTrack is both a domain-specific language and a service for creating simple web apps, forms, surveys, and other interactive web tools. It was originally designed to help accelerate psychology research by making it faster and easier for researchers (who may or may not have computer programming experience) to create and deploy web-based surveys.

Since this repository is mostly focused on creating a linter and formatter for the language, this document won't spend any time describing the look and feel of the programs created with the language; nor will it spend any time describing how one uses the web service. Instead, it will focus solely on the language itself.

The language is designed to feel similar to Python. It uses _only_ tabs for indentation, and whitespace is significant. The language does not enforce a particular case for variable names; i.e., variables can use `camelCase` or `snake_case` or any other case. Please examine the files in the `/samples` folder for a taste of what it looks like.

# ESLint and Prettier

The goal of this project is to produce a linter and formatter for the GuidedTrack language that mimics the functionalities of ESLint and Prettier for the web languages. It should be usable both at the command line and in IDEs (e.g., VSCode) via extensions.

Ideally, it will be installable via NPM, like this:

```bash
npm install gt-lint
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
  - `no-unreachable-code` - detects unreachable code (constant false conditions, code after `*goto:`)
  - `valid-keyword` - validates keyword names against known set
  - `valid-sub-keyword` - validates sub-keyword names
  - `no-unclosed-string` - detects unclosed string literals
  - `no-unclosed-bracket` - detects unclosed brackets/braces/parentheses
  - `no-single-quotes` - enforces double quotes for strings
- Supports inline directive comments: `-- gtlint-disable`, `-- gtlint-disable-line`, `-- gtlint-disable-next-line`

### Formatter (`src/formatter/`)
- Automatically formats GuidedTrack code
- Configurable options for spacing, blank lines, trailing whitespace

### CLI (`src/cli.ts`)
- Command-line interface with `gtlint lint` and `gtlint format` commands
- Glob pattern support for linting/formatting multiple files
- Configuration file support (`gtlint.config.js`)

### VSCode Extension (`vscode-extension/`)
- Syntax highlighting for `.gt` files
- Integration with the linter (shows diagnostics in editor)
- Language configuration (brackets, comments, auto-closing pairs)

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

## Reference Files

- `/samples` - Production GuidedTrack programs demonstrating real-world usage
- `/gt.pdf` - API reference for all keywords, sub-keywords, and built-in functions
- `/LANGUAGE_SPEC.md` - Concise language specification (see below)

# Guidelines

- Feel free to ask clarifying questions at any time.
- Feel free to update this document as needed to record comments, questions, clarifications, design decisions, or anything else that seems important for you to be able to reference later. You're welcome, too, to rewrite anything I've already written in this document to make it clearer, better organized, etc.
- The documentation website linked at the top of this document is quite large and sprawling, and I would recommend _not_ consulting it unless I'm unable to answer some specific question you might have. But between the sample programs, the `gt.pdf` file, the `LANGUAGE_SPEC.md`, and myself, I suspect that most of your questions about the language will be answerable without needing to consult the website.
