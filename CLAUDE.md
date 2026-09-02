# GTLint

A linter and formatter for the [GuidedTrack](https://guidedtrack.com) language ([docs](https://docs.guidedtrack.com)).

## Reference Files

- **`/ARCHITECTURE.md`** — Read this first before making code changes. Describes module responsibilities, entry points, data flow, and dependencies.
- `/samples` — Production GuidedTrack programs (valid code, useful for understanding the language)
- `/gt.pdf` — [Function & Keyword API](https://docs.guidedtrack.com/api/) reference
- `/LANGUAGE_SPEC.md` — Concise language specification
- `/src/language/keyword-spec.ts` — Formal TypeScript keyword spec (used by lint rules)
- `/TODO.md` — Task tracking

## Submodules — Read-Only

`/submodules/` contains external Git submodules (e.g., `guidedtrack-web`, the canonical GuidedTrack compiler — formerly the now-archived standalone `gt-lib` gem). **Never modify** files under `/submodules/`. Submodule data is used for integration tests and keyword auditing: `.gt` fixtures live at `submodules/guidedtrack-web/compiler/test/fixtures/` and the canonical keyword list at `submodules/guidedtrack-web/compiler/lib/keyword_definitions.rb`.

## Non-Obvious Language Quirks

- GuidedTrack has **no `*else:` keyword** — use multiple `*if:` statements instead
- **No `true`/`false` literals** — use 1/0, `*set:`, or `"true".decode("JSON")`
- **Text markup is a rendering concern, not a lexing one.** `*bold*`, `/italic/`, and `_underline_` are recognized only by `src/language/markup.ts` (a port of the interpreter's `TextScanner`) and by the TextMate grammar, whose regexes are generated from that module and checked by `tests/markup.test.ts`. The lexer deliberately does **not** split text on markers — doing so used to chop URLs, dates, and division expressions into fragments, and silently truncated `*if:` conditions.
- **A marker is only markup after whitespace.** An opening `*`/`/`/`_` must follow a space or start the text, must not be followed by a space, and a closing marker must not follow a space. Double quotes are transparent. This is why `https://x.com/a/b`, `1/2/2026`, and `10 / 2 / 5` contain no markup.
- **Only a few arguments are formatted.** GuidedTrack applies markup and links where the interpreter calls `markup_to_dom`/`markup_to_html`: plain text lines, answer options, `*list` items, `*question:`, `*maintain:`, and `*caption:`. Everything else — including `*button:`, `*header:`, and `*tip:` — is set with `.text()` and shows the markers literally. `PROSE_ARGUMENT_KEYWORDS` / `PROSE_SUB_KEYWORDS` in `keyword-spec.ts` hold this allowlist; it is an allowlist rather than a denylist so an unrecognized keyword never gets its URLs mangled.
- **Links need a scheme.** `[text|url]` only becomes a link when the URL starts with `http://` or `https://` and has a dotted host; otherwise GuidedTrack shows the brackets verbatim. The `valid-link` rule flags both that and links written in unformatted contexts.
- **Comments are whole lines only.** The compiler strips `^(\t| )*--.*$`, so a `--` partway through a line is ordinary text.
- **Line endings must be normalized before any line-oriented work.** Everything downstream assumes lines end with a bare `\n`. A CRLF file leaves a `\r` glued to the end of every line, and in JavaScript `.` does not match `\r` while `$` anchors past it — so a regex like `/^\s*--\s*(.+)$/` matches *nothing* on a CRLF line. Use `normalizeLineEndings` from `src/line-endings.ts` before splitting on `'\n'`; the formatter re-applies the original ending on output. (Note this is a JS-specific hazard: the canonical Ruby compiler's equivalent regexes tolerate `\r` because Ruby's `.` matches it and `$` is multiline by default.)
- **The formatter preserves a file's existing line endings by default.** `lineEndings: 'preserve' | 'lf' | 'crlf'` (config) and `--line-endings` (CLI) control this. Preserve is the default because `.gt` source pulled from guidedtrack.com arrives with CRLF, and we make no assumptions about what the server accepts on the way back up.
- **Config file convention**: Rule names in config files use camelCase (e.g., `noUnusedVars`); internally and in inline directives they use kebab-case (e.g., `no-unused-vars`). `src/config.ts` normalizes at the config-loading boundary. Both are accepted.

## Guidelines

- Ask clarifying questions at any time.
- Prefer `/samples`, `/gt.pdf`, `/LANGUAGE_SPEC.md`, and asking me over consulting the [docs website](https://docs.guidedtrack.com) (it's large and sprawling).
- Feel free to update this document to record decisions, clarifications, or anything useful for future reference.

## Post-Change Checklist

**After completing any feature, bug fix, or significant change, always perform these steps:**

### 1. Check CLI / VS Code Extension Parity

The CLI (`src/cli.ts`, `src/config.ts`) and VS Code extension (`vscode-extension/src/`) have **parallel implementations** for config loading, file handling, and linting/formatting. When changing behavior in one, check whether the other needs a matching update.

### 2. Update Documentation

- `/CLAUDE.md` — Update if project-level conventions or instructions changed
- `/ARCHITECTURE.md` — Update if modules, entry points, or data flow changed
- `/LANGUAGE_SPEC.md` — Update if language behavior or directives changed
- `/README.md` — Update user-facing documentation (usage, rules, configuration, etc.)

### 3. Bump Version and Rebuild

Update the version in both `/package.json` and `/vscode-extension/package.json`, then rebuild:

```bash
cd vscode-extension && pnpm run package
```

**Semver guidelines:** Patch = bug fixes. Minor = new features/rules/directives. Major = breaking changes.

The `.vsix` file is gitignored (not committed) — it is built locally via this command. Build artifacts (`dist/` and `*.vsix`) should never be committed to the repo.

### 4. Create a GitHub Release

After committing and pushing, create a GitHub release with the `.vsix` attached:

```bash
gh release create vX.Y.Z vscode-extension/dist/*.vsix --generate-notes
```
