import type { LintRule } from '../linter.js';
import { noUndefinedVars } from './no-undefined-vars.js';
import { noUnusedVars } from './no-unused-vars.js';
import { validKeyword } from './valid-keyword.js';
import { validSubKeyword } from './valid-sub-keyword.js';
import { noInvalidGoto } from './no-invalid-goto.js';
import { indentStyle } from './indent-style.js';
import { noUnclosedString } from './no-unclosed-string.js';
import { noUnclosedBracket } from './no-unclosed-bracket.js';
import { noSingleQuotes } from './no-single-quotes.js';
import { noUnreachableCode } from './no-unreachable-code.js';
import { requiredSubkeywords } from './required-subkeywords.js';
import { validSubkeywordValue } from './valid-subkeyword-value.js';
import { noInlineArgument } from './no-inline-argument.js';
import { gotoNeedsResetInEvents } from './goto-needs-reset-in-events.js';
import { purchaseSubkeywordConstraints } from './purchase-subkeyword-constraints.js';
import { correctIndentation } from './correct-indentation.js';

export const rules: Record<string, LintRule> = {
  'no-undefined-vars': noUndefinedVars,
  'no-unused-vars': noUnusedVars,
  'valid-keyword': validKeyword,
  'valid-sub-keyword': validSubKeyword,
  'no-invalid-goto': noInvalidGoto,
  'indent-style': indentStyle,
  'no-unclosed-string': noUnclosedString,
  'no-unclosed-bracket': noUnclosedBracket,
  'no-single-quotes': noSingleQuotes,
  'no-unreachable-code': noUnreachableCode,
  'required-subkeywords': requiredSubkeywords,
  'valid-subkeyword-value': validSubkeywordValue,
  'no-inline-argument': noInlineArgument,
  'goto-needs-reset-in-events': gotoNeedsResetInEvents,
  'purchase-subkeyword-constraints': purchaseSubkeywordConstraints,
  'correct-indentation': correctIndentation,
};

export function getRule(name: string): LintRule | undefined {
  return rules[name];
}

export function getAllRules(): LintRule[] {
  return Object.values(rules);
}
