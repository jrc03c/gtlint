import * as vscode from 'vscode';
import { rules, KEYWORD_SPECS } from '@jrc03c/gtlint';
import { findParentKeyword, isInsideHtmlBlock, buildMethodCompletionData } from './completion-utils';

/** All directive templates the user can type after `-- @`. */
const DIRECTIVES: { label: string; detail: string; snippet: string }[] = [
  // Combined (lint + format)
  { label: '@gt-disable', detail: 'Disable linting and formatting until @gt-enable', snippet: '@gt-disable' },
  { label: '@gt-enable', detail: 'Re-enable linting and formatting', snippet: '@gt-enable' },
  { label: '@gt-disable-next-line', detail: 'Disable linting and formatting for the next line', snippet: '@gt-disable-next-line' },

  // Lint-only
  { label: '@gtlint-disable', detail: 'Disable all lint rules until @gtlint-enable', snippet: '@gtlint-disable' },
  { label: '@gtlint-enable', detail: 'Re-enable all lint rules', snippet: '@gtlint-enable' },
  { label: '@gtlint-disable-next-line', detail: 'Disable all lint rules for the next line', snippet: '@gtlint-disable-next-line' },

  // Format-only
  { label: '@gtformat-disable', detail: 'Disable formatting until @gtformat-enable', snippet: '@gtformat-disable' },
  { label: '@gtformat-enable', detail: 'Re-enable formatting', snippet: '@gtformat-enable' },

  // Variable tracking
  { label: '@from-parent:', detail: 'Variables received from parent program', snippet: '@from-parent: ${1:var1, var2}' },
  { label: '@from-url:', detail: 'Variables received via URL query string (alias for @from-parent)', snippet: '@from-url: ${1:var1, var2}' },
  { label: '@from-child:', detail: 'Variables received from child program', snippet: '@from-child: ${1:var1, var2}' },
  { label: '@to-parent:', detail: 'Variables sent to parent program', snippet: '@to-parent: ${1:var1, var2}' },
  { label: '@to-csv:', detail: 'Variables collected in CSV export (alias for @to-parent)', snippet: '@to-csv: ${1:var1, var2}' },
  { label: '@to-child:', detail: 'Variables sent to child program', snippet: '@to-child: ${1:var1, var2}' },
];

/** Directives that accept a comma-separated list of rule names. */
const RULE_LIST_DIRECTIVES = [
  '@gt-disable-next-line',
  '@gt-disable',
  '@gtlint-disable-next-line',
  '@gtlint-disable',
  '@gtlint-enable',
];

/**
 * Returns the text before the cursor on the current line, trimmed of
 * leading whitespace.
 */
function getLinePrefix(document: vscode.TextDocument, position: vscode.Position): string {
  return document.lineAt(position.line).text.slice(0, position.character);
}

const cachedMethodData = buildMethodCompletionData();

export class GTLintCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] | undefined {
    const linePrefix = getLinePrefix(document, position);

    // --- Keyword completions: triggered by `*` at start of line ---
    if (/^\s*\*$/.test(linePrefix)) {
      return this.provideKeywordCompletions(document, position);
    }

    // --- Method completions: triggered by `.` after an expression ---
    if (/[a-zA-Z0-9_)\]"]\.$/.test(linePrefix)) {
      return this.provideMethodCompletions();
    }

    // We only complete inside comment lines (lines starting with optional
    // whitespace followed by `--`).
    if (!/^\s*--/.test(linePrefix)) {
      return undefined;
    }

    // Strip leading whitespace + `--` + optional whitespace to get the
    // directive portion the user is currently typing.
    const afterDashes = linePrefix.replace(/^\s*--\s*/, '');

    // --- Case 1: user is typing the directive name (starts with `@`) ---
    if (afterDashes === '' || (afterDashes.startsWith('@') && !afterDashes.includes(' '))) {
      return DIRECTIVES.map((d, i) => {
        const item = new vscode.CompletionItem(d.label, vscode.CompletionItemKind.Keyword);
        item.detail = d.detail;
        item.insertText = new vscode.SnippetString(d.snippet);
        item.sortText = String(i).padStart(2, '0');
        // Replace anything the user already typed after `-- `
        const startCol = linePrefix.length - afterDashes.length;
        item.range = new vscode.Range(position.line, startCol, position.line, position.character);
        return item;
      });
    }

    // --- Case 2: user is typing rule names after a directive ---
    // Check if the text before cursor starts with a directive that accepts rules.
    for (const directive of RULE_LIST_DIRECTIVES) {
      if (afterDashes.startsWith(directive)) {
        const afterDirective = afterDashes.slice(directive.length);

        // We expect either a space or a comma before the next rule name.
        // Find what the user has typed for the current rule fragment.
        const lastSep = Math.max(afterDirective.lastIndexOf(','), afterDirective.lastIndexOf(' '));
        const fragment = afterDirective.slice(lastSep + 1).trim();

        // Build completion items for all rule names.
        const ruleNames = Object.keys(rules);
        const startCol = position.character - fragment.length;

        return ruleNames.map((name) => {
          const rule = rules[name];
          const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.EnumMember);
          item.detail = rule.description;
          item.range = new vscode.Range(position.line, startCol, position.line, position.character);
          return item;
        });
      }
    }

    return undefined;
  }

  private provideKeywordCompletions(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const lines: string[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      lines.push(document.lineAt(i).text);
    }

    // Suppress completions inside *html blocks
    if (isInsideHtmlBlock(lines, position.line)) {
      return undefined;
    }

    const items: vscode.CompletionItem[] = [];
    const parent = findParentKeyword(lines, position.line);

    if (parent && KEYWORD_SPECS[parent]?.subKeywords) {
      // Priority group: sub-keywords of the parent
      const subKeywords = KEYWORD_SPECS[parent].subKeywords!;
      let subIndex = 0;
      for (const [name, spec] of Object.entries(subKeywords)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
        let detail = spec.description ?? '';
        if (spec.enumValues) {
          detail += (detail ? ' ' : '') + `(${spec.enumValues.join(', ')})`;
        }
        item.detail = detail;
        item.sortText = String(subIndex).padStart(3, '0');
        items.push(item);
        subIndex++;
      }

      // Secondary group: all top-level keywords
      let topIndex = 0;
      for (const [name, spec] of Object.entries(KEYWORD_SPECS)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
        item.detail = spec.description;
        item.sortText = '1' + String(topIndex).padStart(2, '0');
        items.push(item);
        topIndex++;
      }
    } else {
      // No parent context: show all top-level keywords
      let topIndex = 0;
      for (const [name, spec] of Object.entries(KEYWORD_SPECS)) {
        const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Keyword);
        item.detail = spec.description;
        item.sortText = '0' + String(topIndex).padStart(2, '0');
        items.push(item);
        topIndex++;
      }
    }

    return items;
  }

  private provideMethodCompletions(): vscode.CompletionItem[] {
    const methods = cachedMethodData;

    return methods.map((method, index) => {
      const kind = method.hasParams
        ? vscode.CompletionItemKind.Method
        : vscode.CompletionItemKind.Property;
      const item = new vscode.CompletionItem(method.name, kind);
      item.detail = method.types.join(' / ');
      item.documentation = method.description;
      item.insertText = new vscode.SnippetString(method.snippet);
      item.sortText = String(index).padStart(3, '0');
      return item;
    });
  }
}
