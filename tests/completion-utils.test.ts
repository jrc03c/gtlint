import { describe, it, expect } from 'vitest';
import {
  getIndentLevel,
  findParentKeyword,
  isInsideHtmlBlock,
  buildMethodCompletionData,
  MethodCompletionData,
} from '../vscode-extension/src/completion-utils';

describe('completion-utils', () => {
  describe('getIndentLevel', () => {
    it('should return 0 for a line with no indentation', () => {
      expect(getIndentLevel('*question: How old are you?')).toBe(0);
    });

    it('should return 1 for a line with one leading tab', () => {
      expect(getIndentLevel('\t*save: age')).toBe(1);
    });

    it('should return 2 for a line with two leading tabs', () => {
      expect(getIndentLevel('\t\t>> x = 5')).toBe(2);
    });

    it('should return 0 for an empty line', () => {
      expect(getIndentLevel('')).toBe(0);
    });

    it('should return 0 for a line with only spaces (spaces do not count)', () => {
      expect(getIndentLevel('    some text')).toBe(0);
    });

    it('should only count leading tabs, not tabs in the middle of a line', () => {
      expect(getIndentLevel('\tsome\ttext\there')).toBe(1);
    });
  });

  describe('findParentKeyword', () => {
    it('should return null at top level (indent 0)', () => {
      const lines = [
        '*question: How old are you?',
        '\t*save: age',
      ];
      expect(findParentKeyword(lines, 0)).toBeNull();
    });

    it('should find the immediate parent keyword', () => {
      const lines = [
        '*question: How old are you?',
        '\t*save: age',
      ];
      expect(findParentKeyword(lines, 1)).toBe('question');
    });

    it('should skip blank lines when walking upward', () => {
      const lines = [
        '*question: How old are you?',
        '',
        '\t*save: age',
      ];
      expect(findParentKeyword(lines, 2)).toBe('question');
    });

    it('should skip comment lines when walking upward', () => {
      const lines = [
        '*question: How old are you?',
        '\t-- this is a comment',
        '\t*save: age',
      ];
      expect(findParentKeyword(lines, 2)).toBe('question');
    });

    it('should find parent at correct level when nested (indent 2 finds keyword at indent 1, not indent 0)', () => {
      const lines = [
        '*service: MyAPI',
        '\t*success',
        '\t\t>> result = it',
      ];
      expect(findParentKeyword(lines, 2)).toBe('success');
    });

    it('should return null when no keyword at expected indent (indent jumps)', () => {
      const lines = [
        '*question: How old are you?',
        '\t\t>> x = 5',
      ];
      // currentLine=1 has indent 2, expected parent at indent 1, but line 0 is indent 0
      expect(findParentKeyword(lines, 1)).toBeNull();
    });

    it('should handle sub-keyword as parent (e.g., *success under *service)', () => {
      const lines = [
        '*service: MyAPI',
        '\t*path: /endpoint',
        '\t*method: POST',
        '\t*success',
        '\t\t>> result = it',
      ];
      expect(findParentKeyword(lines, 4)).toBe('success');
    });

    it('should extract keyword name correctly (ignoring colon and argument)', () => {
      const lines = [
        '*question: How old are you?',
        '\t*type: number',
      ];
      expect(findParentKeyword(lines, 1)).toBe('question');
    });

    it('should extract keyword name with no argument (e.g., *page)', () => {
      const lines = [
        '*page',
        '\tSome content here',
      ];
      expect(findParentKeyword(lines, 1)).toBe('page');
    });
  });

  describe('isInsideHtmlBlock', () => {
    it('should return false at top level', () => {
      const lines = [
        'Some text at top level',
      ];
      expect(isInsideHtmlBlock(lines, 0)).toBe(false);
    });

    it('should return true when directly inside *html', () => {
      const lines = [
        '*html',
        '\t<div>Hello</div>',
      ];
      expect(isInsideHtmlBlock(lines, 1)).toBe(true);
    });

    it('should return true when nested deeper inside *html', () => {
      const lines = [
        '*html',
        '\t<div>',
        '\t\t<p>Hello</p>',
      ];
      expect(isInsideHtmlBlock(lines, 2)).toBe(true);
    });

    it('should return false when *html is a sibling (not ancestor)', () => {
      const lines = [
        '*html',
        '\t<div>Hello</div>',
        '*if: x = 1',
        '\tSome content',
      ];
      expect(isInsideHtmlBlock(lines, 3)).toBe(false);
    });

    it('should return true when *html is a grandparent (e.g., *if > *html > content)', () => {
      const lines = [
        '*if: x = 1',
        '\t*html',
        '\t\t<div>Hello</div>',
      ];
      expect(isInsideHtmlBlock(lines, 2)).toBe(true);
    });

    it('should return false for *html at same indent level', () => {
      const lines = [
        '*html',
        '\t<div>Hello</div>',
        '*if: x = 1',
        '*html',
        '\tSome text here',
      ];
      // Line 2 is at indent 0, *html at line 3 is also indent 0 - it's a sibling
      // But we're checking line 2 specifically
      expect(isInsideHtmlBlock(lines, 2)).toBe(false);
    });
  });

  describe('buildMethodCompletionData', () => {
    let methods: MethodCompletionData[];

    // Build once for all tests in this describe block
    methods = buildMethodCompletionData();

    it('should return entries for known methods (spot check from each type)', () => {
      const names = methods.map(m => m.name);
      // String methods
      expect(names).toContain('clean');
      expect(names).toContain('uppercase');
      // Number methods
      expect(names).toContain('round');
      expect(names).toContain('seconds');
      // Collection methods
      expect(names).toContain('add');
      expect(names).toContain('shuffle');
      // Association methods
      expect(names).toContain('keys');
      // Any methods
      expect(names).toContain('text');
      expect(names).toContain('type');
    });

    it('should deduplicate .size (appears once with String and Collection)', () => {
      const sizeEntries = methods.filter(m => m.name === 'size');
      expect(sizeEntries).toHaveLength(1);
      expect(sizeEntries[0].types).toContain('String');
      expect(sizeEntries[0].types).toContain('Collection');
    });

    it('should have correct snippets with tab stops for methods with params', () => {
      const addMethod = methods.find(m => m.name === 'add');
      expect(addMethod).toBeDefined();
      expect(addMethod!.hasParams).toBe(true);
      expect(addMethod!.snippet).toBe('add(${1:element})');

      const insertMethod = methods.find(m => m.name === 'insert');
      expect(insertMethod).toBeDefined();
      expect(insertMethod!.hasParams).toBe(true);
      expect(insertMethod!.snippet).toBe('insert(${1:element}, ${2:position})');
    });

    it('should have no parens in snippet for property-style methods', () => {
      const cleanMethod = methods.find(m => m.name === 'clean');
      expect(cleanMethod).toBeDefined();
      expect(cleanMethod!.hasParams).toBe(false);
      expect(cleanMethod!.snippet).toBe('clean');

      const keysMethod = methods.find(m => m.name === 'keys');
      expect(keysMethod).toBeDefined();
      expect(keysMethod!.hasParams).toBe(false);
      expect(keysMethod!.snippet).toBe('keys');
    });

    it('should list both String and Association for .encode', () => {
      const encodeEntries = methods.filter(m => m.name === 'encode');
      expect(encodeEntries).toHaveLength(1);
      expect(encodeEntries[0].types).toContain('String');
      expect(encodeEntries[0].types).toContain('Association');
    });

    it('should have a reasonable total count (~35 unique methods)', () => {
      // String: 9, Number: 8, Collection: 15, Association: 4, Any: 2
      // Shared: size (String+Collection), count (String+Collection),
      //         encode (String+Association), decode (String only),
      //         find (String+Collection), erase (Collection+Association),
      //         remove (Collection+Association)
      // Unique count should be around 30-35
      expect(methods.length).toBeGreaterThanOrEqual(28);
      expect(methods.length).toBeLessThanOrEqual(40);
    });
  });
});
