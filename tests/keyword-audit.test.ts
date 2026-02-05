/**
 * Keyword Audit Test
 *
 * Compares the canonical keyword list from gt-lib's keyword_definitions.rb
 * against our TypeScript definitions in tokens.ts and keyword-spec.ts.
 *
 * gt-lib uses a single flat KEYWORDS hash for all keywords (both top-level
 * and sub-keywords). We split them into KEYWORDS (top-level) and SUB_KEYWORDS
 * in our lexer.
 *
 * This test documents known discrepancies rather than fixing them. Any new
 * discrepancies will cause test failures, prompting investigation.
 */

import { describe, it, expect } from 'vitest';
import { KEYWORDS, SUB_KEYWORDS } from '../src/lexer/index.js';
import { KEYWORD_SPECS } from '../src/language/keyword-spec.js';

// ---------------------------------------------------------------------------
// Canonical keyword list from gt-lib's keyword_definitions.rb (single flat list)
// ---------------------------------------------------------------------------

const GT_LIB_ALL_KEYWORDS = new Set([
  // Sub-keyword / attribute style
  'after',
  'answers',
  'back',
  'before',
  'blank',
  'body',
  'cancel',
  'caption',
  'classes',
  'click',
  'color',
  'confirm',
  'countdown',
  'data',
  'date',
  'default',
  'description',
  'error',
  'every',
  'everytime',
  'frequency',
  'hide',
  'history',
  'icon',
  'identifier',
  'management',
  'max',
  'menu',
  'method',
  'min',
  'multiple',
  'name',
  'opacity',
  'other',
  'path',
  'picture',
  'position',
  'required',
  'reset',
  'rollovers',
  'save',
  'send',
  'shuffle',
  'start',
  'startup',
  'status',
  'subject',
  'success',
  'tags',
  'throwaway',
  'ticks',
  'time',
  'tip',
  'title',
  'to',
  'trendline',
  'type',
  'until',
  'url',
  'what',
  'when',
  'xaxis',
  'yaxis',
  // Top-level / content style
  'audio',
  'block',
  'button',
  'chart',
  'clear',
  'component',
  'console',
  'database',
  'email',
  'events',
  'experiment',
  'for',
  'goto',
  'group',
  'header',
  'html',
  'if',
  'image',
  'label',
  'list',
  'login',
  'maintain',
  'multimedia',
  'navigation',
  'page',
  'points',
  'program',
  'progress',
  'purchase',
  'question',
  'quit',
  'randomize',
  'repeat',
  'return',
  'service',
  'set',
  'settings',
  'share',
  'summary',
  'switch',
  'text',
  'trigger',
  'video',
  'wait',
  'while',
  'with',
]);

// gt-lib keywords that are internal parser concepts, not user-facing GT keywords.
// We intentionally exclude these from both KEYWORDS and SUB_KEYWORDS.
const INTENTIONALLY_EXCLUDED = new Set([
  'block',       // Internal parser concept for indented blocks
  'console',     // Internal parser concept (debug console)
  'multimedia',  // Internal parser concept (media container)
  'text',        // Internal parser concept (text node)
]);

// gt-lib keywords we recognize in SUB_KEYWORDS but NOT in KEYWORDS
// (i.e., keywords that gt-lib treats uniformly but we classify as sub-keywords only).
// Some of these also appear in KEYWORDS because they serve dual roles
// (e.g., 'page' is both a top-level keyword and appears in gt-lib's flat list
// alongside attribute-style keywords like 'component', 'database', 'events').

// Known gt-lib keywords missing from BOTH our KEYWORDS and SUB_KEYWORDS sets.
// These are documented discrepancies — not bugs, just not yet added to our lexer.
const KNOWN_MISSING_FROM_LEXER = new Set([
  'back',       // *settings back (in KEYWORD_SPECS but not SUB_KEYWORDS)
  'color',      // *chart data color
  'history',    // *purchase history
  'menu',       // *settings menu (in KEYWORD_SPECS but not SUB_KEYWORDS)
  'opacity',    // *chart data opacity
  'picture',    // *question answer picture
  'position',   // *chart axis position
  'rollovers',  // *chart data rollovers
  'ticks',      // *chart axis ticks
  'title',      // *chart title
  'url',        // *navigation url
]);

// Keywords in our code that are NOT in gt-lib's list.
// These may have been added to GT after the Ruby gem's last update,
// or sourced from newer documentation.
const OUR_EXTRA_KEYWORDS = new Set([
  'placeholder', // *question placeholder (from docs, in SUB_KEYWORDS)
  'searchable',  // *question searchable (from docs, in SUB_KEYWORDS)
]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Keyword Audit — gt-lib vs. gtlint', () => {
  // The union of our KEYWORDS + SUB_KEYWORDS
  const ourAllKeywords = new Set([...KEYWORDS, ...SUB_KEYWORDS]);

  // gt-lib keywords minus intentional exclusions
  const gtLibEffective = new Set(
    [...GT_LIB_ALL_KEYWORDS].filter(k => !INTENTIONALLY_EXCLUDED.has(k))
  );

  describe('Coverage: gt-lib keywords present in our code', () => {
    it('every gt-lib keyword should be in KEYWORDS or SUB_KEYWORDS (minus known missing)', () => {
      const missing = [...gtLibEffective].filter(
        k => !ourAllKeywords.has(k) && !KNOWN_MISSING_FROM_LEXER.has(k)
      );
      expect(missing).toEqual([]);
    });

    it('known missing keywords are actually missing from our lexer', () => {
      for (const k of KNOWN_MISSING_FROM_LEXER) {
        expect(
          ourAllKeywords.has(k),
          `'${k}' is in KNOWN_MISSING but is actually present — remove it from KNOWN_MISSING`
        ).toBe(false);
      }
    });
  });

  describe('Coverage: our keywords present in gt-lib', () => {
    it('every keyword in our KEYWORDS set should be in gt-lib', () => {
      const unexpected = [...KEYWORDS].filter(k => !GT_LIB_ALL_KEYWORDS.has(k));
      expect(unexpected).toEqual([]);
    });

    it('every keyword in our SUB_KEYWORDS set should be in gt-lib (minus documented extras)', () => {
      const extra = [...SUB_KEYWORDS].filter(
        k => !GT_LIB_ALL_KEYWORDS.has(k) && !OUR_EXTRA_KEYWORDS.has(k)
      );
      expect(extra).toEqual([]);
    });

    it('documented extra keywords are actually extra', () => {
      for (const k of OUR_EXTRA_KEYWORDS) {
        expect(
          GT_LIB_ALL_KEYWORDS.has(k),
          `'${k}' is in OUR_EXTRA but is actually in gt-lib — remove it from OUR_EXTRA`
        ).toBe(false);
      }
    });
  });

  describe('KEYWORD_SPECS consistency', () => {
    it('every KEYWORDS entry should have a KEYWORD_SPECS entry', () => {
      const missingSpecs = [...KEYWORDS].filter(k => !(k in KEYWORD_SPECS));
      expect(missingSpecs).toEqual([]);
    });

    it('every KEYWORD_SPECS entry should be in KEYWORDS', () => {
      const extraSpecs = Object.keys(KEYWORD_SPECS).filter(k => !KEYWORDS.has(k));
      expect(extraSpecs).toEqual([]);
    });
  });

  describe('Discrepancy summary', () => {
    it('documents all known discrepancies (update counts when discrepancies change)', () => {
      expect([...KNOWN_MISSING_FROM_LEXER].sort()).toHaveLength(11);
      expect([...OUR_EXTRA_KEYWORDS].sort()).toHaveLength(2);
      expect([...INTENTIONALLY_EXCLUDED].sort()).toHaveLength(4);
    });
  });
});
