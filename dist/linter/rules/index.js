import { noUndefinedVars } from './no-undefined-vars.js';
import { noUnusedVars } from './no-unused-vars.js';
import { validKeyword } from './valid-keyword.js';
import { validSubKeyword } from './valid-sub-keyword.js';
import { noInvalidGoto } from './no-invalid-goto.js';
import { indentStyle } from './indent-style.js';
import { noUnclosedString } from './no-unclosed-string.js';
import { noUnclosedBracket } from './no-unclosed-bracket.js';
import { noSingleQuotes } from './no-single-quotes.js';
export const rules = {
    'no-undefined-vars': noUndefinedVars,
    'no-unused-vars': noUnusedVars,
    'valid-keyword': validKeyword,
    'valid-sub-keyword': validSubKeyword,
    'no-invalid-goto': noInvalidGoto,
    'indent-style': indentStyle,
    'no-unclosed-string': noUnclosedString,
    'no-unclosed-bracket': noUnclosedBracket,
    'no-single-quotes': noSingleQuotes,
};
export function getRule(name) {
    return rules[name];
}
export function getAllRules() {
    return Object.values(rules);
}
//# sourceMappingURL=index.js.map