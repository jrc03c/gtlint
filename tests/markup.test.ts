import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  findMarkupMatches,
  findLinks,
  renderMarkupToHtml,
  markupPatternFor,
  LINK_GRAMMAR_PATTERN,
  IMPLICIT_URL_GRAMMAR_PATTERN,
} from '../src/language/markup';

const anchor = (url: string, text: string) =>
  `<a href='${url}' target='_blank' rel='noopener'>${text}</a>`;

/**
 * Conformance tests ported from the GuidedTrack interpreter's own suite,
 * `spec/javascripts/interpreter/html_formatted_text_spec.coffee`, so that our
 * understanding of markup is checked against the canonical implementation
 * rather than against our own assumptions.
 */
describe('markup conformance with the GuidedTrack interpreter', () => {
  it('formats markup in the correct place', () => {
    expect(renderMarkupToHtml('dont_replace_this_ instead replace _this_')).toBe(
      'dont_replace_this_ instead replace <u>this</u>'
    );
  });

  it('formats markup correctly when there are multiple tags in the same text', () => {
    expect(renderMarkupToHtml('underline _this_ and also _that_')).toBe(
      'underline <u>this</u> and also <u>that</u>'
    );
  });

  it('formats quoted text', () => {
    expect(renderMarkupToHtml('*"hello"* should be bold')).toBe(
      '<strong>"hello"</strong> should be bold'
    );
  });

  it('formats markup within quotes', () => {
    expect(renderMarkupToHtml('"*This*" should be bold')).toBe(
      '"<strong>This</strong>" should be bold'
    );
  });

  it('replaces URLs with links', () => {
    const cases = [
      'http://www.example.com',
      'https://www.example.com',
      'http://example.com',
      'http://www.example.info',
      'http://www.my.immobilien',
      'http://www.guidedtrack.com/programs?foo=bar',
      'http://www.guidedtrack.com?foo=bar',
      'http://www.guidedtrack.com#foo',
    ];

    for (const url of cases) {
      expect(renderMarkupToHtml(url)).toBe(anchor(url, url));
    }

    expect(renderMarkupToHtml('http://www.example.com/')).toBe(
      anchor('http://www.example.com', 'http://www.example.com')
    );
  });

  it('replaces link markup with named links', () => {
    expect(renderMarkupToHtml('[here|http://www.example.com]')).toBe(
      anchor('http://www.example.com', 'here')
    );
    expect(renderMarkupToHtml('[here|http://www.example.info/index]')).toBe(
      anchor('http://www.example.info/index', 'here')
    );
  });

  it('encodes spaces in links inside the link markup', () => {
    expect(renderMarkupToHtml('[here|http://www.example.com?name=will smith]')).toBe(
      anchor('http://www.example.com?name=will%20smith', 'here')
    );
  });

  it('does not encode spaces in links outside the link markup', () => {
    expect(renderMarkupToHtml('http://www.example.com?name=will smith')).toBe(
      `${anchor('http://www.example.com?name=will', 'http://www.example.com?name=will')} smith`
    );
  });

  it('does not encode trailing parentheses in links', () => {
    expect(
      renderMarkupToHtml('Click this link (right here: http://www.example.com?name=will)')
    ).toBe(
      `Click this link (right here: ${anchor(
        'http://www.example.com?name=will',
        'http://www.example.com?name=will'
      )})`
    );
  });

  it('terminates implicit urls upon reaching a space', () => {
    expect(
      renderMarkupToHtml(
        'http://www.example.com?a=b [Will Smith|http://www.example.com?name=will smith]'
      )
    ).toBe(
      `${anchor('http://www.example.com?a=b', 'http://www.example.com?a=b')} ${anchor(
        'http://www.example.com?name=will%20smith',
        'Will Smith'
      )}`
    );
  });

  it('marks up multiple consecutive implicit links', () => {
    expect(renderMarkupToHtml('http://www.google.com http://www.facebook.com')).toBe(
      `${anchor('http://www.google.com', 'http://www.google.com')} ${anchor(
        'http://www.facebook.com',
        'http://www.facebook.com'
      )}`
    );
  });

  it('encodes reserved characters', () => {
    const escapes: Record<string, string> = {
      "'": '%27',
      '!': '%21',
      '(': '%28',
      ')': '%29',
      '*': '*',
    };

    for (const [char, escaped] of Object.entries(escapes)) {
      const original = `x${char}y`;
      const replaced = `x${escaped}y`;

      expect(renderMarkupToHtml(`http://www.google.com?a=${original}`)).toBe(
        anchor(`http://www.google.com?a=${replaced}`, `http://www.google.com?a=${original}`)
      );

      expect(renderMarkupToHtml(`[here|http://www.google.com?a=${original}]`)).toBe(
        anchor(`http://www.google.com?a=${replaced}`, 'here')
      );
    }
  });
});

describe('findMarkupMatches', () => {
  it('does not treat slashes inside a URL as italics', () => {
    expect(findMarkupMatches('[Click here|https://example.com/foo] to learn more!', '/')).toEqual(
      []
    );
    expect(findMarkupMatches('Visit https://example.com/foo today', '/')).toEqual([]);
  });

  it('does not treat division as italics', () => {
    expect(findMarkupMatches('x = 10 / 2 / 5', '/')).toEqual([]);
  });

  it('does not treat multiplication as bold', () => {
    expect(findMarkupMatches('2 * 3 * 4', '*')).toEqual([]);
  });

  it('does not treat dates as italics', () => {
    expect(findMarkupMatches('Due 1/2/2026', '/')).toEqual([]);
  });

  it('finds real markup', () => {
    const matches = findMarkupMatches('this is /italic/ text', '/');
    expect(matches).toHaveLength(1);
    expect(matches[0].content).toBe('italic');
    expect(matches[0].start).toBe(8);
    expect(matches[0].end).toBe(16);
  });

  it('requires the opening marker to follow whitespace', () => {
    expect(findMarkupMatches('a/b/c', '/')).toEqual([]);
    expect(findMarkupMatches('/b/ c', '/')).toHaveLength(1);
  });

  it('requires the closing marker not to follow whitespace', () => {
    expect(findMarkupMatches('/not italic / here', '/')).toEqual([]);
  });

  it('treats a marker followed by a space as ordinary text', () => {
    expect(findMarkupMatches('/ not italic/', '/')).toEqual([]);
  });

  it('finds markup at the very start and end of the text', () => {
    const matches = findMarkupMatches('/italic/', '/');
    expect(matches).toHaveLength(1);
    expect(matches[0].content).toBe('italic');
  });
});

describe('findLinks', () => {
  it('accepts links GuidedTrack will render', () => {
    const links = findLinks('See [here|https://example.com/foo] for details');
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      text: 'here',
      url: 'https://example.com/foo',
      valid: true,
    });
  });

  it('rejects links with no scheme, which GuidedTrack shows as literal text', () => {
    expect(findLinks('[here|www.example.com]')[0].valid).toBe(false);
    expect(findLinks('[here|/relative/path]')[0].valid).toBe(false);
    expect(findLinks('[here|example.com]')[0].valid).toBe(false);
  });

  it('rejects links whose display text contains a pipe', () => {
    expect(findLinks('[a|b|https://example.com]')[0].valid).toBe(false);
  });

  it('rejects links with an empty half', () => {
    expect(findLinks('[|https://example.com]')[0].valid).toBe(false);
    expect(findLinks('[here|]')[0].valid).toBe(false);
  });

  it('finds several links on one line', () => {
    const links = findLinks('[a|https://a.com] and [b|https://b.com]');
    expect(links).toHaveLength(2);
    expect(links.every((link) => link.valid)).toBe(true);
  });
});

/**
 * The grammar matches markup with a regex while the rest of GTLint uses the
 * character scanner. They are two encodings of one rule, so they have to agree:
 * for every line below, the spans the regex finds must be the spans the scanner
 * finds.
 */
describe('the generated regexes agree with the markup scanner', () => {
  const lines = [
    '[Click here|https://example.com/foo] to learn more!',
    'Visit https://example.com/foo today',
    'this is /italic/ text',
    'this is *bold* text',
    'please _underline_ this',
    'dont_replace_this_ instead replace _this_',
    'underline _this_ and also _that_',
    '*"hello"* should be bold',
    '"*This*" should be bold',
    '2 * 3 * 4',
    'x = 10 / 2 / 5',
    'Due 1/2/2026',
    '/italic/',
    '/ not italic/',
    '/not italic / here',
    'a/b/c',
    'nested /italic with *bold* inside/ here',
    'unclosed /markup here',
    'two /one/ and /two/ spans',
    'trailing marker /',
    'C:/Users/someone/file.txt',
    'ratio 3/4 and 5/6',
  ];

  for (const character of ['/', '*', '_']) {
    it(`agrees on \`${character}\` markup`, () => {
      const pattern = new RegExp(markupPatternFor(character), 'g');

      for (const line of lines) {
        const fromRegex = [...line.matchAll(pattern)].map((match) => ({
          start: match.index,
          raw: match[0],
        }));
        const fromScanner = findMarkupMatches(line, character).map((match) => ({
          start: match.start,
          raw: match.raw,
        }));

        expect(fromRegex, `${character} markup in: ${line}`).toEqual(fromScanner);
      }
    });
  }
});

/**
 * The TextMate grammar cannot import TypeScript, so its markup regexes are
 * generated from this module and pasted into the JSON. This test fails if the
 * two drift apart — which is exactly how the highlighter came to italicize
 * `/example.com/` inside a URL in the first place.
 */
describe('TextMate grammar stays in sync with the markup rules', () => {
  const grammar = JSON.parse(
    readFileSync(
      resolve(__dirname, '../vscode-extension/syntaxes/guidedtrack.tmLanguage.json'),
      'utf8'
    )
  );

  it('uses the generated italic pattern', () => {
    expect(grammar.repository['italic-text'].match).toBe(markupPatternFor('/'));
  });

  it('uses the generated bold pattern', () => {
    expect(grammar.repository['bold-text'].match).toBe(markupPatternFor('*'));
  });

  it('uses the generated underline pattern', () => {
    expect(grammar.repository['underline-text'].match).toBe(markupPatternFor('_'));
  });

  it('uses the generated link patterns', () => {
    expect(grammar.repository['explicit-link'].match).toBe(LINK_GRAMMAR_PATTERN);
    expect(grammar.repository['implicit-link'].match).toBe(IMPLICIT_URL_GRAMMAR_PATTERN);
  });
});
