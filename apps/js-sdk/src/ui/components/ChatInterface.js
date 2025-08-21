/**
 * Chat interface component for Ask in Doc functionality
 */

import { DomUtils } from '../../utils/DomUtils.js';
import { KeyboardUtils } from '../../utils/KeyboardUtils.js';
import { MarkdownUtils } from '../../utils/MarkdownUtils.js';
import { ApiService } from '../../services/ApiService.js';
import { Icons } from '../icons/Icons.js';
import { DebounceUtils } from '../../utils/DebounceUtils.js';
import { SearchHook } from '../../core/commands/SearchHook.js';
import { SearchSpace } from '../../core/commands/SearchSpace.js';
import { FlowRegister } from '../../core/flows/Flowregister.js';
import { Flow } from '../../core/flows/Flow.js';

export class ChatInterface {
  // Static instance of FlowRegister shared across all instances
  static _flowRegister = new FlowRegister();
  // Static instance of SearchHook shared across all instances
  static _searchHook = new SearchHook();
  
  constructor(options = {}, eventBus) {
    this.options = options;
    this.eventBus = eventBus;
    this.apiService = new ApiService(options);
    this.isVisible = false;
    this.chatContainer = null;
    this.chatMessages = null;
    this.chatInput = null;
    this.sendButton = null;
    this.overlayElement = null;
    this.messages = [];
    this.isLoading = false;
    this.searchResults = [];
    this.isSearching = false;
    
    // Initialize static search hook if not already created
    if (!ChatInterface._searchHook) {
      ChatInterface._searchHook = new SearchHook({
        spaces: options.searchSpaces || []
      });
    }
    this.isSlashMode = false;

    // Command dropdown state
    this.commandDropdown = null;
    this.commandActiveIndex = -1;

    // Create debounced search function
    this.debouncedSearch = DebounceUtils.debounce(this.performSearch.bind(this), 300);
  }

  /**
   * Create the chat interface
   */
  create() {
    // Don't create elements immediately - they will be created when shown
    this.elementsCreated = false;
  }

  /**
   * Create the overlay
   */
  createOverlay() {
    this.overlayElement = DomUtils.createElement('div', 'flowlight-chat-overlay', {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: this.options.zIndex - 1,
      display: 'none',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    document.body.appendChild(this.overlayElement);
  }

  /**
   * Create the chat container
   */
  createChatContainer() {
    this.chatContainer = DomUtils.createElement('div', 'flowlight-chat-container', {
      position: 'fixed',
      bottom: '0',
      left: '50%',
      transform: 'translate(-50%, 100%) scale(0.8)',
      width: '900px',
      maxWidth: '95vw',
      height: '70vh',
      background: DEFAULT_OPTIONS.themeColors.primaryBackgroundGradient,
      backdropFilter: 'blur(4px)',
      boxShadow: '0 0 8px #eee, 1px 0 3px #0000001a, -1px 0 3px #0000001a',
      borderRadius: '12px 12px 0 0',
      zIndex: this.options.zIndex,
      display: 'none',
      opacity: '0',
      transition: 'all 0.3s ease',
      overflow: 'hidden',
      border: 'none',
      padding: '8px'
    });

    // Create inner container for white background content
    this.chatInnerContainer = DomUtils.createElement('div', 'flowlight-chat-inner', {
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      borderRadius: '10px 10px 0 0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    });

    this.chatContainer.appendChild(this.chatInnerContainer);
    document.body.appendChild(this.chatContainer);
  }

  /**
   * Create the chat header
   */
  createChatHeader() {
    const header = DomUtils.createElement('div', 'flowlight-chat-header', {
      padding: '16px 24px',
      backgroundColor: DEFAULT_OPTIONS.themeColors.primaryLight,
      borderBottom: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: '0',
      minHeight: '32px'
    });

    // Left side - Title and icon
    const leftSide = DomUtils.createElement('div', 'flowlight-chat-title', {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    });

    // Title
    const title = DomUtils.createElement('div', 'flowlight-chat-title-text', {
      fontSize: '18px',
      fontWeight: '600',
      background: DEFAULT_OPTIONS.themeColors.nudgeGradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    title.textContent = this.options.title || DEFAULT_OPTIONS.title;

    leftSide.appendChild(title);

    // Right side - Close button
    const closeButton = DomUtils.createElement('button', 'flowlight-chat-close', {
      width: '32px',
      height: '32px',
      backgroundColor: 'transparent',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });
    closeButton.innerHTML = '−';

    // Add hover effects
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = DEFAULT_OPTIONS.themeColors.primaryLight;
      closeButton.style.borderColor = DEFAULT_OPTIONS.themeColors.primaryLight;
    });

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent';
      closeButton.style.borderColor = '#e5e7eb';
    });

    // Add click handler
    closeButton.addEventListener('click', () => {
      this.hide();
    });

    header.appendChild(leftSide);
    header.appendChild(closeButton);
    this.chatInnerContainer.appendChild(header);
  }

  /**
   * Create the chat messages container
   */
  createChatMessages() {
    this.chatMessages = DomUtils.createElement('div', 'flowlight-chat-messages', {
      position: 'absolute',
      top: '65px', // Header height
      bottom: '80px', // Adjusted for floating input container
      left: '8px',
      right: '8px',
      overflowY: 'auto',
      padding: '24px',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    });

    this.chatInnerContainer.appendChild(this.chatMessages);

    // Focus input when clicking anywhere in messages area
    this.chatMessages.addEventListener('click', (e) => {
      // Allow normal link clicks without stealing focus
      if (e.target && (e.target.tagName === 'A' || e.target.closest('a'))) return;
      if (this.chatInput && !this.chatInput.disabled) {
        this.chatInput.focus();
      }
    });
  }

  /**
   * Create suggestions container
   */
  createSuggestionsContainer() {
    this.suggestionsContainer = DomUtils.createElement('div', 'flowlight-suggestions-container', {
      position: 'absolute',
      bottom: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '70%',
      zIndex: '1',
      display: 'none'
    });

    // Create suggestions wrapper
    const suggestionsWrapper = DomUtils.createElement('div', 'flowlight-suggestions-wrapper', {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: '8px',
      marginBottom: '16px',
      alignItems: 'center'
    });
    
    // Add "Suggested:" label
    const suggestedLabel = DomUtils.createElement('span', 'flowlight-suggestions-label', {
      fontSize: '14px',
      color: '#6b7280',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      marginRight: '8px'
    });
    suggestedLabel.textContent = "Suggested:";
    suggestionsWrapper.appendChild(suggestedLabel);

    // Add suggestion items
    (this.options.suggestions || DEFAULT_OPTIONS.suggestions).forEach((suggestion, index) => {
      const suggestionItem = DomUtils.createElement('div', 'flowlight-suggestion-item', {
        padding: '6px 8px',
        backgroundColor: 'white',
        border: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`,
        borderRadius: '10px',
        cursor: 'pointer',
        fontSize: '11px',
        color: '#374151',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'inline-block',
        width: 'fit-content',
        tabIndex: '0',
        outline: 'none'
      });

      suggestionItem.textContent = suggestion;

      // Add hover effects
      suggestionItem.addEventListener('mouseenter', () => {
        suggestionItem.style.backgroundColor = '#f9fafb';
        suggestionItem.style.borderColor = DEFAULT_OPTIONS.themeColors.primary;
        suggestionItem.style.transform = 'translateY(-1px)';
        suggestionItem.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
      });

      suggestionItem.addEventListener('mouseleave', () => {
        suggestionItem.style.backgroundColor = 'white';
        suggestionItem.style.borderColor = DEFAULT_OPTIONS.themeColors.primaryLight;
        suggestionItem.style.transform = 'translateY(0)';
        suggestionItem.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      });

      // Add click handler to use suggestion
      suggestionItem.addEventListener('click', () => {
        this.chatInput.value = suggestion;
        this.updateSendButtonState();
        this.chatInput.focus();
      });

      // Add keyboard handler for Enter key
      suggestionItem.addEventListener('keydown', (e) => {
        if (KeyboardUtils.isEnter(e)) {
          e.preventDefault();
          this.chatInput.value = suggestion;
          this.updateSendButtonState();
          this.chatInput.focus();
        }
      });

      suggestionsWrapper.appendChild(suggestionItem);
    });

    this.suggestionsContainer.appendChild(suggestionsWrapper);
    this.chatInnerContainer.appendChild(this.suggestionsContainer);
  }

  /**
   * Create search results container
   */
  createSearchResultsContainer() {
    this.searchResultsContainer = DomUtils.createElement('div', 'flowlight-search-results-container', {
      position: 'absolute',
      bottom: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '70%',
      maxHeight: '300px',
      overflowY: 'auto',
      zIndex: '2',
      display: 'none',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`,
      padding: '12px'
    });

    this.chatInnerContainer.appendChild(this.searchResultsContainer);
  }

  /**
   * Show suggestions when chat is empty
   */
  showSuggestions() {
    if (this.messages.length === 0 && this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'block';
      this.hideSearchResults();
    }
  }

  /**
   * Hide suggestions
   */
  hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
    }
    this.hideSearchResults();
  }

  /**
   * Perform search using the query API
   * @param {string} query - Search query
   */
  async performSearch(query) {
    if (!query || query.trim().length < 2) {
      this.hideSearchResults();
      return;
    }

    try {
      this.isSearching = true;
      this.showSearchLoading();
      
      const response = await this.apiService.queryFlows(query);
      
      if (response && response.results && Array.isArray(response.results)) {
        this.searchResults = response.results;
        this.displaySearchResults();
      } else {
        this.hideSearchResults();
      }
    } catch (error) {
      console.error('Search error:', error);
      this.hideSearchResults();
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Display search results as suggestion cards
   */
  displaySearchResults() {
    if (!this.searchResultsContainer) return;
    
    this.searchResultsContainer.innerHTML = '';
    
    if (this.searchResults.length === 0) {
      this.hideSearchResults();
      return;
    }

    // Create results wrapper
    const resultsWrapper = DomUtils.createElement('div', 'flowlight-search-results-wrapper', {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    });

    // Add "Search Results:" label
    const resultsLabel = DomUtils.createElement('div', 'flowlight-search-results-label', {
      fontSize: '12px',
      color: '#6b7280',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontWeight: '500',
      marginBottom: '8px',
      padding: '0 4px'
    });
    resultsLabel.textContent = `Search Results (${this.searchResults.length})`;
    resultsWrapper.appendChild(resultsLabel);

    // Add result cards
    this.searchResults.forEach((result, index) => {
      const resultCard = DomUtils.createElement('div', 'flowlight-search-result-card', {
        padding: '12px',
        backgroundColor: '#f9fafb',
        border: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`,
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        position: 'relative',
        userSelect: 'none',
        tabIndex: '0',
        outline: 'none'
      });

      // Title
      const title = DomUtils.createElement('div', 'flowlight-search-result-title', {
        fontSize: '13px',
        fontWeight: '600',
        color: '#111827',
        lineHeight: '1.3'
      });
      title.textContent = result.title || 'Untitled';

      // Description
      const description = DomUtils.createElement('div', 'flowlight-search-result-description', {
        fontSize: '11px',
        color: '#6b7280',
        lineHeight: '1.4'
      });
      description.textContent = result.description || 'No description available';

      

      resultCard.appendChild(title);
      resultCard.appendChild(description);

      // Add external link icon if URL exists
      if (result.url) {
        const linkIcon = DomUtils.createElement('div', 'flowlight-search-result-link-icon', {
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '10px',
          color: '#6b7280',
          opacity: '0.7'
        });
        linkIcon.innerHTML = '↗';
        resultCard.appendChild(linkIcon);
      }

      // Add hover effects
      resultCard.addEventListener('mouseenter', () => {
        resultCard.style.backgroundColor = '#f3f4f6';
        resultCard.style.borderColor = DEFAULT_OPTIONS.themeColors.primary;
        resultCard.style.transform = 'translateY(-1px)';
        resultCard.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.12)';
        
        // Make link icon more visible on hover
        const linkIcon = resultCard.querySelector('.flowlight-search-result-link-icon');
        if (linkIcon) {
          linkIcon.style.opacity = '1';
          linkIcon.style.color = DEFAULT_OPTIONS.themeColors.primary;
        }
      });

      resultCard.addEventListener('mouseleave', () => {
        resultCard.style.backgroundColor = '#f9fafb';
        resultCard.style.borderColor = DEFAULT_OPTIONS.themeColors.primaryLight;
        resultCard.style.transform = 'translateY(0)';
        resultCard.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        
        // Reset link icon opacity
        const linkIcon = resultCard.querySelector('.flowlight-search-result-link-icon');
        if (linkIcon) {
          linkIcon.style.opacity = '0.7';
          linkIcon.style.color = '#6b7280';
        }
      });

      // Add click handler to navigate to URL
      resultCard.addEventListener('click', () => {
        if (result.url) {
          // Add brief visual feedback
          resultCard.style.transform = 'scale(0.98)';
          setTimeout(() => {
            resultCard.style.transform = 'translateY(-1px)';
          }, 100);
          
          // Navigate to the URL
          window.open(result.url, '_self');
          this.hideSearchResults();
        } else {
          // Fallback to chat query if no URL
          const query = `Tell me about ${result.title}`;
          this.chatInput.value = query;
          this.updateSendButtonState();
          this.hideSearchResults();
          this.chatInput.focus();
        }
      });

      // Add keyboard handler for Enter key
      resultCard.addEventListener('keydown', (e) => {
        if (KeyboardUtils.isEnter(e)) {
          e.preventDefault();
          if (result.url) {
            // Add brief visual feedback
            resultCard.style.transform = 'scale(0.98)';
            setTimeout(() => {
              resultCard.style.transform = 'translateY(-1px)';
            }, 100);
            
            // Navigate to the URL
            window.open(result.url, '_self');
            this.hideSearchResults();
          } else {
            // Fallback to chat query if no URL
            const query = `Tell me about ${result.title}`;
            this.chatInput.value = query;
            this.updateSendButtonState();
            this.hideSearchResults();
            this.chatInput.focus();
          }
        }
      });

      resultsWrapper.appendChild(resultCard);
    });

    this.searchResultsContainer.appendChild(resultsWrapper);
    this.searchResultsContainer.style.display = 'block';
  }

  /**
   * Show search loading state
   */
  showSearchLoading() {
    if (!this.searchResultsContainer) return;
    
    this.searchResultsContainer.innerHTML = '';
    
    const loadingWrapper = DomUtils.createElement('div', 'flowlight-search-loading-wrapper', {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      color: '#6b7280',
      fontSize: '12px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    const loadingText = DomUtils.createElement('span', 'flowlight-search-loading-text');
    loadingText.textContent = 'Searching...';
    
    loadingWrapper.appendChild(loadingText);
    this.searchResultsContainer.appendChild(loadingWrapper);
    this.searchResultsContainer.style.display = 'block';
  }

  /**
   * Hide search results
   */
  hideSearchResults() {
    if (this.searchResultsContainer) {
      this.searchResultsContainer.style.display = 'none';
    }
  }

  /**
   * Check if suggestions are visible
   */
  isSuggestionsVisible() {
    return this.suggestionsContainer && 
           this.suggestionsContainer.style.display !== 'none' && 
           this.suggestionsContainer.style.display !== '';
  }

  /**
   * Check if search results are visible
   */
  isSearchResultsVisible() {
    return this.searchResultsContainer && 
           this.searchResultsContainer.style.display !== 'none' && 
           this.searchResultsContainer.style.display !== '';
  }

  /**
   * Handle arrow key navigation for suggestions
   */
  handleArrowKeyNavigation(e) {
    const isDown = KeyboardUtils.isArrowDown(e);
    const isUp = KeyboardUtils.isArrowUp(e);
    
    // Get all clickable suggestion elements
    let suggestionElements = [];
    
    if (this.isSuggestionsVisible()) {
      suggestionElements = Array.from(this.suggestionsContainer.querySelectorAll('.flowlight-suggestion-item'));
    } else if (this.isSearchResultsVisible()) {
      suggestionElements = Array.from(this.searchResultsContainer.querySelectorAll('.flowlight-search-result-card'));
    }
    
    if (suggestionElements.length === 0) return;
    
    // Find currently focused element
    const currentIndex = suggestionElements.findIndex(el => 
      el === document.activeElement || el.contains(document.activeElement)
    );
    
    let nextIndex;
    if (isDown) {
      nextIndex = currentIndex < suggestionElements.length - 1 ? currentIndex + 1 : 0;
    } else if (isUp) {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : suggestionElements.length - 1;
    }
    
    // Focus the next element
    if (nextIndex >= 0 && nextIndex < suggestionElements.length) {
      suggestionElements[nextIndex].focus();
    }
  }

  /**
   * Create the chat input area
   */
  createChatInput() {
    const inputContainer = DomUtils.createElement('div', 'flowlight-chat-input-container', {
      padding: '8px 24px',
      backgroundColor: 'white',
      borderRadius: '60px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexShrink: '0',
      position: 'absolute',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '70%',
      zIndex: '1',
      border: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`
    });

    // Input wrapper
    const inputWrapper = DomUtils.createElement('div', 'flowlight-chat-input-wrapper', {
      flex: '1',
      position: 'relative',
      borderRadius: '8px',
      height: '34px',
      overflow: 'hidden'
    });

    // Textarea for input
    this.chatInput = DomUtils.createElement('textarea', 'flowlight-chat-input', {
      width: '100%',
      height: '34px',
      padding: '0px 16px',
      border: 'none',
      outline: 'none',
      backgroundColor: 'transparent',
      fontSize: '14px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      resize: 'none',
      color: '#111827',
      lineHeight: '34px',
      overflow: 'hidden'
    });

    this.chatInput.placeholder = this.options.inputPlaceholder || DEFAULT_OPTIONS.inputPlaceholder;

    // Keep single line height - no auto-resizing and handle send button state
    this.chatInput.addEventListener('input', () => {
      
      // Handle first slash mode after any input changes
      this.handleSlashMode();
      if (this.isSlashMode) {
        return;
      }
      
      // No auto-resize for single line
      this.updateSendButtonState();
      
      // Trigger search if there's text, unless in slash-command mode
      const query = this.chatInput.value.trim();
      if (!this.isSlashMode && query.length >= 2) {
        this.debouncedSearch(query);
        this.hideSuggestions();
      } else if (!this.isSlashMode) {
        this.hideSearchResults();
        if (this.messages.length === 0) {
          this.showSuggestions();
        }
      }
    });

    // Dismiss suggestions when input loses focus (with a small delay to allow for clicks)
    this.chatInput.addEventListener('blur', () => {
      setTimeout(() => {
        // Only hide if the focus is not on a suggestion or search result
        const activeElement = document.activeElement;
        const isFocusOnSuggestions = activeElement && (
          activeElement.closest('.flowlight-suggestions-container') ||
          activeElement.closest('.flowlight-search-results-container') ||
          activeElement.closest('.flowlight-command-dropdown')
        );
        
        if (!isFocusOnSuggestions) {
          this.hideSearchResults();
        }
      }, 150);
    });

    // Show suggestions when input is focused and empty
    this.chatInput.addEventListener('focus', () => {
      if (this.chatInput.value.trim().length === 0 && this.messages.length === 0) {
        this.showSuggestions();
      }
    });

    // Send button
    this.sendButton = DomUtils.createElement('button', 'flowlight-chat-send', {
      width: '30px',
      height: '30px',
      backgroundColor: DEFAULT_OPTIONS.themeColors.primaryLight,
      border: 'none',
      borderRadius: '999px',
      cursor: 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9ca3af',
      fontSize: '16px',
      transition: 'all 0.2s ease',
      flexShrink: '0'
    });
    this.sendButton.innerHTML = Icons.arrowUp;
    this.sendButton.disabled = true;


    // Add click handler
    this.sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    inputWrapper.appendChild(this.chatInput);
    inputContainer.appendChild(inputWrapper);
    inputContainer.appendChild(this.sendButton);
    this.chatInnerContainer.appendChild(inputContainer);

    // Focus input when clicking anywhere in the input container (including empty space)
    inputContainer.addEventListener('click', () => {
      if (this.chatInput && !this.chatInput.disabled) {
        this.chatInput.focus();
      }
    });
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Overlay click to hide
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.hide();
      }
    });

    // Chat container click to dismiss suggestions
    this.chatContainer.addEventListener('click', (e) => {
      // If click is not on input, suggestions, or search results, dismiss them
      const isInputClick = e.target.closest('.flowlight-chat-input');
      const isSuggestionsClick = e.target.closest('.flowlight-suggestions-container');
      const isSearchResultsClick = e.target.closest('.flowlight-search-results-container');
      const isCommandDropdownClick = e.target.closest('.flowlight-command-dropdown');
      
      if (!isInputClick && !isSuggestionsClick && !isSearchResultsClick && !isCommandDropdownClick) {
        this.hideSearchResults();
        this.hideCommandDropdown();
      }
    });

    // Input events
    this.chatInput.addEventListener('keydown', (e) => {
      if (KeyboardUtils.isEscape(e)) {
        // Dismiss suggestions first, then hide chat if no suggestions are visible
        if (this.isCommandDropdownVisible()) {
          this.hideCommandDropdown();
          e.preventDefault();
          return;
        } else if (this.isSuggestionsVisible() || this.isSearchResultsVisible()) {
          this.hideSuggestions();
          this.hideSearchResults();
          e.preventDefault();
        } else {
          this.hide();
        }
      } else if (KeyboardUtils.isEnter(e) && !e.shiftKey) {
        if (this.isCommandDropdownVisible()) {
          e.preventDefault();
          this.executeActiveCommandItem();
          return;
        }
        e.preventDefault();
        this.sendMessage();
      } else if (KeyboardUtils.isArrowDown(e) || KeyboardUtils.isArrowUp(e)) {
        // Handle arrow key navigation for command dropdown or suggestions
        if (this.isCommandDropdownVisible()) {
          this.moveCommandActiveIndex(KeyboardUtils.isArrowDown(e) ? 1 : -1);
          e.preventDefault();
          return;
        } else if (this.isSuggestionsVisible() || this.isSearchResultsVisible()) {
          this.handleArrowKeyNavigation(e);
          e.preventDefault();
        }
      }
    });
  }

  /**
   * Create chat elements if they don't exist
   */
  createElements() {
    if (this.elementsCreated) return;
    
    this.createOverlay();
    this.createChatContainer();
    this.createChatHeader();
    this.createChatMessages();
    this.createSuggestionsContainer();
    this.createSearchResultsContainer();
    this.createChatInput();
    this.bindEvents();
    
    this.elementsCreated = true;
  }

  /**
   * Show the chat interface
   */
  show(initialQuery = '') {
    // Create elements if they don't exist
    this.createElements();
    
    this.isVisible = true;
    
    // Show overlay
    this.overlayElement.style.display = 'block';
    setTimeout(() => {
      this.overlayElement.style.opacity = '1';
    }, 10);
    
    // Show chat
    this.chatContainer.style.display = 'block';
    setTimeout(() => {
      this.chatContainer.style.opacity = '1';
      this.chatContainer.style.transform = 'translate(-50%, 0%) scale(1)';
    }, 10);
    
    // Focus input and set initial query
    setTimeout(() => {
      this.chatInput.focus();
      if (initialQuery) {
        this.chatInput.value = initialQuery;
        this.chatInput.dispatchEvent(new Event('input'));
        // Automatically send the initial query
        this.sendMessage();
      } else {
        // Show suggestions only when no initial query and chat is empty
        this.showSuggestions();
      }
    }, 100);
    
    // Emit event
    this.eventBus.emit('chat:shown');
    
    if (this.options.debug) {
      console.log('Chat interface shown');
    }
  }

  /**
   * Hide the chat interface
   */
  hide() {
    this.isVisible = false;
    
    // Hide chat
    this.chatContainer.style.opacity = '0';
    this.chatContainer.style.transform = 'translate(-50%, 100%) scale(0.8)';
    
    // Hide overlay
    this.overlayElement.style.opacity = '0';
    
    setTimeout(() => {
      this.chatContainer.style.display = 'none';
      this.overlayElement.style.display = 'none';
      this.chatInput.value = '';
      this.messages = [];
      this.searchResults = [];
      this.clearMessages();
      this.hideSearchResults();
      
      // Remove elements from DOM
      this.removeElements();
    }, 300);
    
    // Emit event
    this.eventBus.emit('chat:hidden');
    
    if (this.options.debug) {
      console.log('Chat interface hidden');
    }
  }

  /**
   * Update send button state based on input content
   */
  updateSendButtonState() {
    const hasText = this.chatInput.value.trim().length > 0;
    
    if (hasText) {
      this.sendButton.disabled = false;
      this.sendButton.style.backgroundColor = DEFAULT_OPTIONS.themeColors.primary;
      this.sendButton.style.color = 'white';
      this.sendButton.style.cursor = 'pointer';
    } else {
      this.sendButton.disabled = true;
      this.sendButton.style.backgroundColor = DEFAULT_OPTIONS.themeColors.primaryLight;
      this.sendButton.style.color = '#9ca3af';
      this.sendButton.style.cursor = 'not-allowed';
    }
  }

  /**
   * Send a message
   */
  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message || this.isLoading) return;

    // Show loading state first
    this.showLoadingMessage();

    // Add user message
    this.addMessage(message, 'user');
    this.chatInput.value = '';
    this.chatInput.style.height = 'auto';
    this.chatInput.dispatchEvent(new Event('input'));
    this.updateSendButtonState();

    // Show thinking message
    this.showThinkingMessage(message);

    // Send chat query to API
    try {
      const response = await this.sendChatQuery(message);
      this.hideThinkingMessage();
      this.hideLoadingMessage();
      this.addMessage(response, 'assistant');
    } catch (error) {
      this.hideThinkingMessage();
      this.hideLoadingMessage();
      this.addMessage('Sorry, something went wrong. Please try again.', 'assistant');
    }
  }

  /**
   * Send chat query to API
   * @param {string} message - User message
   * @returns {Promise<string>} - API response
   */
  async sendChatQuery(message) {
    try {
      let flowsPayload = []
      let flows = ChatInterface._flowRegister.getAllFlows();
      flows.forEach(flow => {
        flowsPayload.push({
          name: flow.name,
          description: flow.description,
          inputs: flow.inputs
        });
      });
      const response = await this.apiService.sendChatQuery(message, flowsPayload);
      
      // Handle different response formats
      if (response && response.completion) {
        return response.completion;
      } 
      else if (response && response.flow_name) {
        const flow = ChatInterface._flowRegister.getFlow(response.flow_name);
        if (flow) {
          flow.trigger(response.inputs || {});
          return `Flow "${flow.name}" triggered successfully`;
        } else {
          return `Flow with name "${response.flow_name}" not found`;
        }
      } else {
        return 'I received your message but the response format was unexpected.';
      }
    } catch (error) {
      console.error('Chat API error:', error);
      throw new Error('Failed to get response from chat API');
    }
  }

  /**
   * Add a message to the chat
   */
  addMessage(content, role) {
    const messageElement = DomUtils.createElement('div', `flowlight-chat-message flowlight-chat-message-${role}`, {
      display: 'flex',
      maxWidth: '100%'
    });

    // Message content (no avatar)
    const messageContent = DomUtils.createElement('div', 'flowlight-chat-content', {
      flex: '1',
      padding: '12px 16px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap'
    });

    if (role === 'user') {
      messageContent.style.backgroundColor = "#0050C8";
      messageContent.style.color = 'white';
      messageContent.style.alignSelf = 'flex-end';
      messageContent.style.maxWidth = '60%';
      messageContent.style.marginLeft = 'auto';
      // User messages stay as plain text for now
      messageContent.textContent = content;
      messageContent.style.borderRadius = '16px 16px 0px';
          } else {
        messageContent.style.backgroundColor = DEFAULT_OPTIONS.themeColors.primaryLight;
        messageContent.style.color = '#111827';
        messageContent.style.border = `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`;
      messageContent.style.maxWidth = '80%';
      messageContent.style.borderRadius = '16px';
      
      // Parse markdown for assistant messages
      const parsedContent = MarkdownUtils.parseToHtml(content);
      const sanitizedContent = MarkdownUtils.sanitizeHtml(parsedContent);
      messageContent.innerHTML = sanitizedContent;
    }

    messageElement.appendChild(messageContent);

    // Align user messages to the right
    if (role === 'user') {
      messageElement.style.justifyContent = 'flex-end';
    }

    this.chatMessages.appendChild(messageElement);
    
    // Scroll to bottom with smooth animation
    setTimeout(() => {
      this.chatMessages.scrollTo({
        top: this.chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);

    // Store message
    this.messages.push({ content, role, timestamp: new Date() });
    
    // Hide suggestions when first message is added
    this.hideSuggestions();
  }

  /**
   * Show loading message
   */
  showLoadingMessage() {
    this.isLoading = true;
    this.sendButton.disabled = true;
    this.sendButton.style.opacity = '0.5';
    this.sendButton.style.cursor = 'not-allowed';
    this.chatInput.disabled = true;
    this.chatInput.style.opacity = '0.5';
    this.chatInput.style.cursor = 'not-allowed';
  }

    /**
   * Show thinking message
   */
  showThinkingMessage(question) {
    const thinkingElement = DomUtils.createElement('div', 'flowlight-thinking-message', {
      display: 'flex',
      maxWidth: '100%',
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });

    // Thinking content with animated dots (no avatar)
    const thinkingContent = DomUtils.createElement('div', 'flowlight-thinking-content', {
      flex: '1',
      padding: '12px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f9fafb',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
      maxWidth: '80%',
      fontStyle: 'italic'
    });

    // Create animated thinking text
    const thinkingText = DomUtils.createElement('span', 'flowlight-thinking-text');
    thinkingText.textContent = 'Thinking';
    
    const dots = DomUtils.createElement('span', 'flowlight-thinking-dots');
    dots.style.animation = 'flowlight-thinking-animation 1.5s infinite';
    
    // Add CSS animation for dots
    if (!document.getElementById('flowlight-thinking-styles')) {
      const style = document.createElement('style');
      style.id = 'flowlight-thinking-styles';
      style.textContent = `
        @keyframes flowlight-thinking-animation {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
        .flowlight-thinking-dots::after {
          content: '';
          animation: flowlight-thinking-animation 1.5s infinite;
        }
      `;
      document.head.appendChild(style);
    }

    thinkingContent.appendChild(thinkingText);
    thinkingContent.appendChild(dots);
    
    thinkingElement.appendChild(thinkingContent);

    this.chatMessages.appendChild(thinkingElement);
    
    // Fade in
    setTimeout(() => {
      thinkingElement.style.opacity = '1';
    }, 10);
    
    // Scroll to bottom
    setTimeout(() => {
      this.chatMessages.scrollTo({
        top: this.chatMessages.scrollHeight,
        behavior: 'smooth'
      });
    }, 10);

    // Store reference for removal
    this.thinkingElement = thinkingElement;
    this.thinkingContent = thinkingContent;
    this.thinkingText = thinkingText;
    this.thinkingDots = dots;

    // After 4 seconds, change to "Searching for..."
    setTimeout(() => {
      if (this.thinkingElement && this.thinkingText) {
        this.thinkingText.textContent = `Searching for "${question}"`;
        this.thinkingDots.style.display = 'none'; // Hide dots for search phase
      }
    }, 4000);
  }

  /**
   * Hide thinking message
   */
  hideThinkingMessage() {
    if (this.thinkingElement && this.thinkingElement.parentNode) {
      this.thinkingElement.style.opacity = '0';
      setTimeout(() => {
        if (this.thinkingElement && this.thinkingElement.parentNode) {
          this.thinkingElement.parentNode.removeChild(this.thinkingElement);
        }
        this.thinkingElement = null;
      }, 300);
    }
  }

  /**
   * Hide loading message
   */
  hideLoadingMessage() {
    this.isLoading = false;
    this.sendButton.disabled = false;
    this.sendButton.style.opacity = '1';
    this.sendButton.style.cursor = 'pointer';
    this.chatInput.disabled = false;
    this.chatInput.style.opacity = '1';
    this.chatInput.style.cursor = 'text';
  }

  /**
   * Clear all messages
   */
  clearMessages() {
    if (this.chatMessages) {
      this.chatMessages.innerHTML = '';
    }
    // Clear thinking message reference
    this.thinkingElement = null;
    
    // Show suggestions if chat is empty and interface is visible
    if (this.messages.length === 0 && this.isVisible) {
      this.showSuggestions();
    }
  }


  handleSlashMode() {
    const value = this.chatInput ? this.chatInput.value : '';
    const caretIndex = this.chatInput ? this.chatInput.selectionStart : 0;
    const textBeforeCaret = value.slice(0, caretIndex);

    // Find start of the word segment before caret
    const lastSpaceIndex = Math.max(textBeforeCaret.lastIndexOf(' '), textBeforeCaret.lastIndexOf('\n'));
    const tokenStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    const token = textBeforeCaret.slice(tokenStart);

    // Slash mode is true if the input starts with '/'
    this.isSlashMode = value.startsWith('/');

    // Only show dropdown if the current token begins with '/'
    const isSlashToken = token.startsWith('/');
    if (!isSlashToken && !this.isSlashMode) {
      
      // No slash token at the caret; hide dropdown and attempt query in selected space
      this.hideCommandDropdown();
      
      return;
    } else if (this.isSlashMode && isSlashToken) {
      const query = token.slice(1).toLowerCase();
      console.log("query", query);
      
      // Use actual space objects so we can set the selected space on pick
      const spaces = this.normalizeSpaces(ChatInterface._searchHook && Array.isArray(ChatInterface._searchHook.spaces) ? ChatInterface._searchHook.spaces : []);
      const filtered = spaces.filter(s =>
        !query || (s.name && s.name.toLowerCase().includes(query)) || (s.id && String(s.id).toLowerCase().includes(query))
      ).slice(0, ChatInterface._searchHook.maxSpacesShown || 6);

      // Position dropdown above the caret in the textarea
      const caretRect = this.getTextareaCaretRect(this.chatInput);
      this.showCommandDropdown(filtered, caretRect);
      return;
    } 
    else {
      
    // execute query in selected space
      // Parse "/{spaceName} {queryText}"
      const match = value.match(/^\/([^\s]+)\s*(.*)$/);
      const spaceName = match && match[1] ? match[1] : '';
      const queryText = match && match[2] ? match[2].trim() : '';

      // If no query yet, just hide results and exit
      if (!queryText) {
        this.hideSearchResults();
        return;
      }

      console.log("queryText", queryText);

      // Resolve selected space by stored selection or by name/id
      let selectedSpace = ChatInterface._searchHook && typeof ChatInterface._searchHook.getSelectedSpace === 'function'
        ? ChatInterface._searchHook.getSelectedSpace()
        : null;
      if (!selectedSpace && ChatInterface._searchHook && Array.isArray(ChatInterface._searchHook.spaces)) {
        selectedSpace = ChatInterface._searchHook.spaces.find(s => {
          const sName = s && (s.name || s.id);
          return sName && String(sName).toLowerCase() === String(spaceName).toLowerCase();
        });
        if (selectedSpace && typeof ChatInterface._searchHook.setSelectedSpace === 'function') {
          ChatInterface._searchHook.setSelectedSpace(selectedSpace);
        }
      }

      if (!selectedSpace || typeof (selectedSpace.query) !== 'function') {
        this.hideSearchResults();
        return;
      }

      // Show loading and run space query (supports sync/async)
      this.showSearchLoading();
      const runQuery = () => {
        try {
          console.log("queryText", queryText);
          
          const result = selectedSpace.query(queryText);
          return result && typeof result.then === 'function' ? result : Promise.resolve(result);
        } catch (err) {
          return Promise.reject(err);
        }
      };

      runQuery()
        .then(results => {
          if (Array.isArray(results)) {
            this.searchResults = results;
            this.displaySearchResults();
          } else {
            this.hideSearchResults();
          }
        })
        .catch(() => {
          this.hideSearchResults();
        });
    }


   

    
  }

  // Normalize spaces array to objects with id and name
  normalizeSpaces(spacesLike) {
    if (!Array.isArray(spacesLike)) return [];
    return spacesLike.map((s) => {
      if (typeof s === 'string') {
        return { id: s, name: s };
      }
      // Map space-like objects to dropdown items, keep a reference to the original space
      const id = s && (s.id || s.name);
      const name = s && (s.name || s.id);
      return id || name ? { id, name, icon: s.icon, spaceRef: s } : {};
    }).filter(s => s && (s.name || s.id));
  }

  // Compute approximate caret rectangle within textarea (relative to viewport)
  getTextareaCaretRect(textarea) {
    const { top, left } = textarea.getBoundingClientRect();
    const style = window.getComputedStyle(textarea);

    // Mirror div technique
    const div = document.createElement('div');
    const properties = [
      'boxSizing','width','height','overflow','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'paddingTop','paddingRight','paddingBottom','paddingLeft','fontStyle','fontVariant','fontWeight','fontStretch','fontSize',
      'fontFamily','lineHeight','textAlign','whiteSpace','wordWrap','letterSpacing'
    ];
    properties.forEach(prop => {
      div.style[prop] = style[prop];
    });
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.left = `${left + window.scrollX}px`;
    div.style.top = `${top + window.scrollY}px`;

    const value = textarea.value;
    const caretIndex = textarea.selectionStart;
    const before = value.substring(0, caretIndex);
    const after = value.substring(caretIndex) || '.';

    const span = document.createElement('span');
    span.textContent = after;

    div.textContent = before;
    div.appendChild(span);
    document.body.appendChild(div);

    const rect = span.getBoundingClientRect();
    const caretRect = {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
    document.body.removeChild(div);
    return caretRect;
  }

  isCommandDropdownVisible() {
    return this.commandDropdown && this.commandDropdown.style.display !== 'none' && this.commandDropdown.style.display !== '';
  }

  hideCommandDropdown() {
    if (this.commandDropdown) {
      this.commandDropdown.style.display = 'none';
    }
    this.commandActiveIndex = -1;
  }

  showCommandDropdown(items, caretRect) {
    if (!this.commandDropdown) {
      this.commandDropdown = DomUtils.createElement('div', 'flowlight-command-dropdown', {
        position: 'absolute',
        zIndex: String(this.options.zIndex + 5 || 10000),
        backgroundColor: 'white',
        border: `1px solid ${DEFAULT_OPTIONS.themeColors.primaryLight}`,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        borderRadius: '8px',
        maxHeight: '220px',
        overflowY: 'auto',
        display: 'none',
        width: '260px'
      });
      document.body.appendChild(this.commandDropdown);
    }

    // Before showing dropdown, hide other suggestion surfaces
    this.hideSuggestions();
    this.hideSearchResults();

    // Build items
    this.commandDropdown.innerHTML = '';
    if (!items || items.length === 0) {
      this.commandDropdown.style.display = 'none';
      return;
    }
    // Keep a reference to items so selection can set the selected space
    this.commandItems = items;

    items.forEach((item, index) => {
      const row = DomUtils.createElement('div', 'flowlight-command-item', {
        padding: '8px 10px',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#111827'
      });
      const icon = DomUtils.createElement('span', 'flowlight-command-item-icon', {
        fontSize: '12px',
        color: '#6b7280'
      });
      icon.textContent = item.icon || '>';
      const label = DomUtils.createElement('span', 'flowlight-command-item-label', {
        flex: '1'
      });
      label.textContent = item.name || item.id;
      row.appendChild(icon);
      row.appendChild(label);

      row.addEventListener('mouseenter', () => {
        this.setCommandActiveIndex(index);
      });
      row.addEventListener('mouseleave', () => {
        // no-op
      });
      row.addEventListener('click', () => {
        this.commandActiveIndex = index;
        this.executeActiveCommandItem();
      });

      this.commandDropdown.appendChild(row);
    });

    this.commandActiveIndex = 0;
    this.updateCommandActiveStyles();

    // Position: above the caret, slightly offset
    const dropdownRect = { width: 260, height: Math.min(220, items.length * 36) };
    const x = caretRect.left;
    const y = caretRect.top - dropdownRect.height - 8; // 8px gap above caret
    this.commandDropdown.style.left = `${x + window.scrollX}px`;
    this.commandDropdown.style.top = `${y + window.scrollY}px`;
    this.commandDropdown.style.display = 'block';
  }

  setCommandActiveIndex(newIndex) {
    const children = this.commandDropdown ? Array.from(this.commandDropdown.children) : [];
    if (children.length === 0) return;
    if (newIndex < 0) newIndex = children.length - 1;
    if (newIndex >= children.length) newIndex = 0;
    this.commandActiveIndex = newIndex;
    this.updateCommandActiveStyles();
  }

  moveCommandActiveIndex(delta) {
    this.setCommandActiveIndex(this.commandActiveIndex + delta);
  }

  updateCommandActiveStyles() {
    if (!this.commandDropdown) return;
    const children = Array.from(this.commandDropdown.children);
    children.forEach((child, idx) => {
      child.style.backgroundColor = idx === this.commandActiveIndex ? '#f3f4f6' : 'white';
      child.style.borderLeft = idx === this.commandActiveIndex ? `2px solid ${DEFAULT_OPTIONS.themeColors.primary}` : '2px solid transparent';
    }); 
  }

  executeActiveCommandItem() {
    
    if (!this.commandDropdown) return;
    const children = Array.from(this.commandDropdown.children);
    if (children.length === 0) return;
    const activeIndex = this.commandActiveIndex >= 0 ? this.commandActiveIndex : 0;
    const selectedItem = this.commandItems && this.commandItems.length > 0
      ? this.commandItems[activeIndex]
      : null;
    const name = selectedItem ? (selectedItem.name || selectedItem.id || '') : '';
    

    // Set selected space on the hook for downstream usage
    if (selectedItem) {
      const space = selectedItem.spaceRef || selectedItem;
      if (ChatInterface._searchHook && typeof ChatInterface._searchHook.setSelectedSpace === 'function') {
        ChatInterface._searchHook.setSelectedSpace(space);
      }
    }

    // Replace the current slash token with the chosen space name
    const value = this.chatInput.value;
    const caretIndex = this.chatInput.selectionStart;
    const before = value.slice(0, caretIndex);
    const after = value.slice(caretIndex);
    const lastSpaceIndex = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\n'));
    const tokenStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    const newBefore = before.slice(0, tokenStart) + `/${name} `;
    this.chatInput.value = newBefore + after;
    this.chatInput.focus();
    this.chatInput.selectionStart = this.chatInput.selectionEnd = newBefore.length;
    this.hideCommandDropdown();
  }


  /**
   * Remove chat elements from DOM
   */
  removeElements() {
    if (this.overlayElement && this.overlayElement.parentNode) {
      this.overlayElement.parentNode.removeChild(this.overlayElement);
      this.overlayElement = null;
    }
    if (this.chatContainer && this.chatContainer.parentNode) {
      this.chatContainer.parentNode.removeChild(this.chatContainer);
      this.chatContainer = null;
    }
    this.chatInnerContainer = null;
    this.chatMessages = null;
    this.chatInput = null;
    this.sendButton = null;
    this.searchResultsContainer = null;
    this.suggestionsContainer = null;
    if (this.commandDropdown && this.commandDropdown.parentNode) {
      this.commandDropdown.parentNode.removeChild(this.commandDropdown);
    }
    this.commandDropdown = null;
    this.elementsCreated = false;
  }

  /**
   * Destroy the chat interface
   */
  destroy() {
    this.removeElements();
  }

  static registerFlow(flow) {
    ChatInterface._flowRegister.register(flow);
  }

  static initializeSearchSpaces(searchSpaceConfigs) {
    ChatInterface._searchHook.initializeSpaces(searchSpaceConfigs);
  }

  /**
   * Initialize flows from JSON configurations and register them
   * @param {Array<Object>} flowConfigs - Array of flow configuration objects
   * @returns {Array<Flow>} Array of initialized and registered Flow instances
   */
  static initializeFlows(flowConfigs) {
    const flows = Flow.fromConfigs(flowConfigs);
    flows.forEach(flow => ChatInterface.registerFlow(flow));
    return flows;
  }
} 