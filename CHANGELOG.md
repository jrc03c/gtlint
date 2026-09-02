# Changelog

## 0.16.0

### Bug Fixes

- Stop treating slashes inside URLs, dates, and division as `/italic/` markup. GuidedTrack only opens markup on a marker that starts the text or follows a space, so `https://example.com/foo`, `1/2/2026`, and `10 / 2 / 5` contain no markup at all. The syntax highlighter italicized `/example.com/` inside `[Click here|https://example.com/foo]`, and the lexer split the same text into fragments
- Stop silently truncating expressions that contain a division. Because the lexer split keyword arguments at markup characters and the parser kept only the first fragment, `*if: a / b / c > 1` was parsed as `*if: a`, quietly changing the condition, and the leftover fragments made the statement's body look empty — producing a false `no-empty-blocks` error on a block that had one. The parser now joins every fragment of an argument, so a split can never lose part of an expression
- Stop bolding arithmetic. `2 * 3 and 4 * 5` is no longer highlighted as bold, since a marker followed by a space does not open markup
- Highlight `--` as a comment only when it begins a line. The compiler strips whole-line comments only (`^(\t| )*--.*$`), so `Wait -- what?` is displayed text rather than a comment
- Highlight `*label:` names with the label scope. The generic keyword rule matched first and shadowed the more specific one

### Features

- Support `_underline_`, the third markup character, in both the lexer and the syntax highlighter
- Highlight links: `[text|url]` markup and bare URLs are now scoped as links, with the URL never treated as markup
- Highlight `*set:` arguments as expressions rather than prose
- Highlight markup inside answer options, which GuidedTrack formats
- Add the `valid-link` rule (default: `warn`), which flags links GuidedTrack renders as literal text — a URL with no `http://` or `https://` scheme, and links written where text is not formatted, such as a `*button:` label

### Internal

- Add `src/language/markup.ts` as the single source of truth for markup and links, ported from the interpreter's `TextScanner` and `HTMLFormattedText`. The TextMate grammar's regexes are generated from it, and `tests/markup.test.ts` fails if they drift apart, runs the interpreter's own `html_formatted_text_spec.coffee` cases against our implementation, and checks that the generated regexes and the scanner agree span-for-span
- Add `PROSE_ARGUMENT_KEYWORDS` / `PROSE_SUB_KEYWORDS` to `keyword-spec.ts`, replacing three disagreeing hardcoded lists (one in the lexer, one in the grammar, one implied by the parser) with a single allowlist of the arguments GuidedTrack actually formats
- Remove markup scanning from the lexer, which now emits one TEXT token per run of text (about 260 lines lighter)

## 0.15.6

### Bug Fixes

- Normalize the space after a keyword colon. The formatter already ensured exactly one space after `>>` and after expression keywords like `*if:`, but text keywords (`*header:`, `*question:`, `*button:`, and all sub-keywords) only collapsed whitespace that was already present — so `*header:Hello!` was left untouched. It now formats to `*header: Hello!`
- Stop emitting a trailing space after a valueless keyword. `*if:` on its own line formatted to `*if: ` because trailing-whitespace trimming runs before keyword formatting; keywords with no value now keep a bare colon

## 0.15.5

### Bug Fixes

- Allow `*classes` under every content-node keyword. The compiler grants `Classes` to all 38 such keywords through `ContentNode#optional_attributes` (only `*login` and `*points` opt out, and `*events` isn't a content node), but the linter recognized it under just `*component` and `*question`. `*classes` under `*header`, `*button`, `*image`, control-flow blocks, and the rest no longer reports a false error

## 0.15.4

### Internal

- Retarget the integration-test and keyword-audit submodule from the archived standalone `gt-lib` gem (last updated 2023) to `guidedtrack-web/compiler`, the canonical and actively-maintained GuidedTrack reference implementation. The fixture corpus grows from 162 to 167 programs, and the keyword audit now reconciles against the live `keyword_definitions.rb` (adds `placeholder`/`searchable`, drops the removed `history`). No user-facing behavior changes. Renamed `gt-lib-fixtures.test.ts` to `compiler-fixtures.test.ts` and added a `vitest.config.ts` that excludes the submodule from test discovery.

## 0.15.3

### Bug Fixes

- Parse `duration`, `datetime`, and `number` sub-keyword arguments as expressions instead of literal text. A variable used in such a sub-keyword (e.g. `*countdown: timeout`) is now recognized as a real reference: `no-unused-vars` no longer falsely flags it as unused, and `no-undefined-vars` correctly tracks it

## 0.15.2

### Bug Fixes

- Allow `*startup` as a valid sub-keyword of `*events` instead of incorrectly reporting that `*events` does not support sub-keywords

## 0.15.1

### Bug Fixes

- Add `*back` and `*menu` to sub-keyword token list so they are recognized under `*settings` instead of being flagged as invalid

## 0.15.0

### Bug Fixes

- Add `no-stray-colon` lint rule to detect invalid colons in expressions (e.g., `*if: 0 < 1:`)
