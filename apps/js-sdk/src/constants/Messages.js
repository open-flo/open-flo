/**
 * User-facing messages and text content
 */

// Helper function to get the appropriate keyboard shortcut for the platform
function getKeyboardShortcut() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? 'Cmd+K' : 'Ctrl+K';
}

export const MESSAGES = {
  // Search interface
  searchPlaceholder: 'Ask me anything...',
  searchPlaceholderShort: 'Search...',
  poweredBy: 'Powered by',
  poweredByBrand: 'Flowvana',
  thinking: 'Thinking...',
  
  // Results
  noResults: 'No flows found. Try a different search term.',
  noDescription: 'No description available',
  
  // Errors
  searchFailed: 'Search failed. Please try again.',
  searchError: 'Search Error',
  flowDetailsFailed: 'Failed to load flow details. Please try again.',
  
  // Debug messages
  noMorePoints: 'No more points to highlight',
  elementClicked: 'Element clicked - calling next API',
  inputDetected: 'Input detected - waiting 500ms for idle before calling next API',
  idleAfterInput: '500ms idle after input - calling next API',
  highlightingPoint: 'Highlighting point:',
  overlayCreated: 'Overlay:',
  readActionDetected: 'Read action detected - highlighter will auto-dismiss in 3.5 seconds (mouse dismissal disabled)',
  clickActionDetected: 'Click action detected - waiting for user to click the element',
  typeActionDetected: 'Type action detected - waiting for user input with 500ms debounce',
  dismissingHighlight: 'Dismissing highlight',
  highlightDismissed: 'Highlight dismissed',
  searchShown: 'Search interface shown',
  searchHidden: 'Search interface hidden',
  flowlightInitialized: 'FlowLight initialized with options:',
  selectedFlow: 'Selected flow:',
  flowObjectKeys: 'Flow object keys:',
  flowDetailsReceived: 'Flow details received:',
  elementHighlighted: 'Element highlighted:',
  invalidXPath: 'Invalid XPath or error during XPath evaluation:',
  noElementProvided: 'highlightElement: No element provided',
  backgroundAnalysis: 'Background analysis:',
  flowNameNotFound: 'Flow name not found in flow object'
}; 