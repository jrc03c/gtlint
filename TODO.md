# TODO

Tasks and ideas for GTLint development.

## Bugs

- [ ] (Add bugs here)

## VSCode Extension

- [ ] Add snippets / autocompletions?

## Linter Rules

### Completed

- [x] `required-subkeywords` - validates required sub-keywords for `*chart:`, `*email`, `*service:`, `*database:`
- [x] `valid-subkeyword-value` - validates enum values (`*type:`, `*method:`) and yes/no values
- [x] `no-inline-argument` - validates that `*page`, `*html`, `*clear`, etc. have no inline arguments
- [x] `goto-needs-reset-in-events` - warns when `*goto:` inside `*events` lacks `*reset`
- [x] `purchase-subkeyword-constraints` - validates `*purchase` mutually exclusive sub-keywords

### Todo

- [ ] Add rule for `*goto:` target label must exist (strengthen `no-invalid-goto`)
- [ ] Add rule for detecting duplicate `*label:` definitions

## Formatter

- [ ] Add a formatter rule that allows setting the minimum number of blank lines around certain keywords. For example, right now the formatter forcibly adds a blank line _before_ `*program` (if one doesn't exist), but it doesn't add any new lines _after_ `*program`. It'd be nice (1) to be able to control the number of blank lines around asterisk keywords and (2) to have consistency about having blank lines both before and after asterisk keywords. (By the way, I'm open to other solutions besides adding a formatter rule, if you have any better ideas!)
- [ ] Update the above rule (governing blank lines before and after keyword blocks) to ignore comments. In other words, while it's usually the case that the formatter will enforce a certain number of blank lines before and after keyword blocks, it should _not_ enforce this for comments. (As usual, though, I'm open to push-back if you think there are good reasons _not_ to make this change, or if you have better ideas!)

## Documentation

- [ ] (Add documentation tasks here)

## Ideas / Future

- [ ] (Add ideas for future development here)
