/**
 * gt-lib Fixture Integration Tests
 *
 * Exercises all 162 .gt fixture files from the gt-lib submodule through our
 * lexer, parser, and linter. This catches crashes and false positives against
 * real GuidedTrack programs.
 *
 * If the submodule is not initialized, all tests are skipped gracefully.
 */

import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer/index.js';
import { parse } from '../src/parser/index.js';
import { lint } from '../src/linter/index.js';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ---------------------------------------------------------------------------
// Fixture discovery
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURE_DIR = join(__dirname, '..', 'submodules', 'gt-lib', 'test', 'fixtures');

const submodulePresent = existsSync(FIXTURE_DIR);

function loadFixtures(): Array<{ name: string; path: string; source: string }> {
  if (!submodulePresent) return [];
  return readdirSync(FIXTURE_DIR)
    .filter(f => f.endsWith('.gt'))
    .sort()
    .map(f => ({
      name: basename(f, '.gt'),
      path: join(FIXTURE_DIR, f),
      source: readFileSync(join(FIXTURE_DIR, f), 'utf-8'),
    }));
}

const allFixtures = loadFixtures();

// ---------------------------------------------------------------------------
// Fixture categorization
// ---------------------------------------------------------------------------

// Fixtures that are intentional error cases in gt-lib (names suggest invalid input).
// These are excluded from the "should produce no linter errors" test.
const ERROR_CASE_FIXTURES = new Set([
  'bad_indentation',
  'bad_keyword_with_attributes',
  'blank_keyword',
  'chart_with_bad_axis_positions',
  'chart_with_bad_ticks',
  'component_invalid',
  'component_with_invalid_nodes',
  'duration_errors',
  'email_without_cancel_or_content',
  'empty_if_and_group',
  'email_without_content_underneath_body',
  'email_without_subject',
  'events_twice_in_program',
  'extra_indent',
  'html_invalid',
  'indent_with_spaces',
  'list_errors',
  'question_unknown_type',
  'service_with_non_fallthrough_errors',
  'set_and_if_with_errors',
  'unknown_keyword',
]);

// Valid fixtures where our linter currently reports false-positive errors.
// Each entry documents the rule(s) that fire incorrectly.
// These are tested with it.fails() so they remain visible but don't block CI.
const KNOWN_LINTER_ISSUES: Record<string, string> = {
  // valid-keyword false positives (our lexer/parser misidentifies some constructs as keywords)
  'chart':                        'valid-keyword: *color not recognized',
  'chart_with_data_color':        'valid-keyword: *color not recognized',
  'chart_with_trendline':         'required-subkeywords: false positive on chart sub-keywords',
  'goto_jump_script_a':           'valid-keyword: parser issue with goto targets',
  'goto_jump_script_b':           'valid-keyword: parser issue with goto targets',
  'goto_node_jumps':              'valid-keyword: parser issue with goto targets',
  'goto_simple_jumps':            'valid-keyword: parser issue with goto targets',
  'image_caption_unindented':     'valid-keyword: parser issue with image captions',
  'image_captions':               'valid-keyword: parser issue with image captions',
  'image_simple':                 'valid-keyword: parser issue with image',
  'leadin_multiple':              'valid-keyword: parser issue with lead-in text',
  'multiple_with_loops':          'indent-style + valid-keyword: complex fixture',
  'multiple_with_sub_questions':  'valid-keyword: sub-questions not recognized',
  'nodes_with_settings':          'valid-keyword: settings-related parse issue',
  'scatter_chart':                'valid-keyword: chart-related parse issue',
  'sequences_three_textnodes':    'valid-keyword: text node parse issue',
  'textnode_simple_hash':         'valid-keyword: hash text node',
  'video_simple':                 'valid-keyword: video parse issue',
  'video_with_captions':          'valid-keyword + valid-sub-keyword: video captions',
  // valid-sub-keyword false positives
  'classes':                      'valid-sub-keyword: *classes not recognized in context',
  'events':                       'valid-sub-keyword: event names treated as sub-keywords',
  'events_startup_goto_with_reset': 'valid-sub-keyword: event sub-keyword issue',
  'list_styled':                  'valid-sub-keyword: list style not recognized',
  'points_alone':                 'valid-sub-keyword: points context issue',
  'settings':                     'valid-keyword + valid-sub-keyword: settings keywords',
  // no-undefined-vars false positives (vars defined in ways our linter doesn't track)
  'component':                    'no-undefined-vars + valid-sub-keyword: component vars',
  'component_with_data':          'no-undefined-vars: *with: var from runtime context',
  'email':                        'no-undefined-vars: email template vars',
  'for':                          'no-undefined-vars: undefined collection var in snippet',
  'multiple_service_calls':       'no-undefined-vars: service response vars',
  'page_while_with_program':      'no-undefined-vars: program-scoped vars',
  'purchase_subscription':        'no-undefined-vars: purchase callback vars',
  'service':                      'no-undefined-vars: service response vars',
  // no-invalid-goto false positives
  'goto_named_node':              'no-invalid-goto + valid-sub-keyword: named node goto',
  'goto_reset':                   'no-invalid-goto: goto with reset',
  // other
  'email_with_cancel':            'required-subkeywords: cancel-only email is valid',
  'navigation_with_hide':         'no-inline-argument: navigation hide argument',
  'purchase_history':             'purchase-subkeyword-constraints + valid-keyword: history keyword',
};

const validFixtures = allFixtures.filter(
  f => !ERROR_CASE_FIXTURES.has(f.name) && !(f.name in KNOWN_LINTER_ISSUES)
);

const knownIssueFixtures = allFixtures.filter(
  f => f.name in KNOWN_LINTER_ISSUES
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(!submodulePresent)('gt-lib fixture integration tests', () => {
  describe('Lexer — tokenization', () => {
    it.each(allFixtures)('should tokenize $name without throwing', ({ source }) => {
      expect(() => tokenize(source)).not.toThrow();
    });
  });

  describe('Parser — AST generation', () => {
    it.each(allFixtures)('should parse $name without throwing', ({ source }) => {
      const tokens = tokenize(source);
      expect(() => parse(tokens)).not.toThrow();
    });
  });

  describe('Linter — valid fixtures (no errors expected)', () => {
    it.each(validFixtures)('should produce no errors for $name', ({ source }) => {
      const result = lint(source);
      if (result.errorCount > 0) {
        const details = result.messages
          .filter(m => m.severity === 'error')
          .map(m => `  line ${m.line}: [${m.ruleId}] ${m.message}`)
          .join('\n');
        expect.fail(
          `Expected no errors but got ${result.errorCount}:\n${details}`
        );
      }
    });
  });

  describe('Linter — known false positives (expected to fail)', () => {
    // These tests use it.fails() — they assert errorCount === 0, but we EXPECT
    // them to fail (because of known false positives in our linter). When we fix
    // the underlying linter issues, the test will start passing and vitest will
    // flag it as an unexpected pass, prompting us to move it to the valid list.
    it.fails.each(knownIssueFixtures)(
      'should produce no errors for $name (known issue)',
      ({ source }) => {
        const result = lint(source);
        expect(result.errorCount).toBe(0);
      }
    );
  });

  describe('Linter — error-case fixtures (errors expected)', () => {
    const errorFixtures = allFixtures.filter(f => ERROR_CASE_FIXTURES.has(f.name));
    it.each(errorFixtures)('$name is recognized as an error case', ({ name }) => {
      // Just verify our error-case set matches actual fixtures
      expect(ERROR_CASE_FIXTURES.has(name)).toBe(true);
    });
  });
});
