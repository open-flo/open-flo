/**
 * Keyboard event handling utilities
 */

export class KeyboardUtils {
  /**
   * Check if a key combination matches
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} combination - Key combination object
   * @returns {boolean} - True if combination matches
   */
  static isKeyCombination(event, combination) {
    const { key, ctrlKey = false, metaKey = false, shiftKey = false, altKey = false } = combination;
    
    return (
      event.key === key &&
      event.ctrlKey === ctrlKey &&
      event.metaKey === metaKey &&
      event.shiftKey === shiftKey &&
      event.altKey === altKey
    );
  }

  /**
   * Check if event is Ctrl+K or Cmd+K
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's the search shortcut
   */
  static isSearchShortcut(event) {
    // Check for Ctrl+K (Windows/Linux) OR Cmd+K (Mac)
    const isShortcut = (
      (event.key === 'k' || event.key === 'K') &&
      (event.ctrlKey || event.metaKey) &&
      !event.shiftKey &&
      !event.altKey
    );
    
    // Debug logging for K key or modifier keys
    if (event.key === 'k' || event.key === 'K' || event.ctrlKey || event.metaKey) {
      console.log('🔍 Keyboard shortcut check:', {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        isShortcut: isShortcut,
        target: event.target.tagName,
        targetId: event.target.id,
        targetClass: event.target.className
      });
    }
    
    return isShortcut;
  }

  /**
   * Test keyboard event detection
   * @param {KeyboardEvent} event - Keyboard event to test
   * @returns {Object} - Test results
   */
  static testKeyboardEvent(event) {
    return {
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      isSearchShortcut: this.isSearchShortcut(event),
      keyCode: event.keyCode,
      which: event.which,
      code: event.code
    };
  }

  /**
   * Check if event is Escape key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's Escape
   */
  static isEscape(event) {
    return event.key === 'Escape';
  }

  /**
   * Check if event is Enter key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's Enter
   */
  static isEnter(event) {
    return event.key === 'Enter';
  }

  /**
   * Check if event is Arrow Down key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's Arrow Down
   */
  static isArrowDown(event) {
    return event.key === 'ArrowDown';
  }

  /**
   * Check if event is Arrow Up key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's Arrow Up
   */
  static isArrowUp(event) {
    return event.key === 'ArrowUp';
  }

  /**
   * Check if event is Tab key
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's Tab
   */
  static isTab(event) {
    return event.key === 'Tab';
  }

  /**
   * Check if event is a navigation key (arrows)
   * @param {KeyboardEvent} event - Keyboard event
   * @returns {boolean} - True if it's a navigation key
   */
  static isNavigationKey(event) {
    return this.isArrowDown(event) || this.isArrowUp(event);
  }

  /**
   * Prevent default behavior and stop propagation
   * @param {Event} event - Event to prevent
   */
  static preventDefault(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Add keyboard event listener with automatic cleanup
   * @param {HTMLElement} element - Target element
   * @param {string} eventType - Event type (default: 'keydown')
   * @param {Function} handler - Event handler
   * @returns {Function} - Cleanup function
   */
  static addKeyboardListener(element, eventType = 'keydown', handler) {
    const wrappedHandler = (event) => {
      handler(event);
    };
    
    element.addEventListener(eventType, wrappedHandler);
    
    // Return cleanup function
    return () => {
      element.removeEventListener(eventType, wrappedHandler);
    };
  }

  /**
   * Add global keyboard listener
   * @param {string} eventType - Event type (default: 'keydown')
   * @param {Function} handler - Event handler
   * @returns {Function} - Cleanup function
   */
  static addGlobalKeyboardListener(eventType = 'keydown', handler) {
    return this.addKeyboardListener(document, eventType, handler);
  }
} 