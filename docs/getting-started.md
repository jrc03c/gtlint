# Getting Started

GTLint is a linter and formatter for the [GuidedTrack](https://guidedtrack.com) language. It is available as a **VSCode extension** (recommended for most users) and as a **command-line tool**.

## VSCode Extension

### Installation

1. Download the `.vsix` file from the latest release:

   [Download gtlint.vsix](https://github.com/jrc03c/gtlint/releases/latest/download/gtlint.vsix)

2. In VSCode, open the command palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS) and search for **"vsix"**.

3. Select **"Extensions: Install from VSIX..."**.

4. Choose the `gtlint.vsix` file you downloaded in step 1.

### Usage

Once installed, the extension works automatically:

- **Linting** runs while you write code in `.gt` files. Errors and warnings appear as soon as they are detected.
- **Formatting** runs when you save a `.gt` file, automatically cleaning up spacing and whitespace.

No additional setup is needed. To customize which rules are enabled or how the formatter behaves, see [Configuration](/configuration).

## Command-Line Tool

### Prerequisites

The CLI requires [Node.js](https://nodejs.org/).

### Installation

Install GTLint as a dev dependency in a specific project:

```bash
npm install --save-dev @jrc03c/gtlint
```

Or install it globally:

```bash
npm install -g @jrc03c/gtlint
```

::: tip
When installed in a specific project, invoke GTLint with `npx gtlint`. When installed globally, you can use `gtlint` directly. The examples below use `npx gtlint`.
:::

### Usage

**Show help:**

```bash
npx gtlint
```

**Lint files:**

```bash
# Lint a specific file
npx gtlint lint path/to/some-file.gt

# Lint all .gt files in a directory (recursive)
npx gtlint lint path/to/some-dir
```

**Format files:**

```bash
# Format a specific file
npx gtlint format path/to/some-file.gt

# Format all .gt files in a directory (recursive)
npx gtlint format path/to/some-dir
```

**General syntax:**

```
npx gtlint lint [options] [files]
npx gtlint format [options] [files]
```

To customize rule severity levels and formatter settings, see [Configuration](/configuration).
