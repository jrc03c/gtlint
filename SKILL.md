# GuidedTrack Programming Skill

You are an expert GuidedTrack programmer. GuidedTrack is a domain-specific language for creating interactive web applications, surveys, experiments, and forms. It runs in the browser via [guidedtrack.com](https://guidedtrack.com).

Use this reference to write correct, idiomatic GuidedTrack code.

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

## Questions

```
*question: What is your favorite color?
	*type: choice
	*save: color
	Red
	Blue
	Green
```

### Question Types

Set via `*type:` sub-keyword:

| Type | Description |
|------|-------------|
| `text` | Single-line text input |
| `paragraph` | Multi-line text input |
| `number` | Numeric input |
| `choice` | Multiple choice (default) |
| `checkbox` | Multiple selection |
| `slider` | Numeric slider |
| `calendar` | Date/time picker |
| `ranking` | Rank order items |

### Sub-Keywords for Questions

All sub-keywords are optional:

- `*type: text|paragraph|number|choice|checkbox|slider|calendar|ranking` -- question type (default: choice)
- `*save: text` -- variable name to save the response to
- `*tip: text` -- hint text displayed under the question
- `*placeholder: text` -- placeholder text in the input field
- `*before: text` -- text displayed to the left of the input box
- `*after: text` -- text displayed to the right of the input box
- `*default: expression` -- default or pre-selected answer(s)
- `*answers: collection` -- answer options from a collection variable
- `*blank` -- allow skipping the question (no value)
- `*required` -- require an answer (no value)
- `*confirm` -- require clicking Next after selection (no value)
- `*multiple` -- allow multiple text answers (no value)
- `*other` -- allow a free-text "other" option (no value)
- `*shuffle` -- randomize answer order (no value)
- `*searchable` -- enable type-ahead search for answers (no value)
- `*throwaway` -- exclude from CSV data (no value)
- `*countdown: duration` -- time limit for answering (e.g., `30.seconds`)
- `*tags: text` -- tags for grouping questions
- `*min: number` -- minimum value (for slider type)
- `*max: number` -- maximum value (for slider type)
- `*time: yes/no` -- allow time selection (for calendar type)
- `*date: yes/no` -- allow date selection (for calendar type)
- `*icon: text` -- Font Awesome icon class for answer options
- `*image: url` -- image for answer options
- `*classes: text` -- CSS class names to apply

Example with several sub-keywords:

```
*question: Enter your email:
	*type: text
	*save: email
	*placeholder: you@example.com
	*tip: We will never share your email.
	*blank
	*before: Email:
```

### Answer Options with Logic

```
*question: Do you agree?
	Yes
		>> agreed = 1
		Thank you for agreeing!
	No
		>> agreed = 0
	I'm not sure
		>> agreed = 0
		>> unsure = 1
```

### Dynamic Answers

```
>> options = ["Red", "Blue", "Green"]
*question: Pick a color:
	*answers: options
	*save: chosen_color
```

## Pages and Navigation

```
*page
	Content on page one.
	*button: Next

*page
	Content on page two.
	*button: Finish
```

A `*button:` creates a clickable button that advances past the current content.

## Subprograms

`*program:` calls a subprogram and **returns** when it finishes (like a function call):

```
*program: My Subprogram Name
*program: @username/program-name
```

Variables are globally scoped within a program. Subprograms can share variables with parent programs.

## Services (HTTP Requests)

### `*service: service-name`

Makes an HTTP request to an external API. Argument (required): service name. Body (required).

The service name and base URL are configured in the program's settings on the GuidedTrack website (not visible in source code).

```
*service: MyAPI
	*method: GET
	*path: /users/{user_id}
	*success
		>> result = it
	*error
		>> error_msg = it
```

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

Sub-keywords:
- `*path: text` -- path appended to the service base URL (**required**)
- `*method: GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|CONNECT|TRACE` -- HTTP method (**required**)
- `*success` -- code block to run on success; response data available in `it` (**required**, body required)
- `*error` -- code block to run on error; error data available in `it` (**required**, body required)
- `*send: association` -- data to send in the request body (optional)

## Email

```
*email
	*to: {email_address}
	*subject: Welcome!
	*body
		Thank you for signing up, {name}!
```

Sub-keywords:
- `*subject: text` -- email subject line (**required**)
- `*body` -- email body content block (**required**, body required)
- `*to: text` -- recipient email address (optional; defaults to logged-in user)
- `*when: datetime` -- schedule when to send the email
- `*every: duration` -- frequency for recurring emails (e.g., `7.days`)
- `*until: datetime` -- when to stop recurring emails
- `*identifier: text` -- name for identifying scheduled/recurring emails
- `*cancel: text` -- cancel scheduled emails matching this identifier

## Events and Triggers

### `*events`

Defines named events that can be triggered. No argument. Body (required).

```
*events
	myEvent
		>> x = x + 1
	anotherEvent
		>> y = y + 1
	*startup
		>> initialized = 1
```

Sub-keywords:
- `*startup` -- special event that runs when the program loads (body required)

Events are defined as named text lines inside the `*events` body, each with an indented code block.

### `*trigger: event-name`

Triggers an event by name. Argument (required): event name.

```
*trigger: myEvent
*trigger: myEvent
	*send: {"data" -> someValue}
```

Sub-keywords:
- `*send: association` -- data to send to the event handler

**Important:** If using `*goto:` inside an event handler, include `*reset` to reset the navigation stack.

## Randomization and Experiments

### `*randomize`

Randomly selects blocks of code to run. Argument (optional): number of groups to select, or omit to select one. Body (required).

```
*randomize
	*group: optionA
		>> selected = "A"
	*group: optionB
		>> selected = "B"
```

Sub-keywords:
- `*group: text` -- name for a randomization group (body required)
- `*name: text` -- name for the randomized selection (for data tracking)
- `*everytime` -- re-randomize every time the user passes this point (default: remembers first selection)

### `*experiment: name`

Defines an experiment with permanent group assignment. Argument (required): experiment name. Body (required).

```
*experiment: My Experiment
	*group: control
		-- control condition
	*group: treatment
		-- treatment condition
```

Sub-keywords:
- `*group: text` -- name for an experiment group (body required)

Unlike `*randomize`, `*experiment` permanently assigns users to groups.

### `*group: name`

Defines a block of code used inside `*randomize` or `*experiment`. Argument (optional): group name. Body (required).

## HTML Embedding

```
*html
	<div class="container">
		<p>Hello, {name}!</p>
	</div>
```

The body of `*html` blocks is raw HTML, not GuidedTrack. String interpolation with `{variable}` still works inside HTML blocks.

## Media Keywords

### `*image: url`

Inserts an image. Argument (required): URL of the image.

```
*image: https://example.com/photo.jpg
	*caption: A beautiful sunset
	*description: Alt text if image fails to load
```

Sub-keywords:
- `*caption: text` -- description displayed beneath the image
- `*description: text` -- alt text if the image fails to load

### `*audio: url`

Embeds an audio file. Argument (required): URL of the audio file.

```
*audio: https://example.com/sound.mp3
	*start: yes
	*hide: no
```

Sub-keywords:
- `*start: yes/no` -- whether the audio auto-plays (default: no)
- `*hide: yes/no` -- whether player controls are hidden (default: yes)

### `*video: url`

Embeds a YouTube video. Argument (required): YouTube URL. No sub-keywords.

```
*video: https://youtube.com/watch?v=abc123
```

## UI Keywords

### `*button: text`

Displays a clickable button. Argument (required): button label text. No sub-keywords.

```
*button: Continue
```

### `*header: text`

Displays a header. Argument (required): header text. No sub-keywords.

```
*header: Welcome to our survey!
```

### `*progress: percent`

Displays a progress bar. Argument (required): percentage value. No sub-keywords.

```
*progress: 50%
```

### `*list`

Creates a bulleted list. Body (required): list items as indented lines.

```
*list
	First item
	Second item
	Third item

*list: ordered
	Step one
	Step two

*list: expandable
	Expandable item one
	Expandable item two
```

Argument (optional): `ordered` or `expandable`

### `*maintain: text`

Keeps text in a persistent gray box at the top of the page. Argument (required): text to display. No sub-keywords.

```
*maintain: Remember: you chose {color}!
```

### `*clear`

Clears text kept on the page by `*maintain`. No argument. No sub-keywords.

### `*share`

Inserts a Facebook share button. No argument. No sub-keywords.

### `*chart: title`

Displays a chart. Argument (required): chart title. Body (required).

```
*chart: My Results
	*type: bar
	*data: chart_data
	*xaxis
		*min: 0
		*max: 100
	*yaxis
		*min: 0
		*max: 50
	*trendline
```

Sub-keywords:
- `*type: bar|line|scatter` -- chart type (**required**)
- `*data: collection` -- data to display, collection of collections (**required**)
- `*xaxis` -- x-axis configuration block (contains `*min:` and `*max:`)
- `*yaxis` -- y-axis configuration block (contains `*min:` and `*max:`)
- `*min: number` -- minimum value for axis (used inside `*xaxis`/`*yaxis`)
- `*max: number` -- maximum value for axis (used inside `*xaxis`/`*yaxis`)
- `*trendline` -- draws a trend-line (scatter charts)

### `*component`

Displays a bordered content box. No argument. Body (required).

```
*component
	*header: Important Notice
	*classes: my-custom-class
	This content appears inside a bordered box.
	*click
		>> clicked = 1
```

Sub-keywords:
- `*header: text` -- header text for the component
- `*classes: text` -- CSS class names to apply
- `*click` -- code block to run when component is clicked (body required)
- `*with: expression` -- local variable for click handler context

### `*navigation`

Creates a navigation bar. No argument. Body (required).

```
*navigation
	*name: Main Menu
	Home
		*icon: fa-home
	Settings
		*icon: fa-cog
```

Sub-keywords:
- `*name: text` -- name for the navbar
- `*icon: text` -- Font Awesome icon class

### `*page`

Creates a page of content. No argument. Body (required). No sub-keywords.

```
*page
	Page content here.
	*button: Next
```

## Variable Keywords

### `*set: variable`

Sets a variable's value to true. Argument (required): variable name. No sub-keywords.

```
*set: isActive
```

## Settings

### `*settings`

Applies settings to the program. No argument. Body (required).

```
*settings
	*back: yes
	*menu: no
```

Sub-keywords:
- `*back: yes/no` -- enable/disable back navigation
- `*menu: yes/no` -- show/hide the run menu

## User Keywords

### `*login`

Prompts the user to log in. No argument.

```
*login
	*required: yes
```

Sub-keywords:
- `*required: yes/no` -- whether login is required

### `*database: name`

Requests user info from the GuidedTrack database. Argument (required): database name. Body (required).

```
*database: MyDB
	*what: email
	*success
		>> user_email = it
	*error
		>> db_error = it
```

Sub-keywords:
- `*what: email` -- type of data to request (**required**)
- `*success` -- code block to run on success; data available in `it` (**required**)
- `*error` -- code block to run on error; error available in `it` (**required**)

## Scoring Keywords

### `*points: number`

Gives or takes points from user scores. Argument (required): number (can include optional tag).

```
*points: 5
*points: -2
```

### `*summary`

Summarizes user responses. Argument (optional): tag name to filter by. No sub-keywords.

```
*summary
*summary: quiz_results
```

## Purchase Keywords

### `*purchase`

Processes in-app purchases. Argument (optional): text. Has complex sub-keyword constraints.

```
-- Check subscription status:
*purchase
	*status
	*success
		>> sub_status = it
	*error
		>> purchase_error = it

-- Create a subscription:
*purchase: Premium Plan
	*frequency: recurring
	*success
		>> purchase_result = it
	*error
		>> purchase_error = it

-- Open subscription management:
*purchase
	*management
```

Sub-keywords:
- `*status` -- check subscription status (no value)
- `*frequency: recurring` -- generate a subscription
- `*management` -- open subscription management (no value)
- `*success` -- code block to run on success
- `*error` -- code block to run on error

**Constraints:**
- `*status`, `*frequency`, and `*management` are **mutually exclusive** -- use only one per `*purchase` block
- If `*status` or `*frequency` is used, then `*success` and `*error` are **required**

## Program Flow Keywords

### `*switch: program-name`

Switches to another program (pauses the current one). Argument (required): program name.

```
*switch: Other Program
	*reset
```

Sub-keywords:
- `*reset` -- restart target program from the beginning

## Built-in Methods

### String Methods

```
>> len = text.size
>> upper = text.uppercase
>> lower = text.lowercase
>> cleaned = text.clean          -- trims whitespace
>> parts = text.split(",")
>> pos = text.find("needle")
>> n = text.count("a")
>> encoded = text.encode("URL")
>> decoded = text.decode("JSON")
```

### Number Methods

```
>> rounded = num.round
>> rounded2 = num.round(2)
>> dur = 5.seconds     -- also: .minutes, .hours, .days, .weeks, .months, .years
```

### Collection Methods

```
>> items.add("new")
>> items.insert("new", 2)       -- insert at position 2
>> items.remove(1)               -- remove by position
>> items.erase("value")          -- remove by value
>> combined = a.combine(b)
>> items.shuffle
>> sorted = items.sort("asc")   -- or "desc"
>> unique = items.unique
>> len = items.size
>> max_val = items.max
>> min_val = items.min
>> avg = items.mean
>> med = items.median
>> count = items.count("value")
>> pos = items.find("value")
```

### Association Methods

```
>> all_keys = obj.keys
>> obj.erase("value")
>> obj.remove("key")
>> json = obj.encode("JSON")
```

### Universal Methods

```
>> t = variable.type   -- returns "string", "number", "collection", "association", "datetime", "duration"
>> s = variable.text   -- string representation
```

## Namespaced Functions

```
>> today = calendar::date
>> now = calendar::now
```

## Common Patterns

### Variable Initialization

```
>> errors = 0
>> response = {}
>> name = ""
```

### Variable Cleanup (end of program/section)

Clear variables to avoid polluting parent scope:

```
>> errors = ""
>> response = ""
>> name = ""
```

### Boolean Checks

```
-- Check if variable is truthy:
*if: myVar
	-- runs if myVar is truthy (non-zero, non-empty, defined)

-- Check if variable is falsy/undefined:
*if: not myVar
	-- runs if myVar is falsy or undefined
```

### Type Checking

```
*if: not (a.type = "string")
	-- handle wrong type
```

### Membership Testing

```
*if: "key" in myAssociation
	>> value = myAssociation["key"]

*if: item in myCollection
	-- item is in the collection
```

### Building HTML Strings

```
>> html = ""
>> html = "{html}<div>"
>> html = "{html}<p>Hello, {name}!</p>"
>> html = "{html}</div>"
```

### Error Handling Pattern

```
>> errors = 0
>> response = {}

*service: MyAPI
	*method: GET
	*path: /data
	*success
		>> response = it
		*if: "errors" in it
			>> errors = 1
	*error
		>> response = it
		>> errors = 1

*if: errors = 1
	Something went wrong. Please try again later.
	*button: Done
	*goto: EndLabel
```

### Input Validation Pattern

```
*if: not inputVar
	-- handle missing input
	*goto: CleanUpLabel

*if: not (inputVar.type = "string")
	-- handle wrong type
	*goto: CleanUpLabel
```

### Subprogram Pattern with Inputs/Outputs

The parent program sets variables before calling, and reads variables after:

```
-- Parent program:
>> email_address = "user@example.com"
>> payload = {"key" -> "value"}
*program: @username/my-subprogram
-- After return, read outputs:
>> result = subprogram_output
```

### Page Break Pattern (Invisible Question)

Force a page break without visible UI:

```
*question: {""}
	*countdown: .1.seconds
	*classes: hidden
```

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

## Style Conventions

- Use section dividers for readability:
  ```
  --------------------------------------------------------------------------------
  -- Section Name
  --------------------------------------------------------------------------------
  ```
- Document service details, inputs, and outputs in header comments.
- Clean up all local variables at the end of a program (set to `""`).
- Use descriptive label names (e.g., `CleanUpLabel`, `ErrorReportLabel`).
- Use `snake_case` or `camelCase` for variables (both are acceptable; be consistent within a program).
- Add `*wait: 0.seconds` inside long-running loops to yield execution and prevent browser lockup.
