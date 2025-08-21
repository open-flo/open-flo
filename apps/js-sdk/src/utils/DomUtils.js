/**
 * DOM manipulation utilities
 */

export class DomUtils {
  /**
   * Create an element with styles
   * @param {string} tagName - HTML tag name
   * @param {string} className - CSS class name
   * @param {Object} styles - Inline styles object
   * @param {string} innerHTML - Inner HTML content
   * @returns {HTMLElement} - Created element
   */
  static createElement(tagName, className = '', styles = {}, innerHTML = '') {
    const element = document.createElement(tagName);
    
    if (className) {
      element.className = className;
    }
    
    if (innerHTML) {
      element.innerHTML = innerHTML;
    }
    
    if (Object.keys(styles).length > 0) {
      Object.assign(element.style, styles);
    }
    
    return element;
  }

  /**
   * Apply styles to an element
   * @param {HTMLElement} element - Target element
   * @param {Object} styles - Styles object
   */
  static applyStyles(element, styles) {
    Object.assign(element.style, styles);
  }

  /**
   * Add event listeners to an element
   * @param {HTMLElement} element - Target element
   * @param {Object} events - Events object { eventName: handler }
   */
  static addEventListeners(element, events) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.addEventListener(eventName, handler);
    });
  }

  /**
   * Remove event listeners from an element
   * @param {HTMLElement} element - Target element
   * @param {Object} events - Events object { eventName: handler }
   */
  static removeEventListeners(element, events) {
    Object.entries(events).forEach(([eventName, handler]) => {
      element.removeEventListener(eventName, handler);
    });
  }

  /**
   * Safely remove an element from DOM
   * @param {HTMLElement} element - Element to remove
   */
  static removeElement(element) {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }

  /**
   * Check if element is in viewport
   * @param {HTMLElement} element - Element to check
   * @returns {boolean} - True if element is in viewport
   */
  static isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get computed styles for an element
   * @param {HTMLElement} element - Target element
   * @param {string} property - CSS property name
   * @returns {string} - Computed value
   */
  static getComputedStyle(element, property) {
    return window.getComputedStyle(element).getPropertyValue(property);
  }

  /**
   * Add CSS styles to document head
   * @param {string} css - CSS string
   * @param {string} id - Optional ID for the style element
   * @returns {HTMLStyleElement} - Created style element
   */
  static addStyles(css, id = null) {
    const styleElement = document.createElement('style');
    
    if (id) {
      styleElement.id = id;
    }
    
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    
    return styleElement;
  }

  /**
   * Remove CSS styles by ID
   * @param {string} id - Style element ID
   */
  static removeStyles(id) {
    const styleElement = document.getElementById(id);
    if (styleElement) {
      styleElement.remove();
    }
  }
} 