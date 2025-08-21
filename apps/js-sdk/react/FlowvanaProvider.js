import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';

// Import the modular FlowLight
import FlowLight from 'flowlight';

// Create React Context for FlowLight
const FlowLightContext = createContext(null);

// Global FlowLight instance management
let globalFlowLightInstance = null;
let globalInstanceCount = 0;

/**
 * FlowLightProvider - React Context Provider for FlowLight
 * 
 * @param {Object} props - Component props
 * @param {Object} props.options - FlowLight configuration options
 * @param {React.ReactNode} props.children - Child components
 * @param {boolean} props.autoInit - Whether to auto-initialize FlowLight (default: true)
 */
export function FlowLightProvider({ 
  options = {}, 
  children, 
  autoInit = true 
}) {
  const [state, setState] = useState({
    isReady: false,
    isChatVisible: false,
    isSearchVisible: false,
    error: null,
    instance: null
  });

  const flowlightRef = useRef(null);
  const instanceId = useRef(++globalInstanceCount);

  // Initialize FlowLight
  useEffect(() => {
    if (!autoInit) return;

    // If already initialized globally, use that instance
    if (globalFlowLightInstance) {
      flowlightRef.current = globalFlowLightInstance;
      setState(prev => ({
        ...prev,
        isReady: true,
        instance: globalFlowLightInstance,
        isChatVisible: globalFlowLightInstance.isChatVisible || false,
        isSearchVisible: globalFlowLightInstance.isSearchVisible || false
      }));
      return;
    }

    try {
      // Create FlowLight instance
      const instance = new FlowLight({
        ...options,
        debug: options.debug || false
      });

      flowlightRef.current = instance;
      globalFlowLightInstance = instance;

      // Listen to state changes
      const handleChatShown = () => {
        setState(prev => ({ ...prev, isChatVisible: true }));
      };

      const handleChatHidden = () => {
        setState(prev => ({ ...prev, isChatVisible: false }));
      };

      const handleSearchShown = () => {
        setState(prev => ({ ...prev, isSearchVisible: true }));
      };

      const handleSearchHidden = () => {
        setState(prev => ({ ...prev, isSearchVisible: false }));
      };

      // Bind event listeners
      instance.eventBus.on('chat:shown', handleChatShown);
      instance.eventBus.on('chat:hidden', handleChatHidden);
      instance.eventBus.on('search:shown', handleSearchShown);
      instance.eventBus.on('search:hidden', handleSearchHidden);

      setState({
        isReady: true,
        isChatVisible: false,
        isSearchVisible: false,
        error: null,
        instance
      });

    } catch (err) {
      console.error('Failed to initialize FlowLight:', err);
      setState(prev => ({ ...prev, error: err }));
    }

    // Cleanup on unmount
    return () => {
      if (flowlightRef.current && instanceId.current === 1) {
        // Only destroy if this is the first instance
        flowlightRef.current.destroy?.();
        globalFlowLightInstance = null;
      }
    };
  }, [autoInit]); // Only depend on autoInit

  // Update options when they change
  useEffect(() => {
    if (flowlightRef.current && state.isReady) {
      // Update options if the instance supports it
      if (typeof flowlightRef.current.updateOptions === 'function') {
        flowlightRef.current.updateOptions(options);
      }
    }
  }, [options, state.isReady]);

  const contextValue = useMemo(() => ({
    // State
    isReady: state.isReady,
    isChatVisible: state.isChatVisible,
    isSearchVisible: state.isSearchVisible,
    error: state.error,
    instance: state.instance,
    
    // Methods
    showChat: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.showChat?.();
      }
    }, []),
    
    hideChat: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.hideChat?.();
      }
    }, []),
    
    toggleChat: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.toggleChat?.();
      }
    }, []),
    
    showSearch: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.showSearch?.();
      }
    }, []),
    
    hideSearch: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.hideSearch?.();
      }
    }, []),
    
    toggleSearch: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.toggleSearch?.();
      }
    }, []),
    
    // Flow management
    registerFlow: useCallback((flow) => {
      if (flowlightRef.current) {
        flowlightRef.current.registerFlow?.(flow);
      }
    }, []),
    
    initializeFlows: useCallback((flowConfigs) => {
      if (flowlightRef.current) {
        return flowlightRef.current.initializeFlows?.(flowConfigs) || [];
      }
      return [];
    }, []),
    
    initializeSearchSpaces: useCallback((searchSpaceConfigs) => {
      if (flowlightRef.current) {
        flowlightRef.current.initializeSearchSpaces?.(searchSpaceConfigs);
      }
    }, []),
    
    // Utility methods
    updateOptions: useCallback((newOptions) => {
      if (flowlightRef.current) {
        flowlightRef.current.updateOptions?.(newOptions);
      }
    }, []),
    
    getChatState: useCallback(() => {
      if (flowlightRef.current) {
        return flowlightRef.current.getChatState?.() || { isVisible: false };
      }
      return { isVisible: false };
    }, []),
    
    getSearchState: useCallback(() => {
      if (flowlightRef.current) {
        return flowlightRef.current.getSearchState?.() || { isVisible: false };
      }
      return { isVisible: false };
    }, []),
    
    destroy: useCallback(() => {
      if (flowlightRef.current) {
        flowlightRef.current.destroy?.();
        flowlightRef.current = null;
        globalFlowLightInstance = null;
        setState(prev => ({ ...prev, isReady: false, instance: null }));
      }
    }, [])
  }), [state.isReady, state.isChatVisible, state.isSearchVisible, state.error, state.instance]);

  return (
    <FlowLightContext.Provider value={contextValue}>
      {children}
    </FlowLightContext.Provider>
  );
}

/**
 * useFlowLight - React hook to access FlowLight functionality
 * 
 * @returns {Object} FlowLight context and methods
 */
export function useFlowLight() {
  const context = useContext(FlowLightContext);
  
  if (!context) {
    throw new Error('useFlowLight must be used within a FlowLightProvider');
  }
  
  return context;
}

/**
 * useFlowvana - Legacy hook name for backward compatibility
 * @deprecated Use useFlowLight instead
 */
export function useFlowvana() {
  console.warn('useFlowvana is deprecated. Use useFlowLight instead.');
  return useFlowLight();
}

/**
 * FlowLightButton - React component for the floating button
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {React.ReactNode} props.children - Button content (optional)
 */
export function FlowLightButton({ className = '', style = {}, children }) {
  const { toggleChat, isReady } = useFlowLight();

  if (!isReady) return null;

  const buttonStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#0050C8',
    border: 'none',
    cursor: 'pointer',
    zIndex: 999999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transition: 'all 0.2s ease',
    ...style
  };

  const handleClick = (e) => {
    e.preventDefault();
    toggleChat();
  };

  return (
    <button
      className={`flowlight-button ${className}`}
      style={buttonStyle}
      onClick={handleClick}
      title="Open FlowLight Chat"
    >
      {children || (
        <svg 
          aria-hidden="true" 
          role="img" 
          xmlns="http://www.w3.org/2000/svg" 
          width="21" 
          height="24" 
          viewBox="0 0 21 24" 
          fill="none"
        >
          <path 
            fillRule="evenodd" 
            clipRule="evenodd" 
            d="M7.36806 19.0408V21.0351C7.36806 21.5203 6.82206 21.8195 6.38626 21.5641L5.43468 20.9709L5.20589 20.8456C5.18924 20.8364 3.87671 20.0997 0.996801 18.4832L0.768558 18.3562C0.530936 18.223 0.335906 18.0324 0.201083 17.8023C0.0678324 17.5741 -0.00151093 17.3151 0.00109508 17.0582L0 12.0916V7.11711C0 6.83785 0.0812403 6.56518 0.232238 6.33119C0.381869 6.09601 0.598542 5.90276 0.820616 5.79876L4.97153 3.46998L5.19879 3.34085C5.27438 3.2988 5.27446 3.29876 5.42688 3.21447L5.42737 3.2142L9.40274 0.986205L9.63559 0.852304C9.89138 0.709263 10.1809 0.641184 10.4744 0.65446C10.7594 0.667887 11.0403 0.758552 11.2334 0.892314L15.3701 3.21298L15.5994 3.33855L19.8057 5.69947L20.0354 5.82705C20.2729 5.96049 20.4675 6.15083 20.6022 6.38089C20.7352 6.60852 20.8045 6.86744 20.8023 7.12509L20.8031 11.6476C20.8032 12.1277 20.2677 12.4276 19.8395 12.1873L18.0543 11.1856C17.8558 11.0742 17.7335 10.8686 17.7335 10.646V7.9751L14.145 5.96052C14.111 5.94418 14.0414 5.90561 13.8415 5.79317L10.4013 3.8603L6.82463 5.86549L6.82457 5.86553L6.82455 5.86554C6.7898 5.88774 6.78978 5.88775 6.76741 5.90155C6.75393 5.90961 6.50861 6.0478 6.50861 6.0478L3.06984 7.97534V16.2079L6.6604 18.2234C6.68607 18.2359 6.73294 18.2619 6.96988 18.3947L7.06979 18.4808L7.1252 18.5527C7.27759 18.6701 7.36806 18.8494 7.36806 19.0408ZM6.71511 19.0592L6.70908 19.0538C6.71071 19.0559 6.71274 19.0578 6.71511 19.0592ZM18.7 13.3751C18.2718 13.1357 17.7372 13.4356 17.7372 13.9152V14.2825L8.63799 9.17841L8.32825 9.00325C8.01895 8.82995 7.63732 8.84807 7.34939 9.04694L7.111 9.17709L5.74955 9.93778L5.20047 10.2438C4.76099 10.4905 4.62353 11.0305 4.88005 11.4601L5.19219 11.9826L5.50713 12.5108C5.76179 12.9371 6.31925 13.0701 6.76045 12.8196C7.29794 12.5184 7.32327 12.5043 7.34721 12.4881C7.34936 12.4867 7.3515 12.4852 7.35401 12.4835L7.8713 12.195L8.90628 12.7757L8.90523 22.4687C8.90523 22.9539 9.31029 23.3473 9.81005 23.3473C10.0393 23.3473 10.2584 23.2633 10.4257 23.1129L10.4379 23.1033C11.4356 22.3212 11.4365 22.3206 11.6447 22.1572C11.8801 21.9731 12.0039 21.6884 11.9782 21.3975L11.9801 14.5011L18.4889 18.1638C18.9434 18.4179 19.4498 18.2476 19.7884 17.8275L20.624 17.0013C20.7413 16.8846 20.8068 16.7284 20.8068 16.5658V14.9133C20.8068 14.6904 20.6841 14.4845 20.4851 14.3732L18.7 13.3751Z" 
            fill="#FFFFFF"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * FlowLightChat - React component for the chat interface
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.show - Whether to show the chat interface
 */
export function FlowLightChat({ className = '', style = {}, show }) {
  const { isChatVisible, isReady } = useFlowLight();

  if (!isReady || !isChatVisible) return null;

  const chatStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '600px',
    height: '80vh',
    maxHeight: '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    zIndex: 999998,
    display: 'flex',
    flexDirection: 'column',
    ...style
  };

  return (
    <div className={`flowlight-chat ${className}`} style={chatStyle}>
      <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
        <h3 style={{ margin: 0, color: '#1f2937' }}>FlowLight Chat</h3>
      </div>
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <p>Chat interface content would be rendered here by the FlowLight library.</p>
        <p>This is a React wrapper around the native FlowLight chat interface.</p>
      </div>
    </div>
  );
}

/**
 * FlowLightSearch - React component for the search interface
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.show - Whether to show the search interface
 */
export function FlowLightSearch({ className = '', style = {}, show }) {
  const { isSearchVisible, isReady } = useFlowLight();

  if (!isReady || !isSearchVisible) return null;

  const searchStyle = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90vw',
    maxWidth: '600px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    zIndex: 999998,
    padding: '20px',
    ...style
  };

  return (
    <div className={`flowlight-search ${className}`} style={searchStyle}>
      <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Search</h3>
      <input
        type="text"
        placeholder="Search..."
        style={{
          width: '100%',
          padding: '12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '16px'
        }}
        autoFocus
      />
    </div>
  );
}

/**
 * FlowLightOverlay - React component for the backdrop overlay
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
export function FlowLightOverlay({ className = '', style = {} }) {
  const { isChatVisible, isSearchVisible, hideChat, hideSearch } = useFlowLight();

  if (!isChatVisible && !isSearchVisible) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999997,
    ...style
  };

  const handleClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isChatVisible) hideChat();
      if (isSearchVisible) hideSearch();
    }
  };

  return (
    <div 
      className={`flowlight-overlay ${className}`} 
      style={overlayStyle}
      onClick={handleClick}
    />
  );
}

/**
 * FlowLightContainer - Complete React component that includes all FlowLight UI elements
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.showButton - Whether to show the floating button
 * @param {boolean} props.showOverlay - Whether to show the backdrop overlay
 */
export function FlowLightContainer({ 
  className = '', 
  style = {}, 
  showButton = true, 
  showOverlay = true 
}) {
  return (
    <div className={`flowlight-container ${className}`} style={style}>
      {showOverlay && <FlowLightOverlay />}
      <FlowLightChat />
      <FlowLightSearch />
      {showButton && <FlowLightButton />}
    </div>
  );
}

/**
 * withFlowLight - Higher-order component for class components
 * 
 * @param {React.Component} Component - Component to wrap
 * @returns {React.Component} Wrapped component with FlowLight props
 */
export function withFlowLight(Component) {
  return function WrappedComponent(props) {
    const flowlightProps = useFlowLight();
    return React.createElement(Component, { ...props, ...flowlightProps });
  };
}

/**
 * FlowLightKeyboardShortcuts - React component to handle keyboard shortcuts
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.enabled - Whether keyboard shortcuts are enabled
 */
export function FlowLightKeyboardShortcuts({ enabled = true }) {
  const { toggleChat, toggleSearch, isReady } = useFlowLight();

  useEffect(() => {
    if (!enabled || !isReady) return;

    const handleKeyDown = (event) => {
      // Ctrl/Cmd + K for chat
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        toggleChat();
      }
      
      // Ctrl/Cmd + Shift + K for search
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'K') {
        event.preventDefault();
        toggleSearch();
      }
      
      // Escape to close interfaces
      if (event.key === 'Escape') {
        // This would need to be handled by the FlowLight instance
        // For now, we'll just log it
        console.log('Escape pressed - should close FlowLight interfaces');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, isReady, toggleChat, toggleSearch]);

  return null; // This component doesn't render anything
}

// Export FlowLight for direct usage
export { default as FlowLight } from 'flowlight';

// Export all components and hooks
export {
  FlowLightProvider,
  useFlowLight,
  useFlowvana,
  FlowLightButton,
  FlowLightChat,
  FlowLightSearch,
  FlowLightOverlay,
  FlowLightContainer,
  FlowLightKeyboardShortcuts,
  withFlowLight
};
