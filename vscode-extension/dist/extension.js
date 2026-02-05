"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode5 = __toESM(require("vscode"));

// src/configuration.ts
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs"));

// ../dist/lexer/tokens.js
var TokenType;
(function(TokenType2) {
  TokenType2["NEWLINE"] = "NEWLINE";
  TokenType2["INDENT"] = "INDENT";
  TokenType2["DEDENT"] = "DEDENT";
  TokenType2["EOF"] = "EOF";
  TokenType2["KEYWORD"] = "KEYWORD";
  TokenType2["SUB_KEYWORD"] = "SUB_KEYWORD";
  TokenType2["EXPRESSION_START"] = "EXPRESSION_START";
  TokenType2["LABEL_DEF"] = "LABEL_DEF";
  TokenType2["STRING"] = "STRING";
  TokenType2["NUMBER"] = "NUMBER";
  TokenType2["OPERATOR"] = "OPERATOR";
  TokenType2["ARROW"] = "ARROW";
  TokenType2["LPAREN"] = "LPAREN";
  TokenType2["RPAREN"] = "RPAREN";
  TokenType2["LBRACKET"] = "LBRACKET";
  TokenType2["RBRACKET"] = "RBRACKET";
  TokenType2["LBRACE"] = "LBRACE";
  TokenType2["RBRACE"] = "RBRACE";
  TokenType2["COMMA"] = "COMMA";
  TokenType2["DOT"] = "DOT";
  TokenType2["COLON"] = "COLON";
  TokenType2["DOUBLE_COLON"] = "DOUBLE_COLON";
  TokenType2["IDENTIFIER"] = "IDENTIFIER";
  TokenType2["TEXT"] = "TEXT";
  TokenType2["COMMENT"] = "COMMENT";
  TokenType2["INTERPOLATION_START"] = "INTERPOLATION_START";
  TokenType2["INTERPOLATION_END"] = "INTERPOLATION_END";
  TokenType2["ERROR"] = "ERROR";
})(TokenType || (TokenType = {}));
function createToken(type, value, line, column, offset, endLine, endColumn, endOffset) {
  return {
    type,
    value,
    line,
    column,
    offset,
    endLine,
    endColumn,
    endOffset
  };
}
var KEYWORDS = /* @__PURE__ */ new Set([
  "audio",
  "button",
  "chart",
  "clear",
  "component",
  "database",
  "email",
  "events",
  "experiment",
  "for",
  "goto",
  "group",
  "header",
  "html",
  "if",
  "image",
  "label",
  "list",
  "login",
  "maintain",
  "navigation",
  "page",
  "points",
  "program",
  "progress",
  "purchase",
  "question",
  "quit",
  "randomize",
  "repeat",
  "return",
  "service",
  "set",
  "settings",
  "share",
  "summary",
  "switch",
  "trigger",
  "video",
  "wait",
  "while"
]);
var SUB_KEYWORDS = /* @__PURE__ */ new Set([
  "after",
  "answers",
  "before",
  "blank",
  "body",
  "cancel",
  "caption",
  "classes",
  "click",
  "confirm",
  "countdown",
  "data",
  "date",
  "default",
  "description",
  "error",
  "every",
  "everytime",
  "frequency",
  "hide",
  "icon",
  "identifier",
  "management",
  "max",
  "method",
  "min",
  "multiple",
  "name",
  "other",
  "path",
  "placeholder",
  "required",
  "reset",
  "save",
  "searchable",
  "send",
  "shuffle",
  "start",
  "startup",
  "status",
  "subject",
  "success",
  "tags",
  "throwaway",
  "time",
  "tip",
  "to",
  "trendline",
  "type",
  "until",
  "what",
  "when",
  "with",
  "xaxis",
  "yaxis"
]);
var OPERATORS = /* @__PURE__ */ new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "=",
  "<",
  ">",
  "<=",
  ">=",
  "and",
  "or",
  "not",
  "in"
]);

// ../dist/lexer/lexer.js
var Lexer = class {
  source;
  pos = 0;
  line = 1;
  column = 1;
  tokens = [];
  indentStack = [0];
  atLineStart = true;
  constructor(source) {
    this.source = source;
  }
  tokenize() {
    this.tokens = [];
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.indentStack = [0];
    this.atLineStart = true;
    while (!this.isAtEnd()) {
      this.scanToken();
    }
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.tokens.push(createToken(TokenType.DEDENT, "", this.line, this.column, this.pos, this.line, this.column, this.pos));
    }
    this.tokens.push(createToken(TokenType.EOF, "", this.line, this.column, this.pos, this.line, this.column, this.pos));
    return this.tokens;
  }
  scanToken() {
    if (this.atLineStart) {
      this.handleIndentation();
      this.atLineStart = false;
      if (this.isAtEnd())
        return;
    }
    const ch = this.peek();
    if (ch === "\n") {
      this.emitToken(TokenType.NEWLINE, "\n");
      this.advance();
      this.line++;
      this.column = 1;
      this.atLineStart = true;
      return;
    }
    if (ch === "\r") {
      this.advance();
      if (this.peek() === "\n") {
        this.emitToken(TokenType.NEWLINE, "\r\n");
        this.advance();
      } else {
        this.emitToken(TokenType.NEWLINE, "\r");
      }
      this.line++;
      this.column = 1;
      this.atLineStart = true;
      return;
    }
    if (ch === " ") {
      this.advance();
      return;
    }
    if (ch === "-" && this.peekNext() === "-") {
      this.scanComment();
      return;
    }
    if (ch === ">" && this.peekNext() === ">") {
      const startLine = this.line;
      const startCol = this.column;
      const startOffset = this.pos;
      this.advance();
      this.advance();
      this.tokens.push(createToken(TokenType.EXPRESSION_START, ">>", startLine, startCol, startOffset, this.line, this.column, this.pos));
      this.scanExpression();
      return;
    }
    if (ch === "*") {
      this.scanKeyword();
      return;
    }
    if (ch === "/") {
      this.scanItalic();
      return;
    }
    if (ch === '"') {
      this.scanString(ch);
      return;
    }
    if (this.isAlpha(ch)) {
      this.scanIdentifierOrText();
      return;
    }
    this.scanText();
  }
  handleIndentation() {
    let indent = 0;
    const startOffset = this.pos;
    while (!this.isAtEnd() && this.peek() === "	") {
      indent++;
      this.advance();
    }
    if (this.peek() === "\n" || this.peek() === "\r" || this.isAtEnd()) {
      return;
    }
    const currentIndent = this.indentStack[this.indentStack.length - 1];
    if (indent > currentIndent) {
      this.indentStack.push(indent);
      this.tokens.push(createToken(TokenType.INDENT, "	".repeat(indent - currentIndent), this.line, 1, startOffset, this.line, this.column, this.pos));
    } else if (indent < currentIndent) {
      while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
        this.indentStack.pop();
        this.tokens.push(createToken(TokenType.DEDENT, "", this.line, 1, startOffset, this.line, this.column, this.pos));
      }
    }
  }
  scanKeyword() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    this.advance();
    const lookAheadPos = this.pos;
    let foundClosingAsterisk = false;
    let foundColon = false;
    let tempPos = this.pos;
    while (tempPos < this.source.length) {
      const ch = this.source[tempPos];
      if (ch === "\n" || ch === "\r")
        break;
      if (ch === "*") {
        foundClosingAsterisk = true;
        break;
      }
      if (ch === ":") {
        foundColon = true;
        break;
      }
      tempPos++;
    }
    if (foundClosingAsterisk && !foundColon) {
      let value2 = "*";
      while (!this.isAtEnd() && this.peek() !== "*" && this.peek() !== "\n" && this.peek() !== "\r") {
        const ch = this.peek();
        if (ch === "{") {
          if (value2.length > 1) {
            this.tokens.push(createToken(TokenType.TEXT, value2, startLine, startCol, startOffset, this.line, this.column, this.pos));
            value2 = "";
          }
          this.scanInterpolation();
          if (!this.isAtEnd() && this.peek() !== "*" && this.peek() !== "\n" && this.peek() !== "\r") {
            const newStartLine = this.line;
            const newStartCol = this.column;
            const newStartOffset = this.pos;
            value2 = "";
            while (!this.isAtEnd() && this.peek() !== "*" && this.peek() !== "{" && this.peek() !== "\n" && this.peek() !== "\r") {
              value2 += this.peek();
              this.advance();
            }
            if (value2) {
              this.tokens.push(createToken(TokenType.TEXT, value2, newStartLine, newStartCol, newStartOffset, this.line, this.column, this.pos));
            }
          }
          continue;
        }
        value2 += ch;
        this.advance();
      }
      if (value2.length > 1 || value2.length === 1 && value2 !== "*") {
        this.tokens.push(createToken(TokenType.TEXT, value2, startLine, startCol, startOffset, this.line, this.column, this.pos));
      }
      if (!this.isAtEnd() && this.peek() === "*") {
        this.tokens.push(createToken(TokenType.TEXT, "*", this.line, this.column, this.pos, this.line, this.column + 1, this.pos + 1));
        this.advance();
      }
      if (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
        this.scanText();
      }
      return;
    }
    const nameStart = this.pos;
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "-" || this.peek() === "_")) {
      this.advance();
    }
    const name = this.source.slice(nameStart, this.pos).toLowerCase();
    let hasColon = false;
    if (this.peek() === ":") {
      hasColon = true;
      this.advance();
    }
    const currentIndent = this.indentStack[this.indentStack.length - 1];
    const isSubKeyword = currentIndent > 0 && SUB_KEYWORDS.has(name);
    const tokenType = isSubKeyword ? TokenType.SUB_KEYWORD : TokenType.KEYWORD;
    const value = "*" + name + (hasColon ? ":" : "");
    this.tokens.push(createToken(tokenType, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    if (hasColon) {
      this.skipSpaces();
      if (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
        this.scanKeywordArgument(name);
      }
    }
  }
  scanItalic() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    this.advance();
    let foundClosingSlash = false;
    let tempPos = this.pos;
    while (tempPos < this.source.length) {
      const ch = this.source[tempPos];
      if (ch === "\n" || ch === "\r")
        break;
      if (ch === "/") {
        foundClosingSlash = true;
        break;
      }
      tempPos++;
    }
    if (foundClosingSlash) {
      let value = "/";
      while (!this.isAtEnd() && this.peek() !== "/" && this.peek() !== "\n" && this.peek() !== "\r") {
        const ch = this.peek();
        if (ch === "{") {
          if (value.length > 1) {
            this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            value = "";
          }
          this.scanInterpolation();
          if (!this.isAtEnd() && this.peek() !== "/" && this.peek() !== "\n" && this.peek() !== "\r") {
            const newStartLine = this.line;
            const newStartCol = this.column;
            const newStartOffset = this.pos;
            value = "";
            while (!this.isAtEnd() && this.peek() !== "/" && this.peek() !== "{" && this.peek() !== "\n" && this.peek() !== "\r") {
              value += this.peek();
              this.advance();
            }
            if (value) {
              this.tokens.push(createToken(TokenType.TEXT, value, newStartLine, newStartCol, newStartOffset, this.line, this.column, this.pos));
            }
          }
          continue;
        }
        value += ch;
        this.advance();
      }
      if (value.length > 1 || value.length === 1 && value !== "/") {
        this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
      }
      if (!this.isAtEnd() && this.peek() === "/") {
        this.tokens.push(createToken(TokenType.TEXT, "/", this.line, this.column, this.pos, this.line, this.column + 1, this.pos + 1));
        this.advance();
      }
      if (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
        this.scanText();
      }
      return;
    }
    this.scanText();
  }
  scanKeywordArgument(keywordName) {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    const noFormattingKeywords = /* @__PURE__ */ new Set([
      "audio",
      "video",
      "image",
      "path",
      "goto",
      "program",
      "label",
      "trigger",
      "identifier",
      "save",
      "method",
      "what",
      "when",
      "until",
      "every",
      "experiment",
      "name",
      "to",
      "subject",
      "type",
      "data",
      "xaxis",
      "yaxis",
      "icon",
      "status"
    ]);
    const allowFormatting = !noFormattingKeywords.has(keywordName);
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      const ch = this.peek();
      if (ch === "{") {
        if (value.trim()) {
          this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
          value = "";
        }
        this.scanInterpolation();
        continue;
      }
      if (allowFormatting && ch === "*" && this.peekNext() !== " ") {
        let tempPos = this.pos + 1;
        let foundClosingAsterisk = false;
        while (tempPos < this.source.length) {
          const tempCh = this.source[tempPos];
          if (tempCh === "\n" || tempCh === "\r")
            break;
          if (tempCh === "*") {
            foundClosingAsterisk = true;
            break;
          }
          tempPos++;
        }
        if (foundClosingAsterisk) {
          if (value.trim()) {
            this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            value = "";
          }
          this.scanKeyword();
          continue;
        }
      }
      if (allowFormatting && ch === "/") {
        let tempPos = this.pos + 1;
        let foundClosingSlash = false;
        while (tempPos < this.source.length) {
          const tempCh = this.source[tempPos];
          if (tempCh === "\n" || tempCh === "\r")
            break;
          if (tempCh === "/") {
            foundClosingSlash = true;
            break;
          }
          tempPos++;
        }
        if (foundClosingSlash) {
          if (value.trim()) {
            this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            value = "";
          }
          this.scanItalic();
          continue;
        }
      }
      value += ch;
      this.advance();
    }
    if (value.trim()) {
      this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    }
  }
  scanExpression(stopAtCloseBrace = false) {
    this.skipSpaces();
    let braceDepth = 0;
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      const ch = this.peek();
      if (stopAtCloseBrace && ch === "}" && braceDepth === 0)
        return;
      if (ch === " ") {
        this.advance();
        continue;
      }
      if (ch === "-" && this.peekNext() === "-") {
        this.scanComment();
        return;
      }
      if (ch === '"') {
        this.scanString(ch);
        continue;
      }
      if (this.isDigit(ch)) {
        this.scanNumber();
        continue;
      }
      if (ch === "-" && this.peekNext() === ">") {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        this.advance();
        this.advance();
        this.tokens.push(createToken(TokenType.ARROW, "->", startLine, startCol, startOffset, this.line, this.column, this.pos));
        continue;
      }
      if (ch === "(") {
        this.emitToken(TokenType.LPAREN, ch);
        this.advance();
        continue;
      }
      if (ch === ")") {
        this.emitToken(TokenType.RPAREN, ch);
        this.advance();
        continue;
      }
      if (ch === "[") {
        this.emitToken(TokenType.LBRACKET, ch);
        this.advance();
        continue;
      }
      if (ch === "]") {
        this.emitToken(TokenType.RBRACKET, ch);
        this.advance();
        continue;
      }
      if (ch === "{") {
        braceDepth++;
        this.emitToken(TokenType.LBRACE, ch);
        this.advance();
        continue;
      }
      if (ch === "}") {
        braceDepth--;
        this.emitToken(TokenType.RBRACE, ch);
        this.advance();
        continue;
      }
      if (ch === ",") {
        this.emitToken(TokenType.COMMA, ch);
        this.advance();
        continue;
      }
      if (ch === ".") {
        this.emitToken(TokenType.DOT, ch);
        this.advance();
        continue;
      }
      if (ch === ":" && this.peekNext() === ":") {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        this.advance();
        this.advance();
        this.tokens.push(createToken(TokenType.DOUBLE_COLON, "::", startLine, startCol, startOffset, this.line, this.column, this.pos));
        continue;
      }
      if ("+-*/%=".includes(ch)) {
        this.emitToken(TokenType.OPERATOR, ch);
        this.advance();
        continue;
      }
      if (ch === "<") {
        if (this.peekNext() === "=") {
          const startLine = this.line;
          const startCol = this.column;
          const startOffset = this.pos;
          this.advance();
          this.advance();
          this.tokens.push(createToken(TokenType.OPERATOR, "<=", startLine, startCol, startOffset, this.line, this.column, this.pos));
        } else {
          this.emitToken(TokenType.OPERATOR, ch);
          this.advance();
        }
        continue;
      }
      if (ch === ">") {
        if (this.peekNext() === "=") {
          const startLine = this.line;
          const startCol = this.column;
          const startOffset = this.pos;
          this.advance();
          this.advance();
          this.tokens.push(createToken(TokenType.OPERATOR, ">=", startLine, startCol, startOffset, this.line, this.column, this.pos));
        } else {
          this.emitToken(TokenType.OPERATOR, ch);
          this.advance();
        }
        continue;
      }
      if (this.isAlpha(ch) || ch === "_") {
        this.scanIdentifier();
        continue;
      }
      this.emitToken(TokenType.ERROR, ch);
      this.advance();
    }
  }
  scanComment() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    this.advance();
    this.advance();
    value = "--";
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      value += this.peek();
      this.advance();
    }
    this.tokens.push(createToken(TokenType.COMMENT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
  }
  scanString(quote) {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = quote;
    this.advance();
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\n" || this.peek() === "\r") {
        this.tokens.push(createToken(TokenType.ERROR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
        return;
      }
      value += this.peek();
      this.advance();
    }
    if (this.isAtEnd()) {
      this.tokens.push(createToken(TokenType.ERROR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
      return;
    }
    value += this.peek();
    this.advance();
    this.tokens.push(createToken(TokenType.STRING, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
  }
  scanNumber() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    if (this.peek() === "-") {
      value += this.peek();
      this.advance();
    }
    while (!this.isAtEnd() && this.isDigit(this.peek())) {
      value += this.peek();
      this.advance();
    }
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      value += this.peek();
      this.advance();
      while (!this.isAtEnd() && this.isDigit(this.peek())) {
        value += this.peek();
        this.advance();
      }
    }
    this.tokens.push(createToken(TokenType.NUMBER, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
  }
  scanIdentifier() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "_")) {
      value += this.peek();
      this.advance();
    }
    const lower = value.toLowerCase();
    if (OPERATORS.has(lower)) {
      this.tokens.push(createToken(TokenType.OPERATOR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    } else {
      this.tokens.push(createToken(TokenType.IDENTIFIER, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    }
  }
  scanIdentifierOrText() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === "_")) {
      value += this.peek();
      this.advance();
    }
    const lower = value.toLowerCase();
    if (OPERATORS.has(lower)) {
      this.tokens.push(createToken(TokenType.OPERATOR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    } else {
      while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
        const ch = this.peek();
        if (ch === "{") {
          if (value.trim()) {
            this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            value = "";
          }
          this.scanInterpolation();
          continue;
        }
        value += ch;
        this.advance();
      }
      if (value.trim()) {
        this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
      }
    }
  }
  scanText() {
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    let value = "";
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      const ch = this.peek();
      if (ch === "{") {
        if (value.trim()) {
          this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
          value = "";
        }
        this.scanInterpolation();
        continue;
      }
      value += ch;
      this.advance();
    }
    if (value.trim()) {
      this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    }
  }
  scanInterpolation() {
    this.emitToken(TokenType.INTERPOLATION_START, "{");
    this.advance();
    this.scanExpression(true);
    if (!this.isAtEnd() && this.peek() === "}") {
      this.emitToken(TokenType.INTERPOLATION_END, "}");
      this.advance();
    }
  }
  emitToken(type, value) {
    this.tokens.push(createToken(type, value, this.line, this.column, this.pos, this.line, this.column + value.length, this.pos + value.length));
  }
  skipSpaces() {
    while (!this.isAtEnd() && this.peek() === " ") {
      this.advance();
    }
  }
  peek() {
    if (this.isAtEnd())
      return "\0";
    return this.source[this.pos];
  }
  peekNext() {
    if (this.pos + 1 >= this.source.length)
      return "\0";
    return this.source[this.pos + 1];
  }
  advance() {
    const ch = this.source[this.pos];
    this.pos++;
    this.column++;
    return ch;
  }
  isAtEnd() {
    return this.pos >= this.source.length;
  }
  isDigit(ch) {
    return ch >= "0" && ch <= "9";
  }
  isAlpha(ch) {
    return ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z" || ch === "_";
  }
  isAlphaNumeric(ch) {
    return this.isAlpha(ch) || this.isDigit(ch);
  }
};
function tokenize(source) {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}

// ../dist/parser/ast.js
function createProgram(body, loc) {
  return { type: "Program", body, loc };
}
function createKeywordStatement(keyword, argument, subKeywords, body, loc) {
  return { type: "KeywordStatement", keyword, argument, subKeywords, body, loc };
}
function createSubKeyword(keyword, argument, body, loc) {
  return { type: "SubKeyword", keyword, argument, body, loc };
}
function createExpressionStatement(expression, loc) {
  return { type: "ExpressionStatement", expression, loc };
}
function createTextStatement(parts, loc) {
  return { type: "TextStatement", parts, loc };
}
function createTextContent(parts, loc) {
  return { type: "TextContent", parts, loc };
}
function createCommentStatement(value, loc) {
  return { type: "CommentStatement", value, loc };
}
function createAnswerOption(text, body, loc) {
  return { type: "AnswerOption", text, body, loc };
}
function createBinaryExpression(operator, left, right, loc) {
  return { type: "BinaryExpression", operator, left, right, loc };
}
function createUnaryExpression(operator, argument, loc) {
  return { type: "UnaryExpression", operator, argument, loc };
}
function createMemberExpression(object, property, loc, computed = false) {
  return { type: "MemberExpression", object, property, computed, loc };
}
function createCallExpression(callee, args, loc) {
  return { type: "CallExpression", callee, arguments: args, loc };
}
function createIndexExpression(object, index, loc) {
  return { type: "IndexExpression", object, index, loc };
}
function createIdentifier(name, loc) {
  return { type: "Identifier", name, loc };
}
function createLiteral(value, raw, loc) {
  return { type: "Literal", value, raw, loc };
}
function createArrayExpression(elements, loc) {
  return { type: "ArrayExpression", elements, loc };
}
function createObjectExpression(properties, loc) {
  return { type: "ObjectExpression", properties, loc };
}
function createProperty(key, value, loc) {
  return { type: "Property", key, value, loc };
}

// ../dist/parser/parser.js
var Parser = class {
  tokens = [];
  pos = 0;
  errors = [];
  parse(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.errors = [];
    const body = this.parseStatements(0);
    const loc = this.createLoc(tokens[0], tokens[tokens.length - 1]);
    return createProgram(body, loc);
  }
  getErrors() {
    return this.errors;
  }
  parseStatements(minIndent) {
    const statements = [];
    while (!this.isAtEnd()) {
      while (this.check(TokenType.NEWLINE)) {
        this.advance();
      }
      if (this.isAtEnd())
        break;
      if (this.check(TokenType.DEDENT)) {
        this.advance();
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }
    return statements;
  }
  parseStatement() {
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    if (this.isAtEnd() || this.check(TokenType.EOF)) {
      return null;
    }
    const token = this.peek();
    if (this.check(TokenType.COMMENT)) {
      return this.parseComment();
    }
    if (this.check(TokenType.EXPRESSION_START)) {
      return this.parseExpressionStatement();
    }
    if (this.check(TokenType.KEYWORD)) {
      return this.parseKeywordStatement();
    }
    if (this.check(TokenType.TEXT) || this.check(TokenType.IDENTIFIER) || this.check(TokenType.INTERPOLATION_START)) {
      return this.parseTextOrAnswerOption();
    }
    if (this.check(TokenType.INDENT)) {
      this.advance();
      return null;
    }
    this.advance();
    return null;
  }
  parseComment() {
    const token = this.advance();
    return createCommentStatement(token.value, this.createLocFromToken(token));
  }
  parseExpressionStatement() {
    const startToken = this.advance();
    const expr = this.parseExpression();
    return createExpressionStatement(expr, this.createLoc(startToken, this.previous()));
  }
  parseKeywordStatement() {
    const keywordToken = this.advance();
    const keyword = this.extractKeywordName(keywordToken.value);
    const startToken = keywordToken;
    const expressionKeywords = ["if", "while", "for", "wait"];
    let argument = null;
    if (this.check(TokenType.TEXT) || this.check(TokenType.INTERPOLATION_START)) {
      if (expressionKeywords.includes(keyword)) {
        const textToken = this.advance();
        argument = this.parseTextAsExpression(textToken.value, textToken);
      } else {
        argument = this.parseTextContent();
      }
    } else if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF) && !this.isAtEnd()) {
      if (expressionKeywords.includes(keyword)) {
        argument = this.parseExpression();
      } else if (this.check(TokenType.IDENTIFIER)) {
        argument = this.parseTextContent();
      }
    }
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    const subKeywords = [];
    const body = [];
    if (this.check(TokenType.INDENT)) {
      this.advance();
      this.parseKeywordBody(subKeywords, body);
    }
    return createKeywordStatement(keyword, argument, subKeywords, body, this.createLoc(startToken, this.previous()));
  }
  parseKeywordBody(subKeywords, body) {
    while (!this.isAtEnd() && !this.check(TokenType.DEDENT)) {
      while (this.check(TokenType.NEWLINE)) {
        this.advance();
      }
      if (this.isAtEnd() || this.check(TokenType.DEDENT))
        break;
      if (this.check(TokenType.SUB_KEYWORD)) {
        subKeywords.push(this.parseSubKeyword());
        continue;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        body.push(stmt);
      }
    }
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
  }
  parseSubKeyword() {
    const keywordToken = this.advance();
    const keyword = this.extractKeywordName(keywordToken.value);
    const startToken = keywordToken;
    let argument = null;
    if (this.check(TokenType.TEXT) || this.check(TokenType.INTERPOLATION_START) || this.check(TokenType.IDENTIFIER)) {
      argument = this.parseTextContent();
    }
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    const body = [];
    if (this.check(TokenType.INDENT)) {
      this.advance();
      while (!this.isAtEnd() && !this.check(TokenType.DEDENT)) {
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
        if (this.isAtEnd() || this.check(TokenType.DEDENT))
          break;
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      }
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    }
    return createSubKeyword(keyword, argument, body, this.createLoc(startToken, this.previous()));
  }
  parseTextOrAnswerOption() {
    const textContent = this.parseTextContent();
    const startLoc = textContent.loc;
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }
    if (this.check(TokenType.INDENT)) {
      this.advance();
      const body = [];
      while (!this.isAtEnd() && !this.check(TokenType.DEDENT)) {
        while (this.check(TokenType.NEWLINE)) {
          this.advance();
        }
        if (this.isAtEnd() || this.check(TokenType.DEDENT))
          break;
        const stmt = this.parseStatement();
        if (stmt) {
          body.push(stmt);
        }
      }
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
      return createAnswerOption(textContent, body, { start: startLoc.start, end: this.previous().endLine ? { line: this.previous().endLine, column: this.previous().endColumn, offset: this.previous().endOffset } : startLoc.end });
    }
    return createTextStatement(textContent.parts, textContent.loc);
  }
  parseTextContent() {
    const parts = [];
    const startToken = this.peek();
    let endToken = startToken;
    while (this.check(TokenType.TEXT) || this.check(TokenType.IDENTIFIER) || this.check(TokenType.INTERPOLATION_START)) {
      if (this.check(TokenType.INTERPOLATION_START)) {
        this.advance();
        if (!this.check(TokenType.INTERPOLATION_END)) {
          parts.push(this.parseExpression());
        }
        if (this.check(TokenType.INTERPOLATION_END)) {
          this.advance();
        }
      } else {
        const token = this.advance();
        parts.push(token.value);
        endToken = token;
      }
    }
    return createTextContent(parts, this.createLoc(startToken, endToken));
  }
  parseExpression() {
    return this.parseAssignment();
  }
  parseAssignment() {
    const expr = this.parseOr();
    if (this.check(TokenType.OPERATOR) && this.peek().value === "=") {
      const op = this.advance();
      const right = this.parseAssignment();
      return createBinaryExpression("=", expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseOr() {
    let expr = this.parseAnd();
    while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === "or") {
      const op = this.advance();
      const right = this.parseAnd();
      expr = createBinaryExpression("or", expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseAnd() {
    let expr = this.parseEquality();
    while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === "and") {
      const op = this.advance();
      const right = this.parseEquality();
      expr = createBinaryExpression("and", expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseEquality() {
    let expr = this.parseComparison();
    while (this.check(TokenType.OPERATOR) && this.peek().value === "=") {
      const op = this.advance();
      const right = this.parseComparison();
      expr = createBinaryExpression("=", expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseComparison() {
    let expr = this.parseIn();
    while (this.check(TokenType.OPERATOR) && ["<", ">", "<=", ">="].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseIn();
      expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseIn() {
    let expr = this.parseAdditive();
    while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === "in") {
      const op = this.advance();
      const right = this.parseAdditive();
      expr = createBinaryExpression("in", expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.check(TokenType.OPERATOR) && ["+", "-"].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseMultiplicative();
      expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.check(TokenType.OPERATOR) && ["*", "/", "%"].includes(this.peek().value)) {
      const op = this.advance();
      const right = this.parseUnary();
      expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
    }
    return expr;
  }
  parseUnary() {
    if (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === "not") {
      const op = this.advance();
      const argument = this.parseUnary();
      return createUnaryExpression("not", argument, this.createLoc(op, argument.loc.end));
    }
    if (this.check(TokenType.OPERATOR) && this.peek().value === "-") {
      const op = this.advance();
      const argument = this.parseUnary();
      return createUnaryExpression("-", argument, this.createLoc(op, argument.loc.end));
    }
    return this.parsePostfix();
  }
  parsePostfix() {
    let expr = this.parsePrimary();
    while (true) {
      if (this.check(TokenType.DOT)) {
        this.advance();
        if (this.check(TokenType.IDENTIFIER)) {
          const prop = this.advance();
          const propId = createIdentifier(prop.value, this.createLocFromToken(prop));
          if (this.check(TokenType.LPAREN)) {
            this.advance();
            const args = this.parseArguments();
            if (this.check(TokenType.RPAREN)) {
              this.advance();
            }
            const member = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
            expr = createCallExpression(member, args, this.createLoc(expr.loc.start, this.previous()));
          } else {
            expr = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
          }
        }
      } else if (this.check(TokenType.LBRACKET)) {
        this.advance();
        const index = this.parseExpression();
        if (this.check(TokenType.RBRACKET)) {
          this.advance();
        }
        expr = createIndexExpression(expr, index, this.createLoc(expr.loc.start, this.previous()));
      } else if (this.check(TokenType.LPAREN)) {
        this.advance();
        const args = this.parseArguments();
        if (this.check(TokenType.RPAREN)) {
          this.advance();
        }
        expr = createCallExpression(expr, args, this.createLoc(expr.loc.start, this.previous()));
      } else if (this.check(TokenType.DOUBLE_COLON)) {
        this.advance();
        if (this.check(TokenType.IDENTIFIER)) {
          const prop = this.advance();
          const propId = createIdentifier(prop.value, this.createLocFromToken(prop));
          expr = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
          if (this.check(TokenType.LPAREN)) {
            this.advance();
            const args = this.parseArguments();
            if (this.check(TokenType.RPAREN)) {
              this.advance();
            }
            expr = createCallExpression(expr, args, this.createLoc(expr.loc.start, this.previous()));
          }
        }
      } else {
        break;
      }
    }
    return expr;
  }
  parsePrimary() {
    if (this.check(TokenType.NUMBER)) {
      const token2 = this.advance();
      const value = token2.value.includes(".") ? parseFloat(token2.value) : parseInt(token2.value, 10);
      return createLiteral(value, token2.value, this.createLocFromToken(token2));
    }
    if (this.check(TokenType.STRING)) {
      const token2 = this.advance();
      const raw = token2.value;
      const value = raw.slice(1, -1);
      return createLiteral(value, raw, this.createLocFromToken(token2));
    }
    if (this.check(TokenType.IDENTIFIER)) {
      const token2 = this.advance();
      return createIdentifier(token2.value, this.createLocFromToken(token2));
    }
    if (this.check(TokenType.LPAREN)) {
      const start = this.advance();
      const expr = this.parseExpression();
      if (this.check(TokenType.RPAREN)) {
        this.advance();
      }
      return expr;
    }
    if (this.check(TokenType.LBRACKET)) {
      return this.parseArrayLiteral();
    }
    if (this.check(TokenType.LBRACE)) {
      return this.parseObjectLiteral();
    }
    const token = this.peek();
    this.errors.push(`Unexpected token: ${token.type} "${token.value}" at line ${token.line}`);
    this.advance();
    return createLiteral(null, "", this.createLocFromToken(token));
  }
  parseArrayLiteral() {
    const start = this.advance();
    const elements = [];
    while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
      elements.push(this.parseExpression());
      if (this.check(TokenType.COMMA)) {
        this.advance();
      } else {
        break;
      }
    }
    if (this.check(TokenType.RBRACKET)) {
      this.advance();
    }
    return createArrayExpression(elements, this.createLoc(start, this.previous()));
  }
  parseObjectLiteral() {
    const start = this.advance();
    const properties = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const key = this.parseExpression();
      if (this.check(TokenType.ARROW)) {
        this.advance();
      }
      const value = this.parseExpression();
      properties.push(createProperty(key, value, this.createLoc(key.loc.start, value.loc.end)));
      if (this.check(TokenType.COMMA)) {
        this.advance();
      } else {
        break;
      }
    }
    if (this.check(TokenType.RBRACE)) {
      this.advance();
    }
    return createObjectExpression(properties, this.createLoc(start, this.previous()));
  }
  parseArguments() {
    const args = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.parseExpression());
      } while (this.check(TokenType.COMMA) && this.advance());
    }
    return args;
  }
  extractKeywordName(value) {
    let name = value;
    if (name.startsWith("*")) {
      name = name.slice(1);
    }
    if (name.endsWith(":")) {
      name = name.slice(0, -1);
    }
    return name.toLowerCase();
  }
  /**
   * Re-tokenizes and parses a text string as an expression.
   * This is used for keywords like *if:, *while:, etc. that expect expressions
   * but initially receive TEXT tokens from the lexer.
   */
  parseTextAsExpression(text, originalToken) {
    const exprSource = `>> ${text}`;
    const allTokens = tokenize(exprSource);
    const exprTokens = allTokens.filter((t) => t.type !== TokenType.EXPRESSION_START && t.type !== TokenType.EOF).map((t) => {
      const colOffset = originalToken.column - 4;
      const lineOffset = originalToken.line - 1;
      return {
        ...t,
        line: t.line + lineOffset,
        endLine: t.endLine + lineOffset,
        column: t.column + colOffset,
        endColumn: t.endColumn + colOffset,
        offset: originalToken.offset + (t.offset - 3),
        // -3 for ">> "
        endOffset: originalToken.offset + (t.endOffset - 3)
      };
    });
    const savedTokens = this.tokens;
    const savedPos = this.pos;
    this.tokens = exprTokens;
    this.pos = 0;
    const expr = this.parseExpression();
    this.tokens = savedTokens;
    this.pos = savedPos;
    return expr;
  }
  createLoc(start, end) {
    const startPos = "line" in start && "column" in start && "offset" in start && !("type" in start) ? start : { line: start.line, column: start.column, offset: start.offset };
    const endPos = "line" in end && "column" in end && "offset" in end && !("type" in end) ? end : { line: end.endLine, column: end.endColumn, offset: end.endOffset };
    return { start: startPos, end: endPos };
  }
  createLocFromToken(token) {
    return {
      start: { line: token.line, column: token.column, offset: token.offset },
      end: { line: token.endLine, column: token.endColumn, offset: token.endOffset }
    };
  }
  peek() {
    return this.tokens[this.pos];
  }
  previous() {
    return this.tokens[this.pos - 1] || this.tokens[0];
  }
  advance() {
    if (!this.isAtEnd()) {
      this.pos++;
    }
    return this.previous();
  }
  check(type) {
    if (this.isAtEnd())
      return false;
    return this.peek().type === type;
  }
  isAtEnd() {
    return this.pos >= this.tokens.length || this.peek().type === TokenType.EOF;
  }
};
function parse(tokens) {
  const parser = new Parser();
  return parser.parse(tokens);
}

// ../dist/types.js
var DEFAULT_FORMATTER_CONFIG = {
  blankLinesBetweenBlocks: 1,
  spaceAroundOperators: true,
  spaceAfterComma: true,
  spaceAroundArrow: true,
  trimTrailingWhitespace: true,
  insertFinalNewline: true
};
var DEFAULT_LINTER_CONFIG = {
  rules: {
    "no-undefined-vars": "error",
    "no-unused-vars": "warn",
    "valid-keyword": "error",
    "valid-sub-keyword": "error",
    "no-invalid-goto": "error",
    "indent-style": "error",
    "no-unclosed-string": "error",
    "no-unclosed-bracket": "error",
    "no-single-quotes": "error",
    "no-unreachable-code": "warn",
    "required-subkeywords": "error",
    "valid-subkeyword-value": "error",
    "no-inline-argument": "error",
    "goto-needs-reset-in-events": "warn",
    "purchase-subkeyword-constraints": "error"
  },
  format: DEFAULT_FORMATTER_CONFIG,
  ignore: ["**/node_modules/**", "**/dist/**"]
};

// ../dist/linter/rules/no-undefined-vars.js
var noUndefinedVars = {
  name: "no-undefined-vars",
  description: "Disallow use of undefined variables",
  severity: "error",
  create(context) {
    const definedVars = /* @__PURE__ */ new Set();
    const usedVars = [];
    const builtins = /* @__PURE__ */ new Set([
      "it",
      "true",
      "false",
      "calendar",
      "data",
      "seconds",
      "minutes",
      "hours",
      "days",
      "weeks",
      "months",
      "years"
    ]);
    function collectDefinitions(node) {
      if (!node || typeof node !== "object")
        return;
      if (node.type === "Program") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "KeywordStatement") {
        const kw = node;
        if (kw.keyword === "label" && kw.argument && kw.argument.type === "TextContent") {
          const text = kw.argument.parts.find((p) => typeof p === "string");
          if (text) {
            definedVars.add(text.trim());
          }
        }
        if (kw.keyword === "for" && kw.argument && kw.argument.type === "BinaryExpression") {
          collectForVars(kw.argument);
        }
        if (kw.keyword === "set" && kw.argument && kw.argument.type === "TextContent") {
          const text = kw.argument.parts.find((p) => typeof p === "string");
          if (text) {
            definedVars.add(text.trim());
          }
        }
        for (const sub of kw.subKeywords) {
          if (sub.keyword === "save" && sub.argument && sub.argument.type === "TextContent") {
            const text = sub.argument.parts.find((p) => typeof p === "string");
            if (text) {
              definedVars.add(text.trim());
            }
          }
          collectDefinitions(sub);
        }
        for (const stmt of kw.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "ExpressionStatement") {
        if (node.expression.type === "BinaryExpression" && node.expression.operator === "=") {
          if (node.expression.left.type === "Identifier") {
            definedVars.add(node.expression.left.name);
          }
        }
      } else if (node.type === "AnswerOption") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "SubKeyword") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      }
    }
    function collectForVars(expr) {
      if (expr.type === "BinaryExpression" && expr.operator.toLowerCase() === "in") {
        if (expr.left.type === "Identifier") {
          definedVars.add(expr.left.name);
        } else if (expr.left.type === "BinaryExpression" && expr.left.operator === ",") {
          collectForVars(expr.left);
        }
      } else if (expr.type === "Identifier") {
        definedVars.add(expr.name);
      }
    }
    function collectUsages(node, isAssignmentContext = false) {
      if (!node || typeof node !== "object")
        return;
      if (node.type === "Program") {
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "Identifier") {
        usedVars.push({
          name: node.name,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
      } else if (node.type === "KeywordStatement") {
        const kw = node;
        if (kw.argument) {
          collectUsages(kw.argument, false);
        }
        for (const sub of kw.subKeywords) {
          collectUsages(sub);
        }
        for (const stmt of kw.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "SubKeyword") {
        if (node.argument) {
          collectUsages(node.argument);
        }
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "ExpressionStatement") {
        collectUsages(node.expression, true);
      } else if (node.type === "BinaryExpression") {
        if (node.operator === "=" && isAssignmentContext) {
          collectUsages(node.right, false);
        } else {
          collectUsages(node.left, false);
          collectUsages(node.right, false);
        }
      } else if (node.type === "UnaryExpression") {
        collectUsages(node.argument, false);
      } else if (node.type === "MemberExpression") {
        collectUsages(node.object, false);
      } else if (node.type === "CallExpression") {
        collectUsages(node.callee, false);
        for (const arg of node.arguments) {
          collectUsages(arg, false);
        }
      } else if (node.type === "IndexExpression") {
        collectUsages(node.object, false);
        collectUsages(node.index, false);
      } else if (node.type === "ArrayExpression") {
        for (const elem of node.elements) {
          collectUsages(elem, false);
        }
      } else if (node.type === "ObjectExpression") {
        for (const prop of node.properties) {
          collectUsages(prop.key, false);
          collectUsages(prop.value, false);
        }
      } else if (node.type === "Literal" && typeof node.value === "string" && node.raw.startsWith('"')) {
        const regex = /\{([a-zA-Z_]\w*)/g;
        let match;
        while ((match = regex.exec(node.value)) !== null) {
          usedVars.push({
            name: match[1],
            line: node.loc.start.line,
            column: node.loc.start.column
          });
        }
      } else if (node.type === "InterpolatedString") {
        for (const part of node.parts) {
          if (typeof part !== "string") {
            collectUsages(part, false);
          }
        }
      } else if (node.type === "TextContent" || node.type === "TextStatement") {
        for (const part of node.parts) {
          if (typeof part !== "string") {
            collectUsages(part, false);
          }
        }
      } else if (node.type === "AnswerOption") {
        collectUsages(node.text, false);
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      }
    }
    return {
      Program(node) {
        collectDefinitions(node);
        collectUsages(node);
        const fromParentVars = context.getFromParentVars();
        const fromChildVars = context.getFromChildVars();
        for (const usage of usedVars) {
          if (!definedVars.has(usage.name) && !builtins.has(usage.name) && !fromParentVars.has(usage.name) && !fromChildVars.has(usage.name)) {
            context.report({
              message: `'${usage.name}' is not defined`,
              line: usage.line,
              column: usage.column
            });
          }
        }
      }
    };
  }
};

// ../dist/linter/rules/no-unused-vars.js
var noUnusedVars = {
  name: "no-unused-vars",
  description: "Warn about variables that are never used",
  severity: "warning",
  create(context) {
    const definedVars = /* @__PURE__ */ new Map();
    function addDefinition(name, line, column) {
      if (!definedVars.has(name)) {
        definedVars.set(name, { name, line, column, usages: 0 });
      }
    }
    function addUsage(name) {
      const info = definedVars.get(name);
      if (info) {
        info.usages++;
      }
    }
    function collectDefinitions(node) {
      if (!node || typeof node !== "object")
        return;
      if (node.type === "Program") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "KeywordStatement") {
        const kw = node;
        if (kw.keyword === "for" && kw.argument && kw.argument.type === "BinaryExpression") {
          collectForVars(kw.argument, kw.loc.start.line, kw.loc.start.column);
        }
        if (kw.keyword === "set" && kw.argument && kw.argument.type === "TextContent") {
          const text = kw.argument.parts.find((p) => typeof p === "string");
          if (text) {
            addDefinition(text.trim(), kw.loc.start.line, kw.loc.start.column);
          }
        }
        for (const sub of kw.subKeywords) {
          if (sub.keyword === "save" && sub.argument && sub.argument.type === "TextContent") {
            const text = sub.argument.parts.find((p) => typeof p === "string");
            if (text) {
              addDefinition(text.trim(), sub.loc.start.line, sub.loc.start.column);
            }
          }
          collectDefinitions(sub);
        }
        for (const stmt of kw.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "ExpressionStatement") {
        if (node.expression.type === "BinaryExpression" && node.expression.operator === "=") {
          if (node.expression.left.type === "Identifier") {
            addDefinition(node.expression.left.name, node.expression.left.loc.start.line, node.expression.left.loc.start.column);
          }
        }
      } else if (node.type === "AnswerOption") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      } else if (node.type === "SubKeyword") {
        for (const stmt of node.body) {
          collectDefinitions(stmt);
        }
      }
    }
    function collectForVars(expr, line, column) {
      if (expr.type === "BinaryExpression" && expr.operator.toLowerCase() === "in") {
        if (expr.left.type === "Identifier") {
          addDefinition(expr.left.name, line, column);
        } else if (expr.left.type === "BinaryExpression" && expr.left.operator === ",") {
          collectForVars(expr.left, line, column);
        }
      } else if (expr.type === "Identifier") {
        addDefinition(expr.name, line, column);
      }
    }
    function collectUsages(node) {
      if (!node || typeof node !== "object")
        return;
      if (node.type === "Program") {
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "Identifier") {
        addUsage(node.name);
      } else if (node.type === "KeywordStatement") {
        const kw = node;
        if (kw.argument) {
          collectUsages(kw.argument);
        }
        for (const sub of kw.subKeywords) {
          collectUsages(sub);
        }
        for (const stmt of kw.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "SubKeyword") {
        if (node.argument) {
          collectUsages(node.argument);
        }
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      } else if (node.type === "ExpressionStatement") {
        collectUsages(node.expression);
      } else if (node.type === "BinaryExpression") {
        if (node.operator === "=") {
          collectUsages(node.right);
        } else {
          collectUsages(node.left);
          collectUsages(node.right);
        }
      } else if (node.type === "UnaryExpression") {
        collectUsages(node.argument);
      } else if (node.type === "MemberExpression") {
        collectUsages(node.object);
      } else if (node.type === "CallExpression") {
        collectUsages(node.callee);
        for (const arg of node.arguments) {
          collectUsages(arg);
        }
      } else if (node.type === "IndexExpression") {
        collectUsages(node.object);
        collectUsages(node.index);
      } else if (node.type === "ArrayExpression") {
        for (const elem of node.elements) {
          collectUsages(elem);
        }
      } else if (node.type === "ObjectExpression") {
        for (const prop of node.properties) {
          collectUsages(prop.key);
          collectUsages(prop.value);
        }
      } else if (node.type === "Literal" && typeof node.value === "string" && node.raw.startsWith('"')) {
        const regex = /\{([a-zA-Z_]\w*)/g;
        let match;
        while ((match = regex.exec(node.value)) !== null) {
          addUsage(match[1]);
        }
      } else if (node.type === "InterpolatedString") {
        for (const part of node.parts) {
          if (typeof part !== "string") {
            collectUsages(part);
          }
        }
      } else if (node.type === "TextContent" || node.type === "TextStatement") {
        for (const part of node.parts) {
          if (typeof part !== "string") {
            collectUsages(part);
          }
        }
      } else if (node.type === "AnswerOption") {
        collectUsages(node.text);
        for (const stmt of node.body) {
          collectUsages(stmt);
        }
      }
    }
    return {
      Program(node) {
        collectDefinitions(node);
        collectUsages(node);
        const toParentVars = context.getToParentVars();
        const toChildVars = context.getToChildVars();
        for (const [name, info] of definedVars) {
          if (info.usages === 0 && !toParentVars.has(name) && !toChildVars.has(name)) {
            context.report({
              message: `'${name}' is defined but never used`,
              line: info.line,
              column: info.column
            });
          }
        }
      }
    };
  }
};

// ../dist/linter/rules/valid-keyword.js
var validKeyword = {
  name: "valid-keyword",
  description: "Ensure keywords are valid GuidedTrack keywords",
  severity: "error",
  create(context) {
    function checkKeyword(node) {
      const keyword = node.keyword.toLowerCase();
      if (!KEYWORDS.has(keyword)) {
        context.report({
          message: `'*${keyword}' is not a valid GuidedTrack keyword`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkKeyword(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/valid-sub-keyword.js
var KEYWORD_SUB_KEYWORDS = {
  audio: /* @__PURE__ */ new Set(["start", "hide"]),
  chart: /* @__PURE__ */ new Set(["type", "data", "xaxis", "yaxis", "trendline", "min", "max"]),
  component: /* @__PURE__ */ new Set(["classes", "click", "with", "header"]),
  database: /* @__PURE__ */ new Set(["what", "success", "error"]),
  email: /* @__PURE__ */ new Set(["subject", "body", "to", "when", "every", "until", "identifier", "cancel"]),
  experiment: /* @__PURE__ */ new Set(["group"]),
  goto: /* @__PURE__ */ new Set(["reset"]),
  image: /* @__PURE__ */ new Set(["caption", "description"]),
  login: /* @__PURE__ */ new Set(["required"]),
  navigation: /* @__PURE__ */ new Set(["name", "icon"]),
  purchase: /* @__PURE__ */ new Set(["status", "frequency", "management", "success", "error"]),
  question: /* @__PURE__ */ new Set([
    "type",
    "shuffle",
    "save",
    "tip",
    "confirm",
    "searchable",
    "throwaway",
    "countdown",
    "tags",
    "answers",
    "blank",
    "multiple",
    "default",
    "before",
    "after",
    "min",
    "max",
    "time",
    "date",
    "placeholder",
    "other",
    "icon",
    "image"
  ]),
  randomize: /* @__PURE__ */ new Set(["everytime", "name", "group"]),
  service: /* @__PURE__ */ new Set(["path", "method", "send", "success", "error"]),
  settings: /* @__PURE__ */ new Set(["back", "menu"]),
  switch: /* @__PURE__ */ new Set(["reset"]),
  trigger: /* @__PURE__ */ new Set(["send"])
};
var validSubKeyword = {
  name: "valid-sub-keyword",
  description: "Ensure sub-keywords are valid under their parent keyword",
  severity: "error",
  create(context) {
    function checkSubKeywords(parent) {
      const parentKeyword = parent.keyword.toLowerCase();
      const validSubs = KEYWORD_SUB_KEYWORDS[parentKeyword];
      for (const sub of parent.subKeywords) {
        const subKeyword = sub.keyword.toLowerCase();
        if (!SUB_KEYWORDS.has(subKeyword)) {
          context.report({
            message: `'*${subKeyword}' is not a valid sub-keyword`,
            line: sub.loc.start.line,
            column: sub.loc.start.column
          });
          continue;
        }
        if (!validSubs) {
          context.report({
            message: `'*${parentKeyword}' does not support sub-keywords`,
            line: sub.loc.start.line,
            column: sub.loc.start.column
          });
          continue;
        }
        if (!validSubs.has(subKeyword)) {
          context.report({
            message: `'*${subKeyword}' is not a valid sub-keyword for '*${parentKeyword}'`,
            line: sub.loc.start.line,
            column: sub.loc.start.column
          });
        }
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkSubKeywords(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/no-invalid-goto.js
var noInvalidGoto = {
  name: "no-invalid-goto",
  description: "Ensure *goto targets exist",
  severity: "error",
  create(context) {
    const definedLabels = /* @__PURE__ */ new Set();
    const gotoStatements = [];
    function collectLabels(node) {
      if (!node || typeof node !== "object")
        return;
      if (node.type === "Program") {
        for (const stmt of node.body) {
          collectLabels(stmt);
        }
      } else if (node.type === "KeywordStatement") {
        const kw = node;
        if (kw.keyword === "label" && kw.argument) {
          let labelName = "";
          if (kw.argument.type === "TextContent") {
            const text = kw.argument.parts.find((p) => typeof p === "string");
            if (text) {
              labelName = text.trim();
            }
          } else if (kw.argument.type === "Identifier") {
            labelName = kw.argument.name;
          }
          if (labelName) {
            definedLabels.add(labelName);
          }
        }
        if (kw.keyword === "goto" && kw.argument) {
          let targetName = "";
          if (kw.argument.type === "TextContent") {
            const text = kw.argument.parts.find((p) => typeof p === "string");
            if (text) {
              targetName = text.trim();
            }
          } else if (kw.argument.type === "Identifier") {
            targetName = kw.argument.name;
          }
          if (targetName) {
            if (!targetName.startsWith("http://") && !targetName.startsWith("https://")) {
              gotoStatements.push({
                target: targetName,
                line: kw.loc.start.line,
                column: kw.loc.start.column
              });
            }
          }
        }
        for (const stmt of kw.body) {
          collectLabels(stmt);
        }
        for (const sub of kw.subKeywords) {
          for (const stmt of sub.body) {
            collectLabels(stmt);
          }
        }
      } else if (node.type === "AnswerOption") {
        for (const stmt of node.body) {
          collectLabels(stmt);
        }
      }
    }
    return {
      Program(node) {
        collectLabels(node);
        for (const goto of gotoStatements) {
          if (!definedLabels.has(goto.target)) {
            context.report({
              message: `*goto target '${goto.target}' is not defined`,
              line: goto.line,
              column: goto.column
            });
          }
        }
      }
    };
  }
};

// ../dist/linter/rules/indent-style.js
var indentStyle = {
  name: "indent-style",
  description: "Enforce tabs for indentation",
  severity: "error",
  create(context) {
    return {
      Program(_node) {
        const source = context.getSourceCode();
        const lines = source.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          let leadingWhitespace = "";
          let j = 0;
          while (j < line.length && (line[j] === " " || line[j] === "	")) {
            leadingWhitespace += line[j];
            j++;
          }
          if (j === line.length)
            continue;
          if (leadingWhitespace.includes(" ")) {
            const firstSpace = leadingWhitespace.indexOf(" ");
            const firstTab = leadingWhitespace.indexOf("	");
            if (firstTab === -1 || firstSpace < firstTab) {
              context.report({
                message: "Use tabs for indentation, not spaces",
                line: lineNumber,
                column: firstSpace + 1,
                fix: {
                  range: [getLineOffset(lines, i), getLineOffset(lines, i) + leadingWhitespace.length],
                  text: leadingWhitespace.replace(/ {2,}/g, (match) => "	".repeat(Math.ceil(match.length / 2))).replace(/ /g, "")
                }
              });
            }
          }
        }
      }
    };
  }
};
function getLineOffset(lines, lineIndex) {
  let offset = 0;
  for (let i = 0; i < lineIndex; i++) {
    offset += lines[i].length + 1;
  }
  return offset;
}

// ../dist/linter/rules/no-unclosed-string.js
var noUnclosedString = {
  name: "no-unclosed-string",
  description: "Detect unclosed string literals",
  severity: "error",
  create(context) {
    return {
      Program(_node) {
        const source = context.getSourceCode();
        const lines = source.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          let inString = false;
          let stringChar = "";
          let stringStart = -1;
          for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (!inString && ch === "-" && line[j + 1] === "-") {
              break;
            }
            if (!inString && ch === '"') {
              inString = true;
              stringChar = ch;
              stringStart = j;
            } else if (inString && ch === stringChar) {
              inString = false;
              stringChar = "";
              stringStart = -1;
            }
          }
          if (inString) {
            context.report({
              message: `Unclosed string literal (missing closing ${stringChar})`,
              line: lineNumber,
              column: stringStart + 1,
              endLine: lineNumber,
              endColumn: line.length + 1
            });
          }
        }
      }
    };
  }
};

// ../dist/linter/rules/no-unclosed-bracket.js
var noUnclosedBracket = {
  name: "no-unclosed-bracket",
  description: "Detect unclosed brackets/braces",
  severity: "error",
  create(context) {
    return {
      Program(_node) {
        const source = context.getSourceCode();
        const lines = source.split("\n");
        const stack = [];
        const pairs = {
          "(": ")",
          "[": "]",
          "{": "}"
        };
        const closers = {
          ")": "(",
          "]": "[",
          "}": "{"
        };
        const exprKeywords = ["if", "while", "for", "repeat", "goto", "return"];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
          const trimmedLine = line.trim();
          let isExpressionContext = false;
          if (trimmedLine.startsWith(">>")) {
            isExpressionContext = true;
          } else if (trimmedLine.startsWith("*")) {
            for (const keyword of exprKeywords) {
              if (trimmedLine.toLowerCase().startsWith(`*${keyword}:`)) {
                isExpressionContext = true;
                break;
              }
            }
          }
          if (!isExpressionContext)
            continue;
          let inString = false;
          let stringChar = "";
          for (let j = 0; j < line.length; j++) {
            const ch = line[j];
            if (!inString && ch === "-" && line[j + 1] === "-") {
              break;
            }
            if (!inString && (ch === '"' || ch === "'")) {
              inString = true;
              stringChar = ch;
              continue;
            }
            if (inString && ch === stringChar) {
              inString = false;
              stringChar = "";
              continue;
            }
            if (inString)
              continue;
            if (pairs[ch]) {
              stack.push({ char: ch, line: lineNumber, column: j + 1 });
            }
            if (closers[ch]) {
              if (stack.length === 0) {
                context.report({
                  message: `Unexpected closing bracket '${ch}'`,
                  line: lineNumber,
                  column: j + 1
                });
              } else {
                const top = stack.pop();
                if (pairs[top.char] !== ch) {
                  context.report({
                    message: `Mismatched brackets: expected '${pairs[top.char]}' but found '${ch}'`,
                    line: lineNumber,
                    column: j + 1
                  });
                  stack.push(top);
                }
              }
            }
          }
        }
        for (const bracket of stack) {
          context.report({
            message: `Unclosed bracket '${bracket.char}' (missing '${pairs[bracket.char]}')`,
            line: bracket.line,
            column: bracket.column
          });
        }
      }
    };
  }
};

// ../dist/linter/rules/no-single-quotes.js
var noSingleQuotes = {
  name: "no-single-quotes",
  description: "Disallow single quotes for strings (use double quotes)",
  severity: "error",
  create(context) {
    return {
      Program(_node) {
        const source = context.getSourceCode();
        const lines = source.split(/\r?\n/);
        lines.forEach((line, lineIndex) => {
          const lineNumber = lineIndex + 1;
          const trimmedLine = line.trimStart();
          if (trimmedLine.length === 0)
            return;
          if (trimmedLine.startsWith("--"))
            return;
          if (trimmedLine.startsWith(">>")) {
            checkExpressionForSingleQuotes(line, lineNumber, context);
            return;
          }
          const conditionalMatch = trimmedLine.match(/^\*(?:if|while|for):\s*(.+)$/);
          if (conditionalMatch) {
            const expression = conditionalMatch[1];
            const exprStartCol = line.indexOf(expression) + 1;
            checkStringForSingleQuotes(expression, lineNumber, exprStartCol, context);
            return;
          }
          const pathMatch = trimmedLine.match(/^\*path:\s*(.+)$/);
          if (pathMatch) {
            const pathValue = pathMatch[1];
            const pathStartCol = line.indexOf(pathValue) + 1;
            checkStringForSingleQuotes(pathValue, lineNumber, pathStartCol, context);
            return;
          }
        });
      }
    };
  }
};
function checkExpressionForSingleQuotes(line, lineNumber, context) {
  const exprMatch = line.match(/^(\t*)>>\s*(.+)$/);
  if (!exprMatch)
    return;
  const expression = exprMatch[2];
  const exprStartCol = line.indexOf(expression) + 1;
  checkStringForSingleQuotes(expression, lineNumber, exprStartCol, context);
}
function checkStringForSingleQuotes(text, lineNumber, startCol, context) {
  let inDoubleQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }
    if (ch === "'" && !inDoubleQuotes) {
      context.report({
        message: "Single quotes are not valid for strings in GuidedTrack. Use double quotes instead.",
        line: lineNumber,
        column: startCol + i
      });
    }
  }
}

// ../dist/linter/rules/no-unreachable-code.js
function evaluateConstantExpression(expr) {
  if (expr.type === "Identifier") {
    if (expr.name === "true") {
      return true;
    }
    if (expr.name === "false") {
      return false;
    }
    return void 0;
  }
  if (expr.type === "Literal") {
    if (typeof expr.value === "boolean") {
      return expr.value;
    }
    if (typeof expr.value === "number") {
      return expr.value !== 0;
    }
    if (typeof expr.value === "string") {
      return expr.value !== "";
    }
    if (expr.value === null) {
      return false;
    }
  }
  if (expr.type === "BinaryExpression") {
    const left = evaluateConstantExpression(expr.left);
    const right = evaluateConstantExpression(expr.right);
    if (left === void 0 || right === void 0) {
      return void 0;
    }
    const leftNum = typeof expr.left === "object" && expr.left.type === "Literal" ? typeof expr.left.value === "number" ? expr.left.value : void 0 : void 0;
    const rightNum = typeof expr.right === "object" && expr.right.type === "Literal" ? typeof expr.right.value === "number" ? expr.right.value : void 0 : void 0;
    switch (expr.operator) {
      case "==":
      case "=":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum === rightNum;
        }
        return left === right;
      case "!=":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum !== rightNum;
        }
        return left !== right;
      case ">":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum > rightNum;
        }
        return void 0;
      case ">=":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum >= rightNum;
        }
        return void 0;
      case "<":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum < rightNum;
        }
        return void 0;
      case "<=":
        if (leftNum !== void 0 && rightNum !== void 0) {
          return leftNum <= rightNum;
        }
        return void 0;
      case "and":
        return left && right;
      case "or":
        return left || right;
      default:
        return void 0;
    }
  }
  if (expr.type === "UnaryExpression") {
    const arg = evaluateConstantExpression(expr.argument);
    if (arg === void 0)
      return void 0;
    switch (expr.operator) {
      case "not":
      case "!":
        return !arg;
      default:
        return void 0;
    }
  }
  return void 0;
}
var noUnreachableCode = {
  name: "no-unreachable-code",
  description: "Disallow unreachable code after control flow statements",
  severity: "warning",
  create(context) {
    function isLabel(stmt) {
      return stmt.type === "KeywordStatement" && stmt.keyword === "label";
    }
    function isUnconditionalTransfer(stmt) {
      return stmt.keyword === "goto";
    }
    function checkBlock(statements) {
      let foundUnconditionalTransfer = false;
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (foundUnconditionalTransfer) {
          if (stmt.type === "CommentStatement") {
            continue;
          }
          if (!isLabel(stmt)) {
            context.report({
              message: "Unreachable code after unconditional transfer",
              line: stmt.loc.start.line,
              column: stmt.loc.start.column
            });
          }
          foundUnconditionalTransfer = false;
        }
        if (stmt.type === "KeywordStatement") {
          if (isUnconditionalTransfer(stmt)) {
            foundUnconditionalTransfer = true;
          }
          if (stmt.keyword === "if" || stmt.keyword === "elseif") {
            if (stmt.argument) {
              const conditionValue = evaluateConstantExpression(stmt.argument);
              if (conditionValue === false) {
                for (const bodyStmt of stmt.body) {
                  if (bodyStmt.type !== "KeywordStatement" || bodyStmt.keyword !== "else" && bodyStmt.keyword !== "elseif") {
                    context.report({
                      message: "Unreachable code - condition is always false",
                      line: bodyStmt.loc.start.line,
                      column: bodyStmt.loc.start.column
                    });
                    break;
                  }
                }
              } else if (conditionValue === true && stmt.keyword === "if") {
                for (const bodyStmt of stmt.body) {
                  if (bodyStmt.type === "KeywordStatement" && (bodyStmt.keyword === "else" || bodyStmt.keyword === "elseif")) {
                    context.report({
                      message: "Unreachable code - previous condition is always true",
                      line: bodyStmt.loc.start.line,
                      column: bodyStmt.loc.start.column
                    });
                  }
                }
              }
            }
            checkBlock(stmt.body);
          }
          if (stmt.keyword === "while" && stmt.argument) {
            const conditionValue = evaluateConstantExpression(stmt.argument);
            if (conditionValue === false && stmt.body.length > 0) {
              context.report({
                message: "Unreachable code - loop condition is always false",
                line: stmt.body[0].loc.start.line,
                column: stmt.body[0].loc.start.column
              });
            }
            checkBlock(stmt.body);
          }
          if (stmt.keyword !== "if" && stmt.keyword !== "elseif" && stmt.keyword !== "while") {
            checkBlock(stmt.body);
            for (const sub of stmt.subKeywords) {
              checkBlock(sub.body);
            }
          }
        }
        if (stmt.type === "AnswerOption") {
          checkBlock(stmt.body);
        }
      }
    }
    return {
      Program(node) {
        checkBlock(node.body);
      }
    };
  }
};

// ../dist/language/keyword-spec.js
var KEYWORD_SPECS = {
  // ---------------------------------------------------------------------------
  // Media Keywords
  // ---------------------------------------------------------------------------
  audio: {
    description: "Embeds an audio file into the page",
    argument: { required: true, type: "url" },
    body: { allowed: true, required: false },
    subKeywords: {
      start: {
        required: false,
        valueType: "yes-no",
        description: "Whether the audio auto-plays (default: no)"
      },
      hide: {
        required: false,
        valueType: "yes-no",
        description: "Whether the player controls are hidden (default: yes)"
      }
    }
  },
  image: {
    description: "Inserts an image into the page",
    argument: { required: true, type: "url" },
    body: { allowed: true, required: false },
    subKeywords: {
      caption: {
        required: false,
        valueType: "text",
        description: "Description displayed beneath the image"
      },
      description: {
        required: false,
        valueType: "text",
        description: "Alt text if the image fails to load"
      }
    }
  },
  video: {
    description: "Embeds a YouTube video into the page",
    argument: { required: true, type: "url" },
    body: { allowed: false, required: false }
  },
  // ---------------------------------------------------------------------------
  // UI Keywords
  // ---------------------------------------------------------------------------
  button: {
    description: "Puts a button with specific text on the page",
    argument: { required: true, type: "text" },
    body: { allowed: false, required: false }
  },
  chart: {
    description: "Displays a chart",
    argument: { required: true, type: "text" },
    body: { allowed: true, required: true },
    subKeywords: {
      type: {
        required: true,
        valueType: "enum",
        enumValues: ["bar", "line", "scatter"],
        description: "The type of chart"
      },
      data: {
        required: true,
        valueType: "collection",
        description: "The data to display (collection of collections)"
      },
      xaxis: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "X-axis configuration (requires *min and *max)"
      },
      yaxis: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "Y-axis configuration (requires *min and *max)"
      },
      trendline: {
        required: false,
        valueType: "none",
        description: "Draws a trend-line in scatter charts"
      },
      min: {
        required: false,
        valueType: "number",
        description: "Minimum value for axis"
      },
      max: {
        required: false,
        valueType: "number",
        description: "Maximum value for axis"
      }
    },
    requiredSubKeywords: ["type", "data"]
  },
  clear: {
    description: "Clears text kept on the page by *maintain",
    argument: { required: false, type: "none" },
    body: { allowed: false, required: false }
  },
  component: {
    description: "Displays a bordered content box",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true },
    subKeywords: {
      classes: {
        required: false,
        valueType: "text",
        description: "CSS class names to apply"
      },
      click: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "Code to run when component is clicked"
      },
      with: {
        required: false,
        valueType: "expression",
        description: "Local variable for click handler context"
      },
      header: {
        required: false,
        valueType: "text",
        description: "Header text for the component"
      }
    }
  },
  html: {
    description: "Inserts arbitrary HTML code into the page",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true }
  },
  list: {
    description: "Inserts a list into the page",
    argument: {
      required: false,
      type: "enum",
      enumValues: ["ordered", "expandable"]
    },
    body: { allowed: true, required: true }
  },
  maintain: {
    description: "Keeps text in a gray box at the top of the page",
    argument: { required: true, type: "text" },
    body: { allowed: false, required: false }
  },
  navigation: {
    description: "Creates a navigation bar",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true },
    subKeywords: {
      name: {
        required: false,
        valueType: "text",
        description: "Name for the navbar (highly recommended)"
      },
      icon: {
        required: false,
        valueType: "text",
        description: "Font Awesome icon class"
      }
    }
  },
  page: {
    description: "Creates a page of content",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true }
  },
  progress: {
    description: "Displays a progress bar",
    argument: { required: true, type: "percent" },
    body: { allowed: false, required: false }
  },
  share: {
    description: "Inserts a Facebook share button",
    argument: { required: false, type: "none" },
    body: { allowed: false, required: false }
  },
  // ---------------------------------------------------------------------------
  // Question Keywords
  // ---------------------------------------------------------------------------
  question: {
    description: "Asks a question",
    argument: { required: true, type: "text" },
    body: { allowed: true, required: false },
    subKeywords: {
      type: {
        required: false,
        valueType: "enum",
        enumValues: [
          "calendar",
          "checkbox",
          "choice",
          "number",
          "paragraph",
          "ranking",
          "slider",
          "text"
        ],
        description: "The type of question"
      },
      shuffle: {
        required: false,
        valueType: "none",
        description: "Randomize answer order"
      },
      save: {
        required: false,
        valueType: "text",
        description: "Variable name to save response"
      },
      tip: {
        required: false,
        valueType: "text",
        description: "Hint text displayed under the question"
      },
      confirm: {
        required: false,
        valueType: "none",
        description: "Require clicking Next after selection"
      },
      searchable: {
        required: false,
        valueType: "none",
        description: "Enable type-ahead search for answers"
      },
      throwaway: {
        required: false,
        valueType: "none",
        description: "Exclude from CSV data"
      },
      countdown: {
        required: false,
        valueType: "duration",
        description: "Time limit for answering"
      },
      tags: {
        required: false,
        valueType: "text",
        description: "Tags for grouping questions"
      },
      answers: {
        required: false,
        valueType: "collection",
        description: "Answer options from a collection"
      },
      blank: {
        required: false,
        valueType: "none",
        description: "Allow skipping the question"
      },
      multiple: {
        required: false,
        valueType: "none",
        description: "Allow multiple text answers"
      },
      default: {
        required: false,
        valueType: "expression",
        description: "Default/pre-selected answer(s)"
      },
      before: {
        required: false,
        valueType: "text",
        description: "Text to the left of input box"
      },
      after: {
        required: false,
        valueType: "text",
        description: "Text to the right of input box"
      },
      min: {
        required: false,
        valueType: "number",
        description: "Minimum value for slider"
      },
      max: {
        required: false,
        valueType: "number",
        description: "Maximum value for slider"
      },
      time: {
        required: false,
        valueType: "yes-no",
        description: "Allow time selection in calendar"
      },
      date: {
        required: false,
        valueType: "yes-no",
        description: "Allow date selection in calendar"
      },
      placeholder: {
        required: false,
        valueType: "text",
        description: "Placeholder text in input field"
      },
      other: {
        required: false,
        valueType: "none",
        description: 'Allow "other" free-text option'
      },
      icon: {
        required: false,
        valueType: "text",
        description: "Font Awesome icon for answer option"
      },
      image: {
        required: false,
        valueType: "url",
        description: "Image for answer option"
      }
    }
  },
  // ---------------------------------------------------------------------------
  // Control Flow Keywords
  // ---------------------------------------------------------------------------
  if: {
    description: "Runs a block of code if condition is true",
    argument: { required: true, type: "expression" },
    body: { allowed: true, required: true }
  },
  for: {
    description: "Loops through elements of a collection, association, or string",
    argument: { required: true, type: "iteration" },
    body: { allowed: true, required: true }
  },
  while: {
    description: "Runs a block of code while condition is true",
    argument: { required: true, type: "expression" },
    body: { allowed: true, required: true }
  },
  repeat: {
    description: "Repeats a block of code a specified number of times",
    argument: { required: true, type: "number" },
    body: { allowed: true, required: true }
  },
  goto: {
    description: "Jumps to a specific label",
    argument: { required: true, type: "label" },
    body: { allowed: true, required: false },
    subKeywords: {
      reset: {
        required: false,
        valueType: "none",
        description: "Resets the navigation stack (required in *events)"
      }
    }
  },
  label: {
    description: "Declares a named location in the code",
    argument: { required: true, type: "label" },
    body: { allowed: false, required: false }
  },
  wait: {
    description: "Pauses execution",
    argument: {
      required: false,
      type: "duration"
    },
    body: { allowed: false, required: false }
  },
  quit: {
    description: "Ends the entire program immediately",
    argument: { required: false, type: "none" },
    body: { allowed: false, required: false }
  },
  return: {
    description: "Ends the current subprogram and returns to parent",
    argument: { required: false, type: "none" },
    body: { allowed: false, required: false }
  },
  // ---------------------------------------------------------------------------
  // Randomization Keywords
  // ---------------------------------------------------------------------------
  randomize: {
    description: "Randomly selects blocks of code to run",
    argument: { required: false, type: "number" },
    // Can also be "all"
    body: { allowed: true, required: true },
    subKeywords: {
      everytime: {
        required: false,
        valueType: "none",
        description: "Re-randomize every time user passes this point"
      },
      name: {
        required: false,
        valueType: "text",
        description: "Name for the randomized selection"
      },
      group: {
        required: false,
        valueType: "text",
        description: "Name for a randomization group"
      }
    }
  },
  experiment: {
    description: "Defines an experiment with permanent group assignment",
    argument: { required: true, type: "text" },
    body: { allowed: true, required: true },
    subKeywords: {
      group: {
        required: false,
        valueType: "text",
        description: "Name for an experiment group"
      }
    }
  },
  group: {
    description: "Defines a block of code (used in *randomize or *experiment)",
    argument: { required: false, type: "text" },
    body: { allowed: true, required: true }
  },
  // ---------------------------------------------------------------------------
  // Program/Navigation Keywords
  // ---------------------------------------------------------------------------
  program: {
    description: "Runs a subprogram and returns when it finishes",
    argument: { required: true, type: "program-name" },
    body: { allowed: false, required: false }
  },
  switch: {
    description: "Switches to another program (pauses current)",
    argument: { required: true, type: "program-name" },
    body: { allowed: true, required: false },
    subKeywords: {
      reset: {
        required: false,
        valueType: "none",
        description: "Restart target program from beginning"
      }
    }
  },
  // ---------------------------------------------------------------------------
  // Variable Keywords
  // ---------------------------------------------------------------------------
  set: {
    description: "Sets a variable's value to true",
    argument: { required: true, type: "variable" },
    body: { allowed: false, required: false }
  },
  // ---------------------------------------------------------------------------
  // Events Keywords
  // ---------------------------------------------------------------------------
  events: {
    description: "Defines named events that can be triggered",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true },
    subKeywords: {
      startup: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "Event run when program loads"
      }
    }
  },
  trigger: {
    description: "Triggers an event by name",
    argument: { required: true, type: "event-name" },
    body: { allowed: true, required: false },
    subKeywords: {
      send: {
        required: false,
        valueType: "association",
        description: "Data to send to the event"
      }
    }
  },
  // ---------------------------------------------------------------------------
  // Service/Database Keywords
  // ---------------------------------------------------------------------------
  service: {
    description: "Makes an HTTP request",
    argument: { required: true, type: "service-name" },
    body: { allowed: true, required: true },
    subKeywords: {
      path: {
        required: true,
        valueType: "text",
        description: "Path to append to service URL"
      },
      method: {
        required: true,
        valueType: "enum",
        enumValues: ["GET", "POST", "PUT", "DELETE"],
        description: "HTTP method to use"
      },
      send: {
        required: false,
        valueType: "association",
        description: "Data to send in the request"
      },
      success: {
        required: true,
        valueType: "none",
        hasBody: true,
        description: "Code to run on success (data in `it`)"
      },
      error: {
        required: true,
        valueType: "none",
        hasBody: true,
        description: "Code to run on error (error in `it`)"
      }
    },
    requiredSubKeywords: ["path", "method", "success", "error"]
  },
  database: {
    description: "Requests user info from the GuidedTrack database",
    argument: { required: true, type: "text" },
    body: { allowed: true, required: true },
    subKeywords: {
      what: {
        required: true,
        valueType: "enum",
        enumValues: ["email"],
        description: "Type of data to request"
      },
      success: {
        required: true,
        valueType: "none",
        hasBody: true,
        description: "Code to run on success (data in `it`)"
      },
      error: {
        required: true,
        valueType: "none",
        hasBody: true,
        description: "Code to run on error (error in `it`)"
      }
    },
    requiredSubKeywords: ["what", "success", "error"]
  },
  // ---------------------------------------------------------------------------
  // Email Keywords
  // ---------------------------------------------------------------------------
  email: {
    description: "Sends an email immediately or at a specified time",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true },
    subKeywords: {
      subject: {
        required: true,
        valueType: "text",
        description: "Email subject line"
      },
      body: {
        required: true,
        valueType: "none",
        hasBody: true,
        description: "Email body content"
      },
      to: {
        required: false,
        valueType: "text",
        description: "Recipient email address"
      },
      when: {
        required: false,
        valueType: "datetime",
        description: "When to send the email"
      },
      every: {
        required: false,
        valueType: "duration",
        description: "Frequency for recurring emails"
      },
      until: {
        required: false,
        valueType: "datetime",
        description: "When to stop recurring emails"
      },
      identifier: {
        required: false,
        valueType: "text",
        description: "Name for cancelling scheduled emails"
      },
      cancel: {
        required: false,
        valueType: "text",
        description: "Cancel emails with this identifier"
      }
    },
    requiredSubKeywords: ["subject", "body"]
  },
  // ---------------------------------------------------------------------------
  // Purchase Keywords
  // ---------------------------------------------------------------------------
  purchase: {
    description: "Processes in-app purchases",
    argument: { required: false, type: "text" },
    body: { allowed: true, required: false },
    subKeywords: {
      status: {
        required: false,
        valueType: "none",
        description: "Check subscription status"
      },
      frequency: {
        required: false,
        valueType: "enum",
        enumValues: ["recurring"],
        description: "Generate a subscription"
      },
      management: {
        required: false,
        valueType: "none",
        description: "Open subscription management"
      },
      success: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "Code to run on success"
      },
      error: {
        required: false,
        valueType: "none",
        hasBody: true,
        description: "Code to run on error"
      }
    },
    mutuallyExclusiveGroups: [["status", "frequency", "management"]],
    conditionalRequirements: [
      { if: ["status"], then: ["success", "error"] },
      { if: ["frequency"], then: ["success", "error"] }
    ]
  },
  // ---------------------------------------------------------------------------
  // User Keywords
  // ---------------------------------------------------------------------------
  login: {
    description: "Asks the user to log in",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: false },
    subKeywords: {
      required: {
        required: false,
        valueType: "yes-no",
        description: "Whether login is required"
      }
    }
  },
  // ---------------------------------------------------------------------------
  // Scoring Keywords
  // ---------------------------------------------------------------------------
  points: {
    description: "Gives or takes points from user scores",
    argument: { required: true, type: "number" },
    // Can include optional tag
    body: { allowed: false, required: false }
  },
  summary: {
    description: "Summarizes user responses",
    argument: { required: false, type: "text" },
    // Optional tag name
    body: { allowed: false, required: false }
  },
  // ---------------------------------------------------------------------------
  // Settings Keywords
  // ---------------------------------------------------------------------------
  settings: {
    description: "Applies settings to the program",
    argument: { required: false, type: "none" },
    body: { allowed: true, required: true },
    subKeywords: {
      back: {
        required: false,
        valueType: "yes-no",
        description: "Enable back navigation"
      },
      menu: {
        required: false,
        valueType: "yes-no",
        description: "Show/hide run menu"
      }
    }
  },
  // ---------------------------------------------------------------------------
  // Header (used within components, navigation, etc.)
  // ---------------------------------------------------------------------------
  header: {
    description: "Defines a header",
    argument: { required: true, type: "text" },
    body: { allowed: false, required: false }
  }
};
function getKeywordSpec(keyword) {
  return KEYWORD_SPECS[keyword.toLowerCase()];
}
function getRequiredSubKeywords(keyword) {
  const spec = getKeywordSpec(keyword);
  if (!spec)
    return [];
  const required = [];
  if (spec.requiredSubKeywords) {
    required.push(...spec.requiredSubKeywords);
  }
  if (spec.subKeywords) {
    for (const [name, subSpec] of Object.entries(spec.subKeywords)) {
      if (subSpec.required && !required.includes(name)) {
        required.push(name);
      }
    }
  }
  return required;
}

// ../dist/linter/rules/required-subkeywords.js
var requiredSubkeywords = {
  name: "required-subkeywords",
  description: "Ensure keywords have all required sub-keywords",
  severity: "error",
  create(context) {
    function checkKeyword(node) {
      const keyword = node.keyword.toLowerCase();
      const spec = getKeywordSpec(keyword);
      if (!spec)
        return;
      const requiredSubs = getRequiredSubKeywords(keyword);
      if (requiredSubs.length === 0)
        return;
      const presentSubs = new Set(node.subKeywords.map((sub) => sub.keyword.toLowerCase()));
      const missingSubs = requiredSubs.filter((sub) => !presentSubs.has(sub));
      if (missingSubs.length > 0) {
        const missingList = missingSubs.map((s) => `*${s}:`).join(", ");
        const plural = missingSubs.length > 1 ? "s" : "";
        context.report({
          message: `'*${keyword}:' is missing required sub-keyword${plural}: ${missingList}`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkKeyword(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/valid-subkeyword-value.js
var validSubkeywordValue = {
  name: "valid-subkeyword-value",
  description: "Ensure sub-keyword values are valid",
  severity: "error",
  create(context) {
    function getArgumentValue(argument) {
      if (!argument)
        return null;
      if (argument.type === "Literal") {
        const lit = argument;
        return typeof lit.value === "string" ? lit.value : String(lit.value);
      }
      if (argument.type === "TextContent") {
        const tc = argument;
        if (tc.parts.length === 1 && typeof tc.parts[0] === "string") {
          return tc.parts[0].trim();
        }
      }
      return null;
    }
    function checkSubKeyword(parentKeyword, sub) {
      const spec = getKeywordSpec(parentKeyword);
      if (!spec?.subKeywords)
        return;
      const subKeyword = sub.keyword.toLowerCase();
      const subSpec = spec.subKeywords[subKeyword];
      if (!subSpec)
        return;
      const value = getArgumentValue(sub.argument);
      if (subSpec.valueType === "enum" && subSpec.enumValues && value !== null) {
        const normalizedValue = value.toLowerCase();
        const validValues = subSpec.enumValues.map((v) => v.toLowerCase());
        if (!validValues.includes(normalizedValue)) {
          const validList = subSpec.enumValues.join(", ");
          context.report({
            message: `Invalid value '${value}' for '*${subKeyword}:'. Valid values are: ${validList}`,
            line: sub.loc.start.line,
            column: sub.loc.start.column
          });
        }
      }
      if (subSpec.valueType === "yes-no" && value !== null) {
        const normalizedValue = value.toLowerCase();
        if (normalizedValue !== "yes" && normalizedValue !== "no") {
          context.report({
            message: `Invalid value '${value}' for '*${subKeyword}:'. Expected 'yes' or 'no'`,
            line: sub.loc.start.line,
            column: sub.loc.start.column
          });
        }
      }
    }
    function checkKeyword(node) {
      const keyword = node.keyword.toLowerCase();
      for (const sub of node.subKeywords) {
        checkSubKeyword(keyword, sub);
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkKeyword(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/no-inline-argument.js
var noInlineArgument = {
  name: "no-inline-argument",
  description: "Ensure keywords that should not have inline arguments do not have them",
  severity: "error",
  create(context) {
    function checkKeyword(node) {
      const keyword = node.keyword.toLowerCase();
      const spec = getKeywordSpec(keyword);
      if (!spec)
        return;
      if (spec.argument.type === "none" && node.argument !== null) {
        context.report({
          message: `'*${keyword}' should not have an inline argument`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkKeyword(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/goto-needs-reset-in-events.js
var gotoNeedsResetInEvents = {
  name: "goto-needs-reset-in-events",
  description: "Ensure *goto: inside *events has *reset",
  severity: "warning",
  create(context) {
    function checkGotoInEvents(node) {
      const keyword = node.keyword.toLowerCase();
      if (keyword !== "goto")
        return;
      const hasReset = node.subKeywords.some((sub) => sub.keyword.toLowerCase() === "reset");
      if (!hasReset) {
        context.report({
          message: `'*goto:' inside '*events' should have '*reset' to prevent unexpected behavior`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
      }
    }
    function visitInsideEvents(statements) {
      for (const stmt of statements) {
        if (stmt.type === "KeywordStatement") {
          checkGotoInEvents(stmt);
          visitInsideEvents(stmt.body);
        } else if (stmt.type === "AnswerOption") {
          visitInsideEvents(stmt.body);
        }
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        const keyword = node.keyword.toLowerCase();
        if (keyword === "events") {
          visitInsideEvents(node.body);
        } else {
          for (const stmt of node.body) {
            if (stmt.type === "KeywordStatement") {
              visit(stmt);
            }
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/purchase-subkeyword-constraints.js
var purchaseSubkeywordConstraints = {
  name: "purchase-subkeyword-constraints",
  description: "Ensure *purchase has correct sub-keyword combinations",
  severity: "error",
  create(context) {
    const MODE_SUBKEYWORDS = ["status", "frequency", "management"];
    function checkPurchase(node) {
      const keyword = node.keyword.toLowerCase();
      if (keyword !== "purchase")
        return;
      const presentSubs = new Set(node.subKeywords.map((sub) => sub.keyword.toLowerCase()));
      const presentModes = MODE_SUBKEYWORDS.filter((mode2) => presentSubs.has(mode2));
      if (presentModes.length === 0) {
        context.report({
          message: `'*purchase' must have exactly one of: *status, *frequency, or *management`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
        return;
      }
      if (presentModes.length > 1) {
        const modeList = presentModes.map((m) => `*${m}`).join(", ");
        context.report({
          message: `'*purchase' cannot have multiple mode sub-keywords. Found: ${modeList}. Use only one.`,
          line: node.loc.start.line,
          column: node.loc.start.column
        });
        return;
      }
      const mode = presentModes[0];
      if (mode === "status" || mode === "frequency") {
        const missingCallbacks = [];
        if (!presentSubs.has("success")) {
          missingCallbacks.push("*success");
        }
        if (!presentSubs.has("error")) {
          missingCallbacks.push("*error");
        }
        if (missingCallbacks.length > 0) {
          context.report({
            message: `'*purchase' with '*${mode}' requires: ${missingCallbacks.join(" and ")}`,
            line: node.loc.start.line,
            column: node.loc.start.column
          });
        }
      }
    }
    function visit(node) {
      if (node.type === "Program") {
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      } else if (node.type === "KeywordStatement") {
        checkPurchase(node);
        for (const stmt of node.body) {
          if (stmt.type === "KeywordStatement") {
            visit(stmt);
          }
        }
      }
    }
    return {
      Program(node) {
        visit(node);
      }
    };
  }
};

// ../dist/linter/rules/index.js
var rules = {
  "no-undefined-vars": noUndefinedVars,
  "no-unused-vars": noUnusedVars,
  "valid-keyword": validKeyword,
  "valid-sub-keyword": validSubKeyword,
  "no-invalid-goto": noInvalidGoto,
  "indent-style": indentStyle,
  "no-unclosed-string": noUnclosedString,
  "no-unclosed-bracket": noUnclosedBracket,
  "no-single-quotes": noSingleQuotes,
  "no-unreachable-code": noUnreachableCode,
  "required-subkeywords": requiredSubkeywords,
  "valid-subkeyword-value": validSubkeywordValue,
  "no-inline-argument": noInlineArgument,
  "goto-needs-reset-in-events": gotoNeedsResetInEvents,
  "purchase-subkeyword-constraints": purchaseSubkeywordConstraints
};

// ../dist/linter/directives.js
function parseDirectives(source) {
  const lines = source.split("\n");
  const state = {
    lintDisabledLines: /* @__PURE__ */ new Map(),
    formatDisabledLines: /* @__PURE__ */ new Set(),
    fromParentVars: /* @__PURE__ */ new Set(),
    fromChildVars: /* @__PURE__ */ new Set(),
    toParentVars: /* @__PURE__ */ new Set(),
    toChildVars: /* @__PURE__ */ new Set()
  };
  const activeLintDisables = /* @__PURE__ */ new Map();
  let formatDisableStart = null;
  let nextLineLintDisable = null;
  let nextLineFormatDisable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    if (nextLineLintDisable !== null) {
      state.lintDisabledLines.set(lineNum, nextLineLintDisable);
      nextLineLintDisable = null;
    }
    if (nextLineFormatDisable) {
      state.formatDisabledLines.add(lineNum);
      nextLineFormatDisable = false;
    }
    const commentMatch = line.match(/^\s*--\s*(.+)$/);
    if (!commentMatch)
      continue;
    const commentContent = commentMatch[1].trim();
    if (commentContent.startsWith("gt-disable-next-line")) {
      const rulesStr = commentContent.slice("gt-disable-next-line".length).trim();
      if (rulesStr) {
        nextLineLintDisable = parseRuleList(rulesStr);
      } else {
        nextLineLintDisable = "all";
      }
      nextLineFormatDisable = true;
      continue;
    }
    if (commentContent.startsWith("gt-disable") && !commentContent.startsWith("gt-disable-next-line")) {
      const rulesStr = commentContent.slice("gt-disable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          activeLintDisables.set(rule, lineNum);
        }
      } else {
        activeLintDisables.set("all", lineNum);
      }
      if (formatDisableStart === null) {
        formatDisableStart = lineNum;
      }
      continue;
    }
    if (commentContent.startsWith("gt-enable")) {
      const rulesStr = commentContent.slice("gt-enable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          const startLine = activeLintDisables.get(rule);
          if (startLine !== void 0) {
            addLintDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([rule]));
            activeLintDisables.delete(rule);
          }
        }
      } else {
        for (const [key, startLine] of activeLintDisables) {
          if (key === "all") {
            addLintDisabledRegion(state, startLine, lineNum - 1, "all");
          } else {
            addLintDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([key]));
          }
        }
        activeLintDisables.clear();
      }
      if (formatDisableStart !== null) {
        addFormatDisabledRegion(state, formatDisableStart, lineNum - 1);
        formatDisableStart = null;
      }
      continue;
    }
    if (commentContent.startsWith("gtlint-disable-next-line")) {
      const rulesStr = commentContent.slice("gtlint-disable-next-line".length).trim();
      if (rulesStr) {
        nextLineLintDisable = parseRuleList(rulesStr);
      } else {
        nextLineLintDisable = "all";
      }
      continue;
    }
    if (commentContent.startsWith("gtlint-disable") && !commentContent.startsWith("gtlint-disable-next-line")) {
      const rulesStr = commentContent.slice("gtlint-disable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          activeLintDisables.set(rule, lineNum);
        }
      } else {
        activeLintDisables.set("all", lineNum);
      }
      continue;
    }
    if (commentContent.startsWith("gtlint-enable")) {
      const rulesStr = commentContent.slice("gtlint-enable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          const startLine = activeLintDisables.get(rule);
          if (startLine !== void 0) {
            addLintDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([rule]));
            activeLintDisables.delete(rule);
          }
        }
      } else {
        for (const [key, startLine] of activeLintDisables) {
          if (key === "all") {
            addLintDisabledRegion(state, startLine, lineNum - 1, "all");
          } else {
            addLintDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([key]));
          }
        }
        activeLintDisables.clear();
      }
      continue;
    }
    if (commentContent.startsWith("gtformat-disable") && !commentContent.startsWith("gtformat-disable-next-line")) {
      if (formatDisableStart === null) {
        formatDisableStart = lineNum;
      }
      continue;
    }
    if (commentContent.startsWith("gtformat-enable")) {
      if (formatDisableStart !== null) {
        addFormatDisabledRegion(state, formatDisableStart, lineNum - 1);
        formatDisableStart = null;
      }
      continue;
    }
    if (commentContent.startsWith("@from-parent:")) {
      const varsStr = commentContent.slice("@from-parent:".length).trim();
      const vars = parseVarList(varsStr);
      for (const v of vars) {
        state.fromParentVars.add(v);
      }
      continue;
    }
    if (commentContent.startsWith("@from-child:")) {
      const varsStr = commentContent.slice("@from-child:".length).trim();
      const vars = parseVarList(varsStr);
      for (const v of vars) {
        state.fromChildVars.add(v);
      }
      continue;
    }
    if (commentContent.startsWith("@to-parent:")) {
      const varsStr = commentContent.slice("@to-parent:".length).trim();
      const vars = parseVarList(varsStr);
      for (const v of vars) {
        state.toParentVars.add(v);
      }
      continue;
    }
    if (commentContent.startsWith("@to-child:")) {
      const varsStr = commentContent.slice("@to-child:".length).trim();
      const vars = parseVarList(varsStr);
      for (const v of vars) {
        state.toChildVars.add(v);
      }
      continue;
    }
  }
  const totalLines = lines.length;
  for (const [key, startLine] of activeLintDisables) {
    if (key === "all") {
      addLintDisabledRegion(state, startLine, totalLines, "all");
    } else {
      addLintDisabledRegion(state, startLine, totalLines, /* @__PURE__ */ new Set([key]));
    }
  }
  if (formatDisableStart !== null) {
    addFormatDisabledRegion(state, formatDisableStart, totalLines);
  }
  return state;
}
function parseRuleList(str) {
  return new Set(str.split(",").map((s) => s.trim()).filter((s) => s.length > 0));
}
function parseVarList(str) {
  return str.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}
function addLintDisabledRegion(state, startLine, endLine, rules2) {
  for (let line = startLine; line <= endLine; line++) {
    const existing = state.lintDisabledLines.get(line);
    if (rules2 === "all") {
      state.lintDisabledLines.set(line, "all");
    } else if (existing === "all") {
    } else if (existing) {
      for (const rule of rules2) {
        existing.add(rule);
      }
    } else {
      state.lintDisabledLines.set(line, new Set(rules2));
    }
  }
}
function addFormatDisabledRegion(state, startLine, endLine) {
  for (let line = startLine; line <= endLine; line++) {
    state.formatDisabledLines.add(line);
  }
}
function isRuleDisabled(state, line, ruleId) {
  const disabled = state.lintDisabledLines.get(line);
  if (!disabled)
    return false;
  if (disabled === "all")
    return true;
  return disabled.has(ruleId);
}
function isFormatDisabled(state, line) {
  return state.formatDisabledLines.has(line);
}

// ../dist/linter/linter.js
var Linter = class {
  config;
  messages = [];
  source = "";
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_LINTER_CONFIG,
      ...config,
      rules: {
        ...DEFAULT_LINTER_CONFIG.rules,
        ...config.rules
      },
      format: {
        ...DEFAULT_LINTER_CONFIG.format,
        ...config.format
      }
    };
  }
  lint(source, filePath = "<unknown>") {
    this.messages = [];
    this.source = source;
    const directives = parseDirectives(source);
    const tokens = tokenize(source);
    const ast = parse(tokens);
    for (const [ruleName, severity] of Object.entries(this.config.rules)) {
      if (severity === "off")
        continue;
      const rule = rules[ruleName];
      if (!rule)
        continue;
      const context = {
        report: (descriptor) => {
          this.messages.push({
            ruleId: ruleName,
            severity: severity === "error" ? "error" : severity === "warn" ? "warning" : "info",
            message: descriptor.message,
            line: descriptor.line,
            column: descriptor.column,
            endLine: descriptor.endLine,
            endColumn: descriptor.endColumn,
            fix: descriptor.fix
          });
        },
        getSourceCode: () => source,
        getFromParentVars: () => directives.fromParentVars,
        getFromChildVars: () => directives.fromChildVars,
        getToParentVars: () => directives.toParentVars,
        getToChildVars: () => directives.toChildVars
      };
      const visitor = rule.create(context);
      this.visitNode(ast, visitor);
    }
    this.messages = this.messages.filter((msg) => !isRuleDisabled(directives, msg.line, msg.ruleId));
    this.messages.sort((a, b) => {
      if (a.line !== b.line)
        return a.line - b.line;
      return a.column - b.column;
    });
    let errorCount = 0;
    let warningCount = 0;
    let fixableErrorCount = 0;
    let fixableWarningCount = 0;
    for (const msg of this.messages) {
      if (msg.severity === "error") {
        errorCount++;
        if (msg.fix)
          fixableErrorCount++;
      } else if (msg.severity === "warning") {
        warningCount++;
        if (msg.fix)
          fixableWarningCount++;
      }
    }
    return {
      filePath,
      messages: this.messages,
      errorCount,
      warningCount,
      fixableErrorCount,
      fixableWarningCount,
      source
    };
  }
  fix(source) {
    const result = this.lint(source);
    if (result.fixableErrorCount + result.fixableWarningCount === 0) {
      return source;
    }
    const fixes = result.messages.filter((m) => m.fix).map((m) => m.fix).sort((a, b) => b.range[0] - a.range[0]);
    let output = source;
    for (const fix of fixes) {
      output = output.slice(0, fix.range[0]) + fix.text + output.slice(fix.range[1]);
    }
    return output;
  }
  visitNode(node, visitor) {
    if (!node || typeof node !== "object")
      return;
    const handler = visitor[node.type];
    if (handler) {
      handler(node);
    }
    if (node.type === "Program") {
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === "KeywordStatement") {
      if (node.argument && typeof node.argument === "object") {
        this.visitNode(node.argument, visitor);
      }
      for (const sub of node.subKeywords) {
        this.visitNode(sub, visitor);
      }
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === "SubKeyword") {
      if (node.argument && typeof node.argument === "object") {
        this.visitNode(node.argument, visitor);
      }
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === "ExpressionStatement") {
      this.visitNode(node.expression, visitor);
    } else if (node.type === "AnswerOption") {
      this.visitNode(node.text, visitor);
      for (const stmt of node.body) {
        this.visitNode(stmt, visitor);
      }
    } else if (node.type === "TextStatement") {
      for (const part of node.parts) {
        if (typeof part !== "string") {
          this.visitNode(part, visitor);
        }
      }
    } else if (node.type === "TextContent") {
      for (const part of node.parts) {
        if (typeof part !== "string") {
          this.visitNode(part, visitor);
        }
      }
    } else if (node.type === "BinaryExpression") {
      this.visitNode(node.left, visitor);
      this.visitNode(node.right, visitor);
    } else if (node.type === "UnaryExpression") {
      this.visitNode(node.argument, visitor);
    } else if (node.type === "MemberExpression") {
      this.visitNode(node.object, visitor);
      this.visitNode(node.property, visitor);
    } else if (node.type === "CallExpression") {
      this.visitNode(node.callee, visitor);
      for (const arg of node.arguments) {
        this.visitNode(arg, visitor);
      }
    } else if (node.type === "IndexExpression") {
      this.visitNode(node.object, visitor);
      this.visitNode(node.index, visitor);
    } else if (node.type === "ArrayExpression") {
      for (const elem of node.elements) {
        this.visitNode(elem, visitor);
      }
    } else if (node.type === "ObjectExpression") {
      for (const prop of node.properties) {
        this.visitNode(prop.key, visitor);
        this.visitNode(prop.value, visitor);
      }
    }
  }
};

// ../dist/formatter/formatter.js
var Formatter = class {
  config;
  constructor(config = {}) {
    this.config = {
      ...DEFAULT_FORMATTER_CONFIG,
      ...config
    };
  }
  format(source) {
    const lines = source.split("\n");
    const formattedLines = [];
    let previousLineWasBlank = false;
    let previousLineWasTopLevel = false;
    let consecutiveBlankLines = 0;
    const directives = parseDirectives(source);
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const lineNum = i + 1;
      if (isFormatDisabled(directives, lineNum)) {
        formattedLines.push(line);
        const isBlank2 = line.trim() === "";
        if (isBlank2) {
          consecutiveBlankLines++;
        } else {
          consecutiveBlankLines = 0;
        }
        previousLineWasBlank = isBlank2;
        previousLineWasTopLevel = !isBlank2 && !line.startsWith("	");
        continue;
      }
      if (this.config.trimTrailingWhitespace) {
        line = line.replace(/[ \t]+$/, "");
      }
      const isBlank = line.trim() === "";
      if (isBlank) {
        consecutiveBlankLines++;
        if (consecutiveBlankLines > 1) {
          continue;
        }
      } else {
        consecutiveBlankLines = 0;
      }
      const isTopLevel = !isBlank && !line.startsWith("	");
      if (this.config.blankLinesBetweenBlocks > 0) {
        if (isTopLevel && previousLineWasTopLevel && !previousLineWasBlank && !isBlank) {
          const trimmed = line.trim();
          if (trimmed.startsWith("*") && !trimmed.startsWith("--")) {
            formattedLines.push("");
          }
        }
      }
      line = this.formatLine(line);
      formattedLines.push(line);
      previousLineWasBlank = isBlank;
      previousLineWasTopLevel = isTopLevel;
    }
    let result = formattedLines.join("\n");
    if (this.config.insertFinalNewline && !result.endsWith("\n")) {
      result += "\n";
    }
    return result;
  }
  formatLine(line) {
    let indent = "";
    let content = line;
    let i = 0;
    while (i < line.length && line[i] === "	") {
      indent += "	";
      i++;
    }
    content = line.slice(i);
    if (content.trim() === "" || content.trim().startsWith("--")) {
      return line;
    }
    if (content.startsWith(">>")) {
      content = content.replace(/^>>\s*/, ">> ");
      content = this.formatExpression(content);
    }
    if (content.startsWith("*")) {
      content = this.formatKeywordLine(content);
    }
    content = this.formatLiterals(content);
    return indent + content;
  }
  formatExpression(content) {
    let result = content;
    const prefix = ">> ";
    const expressionPart = result.slice(prefix.length);
    result = prefix + this.normalizeWhitespace(expressionPart).trim();
    if (this.config.spaceAroundOperators) {
      result = this.formatOperatorsOutsideStrings(result);
    }
    return result;
  }
  formatOperatorsOutsideStrings(content) {
    const operators = ["+", "-", "*", "/", "%", "<", ">", "<=", ">=", "="];
    let result = "";
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const next = content[i + 1] || "";
      const prev = content[i - 1] || "";
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = "";
        result += ch;
        continue;
      }
      if (inString) {
        result += ch;
        continue;
      }
      if (ch === "-" && next === ">") {
        if (this.config.spaceAroundArrow) {
          if (result.length > 0 && result[result.length - 1] !== " ") {
            result += " ";
          }
          result += "->";
          if (content[i + 2] && content[i + 2] !== " ") {
            result += " ";
          }
          i++;
          continue;
        }
      }
      if ((ch === "<" || ch === ">") && next === "=") {
        if (result.length > 0 && result[result.length - 1] !== " ") {
          result += " ";
        }
        result += ch + "=";
        if (content[i + 2] && content[i + 2] !== " ") {
          result += " ";
        }
        i++;
        continue;
      }
      if (this.config.spaceAroundOperators && operators.includes(ch) && !operators.includes(next)) {
        if (ch === "-" && /\d/.test(next) && (prev === "" || prev === "(" || prev === "[" || prev === "," || prev === "=" || prev === " ")) {
          result += ch;
          continue;
        }
        if (ch === ">" && prev === ">") {
          result += ch;
          continue;
        }
        if (result.length > 0 && result[result.length - 1] !== " ") {
          result += " ";
        }
        result += ch;
        if (next && next !== " " && next !== "\n") {
          result += " ";
        }
        continue;
      }
      result += ch;
    }
    return result;
  }
  formatLiterals(content) {
    let result = "";
    let inString = false;
    let stringChar = "";
    for (let i = 0; i < content.length; i++) {
      const ch = content[i];
      const next = content[i + 1] || "";
      const prev = content[i - 1] || "";
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = "";
        result += ch;
        continue;
      }
      if (inString) {
        result += ch;
        continue;
      }
      if (ch === "," && this.config.spaceAfterComma) {
        result += ch;
        if (next && next !== " " && next !== "\n") {
          result += " ";
        }
        continue;
      }
      if (ch === "[" || ch === "(" || ch === "{") {
        result += ch;
        while (i + 1 < content.length && content[i + 1] === " ") {
          i++;
        }
        continue;
      }
      if (ch === " " && (next === "]" || next === ")" || next === "}")) {
        continue;
      }
      result += ch;
    }
    return result;
  }
  formatKeywordLine(content) {
    const colonIndex = content.indexOf(":");
    if (colonIndex === -1) {
      return content;
    }
    const keywordPart = content.slice(0, colonIndex + 1);
    let expressionPart = content.slice(colonIndex + 1);
    const expressionKeywords = [
      "if",
      "while",
      "for",
      "repeat",
      "goto",
      "return",
      "set",
      "wait",
      "program",
      "component",
      "service",
      "trigger",
      "switch"
    ];
    const keywordName = keywordPart.slice(1, -1).trim();
    if (expressionKeywords.includes(keywordName)) {
      expressionPart = this.normalizeWhitespace(expressionPart);
    } else {
      expressionPart = expressionPart.replace(/^\s+/, " ");
    }
    return keywordPart + expressionPart;
  }
  normalizeWhitespace(expression) {
    let result = "";
    let inString = false;
    let stringChar = "";
    let lastWasSpace = false;
    const trimmed = expression.trim();
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (!inString && (ch === '"' || ch === "'")) {
        inString = true;
        stringChar = ch;
        result += ch;
        lastWasSpace = false;
        continue;
      }
      if (inString && ch === stringChar) {
        inString = false;
        stringChar = "";
        result += ch;
        lastWasSpace = false;
        continue;
      }
      if (inString) {
        result += ch;
        continue;
      }
      if (ch === " " || ch === "	") {
        if (!lastWasSpace && result.length > 0) {
          result += " ";
          lastWasSpace = true;
        }
        continue;
      }
      result += ch;
      lastWasSpace = false;
    }
    return " " + result;
  }
};

// src/configuration.ts
var CONFIG_FILENAMES = ["gtlint.config.js", "gtlint.config.mjs"];
function getVSCodeSettings() {
  const config = vscode.workspace.getConfiguration("gtlint");
  return {
    enable: config.get("enable", true),
    lintOnType: config.get("lintOnType", true),
    lintOnTypeDelay: config.get("lintOnTypeDelay", 300),
    lintOnSave: config.get("lintOnSave", true),
    formatOnSave: config.get("formatOnSave", false),
    rules: config.get("rules", {}),
    format: config.get("format", {})
  };
}
function findConfigFile(startDir) {
  let currentDir = path.resolve(startDir);
  while (true) {
    for (const filename of CONFIG_FILENAMES) {
      const configPath = path.join(currentDir, filename);
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir)
      break;
    currentDir = parentDir;
  }
  return null;
}
async function loadConfigFile(configPath) {
  try {
    delete require.cache[require.resolve(configPath)];
    const module2 = require(configPath);
    return module2.default || module2;
  } catch (error) {
    console.error(`Failed to load GTLint config: ${configPath}`, error);
    return null;
  }
}
async function getConfigForDocument(document) {
  const vscodeSettings = getVSCodeSettings();
  let rules2 = { ...DEFAULT_LINTER_CONFIG.rules };
  let format2 = { ...DEFAULT_FORMATTER_CONFIG };
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  const searchDir = workspaceFolder?.uri.fsPath || path.dirname(document.uri.fsPath);
  const configPath = findConfigFile(searchDir);
  if (configPath) {
    const fileConfig = await loadConfigFile(configPath);
    if (fileConfig) {
      if (fileConfig.rules) {
        rules2 = { ...rules2, ...fileConfig.rules };
      }
      if (fileConfig.format) {
        format2 = { ...format2, ...fileConfig.format };
      }
    }
  }
  rules2 = { ...rules2, ...vscodeSettings.rules };
  format2 = { ...format2, ...vscodeSettings.format };
  const linterConfig = {
    rules: rules2,
    format: format2,
    ignore: DEFAULT_LINTER_CONFIG.ignore
  };
  return {
    linter: linterConfig,
    formatter: format2,
    settings: vscodeSettings
  };
}

// src/diagnostics.ts
var vscode2 = __toESM(require("vscode"));
var diagnosticCollection = vscode2.languages.createDiagnosticCollection("gtlint");
var pendingDiagnostics = /* @__PURE__ */ new Map();
function toSeverity(severity) {
  switch (severity) {
    case "error":
      return vscode2.DiagnosticSeverity.Error;
    case "warning":
      return vscode2.DiagnosticSeverity.Warning;
    case "info":
      return vscode2.DiagnosticSeverity.Information;
  }
}
function toDiagnostic(message, document) {
  const startLine = Math.max(0, message.line - 1);
  const startColumn = message.column;
  let endLine = startLine;
  let endColumn = startColumn + 1;
  if (message.endLine !== void 0 && message.endColumn !== void 0) {
    endLine = Math.max(0, message.endLine - 1);
    endColumn = message.endColumn;
  } else {
    const line = document.lineAt(startLine);
    const lineText = line.text;
    let wordEnd = startColumn;
    while (wordEnd < lineText.length && /\w/.test(lineText[wordEnd])) {
      wordEnd++;
    }
    endColumn = Math.max(wordEnd, startColumn + 1);
  }
  const range = new vscode2.Range(
    new vscode2.Position(startLine, startColumn),
    new vscode2.Position(endLine, endColumn)
  );
  const diagnostic = new vscode2.Diagnostic(range, message.message, toSeverity(message.severity));
  diagnostic.source = "gtlint";
  diagnostic.code = message.ruleId;
  return diagnostic;
}
async function lintDocument(document) {
  if (document.languageId !== "guidedtrack") {
    return;
  }
  const { linter: linterConfig, settings } = await getConfigForDocument(document);
  if (!settings.enable) {
    diagnosticCollection.delete(document.uri);
    return;
  }
  const source = document.getText();
  const linter = new Linter(linterConfig);
  const result = linter.lint(source, document.uri.fsPath);
  const diagnostics = result.messages.map((msg) => toDiagnostic(msg, document));
  diagnosticCollection.set(document.uri, diagnostics);
}
function scheduleLint(document, delay) {
  const uri = document.uri.toString();
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
  }
  const timeout = setTimeout(() => {
    pendingDiagnostics.delete(uri);
    lintDocument(document);
  }, delay);
  pendingDiagnostics.set(uri, timeout);
}
function lintNow(document) {
  const uri = document.uri.toString();
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
    pendingDiagnostics.delete(uri);
  }
  lintDocument(document);
}
function clearDiagnostics(document) {
  const uri = document.uri.toString();
  const pending = pendingDiagnostics.get(uri);
  if (pending) {
    clearTimeout(pending);
    pendingDiagnostics.delete(uri);
  }
  diagnosticCollection.delete(document.uri);
}
function lintAllOpen() {
  for (const document of vscode2.workspace.textDocuments) {
    if (document.languageId === "guidedtrack") {
      lintDocument(document);
    }
  }
}
function dispose() {
  for (const timeout of pendingDiagnostics.values()) {
    clearTimeout(timeout);
  }
  pendingDiagnostics.clear();
  diagnosticCollection.dispose();
}

// src/formatter.ts
var vscode3 = __toESM(require("vscode"));
var GTLintFormatterProvider = class {
  async provideDocumentFormattingEdits(document, _options, _token) {
    const { formatter: formatterConfig, settings } = await getConfigForDocument(document);
    if (!settings.enable) {
      return [];
    }
    const source = document.getText();
    const formatter = new Formatter(formatterConfig);
    const formatted = formatter.format(source);
    if (formatted === source) {
      return [];
    }
    const fullRange = new vscode3.Range(
      document.positionAt(0),
      document.positionAt(source.length)
    );
    return [vscode3.TextEdit.replace(fullRange, formatted)];
  }
};

// src/codeActions.ts
var vscode4 = __toESM(require("vscode"));
var GTLintCodeActionProvider = class {
  static {
    this.providedCodeActionKinds = [vscode4.CodeActionKind.QuickFix];
  }
  async provideCodeActions(document, range, context, _token) {
    const { linter: linterConfig, settings } = await getConfigForDocument(document);
    if (!settings.enable) {
      return [];
    }
    const source = document.getText();
    const linter = new Linter(linterConfig);
    const result = linter.lint(source, document.uri.fsPath);
    const actions = [];
    for (const message of result.messages) {
      if (!message.fix) {
        continue;
      }
      const messageRange = this.getMessageRange(message, document);
      if (!messageRange.intersection(range)) {
        continue;
      }
      const action = this.createQuickFix(document, message, message.fix);
      actions.push(action);
    }
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== "gtlint") {
        continue;
      }
      const message = result.messages.find(
        (m) => m.ruleId === diagnostic.code && m.line - 1 === diagnostic.range.start.line && m.fix
      );
      if (message?.fix) {
        const alreadyAdded = actions.some(
          (a) => a.title === `Fix: ${message.message}` || a.title === this.getFixTitle(message)
        );
        if (!alreadyAdded) {
          const action = this.createQuickFix(document, message, message.fix);
          action.diagnostics = [diagnostic];
          actions.push(action);
        }
      }
    }
    return actions;
  }
  getMessageRange(message, document) {
    const startLine = Math.max(0, message.line - 1);
    const startColumn = message.column;
    const endLine = message.endLine !== void 0 ? Math.max(0, message.endLine - 1) : startLine;
    const endColumn = message.endColumn !== void 0 ? message.endColumn : startColumn + 1;
    return new vscode4.Range(
      new vscode4.Position(startLine, startColumn),
      new vscode4.Position(endLine, endColumn)
    );
  }
  getFixTitle(message) {
    switch (message.ruleId) {
      case "no-undefined-vars":
        return `Define variable mentioned in error`;
      case "indent-style":
        return `Fix indentation`;
      case "no-unclosed-string":
        return `Close string`;
      case "no-unclosed-bracket":
        return `Close bracket`;
      default:
        return `Fix: ${message.message}`;
    }
  }
  createQuickFix(document, message, fix) {
    const title = this.getFixTitle(message);
    const action = new vscode4.CodeAction(title, vscode4.CodeActionKind.QuickFix);
    const startPos = document.positionAt(fix.range[0]);
    const endPos = document.positionAt(fix.range[1]);
    const range = new vscode4.Range(startPos, endPos);
    const edit = new vscode4.WorkspaceEdit();
    edit.replace(document.uri, range, fix.text);
    action.edit = edit;
    action.isPreferred = true;
    return action;
  }
};

// src/extension.ts
var outputChannel;
function activate(context) {
  outputChannel = vscode5.window.createOutputChannel("GTLint");
  outputChannel.appendLine("GTLint extension activated");
  const formatterProvider = new GTLintFormatterProvider();
  context.subscriptions.push(
    vscode5.languages.registerDocumentFormattingEditProvider(
      { language: "guidedtrack" },
      formatterProvider
    )
  );
  const codeActionProvider = new GTLintCodeActionProvider();
  context.subscriptions.push(
    vscode5.languages.registerCodeActionsProvider(
      { language: "guidedtrack" },
      codeActionProvider,
      {
        providedCodeActionKinds: GTLintCodeActionProvider.providedCodeActionKinds
      }
    )
  );
  lintAllOpen();
  context.subscriptions.push(
    vscode5.workspace.onDidChangeTextDocument((event) => {
      const settings = getVSCodeSettings();
      if (settings.enable && settings.lintOnType) {
        scheduleLint(event.document, settings.lintOnTypeDelay);
      }
    })
  );
  context.subscriptions.push(
    vscode5.workspace.onDidSaveTextDocument((document) => {
      const settings = getVSCodeSettings();
      if (settings.enable && settings.lintOnSave) {
        lintNow(document);
      }
    })
  );
  context.subscriptions.push(
    vscode5.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === "guidedtrack") {
        const settings = getVSCodeSettings();
        if (settings.enable) {
          lintNow(document);
        }
      }
    })
  );
  context.subscriptions.push(
    vscode5.workspace.onDidCloseTextDocument((document) => {
      clearDiagnostics(document);
    })
  );
  context.subscriptions.push(
    vscode5.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("gtlint")) {
        outputChannel.appendLine("GTLint configuration changed, re-linting all documents");
        lintAllOpen();
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("gtlint.lintFile", () => {
      const editor = vscode5.window.activeTextEditor;
      if (editor && editor.document.languageId === "guidedtrack") {
        lintNow(editor.document);
        outputChannel.appendLine(`Linted: ${editor.document.fileName}`);
      }
    })
  );
  context.subscriptions.push(
    vscode5.commands.registerCommand("gtlint.formatFile", async () => {
      const editor = vscode5.window.activeTextEditor;
      if (editor && editor.document.languageId === "guidedtrack") {
        await vscode5.commands.executeCommand("editor.action.formatDocument");
        outputChannel.appendLine(`Formatted: ${editor.document.fileName}`);
      }
    })
  );
  outputChannel.appendLine("GTLint extension ready");
}
function deactivate() {
  dispose();
  if (outputChannel) {
    outputChannel.dispose();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
