# GuidedTrack Language Specification

This document provides a concise technical specification of the GuidedTrack language for use by GTLint and for quick reference.

## Overview

GuidedTrack is a domain-specific language for creating interactive web applications, surveys, and forms. It features:
- Python-like indentation-based syntax (tabs only)
- Declarative keyword-based programming model
- Dynamic typing with runtime type checking
- Built-in support for surveys, forms, and user interactions

## File Extension

`.gt`

## Lexical Structure

### Comments

Single-line comments start with `--`:

```guidedtrack
-- This is a comment
```

### Whitespace & Indentation

- **Indentation**: Tabs only (no spaces)
- Indentation determines block structure (like Python)
- Blank lines are ignored
- Trailing whitespace is typically removed by formatters

### Keywords

Keywords start with `*` followed by the keyword name and a colon:

```guidedtrack
*if: condition
*while: condition
*question: What is your name?
```

**Primary Keywords** (44 total):
```
audio, button, chart, clear, component, database, email, events,
experiment, for, goto, group, header, html, if, image, label, list,
login, maintain, navigation, page, points, program, progress, purchase,
question, quit, randomize, repeat, return, service, set, settings,
share, summary, switch, trigger, video, wait, while
```

### Sub-Keywords

Sub-keywords are indented under parent keywords and also start with `*`:

```guidedtrack
*question: How old are you?
	*type: number
	*save: age
```

**Common Sub-Keywords** (45+ total):
```
after, answers, before, blank, body, cancel, caption, classes, click,
confirm, countdown, data, date, default, description, error, every,
everytime, frequency, hide, icon, identifier, management, max, method,
min, multiple, name, other, path, placeholder, required, reset, save,
searchable, send, shuffle, start, startup, status, subject, success,
tags, throwaway, time, tip, to, trendline, type, until, what, when,
with, xaxis, yaxis
```

**Note**: Sub-keywords vary by parent keyword. See `/gt.pdf` for complete list.

### Expressions

Variable assignments and computations start with `>>`:

```guidedtrack
>> x = 5
>> name = "Alice"
>> result = x + 10
```

### Operators

**Arithmetic**: `+`, `-`, `*`, `/`, `%`

**Comparison**: `=` (equals), `<`, `>`, `<=`, `>=`

**Logical**: `and`, `or`, `not`

**Membership**: `in`

**Note**: Assignment uses `=`, not `:=` or `==`. Equality comparison also uses `=`.

### Literals

**Numbers**:
```guidedtrack
>> x = 42
>> pi = 3.14159
```

**Strings** (double quotes only):
```guidedtrack
>> name = "Alice"
>> message = "Hello, world!"
```

**Collections** (arrays):
```guidedtrack
>> numbers = [1, 2, 3]
>> names = ["Alice", "Bob", "Charlie"]
```

**Associations** (objects/dictionaries):
```guidedtrack
>> person = { "name" -> "Alice", "age" -> 30 }
>> settings = {}
```

**Booleans**: No dedicated boolean literals. Three common patterns:
```guidedtrack
>> value = 1              -- true
>> value = 0              -- false
*set: value               -- sets value to true
>> value = "true".decode("JSON")   -- JSON boolean true
>> value = "false".decode("JSON")  -- JSON boolean false
```

### String Interpolation

Use `{variable}` syntax to embed expressions in text or strings:

```guidedtrack
Hello, {name}! You are {age} years old.

>> message = "The result is {x + y}"
```

### Identifiers

Variable and label names:
- Can contain letters, numbers, underscores
- Case-sensitive
- No enforced naming convention (can use camelCase, snake_case, etc.)

## Syntax Elements

### Text Content

Plain text without prefixes is displayed to the user:

```guidedtrack
Welcome to our survey!

This text will be shown on the page.
```

### Control Flow

**Conditional** (note: GuidedTrack has no `*else:` keyword - use multiple `*if:` statements):
```guidedtrack
*if: age >= 18
	You are an adult.
*if: age < 18
	You are a minor.
```

**Loops**:
```guidedtrack
*while: count < 10
	>> count = count + 1

*for: item in collection
	Process {item}

*repeat: 5
	This runs 5 times
```

### Labels & Goto

```guidedtrack
*label: start
	Some content here

*goto: start
```

### Questions

```guidedtrack
*question: What is your favorite color?
	*save: color
	Red
	Blue
	Green
```

Question types (via `*type:` sub-keyword):
- `text` - single line text input
- `paragraph` - multi-line text input
- `number` - numeric input
- `choice` - multiple choice (default)
- `checkbox` - multiple selection
- `slider` - numeric slider
- `calendar` - date/time picker
- `ranking` - rank order items

### Functions & Method Calls

**Method calls** (dot notation):
```guidedtrack
>> length = text.size
>> uppercase = text.uppercase
>> items.add("new item")
```

**Function calls** (namespace):
```guidedtrack
>> today = calendar::date
>> current_time = calendar::now
```

### Member Access

**Property access**:
```guidedtrack
>> item_type = variable.type
>> first_char = text[1]
```

**Collections** are 1-indexed:
```guidedtrack
>> numbers = [10, 20, 30]
>> first = numbers[1]  -- Gets 10
```

### Data Types

Runtime types accessible via `.type`:
- `"string"` - text
- `"number"` - numeric values
- `"collection"` - arrays
- `"association"` - objects/dictionaries
- `"datetime"` - date and time values
- `"duration"` - time durations (e.g., `5.seconds`, `2.minutes`)

### Built-in Methods

**String methods**:
```
.clean, .count(text), .decode(scheme), .encode(scheme), .find(text),
.lowercase, .size, .split(delimiter), .uppercase
```

**Number methods**:
```
.round, .round(decimals), .seconds, .minutes, .hours, .days, .weeks,
.months, .years
```

**Collection methods**:
```
.add(element), .combine(collection), .count(value), .erase(value),
.find(value), .insert(element, position), .max, .mean, .median, .min,
.remove(position), .shuffle, .size, .sort(direction), .unique
```

**Association methods**:
```
.encode(scheme), .erase(value), .keys, .remove(key)
```

**Any variable**:
```
.text, .type
```

### Common Patterns

**Variable cleanup**:
```guidedtrack
>> variable = ""  -- Clears variable
```

**Multiple choice with logic**:
```guidedtrack
*question: Do you agree?
	Yes
		>> agreed = "yes"
	No
		>> agreed = "no"
```

**Calling subprograms**:
```guidedtrack
*program: @username/program-name
```

**Events and triggers**:
```guidedtrack
*events
	myEvent
		>> x = x + 1

*trigger: myEvent
```

## Special Features

### Answer Options

Multiple choice questions can have indented blocks:

```guidedtrack
*question: Choose an option:
	Option A
		>> choice = "A"
	Option B
		>> choice = "B"
```

### Service Calls

HTTP requests to external APIs:

```guidedtrack
*service: MyAPI
	*path: /endpoint
	*method: POST
	*send: { "key" -> "value" }
	*success
		>> result = it
	*error
		>> error_msg = it
```

### Linter Directives

Control linting behavior with special comments:

```guidedtrack
-- gtlint-disable
-- gtlint-disable-next-line
-- gtlint-disable-line
-- gtlint-enable
```

## Formatting Conventions

1. **Indentation**: One tab per level
2. **Blank lines**: Typically one blank line between major sections
3. **Spacing**: Spaces around operators (configurable)
4. **String quotes**: Double quotes only
5. **Trailing whitespace**: Removed
6. **Final newline**: Usually included

## Example Program

```guidedtrack
-- Simple survey example
>> participant_name = ""
>> age = 0

*question: What is your name?
	*type: text
	*save: participant_name

*question: How old are you?
	*type: number
	*save: age

*if: age >= 18
	Thank you, {participant_name}! You are eligible to participate.
*if: age < 18
	Sorry, {participant_name}, you must be 18 or older.
	*quit

-- Continue with survey...
*button: Continue
```

## Common Misconceptions

**GuidedTrack does NOT have:**
- `*else:` or `*elseif:` keywords (use multiple `*if:` statements instead)
- `true` or `false` literals (use 1/0, `*set:`, or JSON decode)
- `==` for equality (use single `=` for both assignment and comparison)
- 0-indexed arrays (collections are 1-indexed)

**Important distinctions:**
- `*program:` is like a function call - it returns to the next line (unlike `*goto:`)
- Comments starting with `-- gtlint-*` are linter directives, not regular comments
- Variables from parent programs (via `@from-parent:`) are not visible to the linter

## Notes for Implementation

1. **Parsing challenges**:
   - Indentation tracking (INDENT/DEDENT tokens)
   - Distinguishing keywords from text content
   - String interpolation within text
   - Nested sub-keywords

2. **Type system**:
   - Dynamically typed
   - Type checking happens at runtime via `.type`
   - No type annotations

3. **Scoping**:
   - Variables appear to be globally scoped within a program
   - Subprograms can access/modify parent variables via `@to-child:` / `@from-child:`

4. **Error handling**:
   - Many keywords support `*success` and `*error` sub-keywords
   - No try/catch mechanism

5. **Concurrency**:
   - Events (`*trigger`) run asynchronously
   - Most operations are synchronous
