import Flow from './Flow';

/**
 * FlowRegister manages the registration and discovery of flows
 */
class FlowRegister {
    constructor() {
        /**
         * Map of registered flows with their names as keys
         * @type {Map<string, Flow>}
         * @private
         */
        this._flows = new Map();
    }

    /**
     * Register a new flow
     * @param {Flow} flow - The flow instance to register
     * @throws {Error} If flow with same name already exists
     */
    register(flow) {
        if (this._flows.has(flow.name)) {
            throw new Error(`Flow with name "${flow.name}" already exists`);
        }
        this._flows.set(flow.name, flow);
    }

    /**
     * Unregister a flow by name
     * @param {string} flowName - Name of the flow to unregister
     * @returns {boolean} true if flow was found and unregistered, false otherwise
     */
    unregister(flowName) {
        return this._flows.delete(flowName);
    }

    /**
     * Get a flow by name
     * @param {string} flowName - Name of the flow to retrieve
     * @returns {Flow|undefined} The flow instance if found, undefined otherwise
     */
    getFlow(flowName) {
        // Log all available flows
        console.log('Available flows:', this._flows);
        return this._flows.get(flowName);
    }

    /**
     * Find flows by name or description
     * @param {string} query - Search query to match against flow names and descriptions
     * @returns {Flow[]} Array of matching flows
     */
    findFlows(query) {
        const searchTerm = query.toLowerCase();
        return Array.from(this._flows.values()).filter(flow => 
            flow.name.toLowerCase().includes(searchTerm) ||
            flow.description.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Get all registered flows
     * @returns {Flow[]} Array of all registered flows
     */
    getAllFlows() {
        return Array.from(this._flows.values());
    }

    
}

export { FlowRegister };
export default FlowRegister;