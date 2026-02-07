import type { FormatterConfig } from '../types.js';
import { DEFAULT_FORMATTER_CONFIG } from '../types.js';
import { tokenize, Token, TokenType } from '../lexer/index.js';
import { parseDirectives, isFormatDisabled } from '../linter/directives.js';

export class Formatter {
  private config: FormatterConfig;

  constructor(config: Partial<FormatterConfig> = {}) {
    this.config = {
      ...DEFAULT_FORMATTER_CONFIG,
      ...config,
    };
  }

  format(source: string): string {
    const lines = source.split('\n');
    const formattedLines: string[] = [];
    let consecutiveBlankLines = 0;

    // Parse directives to respect gtformat-disable regions
    const directives = parseDirectives(source);

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const lineNum = i + 1; // 1-indexed

      // Skip formatting if this line is in a disabled region
      if (isFormatDisabled(directives, lineNum)) {
        formattedLines.push(line);
        const isBlank = line.trim() === '';
        if (isBlank) {
          consecutiveBlankLines++;
        } else {
          consecutiveBlankLines = 0;
        }
        continue;
      }

      // Trim trailing whitespace
      if (this.config.trimTrailingWhitespace) {
        line = line.replace(/[ \t]+$/, '');
      }

      // Check if current line is blank
      const isBlank = line.trim() === '';

      // Skip excess blank lines (keep at most 1)
      if (isBlank) {
        consecutiveBlankLines++;
        if (consecutiveBlankLines > 1) {
          continue; // Skip this blank line
        }
      } else {
        consecutiveBlankLines = 0;
      }

      // Format the line content
      line = this.formatLine(line);

      formattedLines.push(line);
    }

    let result = formattedLines.join('\n');

    // Ensure final newline
    if (this.config.insertFinalNewline && !result.endsWith('\n')) {
      result += '\n';
    }

    return result;
  }

  private formatLine(line: string): string {
    // Preserve indentation
    let indent = '';
    let content = line;
    let i = 0;
    while (i < line.length && line[i] === '\t') {
      indent += '\t';
      i++;
    }
    content = line.slice(i);

    // Skip blank lines and comments
    if (content.trim() === '' || content.trim().startsWith('--')) {
      return line;
    }

    // Determine if this is a text line (not an expression or keyword line)
    const isTextLine = !content.startsWith('>>') && !content.startsWith('*');

    // Format expression lines (>> ...)
    if (content.startsWith('>>')) {
      // Ensure exactly one space after >>
      content = content.replace(/^>>\s*/, '>> ');
      content = this.formatExpression(content);
    }

    // Format keyword lines (*keyword: ...)
    if (content.startsWith('*')) {
      content = this.formatKeywordLine(content);
    }

    // Format array/object literals
    content = this.formatLiterals(content, isTextLine);

    return indent + content;
  }

  private formatExpression(content: string): string {
    // Simple formatting for expressions
    let result = content;

    // First, normalize whitespace (collapse multiple spaces to one)
    // But preserve the >> prefix
    const prefix = '>> ';
    const expressionPart = result.slice(prefix.length);
    result = prefix + this.normalizeWhitespace(expressionPart).trim();

    // Space around operators
    if (this.config.spaceAroundOperators) {
      // Comparison, arithmetic, and assignment (but not in strings)
      result = this.formatOperatorsOutsideStrings(result);
    }

    return result;
  }

  private formatOperatorsOutsideStrings(content: string): string {
    const operators = ['+', '-', '*', '/', '%', '<', '>', '<=', '>=', '='];
    let result = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const next = content[i + 1] || '';
      const prev = content[i - 1] || '';

      // Handle string boundaries
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = '';
        result += ch;
        continue;
      }

      // If in string, just add character
      if (inString) {
        result += ch;
        continue;
      }

      // Handle arrow
      if (ch === '-' && next === '>') {
        if (this.config.spaceAroundArrow) {
          // Ensure space before
          if (result.length > 0 && result[result.length - 1] !== ' ') {
            result += ' ';
          }
          result += '->';
          // Ensure space after
          if (content[i + 2] && content[i + 2] !== ' ') {
            result += ' ';
          }
          i++; // Skip >
          continue;
        }
      }

      // Handle <=, >=
      if ((ch === '<' || ch === '>') && next === '=') {
        if (result.length > 0 && result[result.length - 1] !== ' ') {
          result += ' ';
        }
        result += ch + '=';
        if (content[i + 2] && content[i + 2] !== ' ') {
          result += ' ';
        }
        i++;
        continue;
      }

      // Handle operators
      if (this.config.spaceAroundOperators && operators.includes(ch) && !operators.includes(next)) {
        // Don't add spaces around - when it's a negative number
        if (ch === '-' && /\d/.test(next) && (prev === '' || prev === '(' || prev === '[' || prev === ',' || prev === '=' || prev === ' ')) {
          result += ch;
          continue;
        }

        // Don't add spaces in >>
        if (ch === '>' && prev === '>') {
          result += ch;
          continue;
        }

        // Ensure space before
        if (result.length > 0 && result[result.length - 1] !== ' ') {
          result += ' ';
        }
        result += ch;
        // Ensure space after
        if (next && next !== ' ' && next !== '\n') {
          result += ' ';
        }
        continue;
      }

      result += ch;
    }

    return result;
  }

  private getSpaceForBracket(bracket: string): number {
    switch (bracket) {
      case '{': case '}': return this.config.spaceInsideBraces;
      case '[': case ']': return this.config.spaceInsideBrackets;
      case '(': case ')': return this.config.spaceInsideParens;
      default: return 0;
    }
  }

  private formatLiterals(content: string, isTextLine: boolean = false): string {
    let result = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const next = content[i + 1] || '';
      const prev = content[i - 1] || '';

      // Handle string boundaries
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = '';
        result += ch;
        continue;
      }

      // If in string, just add character
      if (inString) {
        result += ch;
        continue;
      }

      // Handle commas
      if (ch === ',' && this.config.spaceAfterComma) {
        result += ch;
        if (next && next !== ' ' && next !== '\n') {
          result += ' ';
        }
        continue;
      }

      // Handle opening brackets: normalize spaces after them
      if (ch === '[' || ch === '(' || ch === '{') {
        result += ch;
        // Skip all existing spaces after opening bracket
        while (i + 1 < content.length && content[i + 1] === ' ') {
          i++;
        }
        // Find the matching closing bracket to check for empty pairs
        const closingBracket = ch === '{' ? '}' : ch === '[' ? ']' : ')';
        if (content[i + 1] !== closingBracket) {
          // On text lines, don't add spaces (braces are interpolation)
          const spaces = isTextLine ? 0 : this.getSpaceForBracket(ch);
          if (spaces > 0) {
            result += ' '.repeat(spaces);
          }
        }
        continue;
      }

      // Handle spaces before closing brackets: normalize them
      if (ch === ']' || ch === ')' || ch === '}') {
        // Remove any trailing spaces before the closing bracket
        while (result.length > 0 && result[result.length - 1] === ' ') {
          result = result.slice(0, -1);
        }
        // Find the matching opening bracket to check for empty pairs
        const openingBracket = ch === '}' ? '{' : ch === ']' ? '[' : '(';
        if (result.length > 0 && result[result.length - 1] !== openingBracket) {
          // On text lines, don't add spaces (braces are interpolation)
          const spaces = isTextLine ? 0 : this.getSpaceForBracket(ch);
          if (spaces > 0) {
            result += ' '.repeat(spaces);
          }
        }
        result += ch;
        continue;
      }

      result += ch;
    }

    return result;
  }

  private formatKeywordLine(content: string): string {
    // Match keyword pattern: *keyword: expression/text
    const colonIndex = content.indexOf(':');
    if (colonIndex === -1) {
      // No colon, just return as-is (e.g., answer options like "* Option")
      return content;
    }

    const keywordPart = content.slice(0, colonIndex + 1); // e.g., "*if:"
    let expressionPart = content.slice(colonIndex + 1); // e.g., " x > 7"

    // Keywords that require expressions (should normalize whitespace)
    const expressionKeywords = [
      'if', 'while', 'for', 'repeat', 'goto', 'return', 'set', 'wait',
      'program', 'component', 'service', 'trigger', 'switch'
    ];

    // Extract keyword name (remove * and :)
    const keywordName = keywordPart.slice(1, -1).trim();

    // Check if this keyword requires expression formatting
    if (expressionKeywords.includes(keywordName)) {
      // Normalize whitespace in the expression part
      expressionPart = this.normalizeWhitespace(expressionPart);
    } else {
      // For text-based keywords (like *question:, *header:), just trim leading space
      expressionPart = expressionPart.replace(/^\s+/, ' ');
    }

    return keywordPart + expressionPart;
  }

  private normalizeWhitespace(expression: string): string {
    // This function normalizes excess whitespace while preserving string content
    let result = '';
    let inString = false;
    let stringChar = '';
    let lastWasSpace = false;

    const trimmed = expression.trim();

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];

      // Handle string boundaries
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        lastWasSpace = false;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = '';
        result += ch;
        lastWasSpace = false;
        continue;
      }

      // If in string, preserve all whitespace
      if (inString) {
        result += ch;
        continue;
      }

      // Normalize whitespace outside strings
      if (ch === ' ' || ch === '\t') {
        if (!lastWasSpace && result.length > 0) {
          result += ' ';
          lastWasSpace = true;
        }
        continue;
      }

      result += ch;
      lastWasSpace = false;
    }

    return ' ' + result;
  }
}

export function format(source: string, config?: Partial<FormatterConfig>): string {
  const formatter = new Formatter(config);
  return formatter.format(source);
}
