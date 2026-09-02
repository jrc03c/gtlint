/**
 * GuidedTrack Text Markup & Links
 *
 * The single source of truth for how GuidedTrack renders inline markup
 * (`*bold*`, `/italic/`, `_underline_`) and links (`[text|url]`) inside
 * participant-facing text.
 *
 * The rules here are a direct port of the canonical implementation in the
 * GuidedTrack interpreter:
 *
 *   - `app/assets/javascripts/interpreter/text_scanner.js.coffee`
 *   - `app/assets/javascripts/interpreter/html_formatted_text.js.coffee`
 *
 * Everything that needs to reason about markup — the lexer, the lint rules,
 * and the TextMate grammar used for syntax highlighting — derives from this
 * module rather than re-deriving its own approximation. Historically each of
 * those had its own guess, and they disagreed: a naive "pair up the slashes"
 * rule italicizes `/example.com/` inside `https://example.com/foo`, which
 * GuidedTrack itself never does.
 *
 * No runtime dependencies — pure data and pure functions.
 */

// =============================================================================
// Markup characters
// =============================================================================

/**
 * The three markup characters, mapped to the HTML tag GuidedTrack wraps the
 * matched content in. Order matters: the interpreter applies them in this
 * order, and nested markup is formatted recursively.
 */
export const MARKUP_TAGS: Record<string, string> = {
  '/': 'em',
  '*': 'strong',
  '_': 'u',
};

export const MARKUP_CHARACTERS: string[] = Object.keys(MARKUP_TAGS);

export interface MarkupMatch {
  /** The markup character that delimits this match */
  character: string;
  /** The HTML tag GuidedTrack renders it as */
  tag: string;
  /** Offset of the opening marker within the scanned text */
  start: number;
  /** Offset just past the closing marker */
  end: number;
  /** The full matched text, markers included */
  raw: string;
  /** The content between the markers */
  content: string;
}

/**
 * Find every span of `text` that GuidedTrack renders with `character` markup.
 *
 * The rules, straight from `TextScanner`:
 *
 *   1. An opening marker only counts at the start of the text or immediately
 *      after whitespace. This is why URLs are safe: the slashes in
 *      `https://example.com/foo` all follow a non-space character.
 *   2. A marker immediately followed by a space cancels the match, so
 *      `2 * 3 * 4` is arithmetic rather than bold.
 *   3. A closing marker only counts when the character before it is not
 *      whitespace.
 *   4. Double quotes are transparent — they neither open/close markup nor
 *      count as whitespace — so `*"hello"*` is bold and `"*This*"` is too.
 *
 * Matches are returned in source order and never overlap.
 */
export function findMarkupMatches(text: string, character: string): MarkupMatch[] {
  const matches: MarkupMatch[] = [];

  let matchStart: number | null = null;
  let matchEnd: number | null = null;
  let spaceSeen = true;

  for (let position = 0; position < text.length; position++) {
    const ch = text[position];

    // Rule 4: double quotes do not affect formatting state at all.
    if (ch === '"') continue;

    // Rule 2: a marker immediately followed by a space is not markup.
    if (matchStart !== null && matchStart === position - 1 && ch === ' ') {
      matchStart = null;
      matchEnd = null;
    }

    if (ch === character) {
      if (matchStart !== null && !spaceSeen) {
        // Rule 3: valid closing marker.
        matchEnd = position;
      } else if (spaceSeen) {
        // Rule 1: valid opening marker.
        matchStart = position;
      }
    }

    if (matchStart !== null && matchEnd !== null) {
      const raw = text.slice(matchStart, matchEnd + 1);
      matches.push({
        character,
        tag: MARKUP_TAGS[character],
        start: matchStart,
        end: matchEnd + 1,
        raw,
        content: raw.slice(1, -1),
      });
      matchStart = null;
      matchEnd = null;
    }

    spaceSeen = isMarkupSpace(ch);
  }

  return matches;
}

/** Find matches for all three markup characters, in source order. */
export function findAllMarkupMatches(text: string): MarkupMatch[] {
  return MARKUP_CHARACTERS.flatMap((character) => findMarkupMatches(text, character)).sort(
    (a, b) => a.start - b.start
  );
}

function isMarkupSpace(ch: string): boolean {
  return ch === ' ' || ch === '\r' || ch === '\n';
}

// =============================================================================
// Links
// =============================================================================

/**
 * Explicit link markup: `[text|url]`.
 *
 * Ported from `EXPLICIT_URL_EXPRESSION` in `html_formatted_text.js.coffee`.
 * Note how strict this is — GuidedTrack only turns the markup into a link when
 * the URL has an `http://` or `https://` scheme and a dotted host. Anything
 * else (`[here|www.example.com]`, `[here|/relative/path]`) is left on the page
 * as literal text, brackets and all.
 */
export const EXPLICIT_LINK_PATTERN =
  /\[([^|]+)\|(https?:\/\/[\w\-.]+\.[a-zA-Z]{2,}(?:\/[^\]]+)?(?:\?[^\]]+)?(?:#[^\]]+)?)\/?(\])/;

/**
 * Bare URLs, which GuidedTrack auto-links when they are surrounded by
 * whitespace. Ported from `IMPLICIT_URL_EXPRESSION`.
 */
export const IMPLICIT_URL_PATTERN =
  /(^|\s)(https?:\/\/[\w\-.]+\.[a-zA-Z]{2,}(?:\/[^\s]+)?(?:\?[^\s]+)?(?:#[^\s]+)?)\/?(?=\s|$)/;

/**
 * Anything shaped like link markup, whether or not GuidedTrack will accept it.
 * Used by the linter to catch links that silently render as literal text.
 */
const LINK_SHAPED_PATTERN = /\[([^|\]]*)\|([^\]]*)\]/g;

export interface LinkMatch {
  /** Offset of the opening bracket */
  start: number;
  /** Offset just past the closing bracket */
  end: number;
  /** The full `[text|url]` source */
  raw: string;
  /** The display-text half */
  text: string;
  /** The URL half */
  url: string;
  /**
   * Whether GuidedTrack will actually render this as a link. When false the
   * whole thing, brackets included, is shown to the participant verbatim.
   */
  valid: boolean;
}

/**
 * Find everything shaped like `[text|url]`, flagging which ones GuidedTrack
 * will really linkify.
 */
export function findLinks(text: string): LinkMatch[] {
  const links: LinkMatch[] = [];
  const pattern = new RegExp(LINK_SHAPED_PATTERN.source, 'g');

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const raw = match[0];
    links.push({
      start: match.index,
      end: match.index + raw.length,
      raw,
      text: match[1],
      url: match[2],
      valid: isLinkifiedUrl(raw),
    });
  }

  return links;
}

/** Whether a complete `[text|url]` source is one GuidedTrack turns into a link. */
export function isLinkifiedUrl(rawLink: string): boolean {
  const anchored = new RegExp(`^(?:${EXPLICIT_LINK_PATTERN.source})$`);
  return anchored.test(rawLink);
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Render a line of GuidedTrack text the way the interpreter does: markup first,
 * then bare URLs, then explicit link markup.
 *
 * GTLint never needs the HTML itself, but having the full port here means the
 * markup rules can be tested directly against the interpreter's own test
 * expectations (see `tests/markup.test.ts`), which is what keeps this module
 * honest. It is also what a preview or hover feature would want.
 *
 * Note that this does not escape its input — the interpreter runs text through
 * `SanitizedText` first, and this port starts where that leaves off. Sanitize
 * before rendering anything untrusted.
 */
export function renderMarkupToHtml(text: string): string {
  let result = text;

  for (const character of MARKUP_CHARACTERS) {
    const matches = findMarkupMatches(result, character);

    // Apply from the last match backwards so earlier offsets stay valid.
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const tag = match.tag;
      const inner = renderMarkupToHtml(match.content);
      result = `${result.slice(0, match.start)}<${tag}>${inner}</${tag}>${result.slice(match.end)}`;
    }
  }

  return replaceUrlsWithLinks(result);
}

function replaceUrlsWithLinks(text: string): string {
  const implicit = new RegExp(IMPLICIT_URL_PATTERN.source, 'g');
  const explicit = new RegExp(EXPLICIT_LINK_PATTERN.source, 'g');

  return text
    .replace(implicit, (_match, lead: string, link: string) => {
      const end = determineLinkEnd(link);
      const url = link.slice(0, end);
      return `${lead}${anchor(url, encodeUriRfc3986(url))}${link.slice(end)}`;
    })
    .replace(explicit, (_match, linkText: string, url: string) =>
      anchor(linkText, encodeUriRfc3986(url))
    );
}

/**
 * A bare URL that ends in `)` is usually a sentence like
 * "(see http://example.com)" rather than a URL with a parenthesis in it, so the
 * trailing `)` is left outside the link — unless the URL opens a paren itself.
 */
function determineLinkEnd(link: string): number {
  if (!link.endsWith(')')) return link.length;
  if (link.includes('(')) return link.length;
  return link.indexOf(')');
}

const RFC_3986_ESCAPES: Record<string, string> = {
  "'": '%27',
  '!': '%21',
  '(': '%28',
  ')': '%29',
};

function encodeUriRfc3986(url: string): string {
  return encodeURI(url).replace(/['!()]/g, (ch) => RFC_3986_ESCAPES[ch]);
}

function anchor(text: string, url: string): string {
  return `<a href='${url}' target='_blank' rel='noopener'>${text}</a>`;
}

// =============================================================================
// TextMate grammar patterns
// =============================================================================

/**
 * Regex sources for the TextMate grammar in
 * `vscode-extension/syntaxes/guidedtrack.tmLanguage.json`.
 *
 * These encode the same rules as `findMarkupMatches` in a form Oniguruma can
 * match in a single pass:
 *
 *   - `(?<![^\s"])` — the marker opens at the start of a line, after
 *     whitespace, or after a transparent double quote.
 *   - `(?!\s)` — a marker followed by a space does not open markup.
 *   - `[^\s<char>]` before the closing marker — a closing marker cannot follow
 *     whitespace.
 *
 * `tests/markup.test.ts` checks the grammar file against these strings, so the
 * highlighter cannot drift away from the lexer's understanding of markup.
 */
export function markupPatternFor(character: string): string {
  const escaped = character === '*' ? '\\*' : character;
  const notMarker = character === '*' ? '\\s\\*' : `\\s${character}`;
  const notMarkerOrNewline = character === '*' ? '^\\*\\n' : `^${character}\\n`;

  return `(?<![^\\s"])${escaped}(?!\\s)(?:[${notMarkerOrNewline}]*[^${notMarker}])?${escaped}`;
}

/** Grammar pattern for explicit `[text|url]` link markup. */
export const LINK_GRAMMAR_PATTERN =
  '(\\[)([^|\\]]+)(\\|)(https?://[\\w\\-.]+\\.[a-zA-Z]{2,}[^\\]]*)(\\])';

/** Grammar pattern for bare URLs that GuidedTrack auto-links. */
export const IMPLICIT_URL_GRAMMAR_PATTERN =
  '(?<![^\\s])https?://[\\w\\-.]+\\.[a-zA-Z]{2,}(?:[^\\s\\]]*)';
