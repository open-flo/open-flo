/**
 * TypeScript types for Trail Blazer API
 */

// Authentication types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  company_name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    created_at: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  company_name: string;
  created_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  company_name?: string;
}

export interface UpdatePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface VerifyTokenResponse {
  success: boolean;
  valid: boolean;
  user?: UserProfile;
}

// Trail Management types
export interface QueryPathRequest {
  query: string;
}

export interface NextCheckpointRequest {
  checkpoints: string[];
  objective?: string;
}

export interface CheckpointResponse {
  success: boolean;
  checkpoint?: string;
  trail_id?: string;
  completed?: boolean;
}

// User Management types
export interface EarlyAccessRequest {
  email: string;
}

export interface EarlyAccessResponse {
  success: boolean;
  message: string;
}

// Health check
export interface HealthResponse {
  status: string;
  timestamp: string;
}

// API Key Management
export interface CreateApiKeyRequest {
  name: string;
  description?: string;
  expires_in_days?: number;
}

export interface CreateApiKeyResponse {
  success: boolean;
  message?: string;
  key_id?: string;
  api_key?: string;
}

export interface ApiKeyInfo {
  key_id: string;
  name: string;
  description?: string;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface ListApiKeysResponse {
  success: boolean;
  keys: ApiKeyInfo[];
}

export interface RefreshApiKeyRequest {
  key_id: string;
  expires_in_days?: number;
}

export interface RefreshApiKeyResponse {
  success: boolean;
  message?: string;
  api_key?: string;
}

export interface DeleteApiKeyResponse {
  success: boolean;
  message?: string;
}

// API Error response
export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// Invitation types
export interface AcceptInvitationRequest {
  token: string;
  name: string;
  password: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    created_at: string;
  };
}

// Invite users types
export interface InviteUsersRequest {
  emails: string[];
}

export interface InviteUsersResponse {
  success: boolean;
  message?: string;
  invite_id?: string;
  processed_emails?: string[];
  failed_emails?: string[];
}

// Accept invitation types (updated for new backend)
export interface AcceptInviteRequest {
  email: string;
  name: string;
  password: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    company_name: string;
    created_at: string;
  };
}

// User list types
export interface User {
  user_id: string;
  email: string;
  name: string | null;
  org_id: string;
  company_name: string;
  created_at: string;
  status: "active" | "pending" | "suspended";
  role: string;
}

export interface ListUsersRequest {
  limit?: number;
  offset?: number;
}

export interface ListUsersResponse {
  success: boolean;
  message?: string;
  users: User[];
  total_count: number;
}

// Project types
export interface Project {
  project_id: string;
  name: string;
  description: string;
  org_id: string;
  created_by_user_id: string;
  created_at: string;
  status: "active" | "inactive" | "archived";
  is_default: boolean;
  settings: {
    allow_public_access: boolean;
    max_flows_per_project: number;
    max_users_per_project: number;
  };
  last_updated: string | null;
  deleted_at: string | null;
}

export interface ListProjectsRequest {
  status?: "active" | "inactive" | "archived";
  limit?: number;
  skip?: number;
}

export interface ListProjectsResponse {
  success: boolean;
  message: string;
  projects: Project[];
  total_count: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  is_default?: boolean;
  settings?: {
    allow_public_access?: boolean;
    max_flows_per_project?: number;
    max_users_per_project?: number;
  };
}

export interface CreateProjectResponse {
  success: boolean;
  message?: string;
  project_id?: string;
  name?: string;
  org_id?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: "active" | "inactive" | "archived";
  settings?: {
    allow_public_access?: boolean;
    max_flows_per_project?: number;
    max_users_per_project?: number;
  };
}

export interface UpdateProjectResponse {
  success: boolean;
  message?: string;
  project?: Project;
}

// Knowledge Base types
export interface KnowledgeEntry {
  knowledge_id: string;
  project_id: string;
  url: string;
  type: "document" | "link" | "file";
  title: string | null;
  description: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  errors: string | null;
  created_at: string;
  updated_at: string;
  org_id: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  is_deleted: boolean;
}

export interface IngestKnowledgeRequest {
  project_id: string;
  url: string;
  type: "document" | "link" | "file";
  title?: string;
  description?: string;
}

export interface IngestKnowledgeResponse {
  success: boolean;
  message?: string;
  knowledge_id?: string;
  project_id?: string;
  url?: string;
  status?: string;
}

export interface ListKnowledgeRequest {
  project_id: string;
  limit?: number;
  offset?: number;
}

export interface ListKnowledgeResponse {
  success: boolean;
  message?: string;
  knowledge_base: KnowledgeEntry[];
  total_count: number;
}

export interface DeleteKnowledgeResponse {
  success: boolean;
  message?: string;
  knowledge_id?: string;
}

export interface ResyncKnowledgeResponse {
  success: boolean;
  message?: string;
  knowledge_id?: string;
}

// Navigation types
export interface Navigation {
  navigation_id: string;
  title: string;
  url: string;
  phrases: string[];
  updated_at: string;
}

export interface ListNavigationsRequest {
  project_id: string;
  limit?: number;
  offset?: number;
}

export interface ListNavigationsResponse {
  success: boolean;
  message?: string;
  navigations: Navigation[];
  total_count: number;
}

export interface CreateNavigationRequest {
  project_id: string;
  url: string;
  title: string;
  phrases: string[];
}

export interface CreateNavigationResponse {
  success: boolean;
  message?: string;
  navigation_id?: string;
}

export interface UpdateNavigationRequest {
  url: string;
  title: string;
  phrases: string[];
}

export interface UpdateNavigationResponse {
  success: boolean;
  message?: string;
  navigation?: Navigation;
}

export interface DeleteNavigationResponse {
  success: boolean;
  message?: string;
  navigation_id?: string;
}

// Tracking Settings types
export interface TrackingCondition {
  type: "cookie" | "domain";
  name: string; // Required for cookie conditions, empty for domain conditions
  value: string;
  conditions: "equals" | "not_equals" | "contains" | "not_contains";
}

export interface TrackingSettings {
  status: "enable" | "disable";
  conditions: TrackingCondition[];
}

export interface GetTrackingStatusRequest {
  project_id: string;
}

export interface GetTrackingStatusResponse {
  status: "enable" | "disable";
  conditions: {
    cookies?: Array<{
      name: string;
      value: string;
      conditions: "equals" | "not_equals" | "contains" | "not_contains";
    }>;
    domains?: Array<{
      value: string;
      conditions: "equals" | "not_equals" | "contains" | "not_contains";
    }>;
  };
}

export interface UpdateTrackingStatusRequest {
  project_id: string;
  status: "enable" | "disable";
  conditions: {
    cookies?: Array<{
      name: string;
      value: string;
      conditions: "equals" | "not_equals" | "contains" | "not_contains";
    }>;
    domains?: Array<{
      value: string;
      conditions: "equals" | "not_equals" | "contains" | "not_contains";
    }>;
  };
}

export interface UpdateTrackingStatusResponse {
  success: boolean;
  message?: string;
}

// Analytics types
export interface DailyInteraction {
  date: string;
  queries: number;
  chats: number;
  total: number;
}

export interface FeedbackSummary {
  positive: number;
  negative: number;
  total: number;
}

export interface AnalyticsResponse {
  success: boolean;
  message: string;
  time_range: string;
  total_interactions: number;
  total_queries: number;
  total_chats: number;
  daily_interactions: DailyInteraction[];
  feedback_summary: FeedbackSummary;
}

// Search Hook types
export interface SearchHookAuthSource {
  from: 'localstorage' | 'cookie';
  name: string;
}

export interface SearchHookAuthConfig {
  type: 'Bearer' | 'Basic';
  source: SearchHookAuthSource;
}

export interface SearchHook {
  search_hook_id: string;
  name: string;
  url: string;
  auth_config: SearchHookAuthConfig;
  data_list_path: string;
  navigation_url_formula: string;
  navigation_title_formula: string;
  project_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSearchHookRequest {
  project_id: string;
  name: string;
  url: string;
  auth_config: SearchHookAuthConfig;
  data_list_path: string;
  navigation_url_formula: string;
  navigation_title_formula: string;
}

export interface CreateSearchHookResponse {
  success: boolean;
  message?: string;
  search_hook_id?: string;
}

export interface ListSearchHooksRequest {
  project_id: string;
}

export interface ListSearchHooksResponse {
  success: boolean;
  message: string;
  search_hooks: SearchHook[];
  total_count: number;
}

export interface UpdateSearchHookRequest {
  name: string;
  url: string;
  auth_config: SearchHookAuthConfig;
  data_list_path: string;
  navigation_url_formula: string;
  navigation_title_formula: string;
}

export interface UpdateSearchHookResponse {
  success: boolean;
  message?: string;
  search_hook?: SearchHook;
}

export interface DeleteSearchHookResponse {
  success: boolean;
  message?: string;
}

// Workflow types
export interface WorkflowInput {
  type: string;
  required: boolean;
  default?: any;
}

export interface WorkflowAuthSource {
  type: 'cookie' | 'localstorage';
  name: string;
}

export interface WorkflowAuth {
  type: 'Bearer' | 'Basic';
  source: WorkflowAuthSource;
}

export interface WorkflowPayloadField {
  type: string;
  required: boolean;
  default?: any;
}

export interface WorkflowStep {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  auth: WorkflowAuth;
  payloadSchema: Record<string, WorkflowPayloadField>;
}

export interface Workflow {
  workflow_id: string;
  id: string;
  name: string;
  description: string;
  inputs: Record<string, WorkflowInput>;
  steps: WorkflowStep[];
  project_id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkflowRequest {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, WorkflowInput>;
  steps: WorkflowStep[];
  project_id: string;
}

export interface CreateWorkflowResponse {
  success: boolean;
  message?: string;
  workflow_id?: string;
}

export interface ListWorkflowsRequest {
  project_id: string;
}

export interface ListWorkflowsResponse {
  success: boolean;
  message: string;
  workflows: Workflow[];
  total_count: number;
}

export interface UpdateWorkflowRequest {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, WorkflowInput>;
  steps: WorkflowStep[];
}

export interface UpdateWorkflowResponse {
  success: boolean;
  message?: string;
  workflow?: Workflow;
}

export interface DeleteWorkflowResponse {
  success: boolean;
  message?: string;
}

export interface ImportWorkflowFromCurlRequest {
  curl_string: string;
  project_id: string;
}

export interface ImportWorkflowFromCurlResponse {
  success: boolean;
  message?: string;
  workflow?: Workflow;
}

// Auth Configuration types
export interface AuthConfigSource {
  type: "cookie" | "localStorage";
  key: string;
  path?: string; // Optional path for cookie source
}

export interface AuthConfig {
  type: "Bearer";
  source: AuthConfigSource;
}

export interface ProjectAuthConfig {
  auth_config_id: string;
  project_id: string;
  name: string;
  auth_config: AuthConfig;
  created_at: string;
  updated_at: string;
  org_id: string;
}

export interface CreateAuthConfigRequest {
  project_id: string;
  name: string;
  auth_config: AuthConfig;
}

export interface CreateAuthConfigResponse {
  success: boolean;
  message?: string;
  auth_config_id?: string;
}

export interface ListAuthConfigsRequest {
  project_id: string;
}

export interface ListAuthConfigsResponse {
  success: boolean;
  message?: string;
  auth_configs: ProjectAuthConfig[];
  total_count: number;
}

export interface UpdateAuthConfigRequest {
  name: string;
  auth_config: AuthConfig;
}

export interface UpdateAuthConfigResponse {
  success: boolean;
  message?: string;
  auth_config?: ProjectAuthConfig;
}

export interface DeleteAuthConfigResponse {
  success: boolean;
  message?: string;
} 