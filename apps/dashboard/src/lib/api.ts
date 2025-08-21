/**
 * API Client for Flowvana Dashboard
 * Integrates with Trail Blazer API
 */

import { config, getApiUrl, getEndpointUrl } from './config'
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  UserProfile,
  UpdateProfileRequest,
  UpdatePasswordRequest,
  VerifyTokenResponse,
  QueryPathRequest,
  NextCheckpointRequest,
  CheckpointResponse,
  EarlyAccessRequest,
  EarlyAccessResponse,
  HealthResponse,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  ApiKeyInfo,
  ListApiKeysResponse,
  RefreshApiKeyRequest,
  RefreshApiKeyResponse,
  DeleteApiKeyResponse,
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InviteUsersRequest,
  InviteUsersResponse,
  AcceptInviteRequest,
  AcceptInviteResponse,
  User,
  ListUsersRequest,
  ListUsersResponse,
  ApiError,
  Project,
  ListProjectsRequest,
  ListProjectsResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  KnowledgeEntry,
  IngestKnowledgeRequest,
  IngestKnowledgeResponse,
  ListKnowledgeRequest,
  ListKnowledgeResponse,
  DeleteKnowledgeResponse,
  ResyncKnowledgeResponse,
  Navigation,
  ListNavigationsRequest,
  ListNavigationsResponse,
  CreateNavigationRequest,
  CreateNavigationResponse,
  UpdateNavigationRequest,
  UpdateNavigationResponse,
  DeleteNavigationResponse,
  GetTrackingStatusRequest,
  GetTrackingStatusResponse,
  UpdateTrackingStatusRequest,
  UpdateTrackingStatusResponse,
  AnalyticsResponse,
  SearchHook,
  CreateSearchHookRequest,
  CreateSearchHookResponse,
  ListSearchHooksRequest,
  ListSearchHooksResponse,
  UpdateSearchHookRequest,
  UpdateSearchHookResponse,
  DeleteSearchHookResponse,
  Workflow,
  CreateWorkflowRequest,
  CreateWorkflowResponse,
  ListWorkflowsRequest,
  ListWorkflowsResponse,
  UpdateWorkflowRequest,
  UpdateWorkflowResponse,
  DeleteWorkflowResponse,
  ImportWorkflowFromCurlRequest,
  ImportWorkflowFromCurlResponse,
  ProjectAuthConfig,
  CreateAuthConfigRequest,
  CreateAuthConfigResponse,
  ListAuthConfigsRequest,
  ListAuthConfigsResponse,
  UpdateAuthConfigRequest,
  UpdateAuthConfigResponse,
  DeleteAuthConfigResponse,
} from './types'

// Default headers for API requests
const defaultHeaders = {
  'Content-Type': 'application/json',
}

// Cookie helper functions
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const getCookie = (name: string): string | null => {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * Helper function to construct the final URL
 * @param endpoint - Either a full URL or a path
 * @returns The final URL
 */
const buildUrl = (endpoint: string): string => {
  // If it's already a full URL, return it as is
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }
  // Otherwise, build the URL using getApiUrl
  return getApiUrl(endpoint)
}

/**
 * API Client class for making HTTP requests to Trail Blazer API
 */
export class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>

  constructor() {
    this.baseUrl = config.api.base
    this.headers = { ...defaultHeaders }
  }

  /**
   * Check if an endpoint requires authentication
   * @param endpoint - API endpoint path
   * @returns boolean indicating if auth is required
   */
  private requiresAuth(endpoint: string): boolean {
    // Endpoints that don't require authentication
    const publicEndpoints = [
      '/auth/login',
      '/auth/register',
      '/health'
    ]
    
    return !publicEndpoints.some(path => endpoint.includes(path))
  }

  /**
   * Get headers with or without authorization based on endpoint
   * @param endpoint - API endpoint path
   * @returns Headers object
   */
  private getHeaders(endpoint: string): Record<string, string> {
    const headers = { ...defaultHeaders }
    
    const requiresAuth = this.requiresAuth(endpoint)
    
    // Always check for token in cookies if we don't have it in memory
    if (requiresAuth && !this.headers['Authorization']) {
      const token = getCookie('auth_token')
      if (token) {
        this.setAuthToken(token)
      }
    }
    
    if (requiresAuth && this.headers['Authorization']) {
      headers['Authorization'] = this.headers['Authorization']
    }
    
    return headers
  }

  /**
   * Set authorization token
   * @param token - JWT token from Trail Blazer API
   */
  setAuthToken(token: string) {
    this.headers['Authorization'] = `Bearer ${token}`
  }

  /**
   * Remove authorization token
   */
  removeAuthToken() {
    delete this.headers['Authorization']
  }

  /**
   * Handle API response and errors
   * @param response - Fetch response
   * @returns Parsed JSON response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle 401 and 403 errors by logging out the user
      if (response.status === 401 || response.status === 403) {
        this.removeAuthToken()
        deleteCookie('auth_token')
        // Throw a specific error that can be handled by the calling component
        throw new Error('AUTH_EXPIRED')
      }
      
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Make a GET request
   * @param endpoint - API endpoint
   * @param params - Query parameters
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(buildUrl(endpoint))
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(endpoint),
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      // Handle authentication errors differently from network errors
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        throw error // Re-throw auth errors to be handled by components
      }
      // Handle network errors for authenticated endpoints
      if (this.requiresAuth(endpoint)) {
        this.removeAuthToken()
        deleteCookie('auth_token')
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Make a POST request
   * @param endpoint - API endpoint
   * @param data - Request body
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: 'POST',
        headers: this.getHeaders(endpoint),
        body: data ? JSON.stringify(data) : undefined,
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      // Handle authentication errors differently from network errors
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        throw error // Re-throw auth errors to be handled by components
      }
      // Handle network errors for authenticated endpoints
      if (this.requiresAuth(endpoint)) {
        this.removeAuthToken()
        deleteCookie('auth_token')
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Make a PUT request
   * @param endpoint - API endpoint
   * @param data - Request body
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: 'PUT',
        headers: this.getHeaders(endpoint),
        body: data ? JSON.stringify(data) : undefined,
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      // Handle authentication errors differently from network errors
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        throw error // Re-throw auth errors to be handled by components
      }
      // Handle network errors for authenticated endpoints
      if (this.requiresAuth(endpoint)) {
        this.removeAuthToken()
        deleteCookie('auth_token')
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }

  /**
   * Make a DELETE request
   * @param endpoint - API endpoint
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(buildUrl(endpoint), {
        method: 'DELETE',
        headers: this.getHeaders(endpoint),
      })

      return this.handleResponse<T>(response)
    } catch (error) {
      // Handle authentication errors differently from network errors
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        throw error // Re-throw auth errors to be handled by components
      }
      // Handle network errors for authenticated endpoints
      if (this.requiresAuth(endpoint)) {
        this.removeAuthToken()
        deleteCookie('auth_token')
        throw new Error('Network error. Please check your connection and try again.')
      }
      throw error
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient()

// Trail Blazer API endpoints
export const api = {
  // Authentication endpoints
  auth: {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(
        getEndpointUrl('auth', 'register'),
        data
      )
      
      // Store token if registration successful
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token)
        setCookie('auth_token', response.token)
      }
      
      return response
    },

    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(
        getEndpointUrl('auth', 'login'),
        data
      )
      
      // Store token if login successful
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token)
        setCookie('auth_token', response.token)
      }
      
      return response
    },

    verify: async (): Promise<VerifyTokenResponse> => {
      return apiClient.get<VerifyTokenResponse>(getEndpointUrl('auth', 'verify'))
    },

    profile: async (): Promise<UserProfile> => {
      return apiClient.get<UserProfile>(getEndpointUrl('auth', 'profile'))
    },

    updateProfile: async (data: UpdateProfileRequest): Promise<AuthResponse> => {
      return apiClient.put<AuthResponse>(getEndpointUrl('auth', 'profile'), data)
    },

    updatePassword: async (data: UpdatePasswordRequest): Promise<AuthResponse> => {
      return apiClient.put<AuthResponse>(getEndpointUrl('auth', 'password'), data)
    },

    logout: async (): Promise<AuthResponse> => {
      try {
        // Call logout endpoint to invalidate token on server
        const response = await apiClient.post<AuthResponse>(getEndpointUrl('auth', 'logout'))
        
        // Always clear local token regardless of server response
        apiClient.removeAuthToken()
        deleteCookie('auth_token')
        
        return response
      } catch (error) {
        // Even if server call fails, clear local token
        apiClient.removeAuthToken()
        deleteCookie('auth_token')
        
        // Re-throw error for caller to handle
        throw error
      }
    },

    // Initialize auth token from cookies
    initializeAuth: () => {
      const token = getCookie('auth_token')
      if (token) {
        apiClient.setAuthToken(token)
      }
    },

    acceptInvitation: async (data: AcceptInvitationRequest): Promise<AcceptInvitationResponse> => {
      const response = await apiClient.post<AcceptInvitationResponse>(
        getEndpointUrl('auth', 'invitation'),
        data
      )
      
      // Store token if invitation acceptance successful
      if (response.success && response.token) {
        apiClient.setAuthToken(response.token)
        setCookie('auth_token', response.token)
      }
      
      return response
    },

    listUsers: async (params?: ListUsersRequest): Promise<ListUsersResponse> => {
      return apiClient.get<ListUsersResponse>(
        getEndpointUrl('auth', 'users'),
        params
      )
    },

    inviteUsers: async (data: InviteUsersRequest): Promise<InviteUsersResponse> => {
      return apiClient.post<InviteUsersResponse>(
        getEndpointUrl('auth', 'invite'),
        data
      )
    },

    acceptInvite: async (inviteId: string, data: AcceptInviteRequest): Promise<AcceptInviteResponse> => {
      return apiClient.post<AcceptInviteResponse>(
        `${getEndpointUrl('auth', 'accept-invite')}/${inviteId}`,
        data
      )
    },
  },

  // API Key Management endpoints
  apiKeys: {
    create: async (data: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
      return apiClient.post<CreateApiKeyResponse>(
        getEndpointUrl('auth', 'api-keys'),
        data
      )
    },

    list: async (): Promise<ListApiKeysResponse> => {
      return apiClient.get<ListApiKeysResponse>(getEndpointUrl('auth', 'api-keys'))
    },

    refresh: async (keyId: string): Promise<RefreshApiKeyResponse> => {
      return apiClient.post<RefreshApiKeyResponse>(
        `${getEndpointUrl('auth', 'api-keys')}/${keyId}/refresh`,
        { key_id: keyId }
      )
    },

    delete: async (keyId: string): Promise<DeleteApiKeyResponse> => {
      return apiClient.delete<DeleteApiKeyResponse>(
        `${getEndpointUrl('auth', 'api-keys')}/${keyId}`
      )
    },
  },

  // Trail Management endpoints
  trail: {
    queryPath: async (data: QueryPathRequest): Promise<CheckpointResponse> => {
      return apiClient.post<CheckpointResponse>(
        getEndpointUrl('trail', 'queryPath'),
        data
      )
    },

    next: async (data: NextCheckpointRequest, trailId?: string): Promise<CheckpointResponse> => {
      const endpoint = trailId 
        ? `${getEndpointUrl('trail', 'next')}?trail_id=${trailId}`
        : getEndpointUrl('trail', 'next')
      
      return apiClient.post<CheckpointResponse>(endpoint, data)
    },
  },

  // User Management endpoints
  user: {
    requestEarlyAccess: async (data: EarlyAccessRequest): Promise<EarlyAccessResponse> => {
      return apiClient.post<EarlyAccessResponse>(
        getEndpointUrl('user', 'earlyAccess'),
        data
      )
    },
  },

  // Health check
  health: {
    check: async (): Promise<HealthResponse> => {
      return apiClient.get<HealthResponse>(getEndpointUrl('health'))
    },
  },

  // Project Management endpoints
  projects: {
    list: async (params?: ListProjectsRequest): Promise<ListProjectsResponse> => {
      return apiClient.get<ListProjectsResponse>(
        getEndpointUrl('project', 'list'),
        params
      )
    },

    create: async (data: CreateProjectRequest): Promise<CreateProjectResponse> => {
      return apiClient.post<CreateProjectResponse>(
        getEndpointUrl('project', 'create'),
        data
      )
    },

    update: async (projectId: string, data: UpdateProjectRequest): Promise<UpdateProjectResponse> => {
      return apiClient.put<UpdateProjectResponse>(
        `${getEndpointUrl('project', 'detail')}/${projectId}`,
        data
      )
    },

    get: async (projectId: string): Promise<{ success: boolean; project: Project }> => {
      return apiClient.get<{ success: boolean; project: Project }>(
        `${getEndpointUrl('project', 'detail')}/${projectId}`
      )
    },

    delete: async (projectId: string): Promise<{ success: boolean; message?: string }> => {
      return apiClient.delete<{ success: boolean; message?: string }>(
        `${getEndpointUrl('project', 'detail')}/${projectId}`
      )
    },
  },

  // Knowledge Base endpoints
  knowledge: {
    ingest: async (data: IngestKnowledgeRequest): Promise<IngestKnowledgeResponse> => {
      return apiClient.post<IngestKnowledgeResponse>(
        getEndpointUrl('knowledge', 'ingest'),
        data
      )
    },

    list: async (params: ListKnowledgeRequest): Promise<ListKnowledgeResponse> => {
      return apiClient.get<ListKnowledgeResponse>(
        getEndpointUrl('knowledge', 'list'),
        params
      )
    },

    delete: async (knowledgeId: string): Promise<DeleteKnowledgeResponse> => {
      return apiClient.delete<DeleteKnowledgeResponse>(
        `${getEndpointUrl('knowledge', 'delete')}?knowledge_id=${knowledgeId}`
      )
    },

    resync: async (knowledgeId: string): Promise<ResyncKnowledgeResponse> => {
      return apiClient.post<ResyncKnowledgeResponse>(
        `${getEndpointUrl('knowledge', 'resync')}?knowledge_id=${knowledgeId}`,
        {}
      )
    },
  },

  // Navigation endpoints
  navigations: {
    list: async (params: ListNavigationsRequest): Promise<ListNavigationsResponse> => {
      return apiClient.get<ListNavigationsResponse>('/navigations', params)
    },

    create: async (data: CreateNavigationRequest): Promise<CreateNavigationResponse> => {
      return apiClient.post<CreateNavigationResponse>('/navigations', data)
    },

    update: async (navigationId: string, projectId: string, data: UpdateNavigationRequest): Promise<UpdateNavigationResponse> => {
      return apiClient.put<UpdateNavigationResponse>(
        `/navigations/${navigationId}?project_id=${projectId}`,
        data
      )
    },

    delete: async (navigationId: string): Promise<DeleteNavigationResponse> => {
      return apiClient.delete<DeleteNavigationResponse>(
        `/navigations/${navigationId}`
      )
    },
  },

  // Tracking Settings endpoints
  tracking: {
    getStatus: async (projectId: string): Promise<GetTrackingStatusResponse> => {
      try {
        const endpoint = `${getEndpointUrl('tracking', 'status')}?project_id=${projectId}`
        console.log('Tracking API - Getting status from:', endpoint)
        const response = await apiClient.get<GetTrackingStatusResponse>(endpoint)
        console.log('Tracking API - Response:', response)
        return response
      } catch (error) {
        console.error('Tracking API - Error getting status:', error)
        throw error
      }
    },

    updateStatus: async (projectId: string, data: UpdateTrackingStatusRequest): Promise<UpdateTrackingStatusResponse> => {
      try {
        const endpoint = `${getEndpointUrl('tracking', 'status')}?project_id=${projectId}`
        console.log('Tracking API - Updating status at:', endpoint, 'with data:', data)
        const response = await apiClient.put<UpdateTrackingStatusResponse>(endpoint, data)
        console.log('Tracking API - Update response:', response)
        return response
      } catch (error) {
        console.error('Tracking API - Error updating status:', error)
        throw error
      }
    },
  },

  // Analytics endpoints
  analytics: {
    get: async (projectId: string, params?: Record<string, any>): Promise<AnalyticsResponse> => {
      return apiClient.get<AnalyticsResponse>(
        `${getEndpointUrl('analytics', 'get')}?project_id=${projectId}`,
        params
      )
    },
  },

  // Studio endpoints
  studio: {
    getConfig: async (projectId: string): Promise<any> => {
      return apiClient.get<any>(
        `${getEndpointUrl('studio', 'config')}?project_id=${projectId}`
      )
    },
    
    init: async (data: { url: string; project_id: string }): Promise<any> => {
      return apiClient.post<any>(
        getEndpointUrl('studio', 'init'),
        data
      )
    },
  },

  // Search Hook endpoints
  searchHooks: {
    list: async (params: ListSearchHooksRequest): Promise<ListSearchHooksResponse> => {
      return apiClient.get<ListSearchHooksResponse>('/search-hooks', params)
    },

    create: async (data: CreateSearchHookRequest): Promise<CreateSearchHookResponse> => {
      return apiClient.post<CreateSearchHookResponse>('/search-hooks', data)
    },

    update: async (searchHookId: string, data: UpdateSearchHookRequest): Promise<UpdateSearchHookResponse> => {
      return apiClient.put<UpdateSearchHookResponse>(
        `/search-hooks/${searchHookId}`,
        data
      )
    },

    delete: async (searchHookId: string): Promise<DeleteSearchHookResponse> => {
      return apiClient.delete<DeleteSearchHookResponse>(
        `/search-hooks/${searchHookId}`
      )
    },
  },

  // Workflows endpoints
  workflows: {
    list: async (params: ListWorkflowsRequest): Promise<ListWorkflowsResponse> => {
      return apiClient.get<ListWorkflowsResponse>('/workflows/', params)
    },

    create: async (data: CreateWorkflowRequest): Promise<CreateWorkflowResponse> => {
      return apiClient.post<CreateWorkflowResponse>('/workflows/', data)
    },

    update: async (workflowId: string, data: UpdateWorkflowRequest): Promise<UpdateWorkflowResponse> => {
      return apiClient.put<UpdateWorkflowResponse>(
        `/workflows/${workflowId}`,
        data
      )
    },

    delete: async (workflowId: string): Promise<DeleteWorkflowResponse> => {
      return apiClient.delete<DeleteWorkflowResponse>(
        `/workflows/${workflowId}`
      )
    },

    importFromCurl: async (data: ImportWorkflowFromCurlRequest): Promise<ImportWorkflowFromCurlResponse> => {
      return apiClient.post<ImportWorkflowFromCurlResponse>('/workflows/from-curl', data)
    },
  },

  // Auth Configuration endpoints
  authConfigs: {
    list: async (params: ListAuthConfigsRequest): Promise<ListAuthConfigsResponse> => {
      return apiClient.get<ListAuthConfigsResponse>('/project-settings/auth-configs', params)
    },

    create: async (data: CreateAuthConfigRequest): Promise<CreateAuthConfigResponse> => {
      return apiClient.post<CreateAuthConfigResponse>('/project-settings/auth-configs', data)
    },

    update: async (authConfigId: string, data: UpdateAuthConfigRequest): Promise<UpdateAuthConfigResponse> => {
      return apiClient.put<UpdateAuthConfigResponse>(
        `/project-settings/auth-configs/${authConfigId}`,
        data
      )
    },

    delete: async (authConfigId: string): Promise<DeleteAuthConfigResponse> => {
      return apiClient.delete<DeleteAuthConfigResponse>(
        `/project-settings/auth-configs/${authConfigId}`
      )
    },
  },
} 