# FlowLight

A lightweight command interface library with floating button, search functionality, and React integration.

## Features

- 🚀 **Lightweight** - Minimal bundle size with zero dependencies
- 🎯 **Floating Button** - Always accessible command interface
- 🔍 **Search Interface** - Powerful search with keyboard shortcuts
- ⚡ **React Integration** - Hooks and providers for React apps
- 🎨 **Customizable** - Easy to style and configure
- 📱 **Responsive** - Works on desktop and mobile

## Installation

```bash
npm install flowlight
```

## Quick Start

### Vanilla JavaScript

```javascript
import FlowLight from 'flowlight';

// Initialize FlowLight
const flowlight = new FlowLight({
  debug: true,
  buttonPosition: { bottom: 20, right: 20 },
  suggestions: [
    "Custom suggestion 1",
    "Custom suggestion 2",
    "How to do something?"
  ],
  inputPlaceholder: "Ask me anything...",
  themeColors: {
    primary: "#2563EB"
  }
});

// Show the search interface
flowlight.showSearch();
```

### React

```jsx
import { FlowLightProvider, useFlowLight } from 'flowlight/react';

function App() {
  return (
    <FlowLightProvider options={{ debug: true }}>
      <YourApp />
    </FlowLightProvider>
  );
}

function SearchComponent() {
  const { showSearch, isSearchVisible } = useFlowLight();
  
  return (
    <button onClick={showSearch}>
      Open Search
    </button>
  );
}
```

## API Reference

### FlowLight Constructor

```javascript
new FlowLight(options)
```

**Options:**
- `debug` (boolean) - Enable debug mode
- `buttonSize` (number) - Size of the floating button in pixels (default: 60)
- `buttonPosition` (object) - Button position: `{ bottom: 20, right: 20 }` (pixels from edges)
- `buttonIcon` (string) - Custom SVG icon for the button (HTML string)
- `zIndex` (number) - Z-index for positioning (default: 999999)
- `keyboardShortcuts` (boolean) - Enable keyboard shortcuts (default: true)
- `projectId` (string) - Project identifier for API calls
- `title` (string) - Title shown in the interface
- `themeColors` (object) - Custom theme colors:
  - `primary` (string) - Primary color (default: "#1F2937")
  - `primaryLight` (string) - Light variant of primary color
  - `nudgeGradient` (string) - Gradient for nudge elements
  - `primaryBackgroundGradient` (string) - Background gradient
- `suggestions` (array) - Array of suggestion strings to show in the interface
- `inputPlaceholder` (string) - Placeholder text for the chat input field (default: "Ask a question about Lambdatest...")

### Methods

- `showSearch()` - Show the search interface
- `hideSearch()` - Hide the search interface
- `toggleSearch()` - Toggle search visibility
- `updateOptions(options)` - Update configuration
- `destroy()` - Clean up and remove from DOM

### React Hooks

- `useFlowLight()` - Access FlowLight functionality
- `useFlowvana()` - Legacy hook (deprecated)

### React Components

- `FlowLightProvider` - Provider component for React apps
- `withFlowLight(Component)` - HOC for class components

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Toggle search interface
- `Escape` - Close search interface
- `Tab` - Navigate search results

## Environment Configuration

FlowLight supports different API endpoints for development and production environments.

### Build-time Configuration

The library automatically uses the correct API endpoints based on the build environment:

- **Development**: `http://localhost:8000`
- **Production**: `https://api.flowvana.tech`

```bash
# Development build (default)
npm run build

# Production build
npm run build:prod
```

### Runtime Configuration

You can also configure the API base URL at runtime by setting a global configuration:

```javascript
// Set before initializing FlowLight
window.__FLOWLIGHT_CONFIG__ = {
  apiBaseUrl: 'https://your-custom-api.com'
};

// Then initialize FlowLight
const flowlight = new FlowLight();
```

### Environment Variables

For advanced configuration, you can set environment variables:

```bash
# Set API base URL
export API_BASE_URL=https://your-custom-api.com

# Build with custom configuration
NODE_ENV=production API_BASE_URL=https://your-custom-api.com npm run build
```

## Examples

See the `react/` directory for complete examples:
- `FlowvanaExample.js` - Full-featured React example
- `README.md` - Detailed React integration guide

## License

MIT