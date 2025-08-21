/**
 * FlowLight - Command Interface with Floating Button
 * Main entry point for the modular FlowLight library
 */

import { FlowLight } from './core/FlowLight.js';
import { Flow, APIStep } from './core/flows/Flow.js';
import { SearchSpace } from './core/commands/SearchSpace.js';

// Export the main FlowLight class
export default FlowLight;

// UMD export for browser compatibility
if (typeof window !== 'undefined') {
  window.FlowLight = FlowLight;
  window.Flow = Flow;
  window.APIStep = APIStep;
  window.SearchSpace = SearchSpace;
}

// CommonJS export for Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FlowLight;
  module.exports.Flow = Flow;
  module.exports.APIStep = APIStep;
  module.exports.SearchSpace = SearchSpace;
} 