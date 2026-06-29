# Changelog

## 0.15.3

### Bug Fixes

- Count variables passed as arguments to `duration`, `datetime`, and `number` sub-keywords (e.g. a variable used in `*countdown`) as usages, so `no-unused-vars` no longer falsely flags them

## 0.15.2

### Bug Fixes

- Allow `*startup` as a valid sub-keyword of `*events` instead of incorrectly reporting that `*events` does not support sub-keywords

## 0.15.1

### Bug Fixes

- Add `*back` and `*menu` to sub-keyword token list so they are recognized under `*settings` instead of being flagged as invalid

## 0.15.0

### Bug Fixes

- Add `no-stray-colon` lint rule to detect invalid colons in expressions (e.g., `*if: 0 < 1:`)
