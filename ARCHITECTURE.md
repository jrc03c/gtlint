# Architecture

## Pipeline

```
Source code → Lexer → Token[] → Parser → AST → Linter  → LintResult
                                             → Formatter → formatted source
```

Both the CLI and VSCode extension consume the linter and formatter through the public API (`src/index.ts`).

## Modules

### `src/lexer/` — Tokenizer
- Entry point: `tokenize(source): Token[]`
- Scans source character-by-character, emits INDENT/DEDENT tokens for indentation-based blocks
- Keywords/sub-keywords defined as Sets in `tokens.ts`
- Context-aware: disables `*bold*`/`/italic/` formatting in URL/path keyword contexts

### `src/parser/` — AST builder
- Entry point: `parse(tokens): Program`
- Produces AST nodes: `KeywordStatement`, `ExpressionStatement`, `TextStatement`, `CommentStatement`, `AnswerOption`
- Expression nodes: `BinaryExpression`, `UnaryExpression`, `MemberExpression`, `CallExpression`, `IndexExpression`, `Identifier`, `Literal`, `ArrayExpression`, `ObjectExpression`, `InterpolatedString`
- Node types and factory functions defined in `ast.ts`

### `src/linter/` — Rule-based linter
- Entry point: `lint(source): LintResult` or `new Linter(config).lint(source)`
- Rules live in `rules/` — each exports a `LintRule` with a `create(context): RuleVisitor` function (visitor pattern over AST nodes)
- `directives.ts` parses `-- @gt-*`, `-- @gtlint-*`, `-- @gtformat-*` inline comments to suppress/enable rules and declare cross-program variable flow
- Lint rules are automatically suppressed inside `*html` block bodies (except `no-undefined-vars` for `{variable}` interpolations)

### `src/formatter/` — Code formatter
- Entry point: `format(source): string` or `new Formatter(config).format(source)`
- Works line-by-line: trims trailing whitespace, normalizes blank lines, formats operators/spacing
- Respects `@gtformat-disable` / `@gt-disable` directive regions
- Configurable spacing inside braces, brackets, parens (each independent, default 0)

### `src/language/` — Keyword specification
- `keyword-spec.ts` defines `KEYWORD_SPECS`: argument requirements, body rules, valid sub-keywords, required sub-keywords, mutual exclusions, conditional requirements
- Used by lint rules (`valid-keyword`, `valid-sub-keyword`, `required-subkeywords`, etc.) for validation
- No runtime dependencies — pure data

### `src/config.ts` — Configuration loader
- `loadConfig(pathOrDir)` finds and loads `gtlint.config.js` / `gtlint.config.mjs`
- Merges user config with defaults; normalizes camelCase rule names to kebab-case

### `src/cli.ts` — CLI
- Binary entry point: `gtlint lint [options] [files...]` / `gtlint format [options] [files...]`
- Expands glob patterns, loads config, runs linter/formatter, outputs results (stylish/json/compact)

### `src/types.ts` — Shared types
- `LintMessage`, `LintResult`, `Fix`, `SourceLocation`, `FormatterConfig`, `LinterConfig`
- Imported by all modules

### `vscode-extension/src/` — VSCode integration (separate package)
- `extension.ts` — activation, registers providers, listens to document events
- `diagnostics.ts` — converts `LintMessage[]` to VSCode diagnostics, debounced on-type linting
- `formatter.ts` — `DocumentFormattingEditProvider` wrapping the core formatter
- `codeActions.ts` — quick-fix code actions from `Fix` objects
- `completions.ts` — directive and rule name completions in `--` comment lines
- `configuration.ts` — reads `gtlint.*` VSCode settings, merges with defaults

### `tests/`
- Unit tests: `lexer.test.ts`, `parser.test.ts`, `linter.test.ts`, `formatter.test.ts`, `directives.test.ts`
- Integration: `gt-lib-fixtures.test.ts` (162 `.gt` files from `gt-lib` submodule — crash tests, false-positive detection, known failures tracked with `it.fails`)
- Audit: `keyword-audit.test.ts` (compares our keyword spec against `gt-lib`'s canonical list)
- Framework: Vitest

## Module Dependencies

```
types.ts          (no deps — shared types)
language/         (no deps — pure data)
lexer/            (no deps)
parser/           (lexer)
linter/           (parser, lexer, language, types)
  └── rules/      (language, types)
  └── directives  (types)
formatter/        (lexer, directives, types)
config.ts         (types)
cli.ts            (linter, formatter, config)
src/index.ts      (re-exports public API from all modules)

vscode-extension/ (imports gt-lint as library dependency)
```
