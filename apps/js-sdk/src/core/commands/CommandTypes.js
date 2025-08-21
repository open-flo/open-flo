/**
 * JSDoc typedefs for command system
 */

/**
 * @typedef {Object} CommandContext
 * @property {any} chatInterface
 * @property {any} apiService
 * @property {any} eventBus
 * @property {Array} messages
 * @property {number} caretPosition
 * @property {boolean} isVisible
 * @property {Object} options
 */

/**
 * @typedef {Object} CommandActionResult
 * @property {string} [sendMessage]
 * @property {string} [replaceInput]
 * @property {string} [openUrl]
 * @property {"_self"|"_blank"} [target]
 * @property {string} [run]
 * @property {any} [payload]
 */

/**
 * @typedef {Object} CommandHook
 * @property {string} id
 * @property {string} trigger
 * @property {string} name
 * @property {string} [description]
 * @property {number} [priority]
 * @property {(input:string, context:CommandContext) => boolean|number} match
 * @property {(args:any, context:CommandContext) => Promise<any>} getSuggestions
 * @property {(args:any, context:CommandContext) => Promise<CommandActionResult|void>} onExecute
 */

/**
 * @typedef {Object} SearchSpace
 * @property {string} id
 * @property {string} name
 * @property {string} [icon]
 * @property {string} [description]
 * @property {(query:string, context:CommandContext) => Promise<any[]>} query
 * @property {(context:CommandContext) => Promise<any[]>} [prefetch]
 * @property {number} [maxItems]
 * @property {number} [debounceMs]
 * @property {string} [emptyStateText]
 * @property {{
 *  titlePath: string,
 *  descriptionPath?: string,
 *  metaPaths?: string[],
 *  iconPath?: string
 * }} entityMapping
 * @property {{
 *  urlTemplate?: string,
 *  linkField?: string,
 *  target?: "_self"|"_blank",
 *  resolve?: (item:any, context:CommandContext) => { url:string, target?:"_self"|"_blank" },
 *  action?: (item:any, context:CommandContext) => void | { url:string, target?:"_self"|"_blank" },
 *  onBeforeNavigate?: (item:any, context:CommandContext) => boolean|Promise<boolean>
 * }} navigate
 */

/**
 * @typedef {Object} SearchHookConfig
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {number} [priority]
 * @property {number} [debounceMs]
 * @property {number} [maxSpacesShown]
 * @property {SearchSpace[]} spaces
 */


