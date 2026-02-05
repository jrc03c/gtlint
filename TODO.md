# TODO

Tasks and ideas for GTLint development.

## Bugs

- [ ] (Add bugs here)

## VSCode Extension

- [ ] (Add VSCode extension issues here)

## Linter Rules

### Completed

- [x] `required-subkeywords` - validates required sub-keywords for `*chart:`, `*email`, `*service:`, `*database:`
- [x] `valid-subkeyword-value` - validates enum values (`*type:`, `*method:`) and yes/no values
- [x] `no-inline-argument` - validates that `*page`, `*html`, `*clear`, etc. have no inline arguments
- [x] `goto-needs-reset-in-events` - warns when `*goto:` inside `*events` lacks `*reset`
- [x] `purchase-subkeyword-constraints` - validates `*purchase` mutually exclusive sub-keywords

### Todo

- [ ] Add rule for `*image:`, `*audio:`, `*video:` requiring URL-like values
- [ ] Add rule for `*goto:` target label must exist (strengthen `no-invalid-goto`)
- [ ] Add rule for detecting duplicate `*label:` definitions

## Formatter

- [ ] (Add formatter issues here)

## Documentation

- [ ] (Add documentation tasks here)

## Ideas / Future

- [ ] (Add ideas for future development here)
