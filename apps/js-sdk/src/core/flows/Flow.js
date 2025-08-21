

/**
 * Represents a JavaScript function step in a flow sequence
 */
export class FunctionStep {
    /**
     * @param {string} name - Human-readable name of the step
     * @param {Function} fn - JavaScript function to execute
     * @param {Object} options - Additional configuration options
     */
    constructor({name, fn, options} = {}) {
        this.name = name;
        this.fn = fn;
        this.options = options || {};
        this.type = 'function';
    }

    async execute(inputs) {
        try {
            // Execute the function with inputs
            const result = await this.fn(inputs);
            return result;
        } catch (error) {
            console.error(`Error executing function step ${this.name}:`, error);
            throw error;
        }
    }
}

/**
 * Represents a single API step in a flow sequence
 */
export class APIStep {
    /**
     * @param {string} id - Unique identifier for the step
     * @param {string} name - Human-readable name of the step
     * @param {string} url - API endpoint URL
     * @param {Object} auth - Authentication configuration
     * @param {Object} payloadSchema - Request payload schema
     */
    constructor({name, url, method, auth, payloadSchema} = {}) {
        this.name = name;
        this.method = method;
        this.url = url;
        this.auth = auth;
        this.payloadSchema = payloadSchema;
        this.type = 'api';
    }

    async execute(inputs) {
        try {
            // Get auth token from cookie if configured
            let headers = {
                'Content-Type': 'application/json'
            };
            
            if (this.auth?.type === 'Bearer') {
                let token = null;
                
                if (this.auth?.source?.type === 'cookie') {
                    token = document.cookie
                        .split('; ')
                        .find(row => row.startsWith(this.auth.source.name))
                        ?.split('=')[1];
                } else if (this.auth?.source?.type === 'localStorage') {
                    try {
                        const storageKey = this.auth.source.key || 'auth';
                        const tokenPath = this.auth.source.path;
                        
                        if (tokenPath) {
                            // Parse JSON and navigate the token path
                            const authData = JSON.parse(localStorage.getItem(storageKey));
                            token = tokenPath.split('.').reduce((obj, key) => obj?.[key], authData);
                        } else {
                            // Use the raw value directly without parsing
                            token = localStorage.getItem(storageKey);
                        }
                    } catch (error) {
                        console.warn(`Failed to get token from localStorage.${this.auth.source.key || 'auth'}:`, error);
                    }
                }
                    
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            // Build payload based on schema
            const payload = {};
            for (const [key, schema] of Object.entries(this.payloadSchema)) {
                // If input exists, use it
                if (inputs[key] !== undefined) {
                    payload[key] = inputs[key];
                }
                // If required but no input, throw error
                else if (schema.required && !schema.default) {
                    throw new Error(`Missing required field: ${key}`);
                }
                // If has default value, use it
                else if (schema.default !== undefined) {
                    payload[key] = schema.default;
                }
            }

            // Make the API call
            const response = await fetch(this.url, {
                method: this.method,
                headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error executing step ${this.name}:`, error);
            throw error;
        }
    }
}

/**
 * Represents a Flow that defines a sequence of operations
 */
export class Flow {
    /**
     * @param {string} name - Unique identifier and human-readable name of the flow
     * @param {string} description - Detailed description of what the flow does
     * @param {object} inputs - Input schema for the flow with validation rules
     * @param {Array<APIStep>} steps - Array of steps to execute in sequence
     */
    constructor({name, description, inputs, steps} = {}) {
        this.name = name;
        this.description = description;
        this.inputs = inputs || {}; // Schema for input validation
        this.steps = Array.isArray(steps) ? steps : [];
    }                               

    /**
     * Triggers the execution of the flow
     * @param {Object} inputs - Input data for the flow
     * @returns {Promise<void>}
     */
    async trigger(inputs = {}) {
        for (const step of this.steps) {
            await step.execute(inputs);
        }
    }

    /**
     * Static method to create Flow instances from JSON configuration array
     * @param {Array<Object>} flowConfigs - Array of flow configuration objects
     * @returns {Array<Flow>} Array of initialized Flow instances
     */
    static fromConfigs(flowConfigs) {
        if (!Array.isArray(flowConfigs)) {
            throw new Error('Flow configs must be an array');
        }

        return flowConfigs.map(config => {
            try {
                // Validate required fields
                if (!config.name) {
                    throw new Error('Flow config must have name');
                }

                // Create step instances from step configurations
                const steps = [];
                if (Array.isArray(config.steps)) {
                    config.steps.forEach(stepConfig => {
                        if (stepConfig.type === 'function' && stepConfig.fn) {
                            // Create FunctionStep for function-based steps
                            steps.push(new FunctionStep(stepConfig));
                        } else if (stepConfig.url) {
                            // Create APIStep for API-based steps
                            steps.push(new APIStep(stepConfig));
                        } else {
                            throw new Error(`Invalid step configuration: must have either 'fn' (for function steps) or 'url' (for API steps)`);
                        }
                    });
                }

                // Create and return Flow instance
                return new Flow({
                    name: config.name,
                    description: config.description,
                    inputs: config.inputs || {},
                    steps: steps
                });
            } catch (error) {
                console.error(`Error creating flow from config:`, config, error);
                throw new Error(`Failed to create flow "${config.name || 'unknown'}": ${error.message}`);
            }
        });
    }

    /**
     * Static method to create a single Flow instance from JSON configuration
     * @param {Object} flowConfig - Flow configuration object
     * @returns {Flow} Initialized Flow instance
     */
    static fromConfig(flowConfig) {
        return Flow.fromConfigs([flowConfig])[0];
    }
}

export default Flow;