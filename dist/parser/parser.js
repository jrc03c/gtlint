import { TokenType, tokenize } from '../lexer/index.js';
import { createProgram, createKeywordStatement, createSubKeyword, createExpressionStatement, createTextStatement, createTextContent, createCommentStatement, createAnswerOption, createBinaryExpression, createUnaryExpression, createMemberExpression, createCallExpression, createIndexExpression, createIdentifier, createLiteral, createArrayExpression, createObjectExpression, createProperty, } from './ast.js';
export class Parser {
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
            // Skip newlines
            while (this.check(TokenType.NEWLINE)) {
                this.advance();
            }
            if (this.isAtEnd())
                break;
            // Check for DEDENT - means we're exiting this block
            if (this.check(TokenType.DEDENT)) {
                this.advance();
                if (minIndent > 0) {
                    break;
                }
                // At top level, skip orphan DEDENTs and continue parsing
                continue;
            }
            const stmt = this.parseStatement();
            if (stmt) {
                statements.push(stmt);
            }
        }
        return statements;
    }
    parseStatement() {
        // Skip newlines
        while (this.check(TokenType.NEWLINE)) {
            this.advance();
        }
        if (this.isAtEnd() || this.check(TokenType.EOF)) {
            return null;
        }
        const token = this.peek();
        // Comment
        if (this.check(TokenType.COMMENT)) {
            return this.parseComment();
        }
        // Expression statement (>> ...)
        if (this.check(TokenType.EXPRESSION_START)) {
            return this.parseExpressionStatement();
        }
        // Keyword statement (*keyword: ...)
        if (this.check(TokenType.KEYWORD)) {
            return this.parseKeywordStatement();
        }
        // Text (answer options or plain text)
        if (this.check(TokenType.TEXT) || this.check(TokenType.IDENTIFIER) || this.check(TokenType.INTERPOLATION_START)) {
            return this.parseTextOrAnswerOption();
        }
        // INDENT without a preceding keyword - might be continuation
        if (this.check(TokenType.INDENT)) {
            this.advance();
            return null;
        }
        // Skip other tokens
        this.advance();
        return null;
    }
    parseComment() {
        const token = this.advance();
        return createCommentStatement(token.value, this.createLocFromToken(token));
    }
    parseExpressionStatement() {
        const startToken = this.advance(); // consume >>
        const expr = this.parseExpression();
        return createExpressionStatement(expr, this.createLoc(startToken, this.previous()));
    }
    parseKeywordStatement() {
        const keywordToken = this.advance();
        const keyword = this.extractKeywordName(keywordToken.value);
        const startToken = keywordToken;
        // Keywords that expect expressions
        const expressionKeywords = ['if', 'while', 'for', 'wait'];
        // Parse argument (text after the colon)
        let argument = null;
        if (this.check(TokenType.TEXT) || this.check(TokenType.INTERPOLATION_START)) {
            // For expression keywords, re-tokenize and parse as expression
            if (expressionKeywords.includes(keyword)) {
                const textToken = this.advance();
                argument = this.parseTextAsExpression(textToken.value, textToken, keyword);
            }
            else {
                argument = this.parseTextContent();
            }
        }
        else if (!this.check(TokenType.NEWLINE) && !this.check(TokenType.EOF) && !this.isAtEnd()) {
            // Try to parse as expression for certain keywords
            if (expressionKeywords.includes(keyword)) {
                argument = this.parseExpression();
            }
            else if (this.check(TokenType.IDENTIFIER)) {
                argument = this.parseTextContent();
            }
        }
        // Skip to next line
        while (this.check(TokenType.NEWLINE)) {
            this.advance();
        }
        // Parse sub-keywords and body if there's an INDENT
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
            // Skip newlines
            while (this.check(TokenType.NEWLINE)) {
                this.advance();
            }
            if (this.isAtEnd() || this.check(TokenType.DEDENT))
                break;
            // Sub-keyword
            if (this.check(TokenType.SUB_KEYWORD)) {
                subKeywords.push(this.parseSubKeyword());
                continue;
            }
            // Regular statement
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
        // Parse argument
        let argument = null;
        if (this.check(TokenType.TEXT) || this.check(TokenType.INTERPOLATION_START) || this.check(TokenType.IDENTIFIER)) {
            argument = this.parseTextContent();
        }
        // Skip to next line
        while (this.check(TokenType.NEWLINE)) {
            this.advance();
        }
        // Parse body if there's an INDENT
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
        // Skip to next line
        while (this.check(TokenType.NEWLINE)) {
            this.advance();
        }
        // Check if this is an answer option (has indented content)
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
        while (this.check(TokenType.TEXT) ||
            this.check(TokenType.IDENTIFIER) ||
            this.check(TokenType.INTERPOLATION_START)) {
            if (this.check(TokenType.INTERPOLATION_START)) {
                this.advance(); // {
                if (!this.check(TokenType.INTERPOLATION_END)) {
                    parts.push(this.parseExpression());
                }
                if (this.check(TokenType.INTERPOLATION_END)) {
                    this.advance(); // }
                }
            }
            else {
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
        if (this.check(TokenType.OPERATOR) && this.peek().value === '=') {
            const op = this.advance();
            const right = this.parseAssignment();
            return createBinaryExpression('=', expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseOr() {
        let expr = this.parseAnd();
        while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === 'or') {
            const op = this.advance();
            const right = this.parseAnd();
            expr = createBinaryExpression('or', expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseAnd() {
        let expr = this.parseEquality();
        while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === 'and') {
            const op = this.advance();
            const right = this.parseEquality();
            expr = createBinaryExpression('and', expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseEquality() {
        let expr = this.parseComparison();
        while (this.check(TokenType.OPERATOR) && this.peek().value === '=') {
            // Peek ahead to see if this is assignment or comparison
            // In GuidedTrack, = is used for both, context determines meaning
            // For now, treat as comparison in this context
            const op = this.advance();
            const right = this.parseComparison();
            expr = createBinaryExpression('=', expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseComparison() {
        let expr = this.parseIn();
        while (this.check(TokenType.OPERATOR) &&
            ['<', '>', '<=', '>='].includes(this.peek().value)) {
            const op = this.advance();
            const right = this.parseIn();
            expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseIn() {
        let expr = this.parseAdditive();
        while (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === 'in') {
            const op = this.advance();
            const right = this.parseAdditive();
            expr = createBinaryExpression('in', expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseAdditive() {
        let expr = this.parseMultiplicative();
        while (this.check(TokenType.OPERATOR) && ['+', '-'].includes(this.peek().value)) {
            const op = this.advance();
            const right = this.parseMultiplicative();
            expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseMultiplicative() {
        let expr = this.parseUnary();
        while (this.check(TokenType.OPERATOR) && ['*', '/', '%'].includes(this.peek().value)) {
            const op = this.advance();
            const right = this.parseUnary();
            expr = createBinaryExpression(op.value, expr, right, this.createLoc(expr.loc.start, right.loc.end));
        }
        return expr;
    }
    parseUnary() {
        if (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === 'not') {
            const op = this.advance();
            const argument = this.parseUnary();
            return createUnaryExpression('not', argument, this.createLoc(op, argument.loc.end));
        }
        if (this.check(TokenType.OPERATOR) && this.peek().value === '-') {
            const op = this.advance();
            const argument = this.parseUnary();
            return createUnaryExpression('-', argument, this.createLoc(op, argument.loc.end));
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
                    // Check for method call
                    if (this.check(TokenType.LPAREN)) {
                        this.advance(); // (
                        const args = this.parseArguments();
                        if (this.check(TokenType.RPAREN)) {
                            this.advance(); // )
                        }
                        const member = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
                        expr = createCallExpression(member, args, this.createLoc(expr.loc.start, this.previous()));
                    }
                    else {
                        expr = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
                    }
                }
            }
            else if (this.check(TokenType.LBRACKET)) {
                this.advance(); // [
                const index = this.parseExpression();
                if (this.check(TokenType.RBRACKET)) {
                    this.advance(); // ]
                }
                expr = createIndexExpression(expr, index, this.createLoc(expr.loc.start, this.previous()));
            }
            else if (this.check(TokenType.LPAREN)) {
                this.advance(); // (
                const args = this.parseArguments();
                if (this.check(TokenType.RPAREN)) {
                    this.advance(); // )
                }
                expr = createCallExpression(expr, args, this.createLoc(expr.loc.start, this.previous()));
            }
            else if (this.check(TokenType.DOUBLE_COLON)) {
                // Namespace access like calendar::date
                this.advance();
                if (this.check(TokenType.IDENTIFIER)) {
                    const prop = this.advance();
                    const propId = createIdentifier(prop.value, this.createLocFromToken(prop));
                    expr = createMemberExpression(expr, propId, this.createLoc(expr.loc.start, this.previous()));
                    // Check for function call
                    if (this.check(TokenType.LPAREN)) {
                        this.advance(); // (
                        const args = this.parseArguments();
                        if (this.check(TokenType.RPAREN)) {
                            this.advance(); // )
                        }
                        expr = createCallExpression(expr, args, this.createLoc(expr.loc.start, this.previous()));
                    }
                }
            }
            else {
                break;
            }
        }
        return expr;
    }
    parsePrimary() {
        // Number
        if (this.check(TokenType.NUMBER)) {
            const token = this.advance();
            const value = token.value.includes('.') ? parseFloat(token.value) : parseInt(token.value, 10);
            return createLiteral(value, token.value, this.createLocFromToken(token));
        }
        // String
        if (this.check(TokenType.STRING)) {
            const token = this.advance();
            // Remove quotes
            const raw = token.value;
            const value = raw.slice(1, -1);
            return createLiteral(value, raw, this.createLocFromToken(token));
        }
        // Identifier
        if (this.check(TokenType.IDENTIFIER)) {
            const token = this.advance();
            return createIdentifier(token.value, this.createLocFromToken(token));
        }
        // Parenthesized expression
        if (this.check(TokenType.LPAREN)) {
            const start = this.advance();
            const expr = this.parseExpression();
            if (this.check(TokenType.RPAREN)) {
                this.advance();
            }
            return expr;
        }
        // Array literal
        if (this.check(TokenType.LBRACKET)) {
            return this.parseArrayLiteral();
        }
        // Object literal
        if (this.check(TokenType.LBRACE)) {
            return this.parseObjectLiteral();
        }
        // Default: create an error node
        const token = this.peek();
        this.errors.push(`Unexpected token: ${token.type} "${token.value}" at line ${token.line}`);
        this.advance();
        return createLiteral(null, '', this.createLocFromToken(token));
    }
    parseArrayLiteral() {
        const start = this.advance(); // [
        const elements = [];
        while (!this.check(TokenType.RBRACKET) && !this.isAtEnd()) {
            elements.push(this.parseExpression());
            if (this.check(TokenType.COMMA)) {
                this.advance();
            }
            else {
                break;
            }
        }
        if (this.check(TokenType.RBRACKET)) {
            this.advance();
        }
        return createArrayExpression(elements, this.createLoc(start, this.previous()));
    }
    parseObjectLiteral() {
        const start = this.advance(); // {
        const properties = [];
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            const key = this.parseExpression();
            // Expect ->
            if (this.check(TokenType.ARROW)) {
                this.advance();
            }
            const value = this.parseExpression();
            properties.push(createProperty(key, value, this.createLoc(key.loc.start, value.loc.end)));
            if (this.check(TokenType.COMMA)) {
                this.advance();
            }
            else {
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
        // Remove leading * and trailing :
        let name = value;
        if (name.startsWith('*')) {
            name = name.slice(1);
        }
        if (name.endsWith(':')) {
            name = name.slice(0, -1);
        }
        return name.toLowerCase();
    }
    /**
     * Parses a *for loop expression: [var ,] var in collection
     * Handles both `*for: v in x` and `*for: i, v in x` patterns.
     */
    parseForExpression() {
        let loopVars = this.parseAdditive();
        // Handle comma-separated variables: i, v
        while (this.check(TokenType.COMMA)) {
            this.advance(); // consume comma
            const right = this.parseAdditive();
            loopVars = createBinaryExpression(',', loopVars, right, this.createLoc(loopVars.loc.start, right.loc.end));
        }
        // Parse 'in collection'
        if (this.check(TokenType.OPERATOR) && this.peek().value.toLowerCase() === 'in') {
            this.advance(); // consume 'in'
            const collection = this.parseExpression();
            return createBinaryExpression('in', loopVars, collection, this.createLoc(loopVars.loc.start, collection.loc.end));
        }
        return loopVars;
    }
    /**
     * Re-tokenizes and parses a text string as an expression.
     * This is used for keywords like *if:, *while:, etc. that expect expressions
     * but initially receive TEXT tokens from the lexer.
     */
    parseTextAsExpression(text, originalToken, keyword) {
        // Prepend >> to make the lexer treat it as an expression
        const exprSource = `>> ${text}`;
        // Re-tokenize the text as an expression
        const allTokens = tokenize(exprSource);
        // Skip EXPRESSION_START token and EOF token, and adjust positions
        const exprTokens = allTokens
            .filter((t) => t.type !== TokenType.EXPRESSION_START && t.type !== TokenType.EOF)
            .map((t) => {
            // Adjust token positions to match the original source location
            // The re-tokenized text starts at line 1, col 4 (after ">> ")
            // We need to map it to originalToken's position
            const colOffset = originalToken.column - 4; // -4 because of ">> " prefix
            const lineOffset = originalToken.line - 1;
            return {
                ...t,
                line: t.line + lineOffset,
                endLine: t.endLine + lineOffset,
                column: t.column + colOffset,
                endColumn: t.endColumn + colOffset,
                offset: originalToken.offset + (t.offset - 3), // -3 for ">> "
                endOffset: originalToken.offset + (t.endOffset - 3),
            };
        });
        // Store current parser state
        const savedTokens = this.tokens;
        const savedPos = this.pos;
        // Temporarily replace tokens with expression tokens
        this.tokens = exprTokens;
        this.pos = 0;
        // Parse as expression (use for-specific parser for *for loops)
        const expr = keyword === 'for' ? this.parseForExpression() : this.parseExpression();
        // Restore parser state
        this.tokens = savedTokens;
        this.pos = savedPos;
        return expr;
    }
    createLoc(start, end) {
        const startPos = 'line' in start && 'column' in start && 'offset' in start && !('type' in start)
            ? start
            : { line: start.line, column: start.column, offset: start.offset };
        const endPos = 'line' in end && 'column' in end && 'offset' in end && !('type' in end)
            ? end
            : { line: end.endLine, column: end.endColumn, offset: end.endOffset };
        return { start: startPos, end: endPos };
    }
    createLocFromToken(token) {
        return {
            start: { line: token.line, column: token.column, offset: token.offset },
            end: { line: token.endLine, column: token.endColumn, offset: token.endOffset },
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
}
export function parse(tokens) {
    const parser = new Parser();
    return parser.parse(tokens);
}
//# sourceMappingURL=parser.js.map