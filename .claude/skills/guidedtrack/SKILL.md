---
name: guidedtrack
description: GuidedTrack language reference for writing .gt programs. Use when writing, editing, or debugging GuidedTrack code.
---

# GuidedTrack Programming Skill

You are an expert GuidedTrack programmer. GuidedTrack is a domain-specific language for creating interactive web applications, surveys, experiments, and forms. It runs in the browser via [guidedtrack.com](https://guidedtrack.com).

**Additional reference files** (read as needed):
- [keywords.md](keywords.md) -- Complete keyword reference with all sub-keywords and constraints
- [methods.md](methods.md) -- Built-in methods, namespaced functions, and member access
- [patterns.md](patterns.md) -- Common patterns, examples, and style conventions

## File Extension

`.gt`

## Syntax Fundamentals

### Indentation

GuidedTrack uses **tabs only** for indentation (like Python, but tabs not spaces). Indentation determines block structure.

### Comments

```
-- This is a comment
```

### Keywords

Keywords start with `*` and a colon. They are the primary building blocks:

```
*question: What is your name?
*if: age >= 18
*button: Continue
```

### Sub-Keywords

Sub-keywords are indented under parent keywords:

```
*question: How old are you?
	*type: number
	*save: age
```

### Expressions

Variable assignments and computations start with `>>`:

```
>> x = 5
>> name = "Alice"
>> result = x + 10
```

### Plain Text

Lines without a prefix are displayed to the user:

```
Welcome to our survey!
This text will appear on the page.
```

## Data Types and Literals

### Numbers

```
>> x = 42
>> pi = 3.14159
```

### Strings (double quotes only)

```
>> name = "Alice"
>> message = "Hello, world!"
```

### Collections (arrays, 1-indexed)

```
>> numbers = [1, 2, 3]
>> first = numbers[1]  -- Gets 1, NOT 0-indexed
```

### Associations (objects/dictionaries)

```
>> person = {"name" -> "Alice", "age" -> 30}
>> settings = {}
```

### Booleans

There are **no `true`/`false` literals**. Use these patterns:

```
>> value = 1              -- truthy
>> value = 0              -- falsy
*set: value               -- sets to true
>> value = "true".decode("JSON")   -- JSON boolean true
>> value = "false".decode("JSON")  -- JSON boolean false
```

## Operators

**Arithmetic:** `+`, `-`, `*`, `/`, `%`

**Comparison:** `=` (equals), `<`, `>`, `<=`, `>=`

**Logical:** `and`, `or`, `not`

**Membership:** `in`

**Important:** `=` is used for both assignment and equality comparison. There is no `==`.

## String Interpolation

Embed variables and expressions in text or strings with `{variable}`:

```
Hello, {name}! You are {age} years old.
>> message = "The result is {x + y}"
```

## Text Formatting

Bold and italic formatting works in visible text contexts only:

```
*Welcome!* to our program.     -- bold
/This is italicized!/ regular. -- italic
```

Formatting does NOT apply in URLs, paths, labels, or technical keyword values.

## Control Flow

### Conditionals

**There is no `*else:` or `*elseif:` keyword.** Use multiple `*if:` statements:

```
*if: age >= 18
	You are an adult.
*if: age < 18
	You are a minor.
```

### Loops

```
*while: count < 10
	>> count = count + 1

*for: item in collection
	Process {item}

*for: index, value in collection
	Item {index} is {value}

*repeat: 5
	This runs 5 times
```

### Labels and Goto

`*label: name` declares a named location. `*goto: name` jumps to it.

```
*label: StartLabel
	Some content here

*goto: StartLabel
```

`*goto:` jumps to the label and does NOT return. It is different from `*program:` which does return.

`*goto:` sub-keywords:
- `*reset` -- resets the navigation stack (required when using `*goto:` inside `*events` blocks)

### Wait

```
*wait: 5.seconds
*wait: 0.seconds  -- yields execution briefly (useful in long loops)
```

### Quit and Return

```
*quit    -- ends the entire program
*return  -- ends the current subprogram and returns to parent
```

## Questions (Quick Reference)

```
*question: What is your favorite color?
	*type: choice
	*save: color
	Red
	Blue
	Green
```

Question types: `text`, `paragraph`, `number`, `choice` (default), `checkbox`, `slider`, `calendar`, `ranking`

Answer options can have indented logic blocks:

```
*question: Do you agree?
	Yes
		>> agreed = 1
	No
		>> agreed = 0
```

For the full list of question sub-keywords, see [keywords.md](keywords.md).

## Subprograms

`*program:` calls a subprogram and **returns** when it finishes (like a function call):

```
*program: My Subprogram Name
*program: @username/program-name
```

Variables are globally scoped within a program. Subprograms can share variables with parent programs.

## Services (Quick Reference)

```
*service: MyAPI
	*method: POST
	*path: /endpoint
	*send: {"key" -> "value"}
	*success
		>> result = it
	*error
		>> error_msg = it
```

Required sub-keywords: `*path:`, `*method:`, `*success`, `*error`. The `it` variable holds the response. For full details, see [keywords.md](keywords.md).

## Critical Pitfalls

1. **No `*else:`** -- GuidedTrack has NO else keyword. Use separate `*if:` statements.
2. **No `true`/`false` literals** -- Use `1`/`0`, `*set:`, or `"true".decode("JSON")`.
3. **No `==`** -- Use `=` for both assignment and comparison.
4. **1-indexed collections** -- `items[1]` is the first element, not `items[0]`.
5. **Tabs only** -- Never use spaces for indentation.
6. **`*goto:` does not return** -- Use `*program:` for function-call semantics.
7. **`*goto:` in events needs `*reset`** -- Always include `*reset` when using `*goto:` inside `*events` blocks.
8. **Global scope** -- Variables are globally scoped within a program. Clean up at the end.
9. **No try/catch** -- Use `*success`/`*error` sub-keywords on `*service:`, `*database:`, etc.
10. **Double quotes only** -- Single quotes are not valid string delimiters.
