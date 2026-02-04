export const noUnclosedString = {
    name: 'no-unclosed-string',
    description: 'Detect unclosed string literals',
    severity: 'error',
    create(context) {
        return {
            Program(_node) {
                const source = context.getSourceCode();
                const lines = source.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const lineNumber = i + 1;
                    let inString = false;
                    let stringChar = '';
                    let stringStart = -1;
                    for (let j = 0; j < line.length; j++) {
                        const ch = line[j];
                        // Skip if in comment
                        if (!inString && ch === '-' && line[j + 1] === '-') {
                            break;
                        }
                        if (!inString && ch === '"') {
                            inString = true;
                            stringChar = ch;
                            stringStart = j;
                        }
                        else if (inString && ch === stringChar) {
                            inString = false;
                            stringChar = '';
                            stringStart = -1;
                        }
                    }
                    // If still in string at end of line, it's unclosed
                    if (inString) {
                        context.report({
                            message: `Unclosed string literal (missing closing ${stringChar})`,
                            line: lineNumber,
                            column: stringStart + 1,
                            endLine: lineNumber,
                            endColumn: line.length + 1,
                        });
                    }
                }
            },
        };
    },
};
//# sourceMappingURL=no-unclosed-string.js.map