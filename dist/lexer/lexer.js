import { TokenType, createToken, SUB_KEYWORDS, OPERATORS } from './tokens.js';
export class Lexer {
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
        // Emit remaining DEDENTs at end of file
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.tokens.push(createToken(TokenType.DEDENT, '', this.line, this.column, this.pos, this.line, this.column, this.pos));
        }
        this.tokens.push(createToken(TokenType.EOF, '', this.line, this.column, this.pos, this.line, this.column, this.pos));
        return this.tokens;
    }
    scanToken() {
        // Handle line start (indentation)
        if (this.atLineStart) {
            this.handleIndentation();
            this.atLineStart = false;
            if (this.isAtEnd())
                return;
        }
        const ch = this.peek();
        // Newlines
        if (ch === '\n') {
            this.emitToken(TokenType.NEWLINE, '\n');
            this.advance();
            this.line++;
            this.column = 1;
            this.atLineStart = true;
            return;
        }
        // Carriage return (handle \r\n)
        if (ch === '\r') {
            this.advance();
            if (this.peek() === '\n') {
                this.emitToken(TokenType.NEWLINE, '\r\n');
                this.advance();
            }
            else {
                this.emitToken(TokenType.NEWLINE, '\r');
            }
            this.line++;
            this.column = 1;
            this.atLineStart = true;
            return;
        }
        // Skip spaces (not at line start)
        if (ch === ' ') {
            this.advance();
            return;
        }
        // Comments
        if (ch === '-' && this.peekNext() === '-') {
            this.scanComment();
            return;
        }
        // Expression start >>
        if (ch === '>' && this.peekNext() === '>') {
            const startLine = this.line;
            const startCol = this.column;
            const startOffset = this.pos;
            this.advance();
            this.advance();
            this.tokens.push(createToken(TokenType.EXPRESSION_START, '>>', startLine, startCol, startOffset, this.line, this.column, this.pos));
            this.scanExpression();
            return;
        }
        // Keywords starting with *
        if (ch === '*') {
            this.scanKeyword();
            return;
        }
        // Strings (in text context, strings are part of text content)
        if (ch === '"') {
            this.scanString(ch);
            return;
        }
        // Identifiers and text keywords (and, or, not, in)
        if (this.isAlpha(ch)) {
            this.scanIdentifierOrText();
            return;
        }
        // Default: treat as text
        // This includes all punctuation, numbers, and other characters in text context
        this.scanText();
    }
    handleIndentation() {
        let indent = 0;
        const startOffset = this.pos;
        while (!this.isAtEnd() && this.peek() === '\t') {
            indent++;
            this.advance();
        }
        // Skip blank lines
        if (this.peek() === '\n' || this.peek() === '\r' || this.isAtEnd()) {
            return;
        }
        const currentIndent = this.indentStack[this.indentStack.length - 1];
        if (indent > currentIndent) {
            this.indentStack.push(indent);
            this.tokens.push(createToken(TokenType.INDENT, '\t'.repeat(indent - currentIndent), this.line, 1, startOffset, this.line, this.column, this.pos));
        }
        else if (indent < currentIndent) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
                this.indentStack.pop();
                this.tokens.push(createToken(TokenType.DEDENT, '', this.line, 1, startOffset, this.line, this.column, this.pos));
            }
        }
    }
    scanKeyword() {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        this.advance(); // consume *
        // Check if this might be bold text (*text*)
        // Look ahead to see if we find another * before a colon
        const lookAheadPos = this.pos;
        let foundClosingAsterisk = false;
        let foundColon = false;
        let tempPos = this.pos;
        while (tempPos < this.source.length) {
            const ch = this.source[tempPos];
            if (ch === '\n' || ch === '\r')
                break;
            if (ch === '*') {
                foundClosingAsterisk = true;
                break;
            }
            if (ch === ':') {
                foundColon = true;
                break;
            }
            tempPos++;
        }
        // If we found a closing * before a colon, this is bold text, not a keyword
        if (foundClosingAsterisk && !foundColon) {
            // Scan as text with bold formatting
            let value = '*';
            while (!this.isAtEnd() && this.peek() !== '*' && this.peek() !== '\n' && this.peek() !== '\r') {
                const ch = this.peek();
                // Handle interpolation within bold text
                if (ch === '{') {
                    if (value.length > 1) { // more than just the opening *
                        this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
                        value = '';
                    }
                    this.scanInterpolation();
                    // After interpolation, start collecting text again
                    if (!this.isAtEnd() && this.peek() !== '*' && this.peek() !== '\n' && this.peek() !== '\r') {
                        const newStartLine = this.line;
                        const newStartCol = this.column;
                        const newStartOffset = this.pos;
                        value = '';
                        while (!this.isAtEnd() && this.peek() !== '*' && this.peek() !== '{' && this.peek() !== '\n' && this.peek() !== '\r') {
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
            // Add the text before the closing *
            if (value.length > 1 || (value.length === 1 && value !== '*')) {
                this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            }
            // Consume the closing *
            if (!this.isAtEnd() && this.peek() === '*') {
                this.tokens.push(createToken(TokenType.TEXT, '*', this.line, this.column, this.pos, this.line, this.column + 1, this.pos + 1));
                this.advance();
            }
            // Continue scanning the rest of the line as text
            if (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
                this.scanText();
            }
            return;
        }
        // Otherwise, process as keyword
        const nameStart = this.pos;
        while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '-' || this.peek() === '_')) {
            this.advance();
        }
        const name = this.source.slice(nameStart, this.pos).toLowerCase();
        // Check if this is followed by a colon
        let hasColon = false;
        if (this.peek() === ':') {
            hasColon = true;
            this.advance(); // consume :
        }
        // Determine if keyword or sub-keyword based on current indentation
        const currentIndent = this.indentStack[this.indentStack.length - 1];
        const isSubKeyword = currentIndent > 0 && SUB_KEYWORDS.has(name);
        const tokenType = isSubKeyword ? TokenType.SUB_KEYWORD : TokenType.KEYWORD;
        const value = '*' + name + (hasColon ? ':' : '');
        this.tokens.push(createToken(tokenType, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
        // For keywords with arguments, scan until end of line
        if (hasColon) {
            this.skipSpaces();
            if (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
                this.scanKeywordArgument();
            }
        }
    }
    scanKeywordArgument() {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        let value = '';
        while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
            const ch = this.peek();
            // Handle interpolation
            if (ch === '{') {
                if (value.trim()) {
                    this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
                    value = '';
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
        while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
            const ch = this.peek();
            // Skip spaces
            if (ch === ' ') {
                this.advance();
                continue;
            }
            // Comments
            if (ch === '-' && this.peekNext() === '-') {
                this.scanComment();
                return;
            }
            // Strings
            if (ch === '"') {
                this.scanString(ch);
                continue;
            }
            // Numbers
            if (this.isDigit(ch)) {
                this.scanNumber();
                continue;
            }
            // Arrow
            if (ch === '-' && this.peekNext() === '>') {
                const startLine = this.line;
                const startCol = this.column;
                const startOffset = this.pos;
                this.advance();
                this.advance();
                this.tokens.push(createToken(TokenType.ARROW, '->', startLine, startCol, startOffset, this.line, this.column, this.pos));
                continue;
            }
            // Punctuation and operators
            if (ch === '(') {
                this.emitToken(TokenType.LPAREN, ch);
                this.advance();
                continue;
            }
            if (ch === ')') {
                this.emitToken(TokenType.RPAREN, ch);
                this.advance();
                continue;
            }
            if (ch === '[') {
                this.emitToken(TokenType.LBRACKET, ch);
                this.advance();
                continue;
            }
            if (ch === ']') {
                this.emitToken(TokenType.RBRACKET, ch);
                this.advance();
                continue;
            }
            if (ch === '{') {
                this.emitToken(TokenType.LBRACE, ch);
                this.advance();
                continue;
            }
            if (ch === '}') {
                this.emitToken(TokenType.RBRACE, ch);
                this.advance();
                continue;
            }
            if (ch === ',') {
                this.emitToken(TokenType.COMMA, ch);
                this.advance();
                continue;
            }
            if (ch === '.') {
                this.emitToken(TokenType.DOT, ch);
                this.advance();
                continue;
            }
            if (ch === ':' && this.peekNext() === ':') {
                const startLine = this.line;
                const startCol = this.column;
                const startOffset = this.pos;
                this.advance();
                this.advance();
                this.tokens.push(createToken(TokenType.DOUBLE_COLON, '::', startLine, startCol, startOffset, this.line, this.column, this.pos));
                continue;
            }
            // Operators
            if ('+-*/%='.includes(ch)) {
                this.emitToken(TokenType.OPERATOR, ch);
                this.advance();
                continue;
            }
            if (ch === '<') {
                if (this.peekNext() === '=') {
                    const startLine = this.line;
                    const startCol = this.column;
                    const startOffset = this.pos;
                    this.advance();
                    this.advance();
                    this.tokens.push(createToken(TokenType.OPERATOR, '<=', startLine, startCol, startOffset, this.line, this.column, this.pos));
                }
                else {
                    this.emitToken(TokenType.OPERATOR, ch);
                    this.advance();
                }
                continue;
            }
            if (ch === '>') {
                if (this.peekNext() === '=') {
                    const startLine = this.line;
                    const startCol = this.column;
                    const startOffset = this.pos;
                    this.advance();
                    this.advance();
                    this.tokens.push(createToken(TokenType.OPERATOR, '>=', startLine, startCol, startOffset, this.line, this.column, this.pos));
                }
                else {
                    this.emitToken(TokenType.OPERATOR, ch);
                    this.advance();
                }
                continue;
            }
            // Identifiers
            if (this.isAlpha(ch) || ch === '_') {
                this.scanIdentifier();
                continue;
            }
            // Unknown character
            this.emitToken(TokenType.ERROR, ch);
            this.advance();
        }
    }
    scanComment() {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        let value = '';
        // Consume --
        this.advance();
        this.advance();
        value = '--';
        // Read until end of line
        while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
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
        this.advance(); // consume opening quote
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\n' || this.peek() === '\r') {
                // Unclosed string
                this.tokens.push(createToken(TokenType.ERROR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
                return;
            }
            value += this.peek();
            this.advance();
        }
        if (this.isAtEnd()) {
            // Unclosed string
            this.tokens.push(createToken(TokenType.ERROR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
            return;
        }
        value += this.peek(); // closing quote
        this.advance();
        this.tokens.push(createToken(TokenType.STRING, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
    }
    scanNumber() {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        let value = '';
        if (this.peek() === '-') {
            value += this.peek();
            this.advance();
        }
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
            value += this.peek();
            this.advance();
        }
        // Decimal part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
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
        let value = '';
        while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
            value += this.peek();
            this.advance();
        }
        // Check for operator keywords
        const lower = value.toLowerCase();
        if (OPERATORS.has(lower)) {
            this.tokens.push(createToken(TokenType.OPERATOR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
        }
        else {
            this.tokens.push(createToken(TokenType.IDENTIFIER, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
        }
    }
    scanIdentifierOrText() {
        const startLine = this.line;
        const startCol = this.column;
        const startOffset = this.pos;
        let value = '';
        while (!this.isAtEnd() && (this.isAlphaNumeric(this.peek()) || this.peek() === '_')) {
            value += this.peek();
            this.advance();
        }
        // Check for operator keywords
        const lower = value.toLowerCase();
        if (OPERATORS.has(lower)) {
            this.tokens.push(createToken(TokenType.OPERATOR, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
        }
        else {
            // Continue reading as text until end of line
            while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
                const ch = this.peek();
                // Handle interpolation
                if (ch === '{') {
                    if (value.trim()) {
                        this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
                        value = '';
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
        let value = '';
        while (!this.isAtEnd() && this.peek() !== '\n' && this.peek() !== '\r') {
            const ch = this.peek();
            // Handle interpolation
            if (ch === '{') {
                if (value.trim()) {
                    this.tokens.push(createToken(TokenType.TEXT, value, startLine, startCol, startOffset, this.line, this.column, this.pos));
                    value = '';
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
        this.emitToken(TokenType.INTERPOLATION_START, '{');
        this.advance(); // consume {
        let depth = 1;
        let exprStart = this.pos;
        while (!this.isAtEnd() && depth > 0) {
            const ch = this.peek();
            if (ch === '{')
                depth++;
            if (ch === '}')
                depth--;
            if (ch === '\n' || ch === '\r') {
                // Unclosed interpolation
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
        if (!this.isAtEnd() && this.peek() === '}') {
            this.emitToken(TokenType.INTERPOLATION_END, '}');
            this.advance();
        }
    }
    emitToken(type, value) {
        this.tokens.push(createToken(type, value, this.line, this.column, this.pos, this.line, this.column + value.length, this.pos + value.length));
    }
    skipSpaces() {
        while (!this.isAtEnd() && this.peek() === ' ') {
            this.advance();
        }
    }
    peek() {
        if (this.isAtEnd())
            return '\0';
        return this.source[this.pos];
    }
    peekNext() {
        if (this.pos + 1 >= this.source.length)
            return '\0';
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
        return ch >= '0' && ch <= '9';
    }
    isAlpha(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }
    isAlphaNumeric(ch) {
        return this.isAlpha(ch) || this.isDigit(ch);
    }
}
export function tokenize(source) {
    const lexer = new Lexer(source);
    return lexer.tokenize();
}
//# sourceMappingURL=lexer.js.map