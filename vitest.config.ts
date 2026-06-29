import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Our tests live in tests/ and src/**/__tests__/. Exclude submodules/ so we
    // don't try to run guidedtrack-web's own (non-gtlint) JS test files — we only
    // consume its .gt fixtures and keyword_definitions.rb, not its test suite.
    exclude: ['**/node_modules/**', '**/dist/**', '**/submodules/**'],
  },
});
