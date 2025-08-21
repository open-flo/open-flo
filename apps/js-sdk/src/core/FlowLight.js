/**
 * Main FlowLight orchestrator class
 */

import { EventBus } from './EventBus.js';
import { ApiService } from '../services/ApiService.js';
import { FloatingButton } from '../ui/components/FloatingButton.js';
import { DEFAULT_OPTIONS } from '../constants/Defaults.js';
import { MESSAGES } from '../constants/Messages.js';
import { KeyboardUtils } from '../utils/KeyboardUtils.js';
import { ChatInterface } from '../ui/components/ChatInterface.js';
import { SearchSpace } from './commands/SearchSpace.js';

export class FlowLight {
  /**
   * Deep merge two objects, combining nested properties
   * @param {Object} target - The target object (defaults)
   * @param {Object} source - The source object to merge from (user options)
   * @returns {Object} - The merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          // Recursively merge nested objects
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          // For arrays and primitives, completely override with source value
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  constructor(options = {}) {
    // Deep merge user options with defaults to preserve nested objects
    // User options will override corresponding defaults
    this.options = this.deepMerge(DEFAULT_OPTIONS, options);

    // Initialize core services
    this.eventBus = new EventBus();
    this.apiService = new ApiService(this.options);
    // Initialize components
    this.components = {
      button: new FloatingButton(this.options, this.eventBus)
    };

    // State management
    this.isInitialized = false;
    this.isChatVisible = false;

    // Initialize if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }

    if (this.options.debug) {
      console.log(MESSAGES.flowlightInitialized, this.options);
    }
  }

  /**
   * Initialize FlowLight
   */
  init() {
    try {
      // Render components
      this.components.button.render();

      // Bind events
      this.bindEvents();

      // Bind keyboard shortcuts
      this.bindKeyboardShortcuts();

      this.isInitialized = true;

      if (this.options.debug) {
        console.log('FlowLight initialized successfully');
      }
    } catch (error) {
      console.error('Failed to initialize FlowLight:', error);
    }
  }

  /**
   * Bind component events
   */
  bindEvents() {
    // Button click event
    this.eventBus.on('button:click', () => {
      this.toggleChat();
    });

    // Listen to chat visibility events from ChatInterface
    this.eventBus.on('chat:shown', () => {
      this.isChatVisible = true;
      if (this.options.debug) {
        console.log('FlowLight: Chat shown event received, syncing state');
      }
    });

    this.eventBus.on('chat:hidden', () => {
      this.isChatVisible = false;
      if (this.options.debug) {
        console.log('FlowLight: Chat hidden event received, syncing state');
      }
    });
  }

  /**
   * Bind keyboard shortcuts
   */
  bindKeyboardShortcuts() {
    // Only bind keyboard shortcuts if enabled
    if (!this.options.keyboardShortcuts) {
      if (this.options.debug) {
        console.log('Keyboard shortcuts disabled in options');
      }
      return;
    }

    // Clean up existing listener if any
    if (this.keyboardCleanup) {
      this.keyboardCleanup();
      this.keyboardCleanup = null;
    }

    const cleanup = KeyboardUtils.addGlobalKeyboardListener('keydown', (event) => {
      if (KeyboardUtils.isSearchShortcut(event)) {
        KeyboardUtils.preventDefault(event);
        if (this.options.debug) {
          console.log('⌨️ Chat shortcut triggered!');
        }
        this.toggleChat();
      }
    });

    // Store cleanup function for later disposal
    this.keyboardCleanup = cleanup;
    
    if (this.options.debug) {
      console.log('✅ Keyboard shortcuts bound successfully');
    }
  }

  /**
   * Toggle chat visibility
   */
  toggleChat() {
    if (this.options.debug) {
      console.log('🔄 Toggle chat called:', {
        isChatVisible: this.isChatVisible,
        chatInterfaceVisible: this.components.button.chatInterface.isVisible
      });
    }
    
    // Delegate to ChatInterface component via FloatingButton
    this.components.button.toggleChat();
  }

  /**
   * Register a new flow
   * @param {Flow} flow - The flow instance to register
   */
  registerFlow(flow) {
    ChatInterface.registerFlow(flow);
  }

  /**
   * Initialize flows from JSON configurations and register them
   * @param {Array<Object>} flowConfigs - Array of flow configuration objects
   * @returns {Array<Flow>} Array of initialized and registered Flow instances
   */
  initializeFlows(flowConfigs) {
    return ChatInterface.initializeFlows(flowConfigs);
  }

  initializeSearchSpaces(searchSpaceConfigs) {
    ChatInterface.initializeSearchSpaces(searchSpaceConfigs);
  }
}