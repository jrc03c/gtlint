# Getting Started

GTLint is a linter, formatter, and syntax highlighter for the [GuidedTrack](https://guidedtrack.com) language. It is available as a **VSCode extension** (recommended for most users) and as a **command-line tool**.

![VSCode extension](https://github.com/user-attachments/assets/71fc166f-1980-4e2d-a84f-41188f6e0dbe)

![CLI tool](https://github.com/user-attachments/assets/06734d44-794c-475c-b5e2-c389a5f5a34c)

## VSCode Extension

### Installation

1. Download the `.vsix` file from the latest release:

   [Download gtlint.vsix](https://github.com/jrc03c/gtlint/releases/latest/download/gtlint.vsix)

2. In VSCode, open the command palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS) and search for **"vsix"**:

   ![VSCode command palette showing "Extensions: Install from VSIX..."](https://github.com/user-attachments/assets/03128194-04c5-4991-9acd-e9efb3e38ec9)

3. Select **"Extensions: Install from VSIX..."**.

4. Choose the `gtlint.vsix` file you downloaded in step 1.

### Usage

Once installed, the extension works automatically:

- **Linting** runs while you write code in `.gt` files. Errors and warnings appear as soon as they are detected.
- **Formatting** runs when you save a `.gt` file, automatically cleaning up spacing and whitespace.
- **Syntax highlighting** provides color-coded display of GuidedTrack keywords, strings, comments, and expressions.

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
# Print formatted output to stdout
npx gtlint format path/to/some-file.gt

# Format files and write changes back in place
npx gtlint format --write path/to/some-dir
```

::: warning
Without `--write`, the `format` command prints the formatted output to stdout and does **not** modify any files. Use `--write` to format files in place.
:::

### CLI Options

**Lint options:**

| Option | Description |
|---|---|
| `--quiet` | Only report errors, not warnings |
| `--format <type>` | Output format: `stylish` (default), `json`, or `compact` |

**Format options:**

| Option | Description |
|---|---|
| `--write` | Write formatted output back to files (without this, output goes to stdout) |

**Common options:**

| Option | Description |
|---|---|
| `--config <path>` | Path to a config file |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version number |

To customize rule severity levels and formatter settings, see [Configuration](/configuration).

## Disclaimer

GTLint was written almost exclusively by [Claude Code](https://claude.com/product/claude-code). [Josh Castle](https://github.com/jrc03c) directed Claude Code and made a few small changes to project documentation and sample GuidedTrack files; but virtually everything else was written by Claude Code.

## Feedback

If you run into bugs or have feature requests, please [open an issue](https://github.com/jrc03c/gtlint/issues) on GitHub.
