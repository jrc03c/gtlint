/**
 * Keyword Audit Test
 *
 * Compares the canonical keyword list from the GuidedTrack compiler's
 * keyword_definitions.rb (submodules/guidedtrack-web/compiler/lib/, formerly the
 * standalone gt-lib gem) against our TypeScript definitions in tokens.ts and
 * keyword-spec.ts.
 *
 * The compiler uses a single flat KEYWORDS hash for all keywords (both top-level
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
// Canonical keyword list from the compiler's keyword_definitions.rb
// (submodules/guidedtrack-web/compiler/lib/, single flat list)
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
  'placeholder',
  'position',
  'required',
  'reset',
  'rollovers',
  'save',
  'searchable',
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

// Compiler keywords that are internal parser concepts, not user-facing GT keywords.
// We intentionally exclude these from both KEYWORDS and SUB_KEYWORDS.
const INTENTIONALLY_EXCLUDED = new Set([
  'block',       // Internal parser concept for indented blocks
  'console',     // Internal parser concept (debug console)
  'multimedia',  // Internal parser concept (media container)
  'text',        // Internal parser concept (text node)
]);

// Compiler keywords we recognize in SUB_KEYWORDS but NOT in KEYWORDS
// (i.e., keywords the compiler treats uniformly but we classify as sub-keywords only).
// Some of these also appear in KEYWORDS because they serve dual roles
// (e.g., 'page' is both a top-level keyword and appears in the compiler's flat list
// alongside attribute-style keywords like 'component', 'database', 'events').

// Known compiler keywords missing from BOTH our KEYWORDS and SUB_KEYWORDS sets.
// These are documented discrepancies — not bugs, just not yet added to our lexer.
const KNOWN_MISSING_FROM_LEXER = new Set([
  'color',      // *chart data color
  'opacity',    // *chart data opacity
  'picture',    // *question answer picture
  'position',   // *chart axis position
  'rollovers',  // *chart data rollovers
  'ticks',      // *chart axis ticks
  'title',      // *chart title
  'url',        // *navigation url
]);

// Keywords in our code that are NOT in the compiler's list.
// (Empty since retargeting to guidedtrack-web/compiler — 'placeholder' and
// 'searchable' are now part of the canonical list. Kept for future divergences.)
const OUR_EXTRA_KEYWORDS = new Set<string>([]);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Keyword Audit — compiler vs. gtlint', () => {
  // The union of our KEYWORDS + SUB_KEYWORDS
  const ourAllKeywords = new Set([...KEYWORDS, ...SUB_KEYWORDS]);

  // compiler keywords minus intentional exclusions
  const gtLibEffective = new Set(
    [...GT_LIB_ALL_KEYWORDS].filter(k => !INTENTIONALLY_EXCLUDED.has(k))
  );

  describe('Coverage: compiler keywords present in our code', () => {
    it('every compiler keyword should be in KEYWORDS or SUB_KEYWORDS (minus known missing)', () => {
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

  describe('Coverage: our keywords present in the compiler', () => {
    it('every keyword in our KEYWORDS set should be in the compiler list', () => {
      const unexpected = [...KEYWORDS].filter(k => !GT_LIB_ALL_KEYWORDS.has(k));
      expect(unexpected).toEqual([]);
    });

    it('every keyword in our SUB_KEYWORDS set should be in the compiler list (minus documented extras)', () => {
      const extra = [...SUB_KEYWORDS].filter(
        k => !GT_LIB_ALL_KEYWORDS.has(k) && !OUR_EXTRA_KEYWORDS.has(k)
      );
      expect(extra).toEqual([]);
    });

    it('documented extra keywords are actually extra', () => {
      for (const k of OUR_EXTRA_KEYWORDS) {
        expect(
          GT_LIB_ALL_KEYWORDS.has(k),
          `'${k}' is in OUR_EXTRA but is actually in the compiler list — remove it from OUR_EXTRA`
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
      expect([...KNOWN_MISSING_FROM_LEXER].sort()).toHaveLength(8);
      expect([...OUR_EXTRA_KEYWORDS].sort()).toHaveLength(0);
      expect([...INTENTIONALLY_EXCLUDED].sort()).toHaveLength(4);
    });
  });
});
