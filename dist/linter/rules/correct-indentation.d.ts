import type { LintRule } from '../linter.js';
/**
 * Rule: correct-indentation
 *
 * Validates indentation *levels* in GuidedTrack code. Detects two classes of errors:
 *
 * 1. **Body not allowed** — content is indented under a keyword that forbids bodies
 *    (e.g., indented text under `*button:`)
 * 2. **Over-indentation** — content is indented more levels than expected
 *    (e.g., 2 tabs under `*if:` instead of 1)
 *
 * Over-indentation is only checked for statements inside a keyword body, sub-keyword
 * body, or answer option body — not at the top-level Program body. The parser may
 * flatten certain constructs (e.g., answer options after `*question:`, sub-keywords
 * separated by comments) to the program level, making top-level indentation checks
 * unreliable.
 *
 * Comments are excluded from over-indentation checks since they can be indented
 * freely for readability.
 */
export declare const correctIndentation: LintRule;
//# sourceMappingURL=correct-indentation.d.ts.map