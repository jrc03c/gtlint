# Directives

Directives are special comments written directly in `.gt` files that override linter and formatter behavior on a per-line or per-region basis. They are useful when you need to suppress a warning that you know is safe, or preserve specific formatting that the formatter would otherwise change.

Every directive is a GuidedTrack comment (starts with `--`) followed by an `@`-prefixed instruction:

```
-- @gt-disable-next-line
```

GTLint supports three categories of directives:

- **Combined** (`@gt-*`) --- control both linting and formatting
- **Lint-only** (`@gtlint-*`) --- control linting only
- **Format-only** (`@gtformat-*`) --- control formatting only

::: tip
Directives give you fine-grained, per-file control. For project-wide settings, see [Configuration](/configuration).
:::

## Combined Directives {#combined}

These directives affect **both** the linter and the formatter at the same time.

### `@gt-disable` / `@gt-enable`

Disable all linting and formatting from the directive line until `@gt-enable` or the end of the file.

```
-- @gt-disable
*html
	<div style="margin:0;padding:0">
		<p>{user_name}</p>
	</div>
-- @gt-enable
```

### `@gt-disable-next-line`

Disable all linting and formatting for the next line only.

```
-- @gt-disable-next-line
>> temp =   42
```

### `@gt-disable-next-line` with rule list

Disable specific lint rules (and formatting) for the next line only. Rules are listed after the directive name, separated by commas.

```
-- @gt-disable-next-line no-unused-vars
>> temp_value = 42
```

```
-- @gt-disable-next-line no-unused-vars, no-undefined-vars
>> result = external_api_value
```

## Lint-Only Directives {#lint}

These directives affect **only** the linter. The formatter continues to run normally.

### `@gtlint-disable` / `@gtlint-enable`

Disable all lint rules from the directive line until `@gtlint-enable` or the end of the file.

```
-- @gtlint-disable
>> x = some_external_value + 1
>> y = another_external_value + 2
-- @gtlint-enable
```

### `@gtlint-disable` with rule list

Disable specific lint rules only. Other rules remain active.

```
-- @gtlint-disable no-undefined-vars
>> score = participant_score * 2
>> rank = participant_rank
-- @gtlint-enable no-undefined-vars
```

You can disable multiple rules at once:

```
-- @gtlint-disable no-undefined-vars, no-unused-vars
>> temp = external_input
-- @gtlint-enable
```

### `@gtlint-enable` with rule list

Re-enable specific lint rules without re-enabling all of them.

```
-- @gtlint-disable no-undefined-vars, no-unused-vars

>> temp = external_input
>> result = temp + 1

-- @gtlint-enable no-undefined-vars
-- The no-undefined-vars rule is active again, but no-unused-vars is still disabled
>> value = result + other_var
```

### `@gtlint-disable-next-line`

Disable all lint rules for the next line only.

```
-- @gtlint-disable-next-line
>> x = some_untracked_value
```

### `@gtlint-disable-next-line` with rule list

Disable specific lint rules for the next line only.

```
-- @gtlint-disable-next-line no-unused-vars
>> temp_value = 42

-- @gtlint-disable-next-line no-undefined-vars, no-unused-vars
>> snapshot = external_state
```

## Format-Only Directives {#format}

These directives affect **only** the formatter. The linter continues to run normally.

### `@gtformat-disable` / `@gtformat-enable`

Disable formatting from the directive line until `@gtformat-enable` or the end of the file. This is useful when you have intentional spacing or alignment that the formatter would change.

```
-- @gtformat-disable
*question: Rate the following:
	Strongly disagree
	Disagree
	Neutral
	Agree
	Strongly agree
-- @gtformat-enable
```

::: info
Format-only directives do not accept rule lists, since formatting is not rule-based.
:::

## Variable Tracking Directives {#variables}

GuidedTrack programs often run as part of a larger system --- a parent program may call child programs, and variables can flow between them or arrive via URL query strings. Because the linter analyzes each file independently, it cannot see variables defined elsewhere.

Variable tracking directives tell the linter about these external variables so it does not report false positives.

### `@from-parent`

Declare variables that are defined in a parent program and available in this (child) program. Suppresses `no-undefined-vars` warnings for the listed variables.

```
-- @from-parent: user_name, user_age
>> greeting = "Hello, {user_name}! You are {user_age} years old."
```

The linter will warn if a variable listed in `@from-parent` is never actually used in the file, or if its value is overwritten before being read.

### `@from-url`

Declare variables that arrive via URL query string parameters. Works exactly like `@from-parent` --- suppresses `no-undefined-vars` and warns if a listed variable is never used or overwritten before being read.

```
-- @from-url: source, campaign_id
*if: source = "email"
	>> tracking_label = campaign_id
```

### `@from-child`

Declare variables that are set by a child program and available after it returns. Suppresses `no-undefined-vars` warnings for the listed variables.

```
*program: @team/calculate-score

-- @from-child: final_score
*if: final_score > 80
	Congratulations, you passed!
```

The linter will warn if a variable listed in `@from-child` is never used in the file.

### `@to-parent`

Declare variables that will be consumed by the parent program after this child program finishes. Suppresses `no-unused-vars` warnings for the listed variables.

```
-- @to-parent: final_score
>> final_score = correct_answers / total_questions * 100
```

### `@to-child`

Declare variables that will be consumed by a child program called from this file. Suppresses `no-unused-vars` warnings for the listed variables.

```
-- @to-child: difficulty_level, max_attempts
>> difficulty_level = "hard"
>> max_attempts = 3
*program: @team/quiz-module
```

### `@to-csv`

Declare variables whose values are collected in the root program's CSV export. Works exactly like `@to-parent` --- suppresses `no-unused-vars` warnings.

```
-- @to-csv: participant_id, completion_time, total_score
>> participant_id = id
>> completion_time = calendar::now
>> total_score = section_a + section_b
```

## Rule Name Format

Directive rule names always use **kebab-case** (e.g., `no-unused-vars`, `no-undefined-vars`). This applies even though [configuration files](/configuration) use camelCase for rule names.

```
-- Correct:
-- @gtlint-disable-next-line no-unused-vars

-- Incorrect (will not work):
-- @gtlint-disable-next-line noUnusedVars
```

## Placement

Directives must be on their own line. They are standard GuidedTrack comments, so they can appear at any indentation level:

```
*question: What is your name?
	*type: text
	-- @gtlint-disable-next-line no-unused-vars
	*save: user_response
```

Variable tracking directives (`@from-parent`, `@to-child`, etc.) are typically placed at the top of the file, before any program logic:

```
-- @from-parent: user_name, user_age
-- @to-parent: survey_complete

*question: {user_name}, how are you feeling today?
	Great
	Okay
	Not great

>> survey_complete = 1
```
