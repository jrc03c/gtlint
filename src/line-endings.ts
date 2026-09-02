/**
 * Line ending detection and conversion.
 *
 * Everything downstream of these helpers — the lexer, the parser, the
 * directive parser, the lint rules, the formatter — assumes lines are
 * separated by bare `\n`. A CRLF file fed in raw leaves a stray `\r` glued to
 * the end of every line, which silently breaks any regex anchored with `$`
 * (in JavaScript, `.` does not match `\r` and `$` anchors past it).
 *
 * So the rule is: normalize on the way in, re-apply on the way out.
 */

/** A line terminator GTLint can read back out. */
export type LineEnding = '\n' | '\r\n';

/**
 * How the formatter should terminate lines in its output.
 *
 * - `preserve` — keep whatever the file already used (default)
 * - `lf` — always write `\n`
 * - `crlf` — always write `\r\n`
 */
export type LineEndingMode = 'preserve' | 'lf' | 'crlf';

export const LINE_ENDING_MODES: readonly LineEndingMode[] = ['preserve', 'lf', 'crlf'];

/**
 * Report which line ending a source file predominantly uses.
 *
 * Majority wins, so a file with a handful of stray endings still round-trips
 * to its dominant style. Files with no line breaks at all report `\n`.
 */
export function detectLineEnding(source: string): LineEnding {
  let crlf = 0;
  let lf = 0;

  for (let i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      if (i > 0 && source[i - 1] === '\r') crlf++;
      else lf++;
    } else if (source[i] === '\r' && source[i + 1] !== '\n') {
      // A lone CR is a classic Mac line ending; count it as CRLF-ish so a file
      // full of them doesn't get silently reported as LF.
      crlf++;
    }
  }

  return crlf > lf ? '\r\n' : '\n';
}

/**
 * Convert every line ending to `\n`, leaving no `\r` behind.
 *
 * Handles CRLF, lone CR, and already-normalized LF input.
 */
export function normalizeLineEndings(source: string): string {
  return source.replace(/\r\n?/g, '\n');
}

/**
 * Terminate every line of an LF-normalized string with `ending`.
 *
 * The input is normalized first, so this is safe to call on a string whose
 * endings are unknown or mixed.
 */
export function applyLineEnding(source: string, ending: LineEnding): string {
  const normalized = normalizeLineEndings(source);
  return ending === '\n' ? normalized : normalized.replace(/\n/g, '\r\n');
}

/**
 * Resolve the line ending a formatter run should emit, given the configured
 * mode and the source it is about to format.
 */
export function resolveLineEnding(mode: LineEndingMode, source: string): LineEnding {
  if (mode === 'lf') return '\n';
  if (mode === 'crlf') return '\r\n';
  return detectLineEnding(source);
}
