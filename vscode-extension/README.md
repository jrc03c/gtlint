# GTLint for Visual Studio Code

Provides linting, formatting, and quick fixes for GuidedTrack (`.gt`) files.

## Features

- **Syntax Highlighting**: Full syntax highlighting for GuidedTrack keywords, sub-keywords, strings, comments, and expressions
- **Real-time Linting**: Errors and warnings are highlighted as you type
- **Formatting**: Format your GuidedTrack code with a consistent style
- **Quick Fixes**: Automatic fixes for common issues

## Installation

Install from the Visual Studio Code Marketplace or search for "GTLint" in the Extensions view.

## Configuration

GTLint can be configured via:

1. **gtlint.config.js** file in your workspace (highest priority)
2. **VSCode Settings** (Settings > Extensions > GTLint)

### VSCode Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `gtlint.enable` | boolean | `true` | Enable GTLint for GuidedTrack files |
| `gtlint.lintOnType` | boolean | `true` | Lint files as you type |
| `gtlint.lintOnTypeDelay` | number | `300` | Delay in milliseconds before linting after typing |
| `gtlint.lintOnSave` | boolean | `true` | Lint files when saved |
| `gtlint.formatOnSave` | boolean | `false` | Format files when saved |
| `gtlint.lint` | object | `{}` | Override lint rules |
| `gtlint.format` | object | `{}` | Override format settings |

### Example gtlint.config.js

```javascript
module.exports = {
  lint: {
    'no-unused-vars': 'warn',
    'no-undefined-vars': 'error',
  },
  format: {
    spaceAroundOperators: true,
    trimTrailingWhitespace: true,
    insertFinalNewline: true,
  },
};
```

## Available Rules

| Rule | Default | Description |
|------|---------|-------------|
| `no-undefined-vars` | `error` | Disallow use of undefined variables |
| `no-unused-vars` | `warn` | Warn about unused variables |
| `valid-keyword` | `error` | Ensure keywords are valid |
| `valid-sub-keyword` | `error` | Ensure sub-keywords are valid |
| `no-invalid-goto` | `error` | Ensure goto targets exist |
| `indent-style` | `error` | Enforce consistent indentation (tabs only) |
| `no-unclosed-string` | `error` | Detect unclosed strings |
| `no-unclosed-bracket` | `error` | Detect unclosed brackets |

## Commands

- **GTLint: Lint File** - Lint the current file
- **GTLint: Format File** - Format the current file

## Format Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `spaceAroundOperators` | boolean | `true` | Add spaces around operators |
| `spaceAfterComma` | boolean | `true` | Add space after commas |
| `spaceAroundArrow` | boolean | `true` | Add spaces around arrow (`->`) |
| `trimTrailingWhitespace` | boolean | `true` | Remove trailing whitespace |
| `insertFinalNewline` | boolean | `true` | Ensure file ends with newline |

## Disable Rules

You can disable rules for specific lines using comments:

```
-- gtlint-disable-next-line no-unused-vars
>> unused_var = 1

>> another_var = 2 -- gtlint-disable-line no-unused-vars
```

## Requirements

- Visual Studio Code 1.85.0 or higher
