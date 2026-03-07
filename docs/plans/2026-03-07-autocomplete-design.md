# Auto-Complete for Keywords & Methods

## Summary

Add IntelliSense-style auto-complete to the VS Code extension for:
1. **Keywords** — triggered by `*` at line start, context-aware based on parent keyword
2. **Methods** — triggered by `.` after an expression, showing all built-in methods across types

## Approach

Extend the existing `GTLintCompletionProvider` in `completions.ts`. Use lightweight upward line scanning for keyword context detection (no parser/AST needed). Define a new `METHOD_SPECS` constant for method data.

No new files required. No architectural changes.

## Keyword Completions

### Trigger

User types `*` at the start of a line (after optional whitespace/indentation).

### Context Detection (Parent Keyword Lookup)

Walk upward through the document to find the parent keyword:

1. Get current line's indent level (count leading tabs).
2. Walk upward line by line.
3. Skip blank lines and comment-only lines (`--`).
4. For each non-skipped line, measure its indent level.
5. If indent is exactly one less than current AND line starts with `*keyword`: that's the parent.
6. If indent drops below one-less-than-current, stop — no direct parent found.
7. If current line has zero indent, skip the walk (top level).

### `*html` Suppression

Additionally check if any ancestor (not just immediate parent) is `*html`. If so, suppress keyword completions entirely, since `*html` bodies contain raw HTML.

### Completion List

**If parent keyword found:**
- **Priority group** (sorted first): Sub-keywords from `KEYWORD_SPECS[parent].subKeywords` — with descriptions, value types, and enum values from the spec.
- **Secondary group**: All top-level keywords (GuidedTrack's nesting model is fully permissive — any keyword can appear in any body).

**If no parent / ambiguous:** All top-level keywords.

### Completion Items

Each keyword completion includes:
- Keyword name as label
- Description from `KEYWORD_SPECS`
- `sortText` to ensure sub-keywords appear above top-level keywords
- `CompletionItemKind.Keyword`

## Method Completions

### Trigger

User types `.` after a character that could end an expression: identifier character (`a-z`, `A-Z`, `0-9`, `_`), `)`, `]`, or `"`. This avoids false triggers inside URLs.

### Data

A `METHOD_SPECS` constant defining methods per type:

| Type | Methods |
|------|---------|
| string | `clean`, `count(text)`, `decode(scheme)`, `encode(scheme)`, `find(text)`, `lowercase`, `size`, `split(delimiter)`, `uppercase` |
| number | `round`, `round(decimals)`, `seconds`, `minutes`, `hours`, `days`, `weeks`, `months`, `years` |
| collection | `add(element)`, `combine(collection)`, `count(value)`, `erase(value)`, `find(value)`, `insert(element, position)`, `max`, `mean`, `median`, `min`, `remove(position)`, `shuffle`, `size`, `sort(direction)`, `unique` |
| association | `encode(scheme)`, `erase(value)`, `keys`, `remove(key)` |
| any | `text`, `type` |

### Completion Items

Each method completion includes:
- Method name as label
- Type(s) it belongs to in detail (e.g., "String / Collection" for `.size`)
- Snippet with tab stops for methods with parameters (e.g., `insert(${1:element}, ${2:position})`)
- `CompletionItemKind.Property` for properties, `CompletionItemKind.Method` for calls with parens

### Deduplication

Methods shared across types (e.g., `.size`, `.count()`, `.find()`) appear once with all applicable types listed.

## Integration

### Trigger Characters

Add `*` and `.` to the existing trigger character registration in `extension.ts` (currently `@`, `,`, ` `).

### Provider Logic

Three code paths in `provideCompletionItems`, checked in order:

1. Line is a `--` comment -> existing directive completions (unchanged)
2. `*` at line start (after whitespace) -> keyword completions
3. `.` after expression-ending character -> method completions

### Imports

`KEYWORD_SPECS` is already available from the `@jrc03c/gtlint` package. `METHOD_SPECS` will be defined locally in `completions.ts`.

## Non-Goals

- Type inference for method filtering (show all types instead)
- Language Server Protocol (direct VS Code API is sufficient)
- Snippet templates for keyword bodies (just complete the keyword name)
- Completions inside `*html` blocks
