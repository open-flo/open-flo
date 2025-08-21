/**
 * Debouncing utilities
 */

export class DebounceUtils {
  /**
   * Create a debounced function
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced function
   */
  static debounce(func, delay) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Create a debounced function that returns a promise
   * @param {Function} func - Async function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} - Debounced async function
   */
  static debounceAsync(func, delay) {
    let timeoutId;
    let lastPromise = null;
    
    return function (...args) {
      clearTimeout(timeoutId);
      
      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  }

  /**
   * Clear a debounced timeout
   * @param {number} timeoutId - Timeout ID to clear
   */
  static clearDebounce(timeoutId) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
} 