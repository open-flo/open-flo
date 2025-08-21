/**
 * Event bus for component communication
 */

export class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} - Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Event handler to remove
   */
  off(event, callback) {
    if (this.events.has(event)) {
      this.events.get(event).delete(callback);
      
      // Clean up empty event sets
      if (this.events.get(event).size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event once (auto-unsubscribe after first call)
   * @param {string} event - Event name
   * @param {Function} callback - Event handler
   * @returns {Function} - Unsubscribe function
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    
    return this.on(event, onceCallback);
  }

  /**
   * Clear all events
   */
  clear() {
    this.events.clear();
  }

  /**
   * Get all registered events
   * @returns {Array} - Array of event names
   */
  getEvents() {
    return Array.from(this.events.keys());
  }

  /**
   * Get subscriber count for an event
   * @param {string} event - Event name
   * @returns {number} - Number of subscribers
   */
  getSubscriberCount(event) {
    return this.events.has(event) ? this.events.get(event).size : 0;
  }
} 