# GTLint Documentation Site — Design

## Summary

Create a VitePress documentation site for GTLint, hosted on GitHub Pages at `jrc03c.github.io/gtlint`. The audience is GuidedTrack users who want to use GTLint to lint/format their programs.

## Tech Stack

- **VitePress** — static site generator
- **GitHub Pages** — hosting at `jrc03c.github.io/gtlint`
- **GitHub Actions** — automated deployment on push to `main`

## Site Structure

```
docs/
  .vitepress/
    config.ts        # VitePress config (title, nav, sidebar, base path)
  index.md           # Home page (hero + feature cards)
  getting-started.md # Install (VSCode + CLI) + quick usage
  rules.md           # All lint rules with descriptions & severity levels
  formatter.md       # Formatter behaviors & settings
  configuration.md   # gtlint.config.js reference
  directives.md      # All inline directives
```

## Pages

1. **Home** (`index.md`) — Hero section with tagline, feature highlights (linter, formatter, VSCode extension), and quick install snippet.
2. **Getting Started** (`getting-started.md`) — VSCode installation + CLI installation + basic usage for both.
3. **Rules** (`rules.md`) — Table/list of all lint rules, what each detects, default severity, how to configure.
4. **Formatter** (`formatter.md`) — What the formatter does, each formatting behavior, configuration options.
5. **Configuration** (`configuration.md`) — Full `gtlint.config.js` reference with the example config and value explanations.
6. **Directives** (`directives.md`) — All inline directives with examples.

## Sidebar Navigation

```
Getting Started
Rules
Formatter
Configuration
Directives
```

## Deployment

- GitHub Actions workflow (`.github/workflows/docs.yml`) triggers on push to `main` when `docs/**` files change.
- Builds VitePress, deploys to `gh-pages` branch.
- Base path set to `/gtlint/` for GitHub Pages project site.

## README

The README stays as-is. It can be slimmed down later as a separate step.

## Decisions

- Docs live in `docs/` (standard VitePress convention).
- Default GitHub Pages URL — no custom domain needed.
- Content derived from existing README, split across focused pages.
