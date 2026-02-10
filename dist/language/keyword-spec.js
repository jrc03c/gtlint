/**
 * GuidedTrack Keyword Specification
 *
 * This file defines the complete specification for all GuidedTrack keywords,
 * including their argument requirements, valid sub-keywords, and constraints.
 * This is used by various lint rules to validate keyword usage.
 *
 * Based on the GuidedTrack Function & Keyword API documentation.
 */
// =============================================================================
// Keyword Specifications
// =============================================================================
export const KEYWORD_SPECS = {
    // ---------------------------------------------------------------------------
    // Media Keywords
    // ---------------------------------------------------------------------------
    audio: {
        description: 'Embeds an audio file into the page',
        argument: { required: true, type: 'url' },
        body: { allowed: true, required: false },
        subKeywords: {
            start: {
                required: false,
                valueType: 'yes-no',
                description: 'Whether the audio auto-plays (default: no)',
            },
            hide: {
                required: false,
                valueType: 'yes-no',
                description: 'Whether the player controls are hidden (default: yes)',
            },
        },
    },
    image: {
        description: 'Inserts an image into the page',
        argument: { required: true, type: 'url' },
        body: { allowed: true, required: false },
        subKeywords: {
            caption: {
                required: false,
                valueType: 'text',
                description: 'Description displayed beneath the image',
            },
            description: {
                required: false,
                valueType: 'text',
                description: 'Alt text if the image fails to load',
            },
        },
    },
    video: {
        description: 'Embeds a YouTube video into the page',
        argument: { required: true, type: 'url' },
        body: { allowed: false, required: false },
    },
    // ---------------------------------------------------------------------------
    // UI Keywords
    // ---------------------------------------------------------------------------
    button: {
        description: 'Puts a button with specific text on the page',
        argument: { required: true, type: 'text' },
        body: { allowed: false, required: false },
    },
    chart: {
        description: 'Displays a chart',
        argument: { required: true, type: 'text' },
        body: { allowed: true, required: true },
        subKeywords: {
            type: {
                required: true,
                valueType: 'enum',
                enumValues: ['bar', 'line', 'scatter'],
                description: 'The type of chart',
            },
            data: {
                required: true,
                valueType: 'collection',
                description: 'The data to display (collection of collections)',
            },
            xaxis: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'X-axis configuration (requires *min and *max)',
            },
            yaxis: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'Y-axis configuration (requires *min and *max)',
            },
            trendline: {
                required: false,
                valueType: 'none',
                description: 'Draws a trend-line in scatter charts',
            },
            min: {
                required: false,
                valueType: 'number',
                description: 'Minimum value for axis',
            },
            max: {
                required: false,
                valueType: 'number',
                description: 'Maximum value for axis',
            },
        },
        requiredSubKeywords: ['type', 'data'],
    },
    clear: {
        description: 'Clears text kept on the page by *maintain',
        argument: { required: false, type: 'none' },
        body: { allowed: false, required: false },
    },
    component: {
        description: 'Displays a bordered content box',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
        subKeywords: {
            classes: {
                required: false,
                valueType: 'text',
                description: 'CSS class names to apply',
            },
            click: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run when component is clicked',
            },
            with: {
                required: false,
                valueType: 'expression',
                description: 'Local variable for click handler context',
            },
            header: {
                required: false,
                valueType: 'text',
                description: 'Header text for the component',
            },
        },
    },
    html: {
        description: 'Inserts arbitrary HTML code into the page',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
    },
    list: {
        description: 'Inserts a list into the page',
        argument: {
            required: false,
            type: 'enum',
            enumValues: ['ordered', 'expandable'],
        },
        body: { allowed: true, required: true },
    },
    maintain: {
        description: 'Keeps text in a gray box at the top of the page',
        argument: { required: true, type: 'text' },
        body: { allowed: false, required: false },
    },
    navigation: {
        description: 'Creates a navigation bar',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
        subKeywords: {
            name: {
                required: false,
                valueType: 'text',
                description: 'Name for the navbar (highly recommended)',
            },
            icon: {
                required: false,
                valueType: 'text',
                description: 'Font Awesome icon class',
            },
        },
    },
    page: {
        description: 'Creates a page of content',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
    },
    progress: {
        description: 'Displays a progress bar',
        argument: { required: true, type: 'percent' },
        body: { allowed: false, required: false },
    },
    share: {
        description: 'Inserts a Facebook share button',
        argument: { required: false, type: 'none' },
        body: { allowed: false, required: false },
    },
    // ---------------------------------------------------------------------------
    // Question Keywords
    // ---------------------------------------------------------------------------
    question: {
        description: 'Asks a question',
        argument: { required: true, type: 'text' },
        body: { allowed: true, required: false },
        subKeywords: {
            type: {
                required: false,
                valueType: 'enum',
                enumValues: [
                    'calendar',
                    'checkbox',
                    'choice',
                    'number',
                    'paragraph',
                    'ranking',
                    'slider',
                    'text',
                ],
                description: 'The type of question',
            },
            shuffle: {
                required: false,
                valueType: 'none',
                description: 'Randomize answer order',
            },
            save: {
                required: false,
                valueType: 'text',
                description: 'Variable name to save response',
            },
            tip: {
                required: false,
                valueType: 'text',
                description: 'Hint text displayed under the question',
            },
            confirm: {
                required: false,
                valueType: 'none',
                description: 'Require clicking Next after selection',
            },
            searchable: {
                required: false,
                valueType: 'none',
                description: 'Enable type-ahead search for answers',
            },
            throwaway: {
                required: false,
                valueType: 'none',
                description: 'Exclude from CSV data',
            },
            countdown: {
                required: false,
                valueType: 'duration',
                description: 'Time limit for answering',
            },
            tags: {
                required: false,
                valueType: 'text',
                description: 'Tags for grouping questions',
            },
            answers: {
                required: false,
                valueType: 'collection',
                description: 'Answer options from a collection',
            },
            blank: {
                required: false,
                valueType: 'none',
                description: 'Allow skipping the question',
            },
            multiple: {
                required: false,
                valueType: 'none',
                description: 'Allow multiple text answers',
            },
            default: {
                required: false,
                valueType: 'expression',
                description: 'Default/pre-selected answer(s)',
            },
            before: {
                required: false,
                valueType: 'text',
                description: 'Text to the left of input box',
            },
            after: {
                required: false,
                valueType: 'text',
                description: 'Text to the right of input box',
            },
            min: {
                required: false,
                valueType: 'number',
                description: 'Minimum value for slider',
            },
            max: {
                required: false,
                valueType: 'number',
                description: 'Maximum value for slider',
            },
            time: {
                required: false,
                valueType: 'yes-no',
                description: 'Allow time selection in calendar',
            },
            date: {
                required: false,
                valueType: 'yes-no',
                description: 'Allow date selection in calendar',
            },
            placeholder: {
                required: false,
                valueType: 'text',
                description: 'Placeholder text in input field',
            },
            other: {
                required: false,
                valueType: 'none',
                description: 'Allow "other" free-text option',
            },
            icon: {
                required: false,
                valueType: 'text',
                description: 'Font Awesome icon for answer option',
            },
            image: {
                required: false,
                valueType: 'url',
                description: 'Image for answer option',
            },
        },
    },
    // ---------------------------------------------------------------------------
    // Control Flow Keywords
    // ---------------------------------------------------------------------------
    if: {
        description: 'Runs a block of code if condition is true',
        argument: { required: true, type: 'expression' },
        body: { allowed: true, required: true },
    },
    for: {
        description: 'Loops through elements of a collection, association, or string',
        argument: { required: true, type: 'iteration' },
        body: { allowed: true, required: true },
    },
    while: {
        description: 'Runs a block of code while condition is true',
        argument: { required: true, type: 'expression' },
        body: { allowed: true, required: true },
    },
    repeat: {
        description: 'Repeats a block of code a specified number of times',
        argument: { required: true, type: 'number' },
        body: { allowed: true, required: true },
    },
    goto: {
        description: 'Jumps to a specific label',
        argument: { required: true, type: 'label' },
        body: { allowed: true, required: false },
        subKeywords: {
            reset: {
                required: false,
                valueType: 'none',
                description: 'Resets the navigation stack (required in *events)',
            },
        },
    },
    label: {
        description: 'Declares a named location in the code',
        argument: { required: true, type: 'label' },
        body: { allowed: false, required: false },
    },
    wait: {
        description: 'Pauses execution',
        argument: {
            required: false,
            type: 'duration',
        },
        body: { allowed: false, required: false },
    },
    quit: {
        description: 'Ends the entire program immediately',
        argument: { required: false, type: 'none' },
        body: { allowed: false, required: false },
    },
    return: {
        description: 'Ends the current subprogram and returns to parent',
        argument: { required: false, type: 'none' },
        body: { allowed: false, required: false },
    },
    // ---------------------------------------------------------------------------
    // Randomization Keywords
    // ---------------------------------------------------------------------------
    randomize: {
        description: 'Randomly selects blocks of code to run',
        argument: { required: false, type: 'number' }, // Can also be "all"
        body: { allowed: true, required: true },
        subKeywords: {
            everytime: {
                required: false,
                valueType: 'none',
                description: 'Re-randomize every time user passes this point',
            },
            name: {
                required: false,
                valueType: 'text',
                description: 'Name for the randomized selection',
            },
            group: {
                required: false,
                valueType: 'text',
                description: 'Name for a randomization group',
            },
        },
    },
    experiment: {
        description: 'Defines an experiment with permanent group assignment',
        argument: { required: true, type: 'text' },
        body: { allowed: true, required: true },
        subKeywords: {
            group: {
                required: false,
                valueType: 'text',
                description: 'Name for an experiment group',
            },
        },
    },
    group: {
        description: 'Defines a block of code (used in *randomize or *experiment)',
        argument: { required: false, type: 'text' },
        body: { allowed: true, required: true },
    },
    // ---------------------------------------------------------------------------
    // Program/Navigation Keywords
    // ---------------------------------------------------------------------------
    program: {
        description: 'Runs a subprogram and returns when it finishes',
        argument: { required: true, type: 'program-name' },
        body: { allowed: false, required: false },
    },
    switch: {
        description: 'Switches to another program (pauses current)',
        argument: { required: true, type: 'program-name' },
        body: { allowed: true, required: false },
        subKeywords: {
            reset: {
                required: false,
                valueType: 'none',
                description: 'Restart target program from beginning',
            },
        },
    },
    // ---------------------------------------------------------------------------
    // Variable Keywords
    // ---------------------------------------------------------------------------
    set: {
        description: "Sets a variable's value to true",
        argument: { required: true, type: 'variable' },
        body: { allowed: false, required: false },
    },
    // ---------------------------------------------------------------------------
    // Events Keywords
    // ---------------------------------------------------------------------------
    events: {
        description: 'Defines named events that can be triggered',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
        subKeywords: {
            startup: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'Event run when program loads',
            },
        },
    },
    trigger: {
        description: 'Triggers an event by name',
        argument: { required: true, type: 'event-name' },
        body: { allowed: true, required: false },
        subKeywords: {
            send: {
                required: false,
                valueType: 'association',
                description: 'Data to send to the event',
            },
        },
    },
    // ---------------------------------------------------------------------------
    // Service/Database Keywords
    // ---------------------------------------------------------------------------
    service: {
        description: 'Makes an HTTP request',
        argument: { required: true, type: 'service-name' },
        body: { allowed: true, required: true },
        subKeywords: {
            path: {
                required: true,
                valueType: 'text',
                description: 'Path to append to service URL',
            },
            method: {
                required: true,
                valueType: 'enum',
                enumValues: ['CONNECT', 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE'],
                description: 'HTTP method to use',
            },
            send: {
                required: false,
                valueType: 'association',
                description: 'Data to send in the request',
            },
            success: {
                required: true,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on success (data in `it`)',
            },
            error: {
                required: true,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on error (error in `it`)',
            },
        },
        requiredSubKeywords: ['path', 'method', 'success', 'error'],
    },
    database: {
        description: 'Requests user info from the GuidedTrack database',
        argument: { required: true, type: 'text' },
        body: { allowed: true, required: true },
        subKeywords: {
            what: {
                required: true,
                valueType: 'enum',
                enumValues: ['email'],
                description: 'Type of data to request',
            },
            success: {
                required: true,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on success (data in `it`)',
            },
            error: {
                required: true,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on error (error in `it`)',
            },
        },
        requiredSubKeywords: ['what', 'success', 'error'],
    },
    // ---------------------------------------------------------------------------
    // Email Keywords
    // ---------------------------------------------------------------------------
    email: {
        description: 'Sends an email immediately or at a specified time',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
        subKeywords: {
            subject: {
                required: true,
                valueType: 'text',
                description: 'Email subject line',
            },
            body: {
                required: true,
                valueType: 'none',
                hasBody: true,
                description: 'Email body content',
            },
            to: {
                required: false,
                valueType: 'text',
                description: 'Recipient email address',
            },
            when: {
                required: false,
                valueType: 'datetime',
                description: 'When to send the email',
            },
            every: {
                required: false,
                valueType: 'duration',
                description: 'Frequency for recurring emails',
            },
            until: {
                required: false,
                valueType: 'datetime',
                description: 'When to stop recurring emails',
            },
            identifier: {
                required: false,
                valueType: 'text',
                description: 'Name for cancelling scheduled emails',
            },
            cancel: {
                required: false,
                valueType: 'text',
                description: 'Cancel emails with this identifier',
            },
        },
        requiredSubKeywords: ['subject', 'body'],
    },
    // ---------------------------------------------------------------------------
    // Purchase Keywords
    // ---------------------------------------------------------------------------
    purchase: {
        description: 'Processes in-app purchases',
        argument: { required: false, type: 'text' },
        body: { allowed: true, required: false },
        subKeywords: {
            status: {
                required: false,
                valueType: 'none',
                description: 'Check subscription status',
            },
            frequency: {
                required: false,
                valueType: 'enum',
                enumValues: ['recurring'],
                description: 'Generate a subscription',
            },
            management: {
                required: false,
                valueType: 'none',
                description: 'Open subscription management',
            },
            success: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on success',
            },
            error: {
                required: false,
                valueType: 'none',
                hasBody: true,
                description: 'Code to run on error',
            },
        },
        mutuallyExclusiveGroups: [['status', 'frequency', 'management']],
        conditionalRequirements: [
            { if: ['status'], then: ['success', 'error'] },
            { if: ['frequency'], then: ['success', 'error'] },
        ],
    },
    // ---------------------------------------------------------------------------
    // User Keywords
    // ---------------------------------------------------------------------------
    login: {
        description: 'Asks the user to log in',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: false },
        subKeywords: {
            required: {
                required: false,
                valueType: 'yes-no',
                description: 'Whether login is required',
            },
        },
    },
    // ---------------------------------------------------------------------------
    // Scoring Keywords
    // ---------------------------------------------------------------------------
    points: {
        description: 'Gives or takes points from user scores',
        argument: { required: true, type: 'number' }, // Can include optional tag
        body: { allowed: false, required: false },
    },
    summary: {
        description: 'Summarizes user responses',
        argument: { required: false, type: 'text' }, // Optional tag name
        body: { allowed: false, required: false },
    },
    // ---------------------------------------------------------------------------
    // Settings Keywords
    // ---------------------------------------------------------------------------
    settings: {
        description: 'Applies settings to the program',
        argument: { required: false, type: 'none' },
        body: { allowed: true, required: true },
        subKeywords: {
            back: {
                required: false,
                valueType: 'yes-no',
                description: 'Enable back navigation',
            },
            menu: {
                required: false,
                valueType: 'yes-no',
                description: 'Show/hide run menu',
            },
        },
    },
    // ---------------------------------------------------------------------------
    // Header (used within components, navigation, etc.)
    // ---------------------------------------------------------------------------
    header: {
        description: 'Defines a header',
        argument: { required: true, type: 'text' },
        body: { allowed: false, required: false },
    },
};
// =============================================================================
// Helper Functions
// =============================================================================
/**
 * Get the specification for a keyword (case-insensitive).
 */
export function getKeywordSpec(keyword) {
    return KEYWORD_SPECS[keyword.toLowerCase()];
}
/**
 * Check if a keyword exists.
 */
export function isValidKeyword(keyword) {
    return keyword.toLowerCase() in KEYWORD_SPECS;
}
/**
 * Get all required sub-keywords for a keyword.
 */
export function getRequiredSubKeywords(keyword) {
    const spec = getKeywordSpec(keyword);
    if (!spec)
        return [];
    const required = [];
    // From requiredSubKeywords array
    if (spec.requiredSubKeywords) {
        required.push(...spec.requiredSubKeywords);
    }
    // From individual sub-keyword specs
    if (spec.subKeywords) {
        for (const [name, subSpec] of Object.entries(spec.subKeywords)) {
            if (subSpec.required && !required.includes(name)) {
                required.push(name);
            }
        }
    }
    return required;
}
/**
 * Get all valid sub-keywords for a keyword.
 */
export function getValidSubKeywords(keyword) {
    const spec = getKeywordSpec(keyword);
    if (!spec?.subKeywords)
        return [];
    return Object.keys(spec.subKeywords);
}
/**
 * Check if a sub-keyword is valid for a given parent keyword.
 */
export function isValidSubKeyword(parentKeyword, subKeyword) {
    const spec = getKeywordSpec(parentKeyword);
    if (!spec?.subKeywords)
        return false;
    return subKeyword.toLowerCase() in spec.subKeywords;
}
/**
 * Get valid enum values for a sub-keyword.
 */
export function getSubKeywordEnumValues(parentKeyword, subKeyword) {
    const spec = getKeywordSpec(parentKeyword);
    if (!spec?.subKeywords)
        return undefined;
    const subSpec = spec.subKeywords[subKeyword.toLowerCase()];
    return subSpec?.enumValues;
}
//# sourceMappingURL=keyword-spec.js.map