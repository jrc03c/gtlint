# Auto-Complete Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add context-aware keyword and method auto-complete to the VS Code extension.

**Architecture:** Extend the existing `GTLintCompletionProvider` in `completions.ts`. Extract context-detection helpers as pure functions (string arrays, not vscode types) into `completion-utils.ts` for testability. Add `KEYWORD_SPECS` export to the main package. Define `METHOD_SPECS` locally.

**Tech Stack:** TypeScript, VS Code Extension API, Vitest

**Design doc:** `docs/plans/2026-03-07-autocomplete-design.md` (this file, original design above the plan)

---

## Task 1: Export KEYWORD_SPECS from the main package

**Files:**
- Modify: `src/index.ts`

**Step 1: Add the export**

In `src/index.ts`, add after the existing lexer exports line:

```typescript
// Language exports
export { KEYWORD_SPECS, getKeywordSpec, getValidSubKeywords } from './language/index.js';
export type { KeywordSpec, SubKeywordSpec } from './language/index.js';
```

**Step 2: Verify the build**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: export KEYWORD_SPECS and helpers from main package"
```

---

## Task 2: Create completion-utils.ts with getIndentLevel

**Files:**
- Create: `vscode-extension/src/completion-utils.ts`
- Create: `tests/completion-utils.test.ts`

**Step 1: Write the failing tests**

Create `tests/completion-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getIndentLevel } from '../vscode-extension/src/completion-utils';

describe('completion-utils', () => {
  describe('getIndentLevel', () => {
    it('should return 0 for a line with no indentation', () => {
      expect(getIndentLevel('*question: Hello')).toBe(0);
    });

    it('should return 1 for a line with one tab', () => {
      expect(getIndentLevel('\t*type: text')).toBe(1);
    });

    it('should return 2 for a line with two tabs', () => {
      expect(getIndentLevel('\t\t*if: x > 5')).toBe(2);
    });

    it('should return 0 for an empty line', () => {
      expect(getIndentLevel('')).toBe(0);
    });

    it('should return 0 for a line with only spaces (no tabs)', () => {
      expect(getIndentLevel('    *set: x')).toBe(0);
    });

    it('should count only leading tabs', () => {
      expect(getIndentLevel('\t\ttext\there')).toBe(2);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `vscode-extension/src/completion-utils.ts`:

```typescript
/**
 * Pure utility functions for completion context detection.
 * These operate on plain strings/arrays (no vscode dependency) for testability.
 */

/** Count leading tabs in a line. */
export function getIndentLevel(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === '\t') count++;
    else break;
  }
  return count;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add vscode-extension/src/completion-utils.ts tests/completion-utils.test.ts
git commit -m "feat: add getIndentLevel helper with tests"
```

---

## Task 3: Add findParentKeyword helper

**Files:**
- Modify: `vscode-extension/src/completion-utils.ts`
- Modify: `tests/completion-utils.test.ts`

**Step 1: Write the failing tests**

Append to the `completion-utils` describe block in `tests/completion-utils.test.ts`:

```typescript
import { getIndentLevel, findParentKeyword } from '../vscode-extension/src/completion-utils';

// ... existing tests ...

describe('findParentKeyword', () => {
  it('should return null at top level (indent 0)', () => {
    const lines = ['*question: Hello', '\t*type: text', '*button: Next'];
    expect(findParentKeyword(lines, 2)).toBeNull();
  });

  it('should find the immediate parent keyword', () => {
    const lines = ['*question: Hello', '\t*'];
    expect(findParentKeyword(lines, 1)).toBe('question');
  });

  it('should skip blank lines when walking up', () => {
    const lines = ['*question: Hello', '', '\t*'];
    expect(findParentKeyword(lines, 2)).toBe('question');
  });

  it('should skip comment lines when walking up', () => {
    const lines = ['*question: Hello', '\t-- a comment', '\t*'];
    expect(findParentKeyword(lines, 2)).toBe('question');
  });

  it('should find parent at correct indent level (nested)', () => {
    const lines = ['*if: x > 5', '\t*question: Hello', '\t\t*'];
    expect(findParentKeyword(lines, 2)).toBe('question');
  });

  it('should return null when no parent at expected indent', () => {
    const lines = ['*question: Hello', '\t\t*'];
    // Current line is at indent 2, expects parent at indent 1, but
    // *question is at indent 0 — too far out
    expect(findParentKeyword(lines, 1)).toBeNull();
  });

  it('should handle sub-keyword parent (e.g., *success under *service)', () => {
    const lines = ['*service: API', '\t*success', '\t\t*'];
    expect(findParentKeyword(lines, 2)).toBe('success');
  });

  it('should extract keyword name ignoring colon and argument', () => {
    const lines = ['*for: item in collection', '\t*'];
    expect(findParentKeyword(lines, 1)).toBe('for');
  });

  it('should extract keyword name with no argument', () => {
    const lines = ['*page', '\t*'];
    expect(findParentKeyword(lines, 1)).toBe('page');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: FAIL — findParentKeyword not exported

**Step 3: Write minimal implementation**

Add to `vscode-extension/src/completion-utils.ts`:

```typescript
/**
 * Walk upward from `currentLine` to find the parent keyword.
 * Returns the keyword name (lowercase) or null if not found.
 *
 * @param lines - All lines of the document as strings
 * @param currentLine - Zero-based line index of the cursor
 */
export function findParentKeyword(lines: string[], currentLine: number): string | null {
  const currentIndent = getIndentLevel(lines[currentLine]);
  if (currentIndent === 0) return null;

  const targetIndent = currentIndent - 1;

  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines and comments
    if (trimmed === '' || trimmed.startsWith('--')) continue;

    const indent = getIndentLevel(line);

    if (indent === targetIndent) {
      // Check if this line starts with *keyword
      const match = trimmed.match(/^\*(\w+)/);
      if (match) return match[1].toLowerCase();
      // Non-keyword line at parent indent — no keyword parent
      return null;
    }

    if (indent < targetIndent) {
      // We've gone past the expected parent level
      return null;
    }
  }

  return null;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add vscode-extension/src/completion-utils.ts tests/completion-utils.test.ts
git commit -m "feat: add findParentKeyword helper with tests"
```

---

## Task 4: Add isInsideHtmlBlock helper

**Files:**
- Modify: `vscode-extension/src/completion-utils.ts`
- Modify: `tests/completion-utils.test.ts`

**Step 1: Write the failing tests**

Append to the test file:

```typescript
import { getIndentLevel, findParentKeyword, isInsideHtmlBlock } from '../vscode-extension/src/completion-utils';

// ... existing tests ...

describe('isInsideHtmlBlock', () => {
  it('should return false at top level', () => {
    const lines = ['*question: Hello', '*'];
    expect(isInsideHtmlBlock(lines, 1)).toBe(false);
  });

  it('should return true when directly inside *html', () => {
    const lines = ['*html', '\t<div>'];
    expect(isInsideHtmlBlock(lines, 1)).toBe(true);
  });

  it('should return true when nested inside *html', () => {
    const lines = ['*html', '\t<div>', '\t\t*'];
    expect(isInsideHtmlBlock(lines, 2)).toBe(true);
  });

  it('should return false when *html is a sibling, not ancestor', () => {
    const lines = ['*html', '\t<div>', '*question: Hello', '\t*'];
    expect(isInsideHtmlBlock(lines, 3)).toBe(false);
  });

  it('should return true when *html is a grandparent', () => {
    const lines = ['*if: x', '\t*html', '\t\t<div>', '\t\t\t*'];
    expect(isInsideHtmlBlock(lines, 3)).toBe(true);
  });

  it('should return false for *html at same indent level', () => {
    const lines = ['*html', '*'];
    expect(isInsideHtmlBlock(lines, 1)).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: FAIL — isInsideHtmlBlock not exported

**Step 3: Write minimal implementation**

Add to `vscode-extension/src/completion-utils.ts`:

```typescript
/**
 * Check if `currentLine` is inside an `*html` block by walking up through
 * all ancestor indent levels looking for `*html`.
 */
export function isInsideHtmlBlock(lines: string[], currentLine: number): boolean {
  const currentIndent = getIndentLevel(lines[currentLine]);
  if (currentIndent === 0) return false;

  // Walk upward, checking each ancestor indent level for *html
  let targetIndent = currentIndent - 1;
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('--')) continue;

    const indent = getIndentLevel(line);

    if (indent === targetIndent) {
      const match = trimmed.match(/^\*(\w+)/);
      if (match && match[1].toLowerCase() === 'html') return true;
      // Move to next ancestor level
      if (targetIndent === 0) return false;
      targetIndent--;
    }

    if (indent < targetIndent) {
      // Adjust target to match what we found
      if (indent < 0) return false;
      const match = trimmed.match(/^\*(\w+)/);
      if (match && match[1].toLowerCase() === 'html') return true;
      targetIndent = indent - 1;
      if (targetIndent < 0) return false;
    }
  }

  return false;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add vscode-extension/src/completion-utils.ts tests/completion-utils.test.ts
git commit -m "feat: add isInsideHtmlBlock helper with tests"
```

---

## Task 5: Define METHOD_SPECS and build method completion items

**Files:**
- Modify: `vscode-extension/src/completion-utils.ts`
- Modify: `tests/completion-utils.test.ts`

This task defines the method spec data and a pure function that builds completion item data (without vscode types) for testing.

**Step 1: Write the failing tests**

Append to the test file:

```typescript
import {
  getIndentLevel,
  findParentKeyword,
  isInsideHtmlBlock,
  buildMethodCompletionData,
} from '../vscode-extension/src/completion-utils';

// ... existing tests ...

describe('buildMethodCompletionData', () => {
  it('should return entries for all known methods', () => {
    const data = buildMethodCompletionData();
    const names = data.map(d => d.name);
    // Spot-check some methods from each type
    expect(names).toContain('size');
    expect(names).toContain('uppercase');
    expect(names).toContain('round');
    expect(names).toContain('add');
    expect(names).toContain('keys');
    expect(names).toContain('type');
  });

  it('should deduplicate methods shared across types', () => {
    const data = buildMethodCompletionData();
    const sizeEntries = data.filter(d => d.name === 'size');
    expect(sizeEntries).toHaveLength(1);
    // Should list both types
    expect(sizeEntries[0].types).toContain('String');
    expect(sizeEntries[0].types).toContain('Collection');
  });

  it('should have snippets with tab stops for methods with params', () => {
    const data = buildMethodCompletionData();
    const insert = data.find(d => d.name === 'insert');
    expect(insert).toBeDefined();
    expect(insert!.snippet).toBe('insert(${1:element}, ${2:position})');
    expect(insert!.hasParams).toBe(true);
  });

  it('should have no snippet params for property-style methods', () => {
    const data = buildMethodCompletionData();
    const keys = data.find(d => d.name === 'keys');
    expect(keys).toBeDefined();
    expect(keys!.snippet).toBe('keys');
    expect(keys!.hasParams).toBe(false);
  });

  it('should include type annotation in detail string', () => {
    const data = buildMethodCompletionData();
    const encode = data.find(d => d.name === 'encode');
    expect(encode).toBeDefined();
    expect(encode!.types).toContain('String');
    expect(encode!.types).toContain('Association');
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: FAIL — buildMethodCompletionData not exported

**Step 3: Write the implementation**

Add to `vscode-extension/src/completion-utils.ts`:

```typescript
export interface MethodCompletionData {
  name: string;
  types: string[];
  snippet: string;
  hasParams: boolean;
  description: string;
}

interface MethodDef {
  name: string;
  snippet: string;
  hasParams: boolean;
  description: string;
}

const METHOD_SPECS: Record<string, MethodDef[]> = {
  String: [
    { name: 'clean', snippet: 'clean', hasParams: false, description: 'Remove leading/trailing whitespace' },
    { name: 'count', snippet: 'count(${1:text})', hasParams: true, description: 'Count occurrences of text' },
    { name: 'decode', snippet: 'decode(${1:scheme})', hasParams: true, description: 'Decode from scheme (e.g., "JSON")' },
    { name: 'encode', snippet: 'encode(${1:scheme})', hasParams: true, description: 'Encode to scheme (e.g., "JSON")' },
    { name: 'find', snippet: 'find(${1:text})', hasParams: true, description: 'Find position of text (0 if not found)' },
    { name: 'lowercase', snippet: 'lowercase', hasParams: false, description: 'Convert to lowercase' },
    { name: 'size', snippet: 'size', hasParams: false, description: 'Number of characters' },
    { name: 'split', snippet: 'split(${1:delimiter})', hasParams: true, description: 'Split into a collection' },
    { name: 'uppercase', snippet: 'uppercase', hasParams: false, description: 'Convert to uppercase' },
  ],
  Number: [
    { name: 'round', snippet: 'round', hasParams: false, description: 'Round to nearest integer (or use .round(n) for n decimals)' },
    { name: 'seconds', snippet: 'seconds', hasParams: false, description: 'Convert to duration in seconds' },
    { name: 'minutes', snippet: 'minutes', hasParams: false, description: 'Convert to duration in minutes' },
    { name: 'hours', snippet: 'hours', hasParams: false, description: 'Convert to duration in hours' },
    { name: 'days', snippet: 'days', hasParams: false, description: 'Convert to duration in days' },
    { name: 'weeks', snippet: 'weeks', hasParams: false, description: 'Convert to duration in weeks' },
    { name: 'months', snippet: 'months', hasParams: false, description: 'Convert to duration in months' },
    { name: 'years', snippet: 'years', hasParams: false, description: 'Convert to duration in years' },
  ],
  Collection: [
    { name: 'add', snippet: 'add(${1:element})', hasParams: true, description: 'Add element to end' },
    { name: 'combine', snippet: 'combine(${1:collection})', hasParams: true, description: 'Combine with another collection' },
    { name: 'count', snippet: 'count(${1:value})', hasParams: true, description: 'Count occurrences of value' },
    { name: 'erase', snippet: 'erase(${1:value})', hasParams: true, description: 'Remove all occurrences of value' },
    { name: 'find', snippet: 'find(${1:value})', hasParams: true, description: 'Find position of value (0 if not found)' },
    { name: 'insert', snippet: 'insert(${1:element}, ${2:position})', hasParams: true, description: 'Insert element at position' },
    { name: 'max', snippet: 'max', hasParams: false, description: 'Maximum value' },
    { name: 'mean', snippet: 'mean', hasParams: false, description: 'Average value' },
    { name: 'median', snippet: 'median', hasParams: false, description: 'Median value' },
    { name: 'min', snippet: 'min', hasParams: false, description: 'Minimum value' },
    { name: 'remove', snippet: 'remove(${1:position})', hasParams: true, description: 'Remove element at position' },
    { name: 'shuffle', snippet: 'shuffle', hasParams: false, description: 'Randomly reorder elements' },
    { name: 'size', snippet: 'size', hasParams: false, description: 'Number of elements' },
    { name: 'sort', snippet: 'sort(${1:direction})', hasParams: true, description: 'Sort elements ("asc" or "desc")' },
    { name: 'unique', snippet: 'unique', hasParams: false, description: 'Remove duplicate elements' },
  ],
  Association: [
    { name: 'encode', snippet: 'encode(${1:scheme})', hasParams: true, description: 'Encode to scheme (e.g., "JSON")' },
    { name: 'erase', snippet: 'erase(${1:value})', hasParams: true, description: 'Remove all occurrences of value' },
    { name: 'keys', snippet: 'keys', hasParams: false, description: 'Get all keys as a collection' },
    { name: 'remove', snippet: 'remove(${1:key})', hasParams: true, description: 'Remove key-value pair by key' },
  ],
  Any: [
    { name: 'text', snippet: 'text', hasParams: false, description: 'Convert to text representation' },
    { name: 'type', snippet: 'type', hasParams: false, description: 'Get the runtime type name' },
  ],
};

/**
 * Build a deduplicated flat list of method completion data from METHOD_SPECS.
 * Methods shared across types (e.g., .size) appear once with all types listed.
 */
export function buildMethodCompletionData(): MethodCompletionData[] {
  const merged = new Map<string, MethodCompletionData>();

  for (const [typeName, methods] of Object.entries(METHOD_SPECS)) {
    for (const method of methods) {
      const existing = merged.get(method.name);
      if (existing) {
        if (!existing.types.includes(typeName)) {
          existing.types.push(typeName);
        }
      } else {
        merged.set(method.name, {
          name: method.name,
          types: [typeName],
          snippet: method.snippet,
          hasParams: method.hasParams,
          description: method.description,
        });
      }
    }
  }

  return Array.from(merged.values());
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/completion-utils.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add vscode-extension/src/completion-utils.ts tests/completion-utils.test.ts
git commit -m "feat: add METHOD_SPECS and buildMethodCompletionData"
```

---

## Task 6: Implement keyword completions in the provider

**Files:**
- Modify: `vscode-extension/src/completions.ts`

**Step 1: Add keyword completion import and method**

At the top of `completions.ts`, add the new imports:

```typescript
import { KEYWORD_SPECS, getValidSubKeywords } from '@jrc03c/gtlint';
import { findParentKeyword, isInsideHtmlBlock, getIndentLevel } from './completion-utils';
```

Add a private method to `GTLintCompletionProvider`:

```typescript
private provideKeywordCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  linePrefix: string
): vscode.CompletionItem[] | undefined {
  // Only trigger when * is at the start of the line (after whitespace)
  if (!/^\s*\*$/.test(linePrefix)) return undefined;

  const lines = Array.from({ length: document.lineCount }, (_, i) => document.lineAt(i).text);

  // Suppress inside *html blocks
  if (isInsideHtmlBlock(lines, position.line)) return undefined;

  const parent = findParentKeyword(lines, position.line);
  const items: vscode.CompletionItem[] = [];
  let sortIndex = 0;

  // Priority group: sub-keywords of the parent
  if (parent) {
    const parentSpec = KEYWORD_SPECS[parent];
    if (parentSpec?.subKeywords) {
      for (const [name, subSpec] of Object.entries(parentSpec.subKeywords)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
        let detail = subSpec.description || '';
        if (subSpec.enumValues) {
          detail += ` (${subSpec.enumValues.join(' | ')})`;
        }
        item.detail = detail;
        item.sortText = String(sortIndex++).padStart(3, '0');
        items.push(item);
      }
    }
  }

  // Secondary group: all top-level keywords
  for (const [name, spec] of Object.entries(KEYWORD_SPECS)) {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
    item.detail = spec.description;
    item.sortText = String(sortIndex++).padStart(3, '0');
    items.push(item);
  }

  return items;
}
```

**Step 2: Wire it into provideCompletionItems**

In the existing `provideCompletionItems` method, add the keyword check **before** the directive check (since `*` lines are not `--` lines, the order doesn't strictly matter, but this is logically clearer):

```typescript
provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  _token: vscode.CancellationToken,
  _context: vscode.CompletionContext
): vscode.CompletionItem[] | undefined {
  const linePrefix = getLinePrefix(document, position);

  // --- Keyword completions (line starts with whitespace + *) ---
  if (/^\s*\*$/.test(linePrefix)) {
    return this.provideKeywordCompletions(document, position, linePrefix);
  }

  // --- Directive completions (existing, unchanged) ---
  if (!/^\s*--/.test(linePrefix)) {
    return undefined;  // Not a comment line and not a keyword trigger
  }

  // ... rest of existing directive completion code unchanged ...
}
```

**Step 3: Verify build**

Run: `cd vscode-extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add vscode-extension/src/completions.ts
git commit -m "feat: add context-aware keyword completions"
```

---

## Task 7: Implement method completions in the provider

**Files:**
- Modify: `vscode-extension/src/completions.ts`

**Step 1: Add method completion imports and method**

Add to the imports in `completions.ts`:

```typescript
import { buildMethodCompletionData } from './completion-utils';
```

Add a private method:

```typescript
private provideMethodCompletions(
  linePrefix: string
): vscode.CompletionItem[] | undefined {
  // Trigger when . follows an expression-ending character
  if (!/[a-zA-Z0-9_)\]"]\.$/. test(linePrefix)) return undefined;

  const data = buildMethodCompletionData();
  return data.map((method, i) => {
    const kind = method.hasParams
      ? vscode.CompletionItemKind.Method
      : vscode.CompletionItemKind.Property;
    const item = new vscode.CompletionItem(method.name, kind);
    item.detail = method.types.join(' / ');
    item.documentation = method.description;
    item.insertText = new vscode.SnippetString(method.snippet);
    item.sortText = String(i).padStart(3, '0');
    return item;
  });
}
```

**Step 2: Wire it into provideCompletionItems**

Add the method completion check after the keyword check and before the directive check:

```typescript
// --- Method completions (after .) ---
if (linePrefix.endsWith('.')) {
  return this.provideMethodCompletions(linePrefix);
}
```

**Step 3: Verify build**

Run: `cd vscode-extension && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add vscode-extension/src/completions.ts
git commit -m "feat: add method completions with snippets"
```

---

## Task 8: Add trigger characters in extension.ts

**Files:**
- Modify: `vscode-extension/src/extension.ts`

**Step 1: Update the trigger character registration**

Change the trigger characters from `'@', ',', ' '` to `'@', ',', ' ', '*', '.'`:

```typescript
  // Register completion provider for directives, keywords, and methods
  const completionProvider = new GTLintCompletionProvider();
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: 'guidedtrack' },
      completionProvider,
      '@', ',', ' ', '*', '.'
    )
  );
```

**Step 2: Verify build**

Run: `cd vscode-extension && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add vscode-extension/src/extension.ts
git commit -m "feat: register * and . as completion trigger characters"
```

---

## Task 9: Manual testing and edge case fixes

**Files:**
- Possibly modify: `vscode-extension/src/completions.ts`, `vscode-extension/src/completion-utils.ts`

**Step 1: Build the extension**

Run: `cd vscode-extension && pnpm run build`
Expected: Build succeeds

**Step 2: Manual testing checklist**

Open a `.gt` file in VS Code with the extension loaded and verify:

- [ ] Typing `*` at top level shows all top-level keywords with descriptions
- [ ] Typing `*` indented under `*question:` shows sub-keywords first (type, save, shuffle, etc.), then all top-level keywords
- [ ] Typing `*` indented under `*randomize` shows sub-keywords first (everytime, name, group), then all top-level keywords
- [ ] Typing `*` inside `*html` block shows NO completions
- [ ] Typing `.` after a variable name shows method list with type annotations
- [ ] Typing `.` inside a URL (e.g., after `*image: https://example.com/photo`) does NOT show method completions
- [ ] Selecting a method with params (e.g., `insert`) inserts snippet with tab stops
- [ ] Selecting a property (e.g., `size`) inserts plain text
- [ ] Typing `-- @` still shows directive completions (unchanged)
- [ ] Typing a rule name after `-- @gtlint-disable ` still works (unchanged)

**Step 3: Fix any issues found, commit**

```bash
git add -A
git commit -m "fix: address edge cases from manual testing"
```

---

## Task 10: Update docs, version, and build

**Files:**
- Modify: `ARCHITECTURE.md` (update completions.ts description)
- Modify: `CHANGELOG.md`
- Modify: `README.md` (add auto-complete section)
- Modify: `package.json` (bump version)
- Modify: `vscode-extension/package.json` (bump version)

**Step 1: Update ARCHITECTURE.md**

Change the `completions.ts` line to mention keyword and method completions:

```
- `completions.ts` — directive, rule name, keyword, and method completions
```

Add `completion-utils.ts`:

```
- `completion-utils.ts` — pure helper functions for completion context detection (parent keyword lookup, indent level, HTML block detection)
```

**Step 2: Update CHANGELOG.md**

Add entry for new feature.

**Step 3: Update README.md**

Add a section documenting the auto-complete features (keywords with context-aware sub-keywords, method completions with type annotations).

**Step 4: Bump versions**

Bump minor version in both `package.json` and `vscode-extension/package.json`.

**Step 5: Rebuild extension**

Run: `cd vscode-extension && pnpm run package`
Expected: `.vsix` file created in `vscode-extension/dist/`

**Step 6: Commit**

```bash
git add ARCHITECTURE.md CHANGELOG.md README.md package.json vscode-extension/package.json
git commit -m "docs: update docs for keyword & method auto-complete, bump version"
```

---

## Task 11: Clean up plan file

**Files:**
- Remove: `docs/plans/2026-03-07-autocomplete-design.md`

**Step 1: Remove the plan file**

```bash
git rm docs/plans/2026-03-07-autocomplete-design.md
git commit -m "chore: remove completed autocomplete plan"
```
