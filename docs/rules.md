# Rules

GTLint's linter checks GuidedTrack programs for errors and potential issues. It ships with 19 built-in rules that cover everything from syntax errors to unused variables.

## Severity Levels

Each rule has a severity that controls how it is reported:

| Severity | Config value | Behavior |
|----------|-------------|----------|
| Error | `"error"` | Reported as an error. Causes a non-zero exit code in the CLI. |
| Warning | `"warn"` | Reported as a warning. Does not fail linting. |
| Off | `"off"` | Rule is completely disabled. |

You can change severity levels in a [configuration file](/configuration) or suppress rules inline with [directives](/directives).

::: tip
Config files use **camelCase** rule names (e.g., `noUnusedVars`), while inline directives use **kebab-case** (e.g., `no-unused-vars`).
:::

## Rule Reference

### correctIndentation

**Default:** `"error"`

Detects incorrect indentation levels. In GuidedTrack, indentation is meaningful -- code nested under a keyword must be indented exactly one level deeper. This rule flags lines that are indented too much or too little relative to their context.

### gotoNeedsResetInEvents

**Default:** `"warn"`

Detects `*goto` used inside event handlers (such as `*trigger` blocks) where `*reset` should be used instead. In GuidedTrack, `*goto` inside an event handler can cause unexpected behavior because the event handler's scope is separate from the main program flow.

### indentStyle

**Default:** `"error"`

Detects spaces used instead of tabs for indentation. GuidedTrack requires tabs for indentation. This rule flags lines that use spaces at the start of a line for indentation purposes.

### noDuplicateLabels

**Default:** `"error"`

Detects duplicate `*label` names within the same program. Each label name must be unique so that `*goto` can unambiguously jump to the correct location.

### noEmptyBlocks

**Default:** `"error"`

Detects keyword blocks with no body. For example, an `*if` statement with nothing indented beneath it serves no purpose and is likely a mistake:

```
*if: condition
-- nothing here
```

### noInlineArgument

**Default:** `"error"`

Detects invalid inline arguments on keywords that do not accept them. Some GuidedTrack keywords take their argument on the same line (e.g., `*if: condition`), while others do not accept inline arguments. This rule flags cases where an argument is provided to a keyword that does not support one.

### noInvalidGoto

**Default:** `"error"`

Detects `*goto` statements that reference a label that does not exist in the program. This catches typos and references to labels that have been removed or renamed.

### noSingleQuotes

**Default:** `"error"`

Detects single quotes used around string literals. GuidedTrack requires double quotes for strings. Single-quoted strings will not be interpreted correctly.

### noUnclosedBracket

**Default:** `"error"`

Detects unclosed brackets, braces, or parentheses. An opening `(`, `[`, or `{` without a corresponding closing character will cause a parse error in GuidedTrack.

### noUnclosedString

**Default:** `"error"`

Detects string literals that are missing their closing double quote. An unclosed string will cause unexpected behavior as GuidedTrack interprets the rest of the line (or program) as part of the string.

### noUndefinedVars

**Default:** `"error"`

Detects variables that are used but never defined in the program. This catches typos in variable names and references to variables that were never assigned a value.

::: tip
If a variable is defined in a parent program, child program, or URL parameter, use the [`@from-parent`](/directives), [`@from-child`](/directives), or [`@from-url`](/directives) directives to tell GTLint about it.
:::

### noUnreachableCode

**Default:** `"warn"`

Detects code that can never execute. For example, code placed after a `*goto` or `*quit` statement at the same indentation level will never be reached because control flow has already jumped elsewhere or exited.

### noUnusedLabels

**Default:** `"warn"`

Detects `*label` definitions that are never referenced by any `*goto` statement in the program. Unused labels add clutter and may indicate dead code or a missing `*goto`.

### noUnusedVars

**Default:** `"warn"`

Detects variables that are defined (assigned a value) but never read anywhere in the program. Unused variables may indicate incomplete code or leftover artifacts from refactoring.

::: tip
If a variable is used in a child program, parent program, or CSV export, use the [`@to-child`](/directives), [`@to-parent`](/directives), or [`@to-csv`](/directives) directives to tell GTLint about it.
:::

### purchaseSubkeywordConstraints

**Default:** `"error"`

Detects invalid sub-keyword combinations on `*purchase` blocks. The `*purchase` keyword has specific constraints on which sub-keywords can appear together; this rule enforces those constraints.

### requiredSubkeywords

**Default:** `"error"`

Detects keywords that are missing their required sub-keywords. Some GuidedTrack keywords require certain sub-keywords to be present in their block. For example, a keyword might require a specific child keyword to function correctly.

### validKeyword

**Default:** `"error"`

Detects unrecognized `*keyword` names. If a line starts with `*` followed by a name that is not a valid GuidedTrack keyword, this rule flags it. This catches typos and made-up keyword names.

### validSubKeyword

**Default:** `"error"`

Detects invalid sub-keywords for a given parent keyword. Each GuidedTrack keyword accepts a specific set of sub-keywords; using a sub-keyword that is not valid for its parent keyword is flagged by this rule.

### validSubkeywordValue

**Default:** `"error"`

Detects invalid values for sub-keywords. Some sub-keywords only accept specific values (e.g., a boolean, a number within a range, or a value from a fixed set). This rule flags values that do not meet the sub-keyword's requirements.

## Configuring Rules

To change the severity of a rule, add a `lint` section to your `gtlint.config.js` file:

```js
export default {
  lint: {
    noUnusedVars: "off",
    noUnreachableCode: "error",
  },
}
```

You only need to list rules whose severity you want to change from the default. See [Configuration](/configuration) for the full reference.

To suppress a rule for a specific line or section of code, use [inline directives](/directives):

```
-- @gtlint-disable-next-line no-unused-vars
*set: temp = 42
```
