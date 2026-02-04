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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/lexer/tokens.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/lexer/lexer.js
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
    if (ch === '"') {
      this.scanString(ch);
      return;
    }
    if (this.isDigit(ch) || ch === "-" && this.isDigit(this.peekNext())) {
      this.scanNumber();
      return;
    }
    if (ch === "-" && this.peekNext() === ">") {
      const startLine = this.line;
      const startCol = this.column;
      const startOffset = this.pos;
      this.advance();
      this.advance();
      this.tokens.push(createToken(TokenType.ARROW, "->", startLine, startCol, startOffset, this.line, this.column, this.pos));
      return;
    }
    if (ch === "(") {
      this.emitToken(TokenType.LPAREN, ch);
      this.advance();
      return;
    }
    if (ch === ")") {
      this.emitToken(TokenType.RPAREN, ch);
      this.advance();
      return;
    }
    if (ch === "[") {
      this.emitToken(TokenType.LBRACKET, ch);
      this.advance();
      return;
    }
    if (ch === "]") {
      this.emitToken(TokenType.RBRACKET, ch);
      this.advance();
      return;
    }
    if (ch === "{") {
      this.emitToken(TokenType.LBRACE, ch);
      this.advance();
      return;
    }
    if (ch === "}") {
      this.emitToken(TokenType.RBRACE, ch);
      this.advance();
      return;
    }
    if (ch === ",") {
      this.emitToken(TokenType.COMMA, ch);
      this.advance();
      return;
    }
    if (ch === ".") {
      this.emitToken(TokenType.DOT, ch);
      this.advance();
      return;
    }
    if (ch === ":" && this.peekNext() === ":") {
      const startLine = this.line;
      const startCol = this.column;
      const startOffset = this.pos;
      this.advance();
      this.advance();
      this.tokens.push(createToken(TokenType.DOUBLE_COLON, "::", startLine, startCol, startOffset, this.line, this.column, this.pos));
      return;
    }
    if (ch === ":") {
      this.emitToken(TokenType.COLON, ch);
      this.advance();
      return;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "%" || ch === "=") {
      this.emitToken(TokenType.OPERATOR, ch);
      this.advance();
      return;
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
      return;
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
        this.scanKeywordArgument();
      }
    }
  }
  scanKeywordArgument() {
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
  scanExpression() {
    this.skipSpaces();
    while (!this.isAtEnd() && this.peek() !== "\n" && this.peek() !== "\r") {
      const ch = this.peek();
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
        this.emitToken(TokenType.LBRACE, ch);
        this.advance();
        continue;
      }
      if (ch === "}") {
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
    const startLine = this.line;
    const startCol = this.column;
    const startOffset = this.pos;
    this.emitToken(TokenType.INTERPOLATION_START, "{");
    this.advance();
    let depth = 1;
    let exprStart = this.pos;
    while (!this.isAtEnd() && depth > 0) {
      const ch = this.peek();
      if (ch === "{")
        depth++;
      if (ch === "}")
        depth--;
      if (ch === "\n" || ch === "\r") {
        const value = this.source.slice(exprStart, this.pos);
        this.tokens.push(createToken(TokenType.ERROR, value, startLine, startCol + 1, exprStart, this.line, this.column, this.pos));
        return;
      }
      if (depth > 0)
        this.advance();
    }
    const exprValue = this.source.slice(exprStart, this.pos);
    if (exprValue.trim()) {
      this.tokens.push(createToken(TokenType.IDENTIFIER, exprValue.trim(), startLine, startCol + 1, exprStart, this.line, this.column, this.pos));
    }
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/parser/ast.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/parser/parser.js
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
    if (this.check(TokenType.TEXT) || this.check(TokenType.IDENTIFIER)) {
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
    if (this.check(TokenType.TEXT)) {
      if (expressionKeywords.includes(keyword)) {
        const textToken = this.advance();
        argument = this.parseTextAsExpression(textToken.value, textToken);
      } else {
        argument = this.parseTextContent();
      }
    } else if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF) && !this.isAtEnd()) {
      if (expressionKeywords.includes(keyword)) {
        argument = this.parseExpression();
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
    if (this.check(TokenType.TEXT)) {
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
        if (this.check(TokenType.IDENTIFIER)) {
          const id = this.advance();
          parts.push(createIdentifier(id.value, this.createLocFromToken(id)));
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/types.js
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
    "no-unreachable-code": "warn"
  },
  format: DEFAULT_FORMATTER_CONFIG,
  ignore: ["**/node_modules/**", "**/dist/**"]
};

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-undefined-vars.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-unused-vars.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/valid-keyword.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/valid-sub-keyword.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-invalid-goto.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/indent-style.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-unclosed-string.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-unclosed-bracket.js
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
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineNumber = i + 1;
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-single-quotes.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/no-unreachable-code.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/rules/index.js
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
  "no-unreachable-code": noUnreachableCode
};

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/directives.js
function parseDirectives(source) {
  const lines = source.split("\n");
  const state = {
    disabledLines: /* @__PURE__ */ new Map(),
    fromParentVars: /* @__PURE__ */ new Set(),
    fromChildVars: /* @__PURE__ */ new Set(),
    toParentVars: /* @__PURE__ */ new Set(),
    toChildVars: /* @__PURE__ */ new Set()
  };
  const activeDisables = /* @__PURE__ */ new Map();
  let nextLineDisable = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    if (nextLineDisable !== null) {
      state.disabledLines.set(lineNum, nextLineDisable);
      nextLineDisable = null;
    }
    const commentMatch = line.match(/^\s*--\s*(.+)$/);
    if (!commentMatch)
      continue;
    const commentContent = commentMatch[1].trim();
    if (commentContent.startsWith("gtlint-disable-next-line")) {
      const rulesStr = commentContent.slice("gtlint-disable-next-line".length).trim();
      if (rulesStr) {
        nextLineDisable = parseRuleList(rulesStr);
      } else {
        nextLineDisable = "all";
      }
      continue;
    }
    if (commentContent.startsWith("gtlint-disable")) {
      const rulesStr = commentContent.slice("gtlint-disable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          activeDisables.set(rule, lineNum);
        }
      } else {
        activeDisables.set("all", lineNum);
      }
      continue;
    }
    if (commentContent.startsWith("gtlint-enable")) {
      const rulesStr = commentContent.slice("gtlint-enable".length).trim();
      if (rulesStr) {
        const rules2 = parseRuleList(rulesStr);
        for (const rule of rules2) {
          const startLine = activeDisables.get(rule);
          if (startLine !== void 0) {
            addDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([rule]));
            activeDisables.delete(rule);
          }
        }
      } else {
        for (const [key, startLine] of activeDisables) {
          if (key === "all") {
            addDisabledRegion(state, startLine, lineNum - 1, "all");
          } else {
            addDisabledRegion(state, startLine, lineNum - 1, /* @__PURE__ */ new Set([key]));
          }
        }
        activeDisables.clear();
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
  for (const [key, startLine] of activeDisables) {
    if (key === "all") {
      addDisabledRegion(state, startLine, totalLines, "all");
    } else {
      addDisabledRegion(state, startLine, totalLines, /* @__PURE__ */ new Set([key]));
    }
  }
  return state;
}
function parseRuleList(str) {
  return new Set(str.split(",").map((s) => s.trim()).filter((s) => s.length > 0));
}
function parseVarList(str) {
  return str.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}
function addDisabledRegion(state, startLine, endLine, rules2) {
  for (let line = startLine; line <= endLine; line++) {
    const existing = state.disabledLines.get(line);
    if (rules2 === "all") {
      state.disabledLines.set(line, "all");
    } else if (existing === "all") {
    } else if (existing) {
      for (const rule of rules2) {
        existing.add(rule);
      }
    } else {
      state.disabledLines.set(line, new Set(rules2));
    }
  }
}
function isRuleDisabled(state, line, ruleId) {
  const disabled = state.disabledLines.get(line);
  if (!disabled)
    return false;
  if (disabled === "all")
    return true;
  return disabled.has(ruleId);
}

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/linter/linter.js
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

// ../node_modules/.pnpm/gt-lint@file+/node_modules/gt-lint/dist/formatter/formatter.js
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
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
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
