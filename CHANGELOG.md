# Changelog

## 0.15.5

### Bug Fixes

- Allow `*classes` under every content-node keyword. The compiler grants `Classes` to all 38 such keywords through `ContentNode#optional_attributes` (only `*login` and `*points` opt out, and `*events` isn't a content node), but the linter recognized it under just `*component` and `*question`. `*classes` under `*header`, `*button`, `*image`, control-flow blocks, and the rest no longer reports a false error

## 0.15.4

### Internal

- Retarget the integration-test and keyword-audit submodule from the archived standalone `gt-lib` gem (last updated 2023) to `guidedtrack-web/compiler`, the canonical and actively-maintained GuidedTrack reference implementation. The fixture corpus grows from 162 to 167 programs, and the keyword audit now reconciles against the live `keyword_definitions.rb` (adds `placeholder`/`searchable`, drops the removed `history`). No user-facing behavior changes. Renamed `gt-lib-fixtures.test.ts` to `compiler-fixtures.test.ts` and added a `vitest.config.ts` that excludes the submodule from test discovery.

## 0.15.3

### Bug Fixes

- Parse `duration`, `datetime`, and `number` sub-keyword arguments as expressions instead of literal text. A variable used in such a sub-keyword (e.g. `*countdown: timeout`) is now recognized as a real reference: `no-unused-vars` no longer falsely flags it as unused, and `no-undefined-vars` correctly tracks it

## 0.15.2

### Bug Fixes

- Allow `*startup` as a valid sub-keyword of `*events` instead of incorrectly reporting that `*events` does not support sub-keywords

## 0.15.1

### Bug Fixes

- Add `*back` and `*menu` to sub-keyword token list so they are recognized under `*settings` instead of being flagged as invalid

## 0.15.0

### Bug Fixes

- Add `no-stray-colon` lint rule to detect invalid colons in expressions (e.g., `*if: 0 < 1:`)
