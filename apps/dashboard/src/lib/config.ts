/**
 * Configuration utility for Flowvana Dashboard
 * Handles environment variables and Trail Blazer API configuration
 */

export const config = {
  // API Configuration
  apiHost: import.meta.env.VITE_API_HOST || 'http://localhost:8090',
  
  // Development Configuration
  isDev: import.meta.env.VITE_DEV_MODE === 'true' || import.meta.env.DEV,
  
  // API Endpoints
  api: {
    base: import.meta.env.VITE_API_HOST || 'http://localhost:8090',
    endpoints: {
      // Authentication endpoints
      auth: {
        register: '/auth/register',
        login: '/auth/login',
        logout: '/auth/logout',
        verify: '/auth/verify',
        profile: '/auth/profile',
        password: '/auth/password',
        'api-keys': '/auth/api-keys',
        invitation: '/auth/invitation',
        invite: '/auth/invite',
        'accept-invite': '/auth/accept-invite',
        users: '/auth/users',
      },
      // Trail Management endpoints
      trail: {
        queryPath: '/trail/query_path',
        next: '/trail/next',
      },
      // User Management endpoints
      user: {
        earlyAccess: '/user/early-access',
      },
      // Project Management endpoints
      project: {
        list: '/projects/',
        create: '/projects/',
        detail: '/projects',
      },
      // Knowledge Base endpoints
      knowledge: {
        ingest: '/knowledge/ingest',
        list: '/knowledge/list',
        delete: '/knowledge/delete',
        resync: '/knowledge/resync',
      },
      // Tracking endpoints
      tracking: {
        status: '/track/status',
      },
      // Analytics endpoints
      analytics: {
        get: '/analytics/',
      },
      // Studio endpoints
      studio: {
        init: '/studio/init',
        config: '/studio/config',
      },
      // Health check
      health: '/health',
    }
  }
}

/**
 * Get the full API URL for a given endpoint
 * @param endpoint - The API endpoint path
 * @returns The full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = config.api.base.replace(/\/$/, '') // Remove trailing slash
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${baseUrl}${path}`
}

/**
 * Get a Trail Blazer API endpoint path
 * @param category - The endpoint category (auth, trail, user, etc.)
 * @param endpoint - The specific endpoint within the category
 * @returns The endpoint path (not the full URL)
 */
export const getEndpointUrl = (category: string, endpoint?: string): string => {
  const endpoints = config.api.endpoints as any
  
  if (endpoint) {
    // For nested endpoints like auth.login
    return endpoints[category]?.[endpoint] || `/${category}/${endpoint}`
  } else {
    // For simple endpoints like health
    return endpoints[category] || `/${category}`
  }
}

// Export environment variables for direct access if needed
export const env = {
  API_HOST: config.apiHost,
  DEV_MODE: config.isDev,
} 