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

`/submodules/` contains external Git submodules (e.g., `gt-lib`). **Never modify** files under `/submodules/`. Submodule data is used for integration tests and keyword auditing.

## Non-Obvious Language Quirks

- GuidedTrack has **no `*else:` keyword** — use multiple `*if:` statements instead
- **No `true`/`false` literals** — use 1/0, `*set:`, or `"true".decode("JSON")`
- **Config file convention**: Rule names in config files use camelCase (e.g., `noUnusedVars`); internally and in inline directives they use kebab-case (e.g., `no-unused-vars`). `src/config.ts` normalizes at the config-loading boundary. Both are accepted.

## Guidelines

- Ask clarifying questions at any time.
- Prefer `/samples`, `/gt.pdf`, `/LANGUAGE_SPEC.md`, and asking me over consulting the [docs website](https://docs.guidedtrack.com) (it's large and sprawling).
- Feel free to update this document to record decisions, clarifications, or anything useful for future reference.

## Post-Change Checklist

**After completing any feature, bug fix, or significant change, always perform these steps:**

### 1. Update Documentation

- `/CLAUDE.md` — Update if project-level conventions or instructions changed
- `/ARCHITECTURE.md` — Update if modules, entry points, or data flow changed
- `/LANGUAGE_SPEC.md` — Update if language behavior or directives changed
- `/README.md` — Update user-facing documentation (usage, rules, configuration, etc.)

### 2. Bump Version and Rebuild

Update the version in both `/package.json` and `/vscode-extension/package.json`, then rebuild:

```bash
cd vscode-extension && pnpm run package
```

**Semver guidelines:** Patch = bug fixes. Minor = new features/rules/directives. Major = breaking changes.

The `.vsix` file is gitignored (not committed) — it is built locally via this command. Build artifacts (`dist/` and `*.vsix`) should never be committed to the repo.

### 3. Create a GitHub Release

After committing and pushing, create a GitHub release with the `.vsix` attached:

```bash
gh release create vX.Y.Z vscode-extension/dist/*.vsix --generate-notes
```
