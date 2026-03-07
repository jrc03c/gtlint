export interface MethodCompletionData {
  name: string;
  types: string[];
  snippet: string;
  hasParams: boolean;
  description: string;
}

/**
 * Count leading tabs in a line. Spaces don't count.
 */
export function getIndentLevel(line: string): number {
  let count = 0;
  for (const ch of line) {
    if (ch === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Walk upward from `currentLine` to find the parent keyword.
 *
 * - If current line's indent is 0, return null (top level).
 * - Walk upward, skipping blank lines and comment-only lines.
 * - For each non-skipped line: if indent is exactly (currentIndent - 1) and
 *   the trimmed line starts with `*keyword`, return the keyword name (lowercase).
 * - If indent drops below (currentIndent - 1), return null.
 * - If we reach top without finding, return null.
 */
export function findParentKeyword(lines: string[], currentLine: number): string | null {
  const currentIndent = getIndentLevel(lines[currentLine]);
  if (currentIndent === 0) return null;

  const targetIndent = currentIndent - 1;

  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (trimmed === '') continue;

    // Skip comment-only lines
    if (trimmed.startsWith('--')) continue;

    const indent = getIndentLevel(line);

    if (indent === targetIndent) {
      // Check if it starts with *keyword
      if (trimmed.startsWith('*')) {
        // Extract keyword name: strip `*`, then take everything before `:` or space
        const afterStar = trimmed.slice(1);
        const match = afterStar.match(/^([a-zA-Z_]+)/);
        if (match) {
          return match[1].toLowerCase();
        }
      }
      // Found a line at the right indent but it's not a keyword
      return null;
    }

    if (indent < targetIndent) {
      return null;
    }
  }

  return null;
}

/**
 * Check if currentLine is inside an `*html` block by walking up through
 * all ancestor indent levels.
 *
 * - If indent is 0, return false.
 * - Start with targetIndent = currentIndent - 1.
 * - Walk upward, skipping blanks and comments.
 * - When finding a line at targetIndent: check if it's `*html`.
 *   If yes, return true. If not, decrement targetIndent and continue.
 * - If targetIndent goes below 0 or we reach top, return false.
 */
export function isInsideHtmlBlock(lines: string[], currentLine: number): boolean {
  const currentIndent = getIndentLevel(lines[currentLine]);
  if (currentIndent === 0) return false;

  let targetIndent = currentIndent - 1;

  for (let i = currentLine - 1; i >= 0; i--) {
    if (targetIndent < 0) return false;

    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (trimmed === '') continue;

    // Skip comment-only lines
    if (trimmed.startsWith('--')) continue;

    const indent = getIndentLevel(line);

    if (indent === targetIndent) {
      // Check if this ancestor is *html
      if (trimmed === '*html' || trimmed.startsWith('*html:') || trimmed.startsWith('*html ')) {
        return true;
      }
      // Not *html — move to next ancestor level
      targetIndent--;
      if (targetIndent < 0) return false;
    }
  }

  return false;
}

interface MethodSpec {
  name: string;
  params?: string[];
  description: string;
}

interface TypeMethodSpecs {
  type: string;
  methods: MethodSpec[];
}

const METHOD_SPECS: TypeMethodSpecs[] = [
  {
    type: 'String',
    methods: [
      { name: 'clean', description: 'Remove leading/trailing whitespace and collapse internal whitespace' },
      { name: 'count', params: ['text'], description: 'Count occurrences of text in string' },
      { name: 'decode', params: ['scheme'], description: 'Decode string using specified scheme (e.g., "JSON")' },
      { name: 'encode', params: ['scheme'], description: 'Encode string using specified scheme (e.g., "JSON")' },
      { name: 'find', params: ['text'], description: 'Find position of text in string' },
      { name: 'lowercase', description: 'Convert string to lowercase' },
      { name: 'size', description: 'Get the length of the string' },
      { name: 'split', params: ['delimiter'], description: 'Split string by delimiter into a collection' },
      { name: 'uppercase', description: 'Convert string to uppercase' },
    ],
  },
  {
    type: 'Number',
    methods: [
      { name: 'round', description: 'Round to nearest integer, or to specified decimal places' },
      { name: 'seconds', description: 'Create a duration in seconds' },
      { name: 'minutes', description: 'Create a duration in minutes' },
      { name: 'hours', description: 'Create a duration in hours' },
      { name: 'days', description: 'Create a duration in days' },
      { name: 'weeks', description: 'Create a duration in weeks' },
      { name: 'months', description: 'Create a duration in months' },
      { name: 'years', description: 'Create a duration in years' },
    ],
  },
  {
    type: 'Collection',
    methods: [
      { name: 'add', params: ['element'], description: 'Add an element to the collection' },
      { name: 'combine', params: ['collection'], description: 'Combine with another collection' },
      { name: 'count', params: ['value'], description: 'Count occurrences of value in collection' },
      { name: 'erase', params: ['value'], description: 'Erase all occurrences of value' },
      { name: 'find', params: ['value'], description: 'Find position of value in collection' },
      { name: 'insert', params: ['element', 'position'], description: 'Insert element at position' },
      { name: 'max', description: 'Get the maximum value' },
      { name: 'mean', description: 'Get the arithmetic mean' },
      { name: 'median', description: 'Get the median value' },
      { name: 'min', description: 'Get the minimum value' },
      { name: 'remove', params: ['position'], description: 'Remove element at position' },
      { name: 'shuffle', description: 'Randomly shuffle the collection' },
      { name: 'size', description: 'Get the number of elements' },
      { name: 'sort', params: ['direction'], description: 'Sort the collection (ascending or descending)' },
      { name: 'unique', description: 'Remove duplicate values' },
    ],
  },
  {
    type: 'Association',
    methods: [
      { name: 'encode', params: ['scheme'], description: 'Encode association using specified scheme (e.g., "JSON")' },
      { name: 'erase', params: ['value'], description: 'Erase all entries with the given value' },
      { name: 'keys', description: 'Get all keys as a collection' },
      { name: 'remove', params: ['key'], description: 'Remove entry by key' },
    ],
  },
  {
    type: 'Any',
    methods: [
      { name: 'text', description: 'Convert value to its text representation' },
      { name: 'type', description: 'Get the runtime type name of the value' },
    ],
  },
];

function buildSnippet(name: string, params?: string[]): string {
  if (!params || params.length === 0) return name;
  const paramSnippets = params.map((p, i) => `\${${i + 1}:${p}}`).join(', ');
  return `${name}(${paramSnippets})`;
}

/**
 * Build a deduplicated flat list of method completion data from METHOD_SPECS.
 * Methods shared across types (e.g., `.size` on String and Collection) appear
 * once with all applicable types listed in the `types` array.
 */
export function buildMethodCompletionData(): MethodCompletionData[] {
  const map = new Map<string, MethodCompletionData>();

  for (const typeSpec of METHOD_SPECS) {
    for (const method of typeSpec.methods) {
      const existing = map.get(method.name);
      if (existing) {
        if (!existing.types.includes(typeSpec.type)) {
          existing.types.push(typeSpec.type);
        }
      } else {
        map.set(method.name, {
          name: method.name,
          types: [typeSpec.type],
          snippet: buildSnippet(method.name, method.params),
          hasParams: !!(method.params && method.params.length > 0),
          description: method.description,
        });
      }
    }
  }

  return Array.from(map.values());
}
