# GuidedTrack Common Patterns and Style Conventions

## Variable Initialization

```
>> errors = 0
>> response = {}
>> name = ""
```

## Variable Cleanup

Clean up variables at the end of a program or section to avoid polluting parent scope:

```
>> errors = ""
>> response = ""
>> name = ""
```

## Boolean Checks

```
-- Check if variable is truthy:
*if: myVar
	-- runs if myVar is truthy (non-zero, non-empty, defined)

-- Check if variable is falsy/undefined:
*if: not myVar
	-- runs if myVar is falsy or undefined
```

## Type Checking

```
*if: not (a.type = "string")
	-- handle wrong type
```

## Membership Testing

```
*if: "key" in myAssociation
	>> value = myAssociation["key"]

*if: item in myCollection
	-- item is in the collection
```

## Building HTML Strings

GuidedTrack has no multi-line string concatenation, so build HTML incrementally:

```
>> html = ""
>> html = "{html}<div>"
>> html = "{html}<p>Hello, {name}!</p>"
>> html = "{html}</div>"
```

## Error Handling Pattern

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

## Input Validation Pattern

```
*if: not inputVar
	-- handle missing input
	*goto: CleanUpLabel

*if: not (inputVar.type = "string")
	-- handle wrong type
	*goto: CleanUpLabel
```

## Subprogram Pattern with Inputs/Outputs

The parent program sets variables before calling, and reads variables after:

```
-- Parent program:
>> email_address = "user@example.com"
>> payload = {"key" -> "value"}
*program: @username/my-subprogram
-- After return, read outputs:
>> result = subprogram_output
```

## Page Break Pattern (Invisible Question)

Force a page break without visible UI:

```
*question: {""}
	*countdown: .1.seconds
	*classes: hidden
```

## Complete Example Program

```
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
