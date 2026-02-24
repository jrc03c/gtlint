# Formatter

GTLint includes an automatic code formatter for GuidedTrack. It normalizes spacing, trims whitespace, and cleans up expressions so your code is consistent and readable.

- In the **VSCode extension**, formatting can be triggered via the command palette (**GTLint: Format File**) or configured to run on save (requires enabling `editor.formatOnSave` in VSCode settings).
- With the **CLI**, run `npx gtlint format <file-or-directory>` to format files.

Most formatting behaviors are configurable. See [Configuration](/configuration) for the full config file reference, and [Directives](/directives) for how to disable formatting inline.

## Behaviors

### Trim trailing whitespace

Removes spaces and tabs at the end of each line.

**Config:** `trimTrailingWhitespace` (default: `true`)

**Before:**

```
*question: What is your name?··
```

**After:**

```
*question: What is your name?
```

<small>`·` represents a space character.</small>

---

### Collapse consecutive empty lines

Reduces multiple consecutive blank lines down to a single blank line. This keeps programs from accumulating large vertical gaps.

**Always enabled** (no config option).

**Before:**

```
*question: What is your name?



*question: What is your age?
```

**After:**

```
*question: What is your name?

*question: What is your age?
```

---

### Add spaces around operators

Ensures there is a space on each side of arithmetic, comparison, and assignment operators (`+`, `-`, `*`, `/`, `%`, `=`, `<`, `>`, `<=`, `>=`).

**Config:** `spaceAroundOperators` (default: `true`)

**Before:**

```
>> x=y+1
*if: score>10
```

**After:**

```
>> x = y + 1
*if: score > 10
```

::: tip
The formatter is smart about negative numbers. A leading `-` that precedes a digit (for example, `-1`) is left alone.
:::

---

### Add spaces around arrows

Ensures there is a space on each side of the `->` arrow used in associations.

**Config:** `spaceAroundArrow` (default: `true`)

**Before:**

```
>> my_assoc = {"a"->1, "b"->2}
```

**After:**

```
>> my_assoc = {"a" -> 1, "b" -> 2}
```

---

### Add spaces after commas

Ensures there is a space after each comma in collections and associations.

**Config:** `spaceAfterComma` (default: `true`)

**Before:**

```
>> items = [1,2,3,4]
```

**After:**

```
>> items = [1, 2, 3, 4]
```

---

### Normalize spacing inside braces

Controls the number of spaces immediately inside `{` and `}`. A value of `0` means no spaces; a value of `1` adds one space after `{` and one space before `}`.

**Config:** `spaceInsideBraces` (default: `0`)

**With `spaceInsideBraces: 0` (default):**

```
>> scores = {"a" -> 1, "b" -> 2}
```

**With `spaceInsideBraces: 1`:**

```
>> scores = { "a" -> 1, "b" -> 2 }
```

---

### Normalize spacing inside brackets

Controls the number of spaces immediately inside `[` and `]`. A value of `0` means no spaces; a value of `1` adds one space after `[` and one space before `]`.

**Config:** `spaceInsideBrackets` (default: `0`)

**With `spaceInsideBrackets: 0` (default):**

```
>> items = [1, 2, 3]
```

**With `spaceInsideBrackets: 1`:**

```
>> items = [ 1, 2, 3 ]
```

---

### Normalize spacing inside parens

Controls the number of spaces immediately inside `(` and `)`. A value of `0` means no spaces; a value of `1` adds one space after `(` and one space before `)`.

**Config:** `spaceInsideParens` (default: `0`)

**With `spaceInsideParens: 0` (default):**

```
>> result = (x + 1) * 2
```

**With `spaceInsideParens: 1`:**

```
>> result = ( x + 1 ) * 2
```

---

### Normalize `>>` spacing

Ensures that the expression prefix `>>` is always followed by exactly one space.

**Always enabled** (no config option).

**Before:**

```
>>x = 1
>>    y = 2
```

**After:**

```
>> x = 1
>> y = 2
```

---

### Collapse runs of whitespace

Reduces multiple consecutive spaces in expressions and keyword values to a single space. Content inside string literals is never changed.

**Always enabled** (no config option).

**Before:**

```
>> x  =   y  +   1
*if: score   >   10
```

**After:**

```
>> x = y + 1
*if: score > 10
```

---

### Insert final newline

Ensures the file ends with a newline character. This is a common convention that avoids "no newline at end of file" warnings in diffs and other tools.

**Config:** `insertFinalNewline` (default: `true`)

## Default configuration

All formatter options live under the `format` key in your config file. Here are the defaults:

```js
// gtlint.config.js
export default {
  format: {
    insertFinalNewline: true,
    spaceAfterComma: true,
    spaceAroundArrow: true,
    spaceAroundOperators: true,
    spaceInsideBraces: 0,
    spaceInsideBrackets: 0,
    spaceInsideParens: 0,
    trimTrailingWhitespace: true,
  },
}
```

Set any boolean option to `false` to disable that behavior. The `spaceInside*` options accept a number specifying how many spaces to insert (use `0` for none).

For the full configuration file reference, see [Configuration](/configuration).

## Disabling formatting inline

You can disable the formatter for specific sections of code using inline directives:

```
-- @gtformat-disable
*question: This    section   is   not   formatted.
-- @gtformat-enable
```

Or disable both linting and formatting together:

```
-- @gt-disable
*question: This section is not linted or formatted.
-- @gt-enable
```

For the full list of directives, see [Directives](/directives).
