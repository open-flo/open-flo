from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserState(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"

class NextRequest(BaseModel):
    checkpoints: List[str]
    objective: Optional[str] = ""

class NextResponse(BaseModel):
    id: int
    checkpoint: str 
    trail_id: str
    suggestion_text: Optional[str] = ""

class QueryPathRequest(BaseModel):
    query: str

class KnowledgeBaseNode(BaseModel):
    idx: int
    label: str
    node_name: str

class KnowledgeBasePath(BaseModel):
    nodes: List[KnowledgeBaseNode]

class EarlyAccessRequest(BaseModel):
    email: EmailStr

class EarlyAccessResponse(BaseModel):
    success: bool
    message: str
    email: str
    timestamp: datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    expires_in: Optional[int] = None

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    company_name: str

class RegisterResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    org_id: Optional[str] = None
    company_name: Optional[str] = None
    name: Optional[str] = None

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None

class UpdateUserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None

class UpdatePasswordRequest(BaseModel):
    old_password: str
    new_password: str

class UpdatePasswordResponse(BaseModel):
    success: bool
    message: str

class LogoutResponse(BaseModel):
    success: bool
    message: str
    tokens_invalidated: int

class CreateApiKeyRequest(BaseModel):
    name: str
    description: Optional[str] = None
    expires_in_days: Optional[int] = None  # None means no expiration

class CreateApiKeyResponse(BaseModel):
    success: bool
    message: str
    api_key: Optional[str] = None
    key_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    org_id: Optional[str] = None
    created_by_user_id: Optional[str] = None

class ApiKeyInfo(BaseModel):
    key_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    is_active: bool
    deleted_at: Optional[datetime] = None
    org_id: Optional[str] = None
    created_by_user_id: Optional[str] = None

class ListApiKeysResponse(BaseModel):
    success: bool
    message: str
    api_keys: List[ApiKeyInfo] = []

class DeleteApiKeyResponse(BaseModel):
    success: bool
    message: str

class RefreshApiKeyRequest(BaseModel):
    key_id: str
    expires_in_days: Optional[int] = None  # None means no expiration

class RefreshApiKeyResponse(BaseModel):
    success: bool
    message: str
    api_key: Optional[str] = None
    expires_at: Optional[datetime] = None
    org_id: Optional[str] = None
    created_by_user_id: Optional[str] = None

class InviteUsersRequest(BaseModel):
    emails: List[EmailStr]

class AcceptInviteRequest(BaseModel):
    name: str
    password: str
    email: EmailStr  # Required to identify which user is accepting when multiple users share same invite_id

class AcceptInviteResponse(BaseModel):
    success: bool
    message: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None

class InviteInfo(BaseModel):
    email: str
    invite_id: str

class BatchInviteResponse(BaseModel):
    success: bool
    message: str
    invite_id: Optional[str] = None
    processed_emails: List[str] = []
    failed_emails: List[str] = []

class InvitationInfo(BaseModel):
    invite_id: str
    email: str
    status: InvitationStatus
    invited_by: str
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime] = None

class UserInfo(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None  # Name can be None for pending users
    org_id: str
    company_name: str
    created_at: datetime
    status: UserState
    role: UserRole

class ListUsersResponse(BaseModel):
    success: bool
    message: str
    users: List[UserInfo] = []
    total_count: int = 0

# Project Models
class ProjectStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"

class CreateProjectRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False

class CreateProjectResponse(BaseModel):
    success: bool
    message: str
    project_id: Optional[str] = None
    name: Optional[str] = None
    org_id: Optional[str] = None

class ProjectInfo(BaseModel):
    project_id: str
    name: str
    description: str
    org_id: str
    created_by_user_id: str
    created_at: datetime
    status: ProjectStatus
    is_default: bool
    settings: dict
    last_updated: Optional[str] = None
    deleted_at: Optional[str] = None

class ListProjectsResponse(BaseModel):
    success: bool
    message: str
    projects: List[ProjectInfo] = []
    total_count: int = 0

class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None

class UpdateProjectResponse(BaseModel):
    success: bool
    message: str
    project: Optional[ProjectInfo] = None

class DeleteProjectResponse(BaseModel):
    success: bool
    message: str
    project_id: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    k: Optional[int] = 4

class Flow(BaseModel):
    name: str
    description: str
    inputs: dict[str, dict[str, object]]  # e.g. {"input_name": {"type": "string", "required": True}}
    

class ChatRequest(BaseModel):
    query: str
    k: Optional[int] = 4
    min_score: Optional[float] = 0.0
    flows: Optional[List[Flow]] = None
    max_tokens: Optional[int] = 1000
    temperature: Optional[float] = 0.1
    use_reranking: Optional[bool] = True
    use_colpali: Optional[bool] = False
    folder_name: Optional[str] = None
    end_user_id: Optional[str] = None
    

class ChatResponse(BaseModel):
    success: bool
    message: str
    completion: Optional[str] = None
    query: Optional[str] = None
    request_id: Optional[str] = None
    flow_name: Optional[str] = None
    inputs: Optional[dict] = None

# Track Models
class TrackIngestRequest(BaseModel):
    url: str
    title: str
    extractedData: List[dict]

class TrackIngestResponse(BaseModel):
    success: bool
    message: str
    track_id: Optional[str] = None

class TrackValidateRequest(BaseModel):
    url: str

class TrackValidateResponse(BaseModel):
    success: bool
    message: str
    trackable: bool
    reason: str

class TrackStatus(str, Enum):
    INGESTED = "ingested"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"

# Track Settings Models
class TrackSettingsStatus(str, Enum):
    ENABLED = "enable"
    DISABLED = "disable"

class TrackConditionType(str, Enum):
    COOKIE = "cookie"
    DOMAIN = "domain"

class TrackConditionOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"

class TrackCondition(BaseModel):
    type: TrackConditionType
    name: str
    value: str
    conditions: TrackConditionOperator

class CookieCondition(BaseModel):
    name: str
    value: str
    conditions: TrackConditionOperator

class DomainCondition(BaseModel):
    value: str
    conditions: TrackConditionOperator

class TrackConditions(BaseModel):
    cookies: Optional[List[CookieCondition]] = None
    domains: Optional[List[DomainCondition]] = None

class TrackSettingsUpdateRequest(BaseModel):
    status: Optional[TrackSettingsStatus] = None
    conditions: Optional[TrackConditions] = None

class TrackSettingsResponse(BaseModel):
    status: TrackSettingsStatus
    conditions: TrackConditions = TrackConditions()

class TrackSettingsUpdateResponse(BaseModel):
    success: bool
    message: str

# Knowledge Base Models
class KnowledgeBaseStatus(str, Enum):
    INGESTED = "ingested"
    PROCESSING = "processing"
    COMPLETED = "completed"
    ERROR = "error"

class KnowledgeBaseType(str, Enum):
    DOCUMENT = "document"
    URL = "url"
    FILE = "file"

class IngestKnowledgeRequest(BaseModel):
    project_id: str
    url: str
    type: KnowledgeBaseType
    title: Optional[str] = None
    description: Optional[str] = None

class IngestKnowledgeResponse(BaseModel):
    success: bool
    message: str
    knowledge_id: Optional[str] = None
    project_id: Optional[str] = None
    url: Optional[str] = None
    status: Optional[KnowledgeBaseStatus] = None

class KnowledgeBaseInfo(BaseModel):
    knowledge_id: str
    project_id: str
    url: str
    type: KnowledgeBaseType
    title: Optional[str] = None
    description: Optional[str] = None
    status: KnowledgeBaseStatus
    errors: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    org_id: str
    processing_started_at: Optional[datetime] = None
    processing_completed_at: Optional[datetime] = None
    is_deleted: bool = False

class ListKnowledgeResponse(BaseModel):
    success: bool
    message: str
    knowledge_base: List[KnowledgeBaseInfo] = []
    total_count: int = 0

class DeleteKnowledgeResponse(BaseModel):
    success: bool
    message: str
    knowledge_id: Optional[str] = None

class ResyncKnowledgeResponse(BaseModel):
    success: bool
    message: str
    knowledge_id: Optional[str] = None

# Navigation Models
class Navigation(BaseModel):
    navigation_id: str
    title: str
    url: str
    phrases: List[str]
    updated_at: Optional[datetime] = None

class ListNavigationsResponse(BaseModel):
    success: bool
    message: str
    navigations: List[Navigation] = []
    total_count: int = 0

class DeleteNavigationResponse(BaseModel):
    success: bool
    message: str
    navigation_id: Optional[str] = None

class CreateNavigationRequest(BaseModel):
    project_id: str
    url: str
    title: str
    phrases: List[str]

class CreateNavigationResponse(BaseModel):
    success: bool
    message: str
    navigation_id: Optional[str] = None

class EditNavigationRequest(BaseModel):
    url: str
    title: str
    phrases: List[str]

class EditNavigationResponse(BaseModel):
    success: bool
    message: str
    navigation_id: Optional[str] = None

# Log Models
class LogType(str, Enum):
    QUERY = "query"
    CHAT = "chat"

class FeedbackType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"

class FeedbackRequest(BaseModel):
    response: FeedbackType

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    request_id: Optional[str] = None

# Analytics Models
class AnalyticsTimeRange(str, Enum):
    DAYS_7 = "7_days"
    DAYS_30 = "30_days"
    DAYS_90 = "90_days"

class DailyInteractionCount(BaseModel):
    date: str
    queries: int
    chats: int
    total: int

class FeedbackCount(BaseModel):
    positive: int
    negative: int
    total: int

class AnalyticsResponse(BaseModel):
    success: bool
    message: str
    time_range: str
    total_interactions: int
    total_queries: int
    total_chats: int
    daily_interactions: List[DailyInteractionCount]
    feedback_summary: FeedbackCount

# Studio Models
class StudioInitRequest(BaseModel):
    url: str
    project_id: str

class StudioInitResponse(BaseModel):
    success: bool
    config: Optional[dict] = None

class StudioConfigResponse(BaseModel):
    success: bool
    message: str
    project_id: Optional[str] = None
    config: Optional[dict] = None

class StudioConfigUpdateRequest(BaseModel):
    project_id: str
    config: dict

class StudioConfigUpdateResponse(BaseModel):
    success: bool
    message: str
    project_id: Optional[str] = None
    config: Optional[dict] = None

# Query Classification Models
class QueryClassificationResponse(BaseModel):
    flow_name: str = ""
    inputs: dict = {}
    corrections: str = ""
    forward_to_chat: bool = True

# Search Hook Models
class SearchHook(BaseModel):
    search_hook_id: str
    name: str
    url: str
    auth_config: dict
    data_list_path: str
    navigation_url_formula: str
    navigation_title_formula: str
    project_id: str
    org_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class ListSearchHooksResponse(BaseModel):
    success: bool
    message: str
    search_hooks: List[SearchHook] = []
    total_count: int = 0

class DeleteSearchHookResponse(BaseModel):
    success: bool
    message: str
    search_hook_id: Optional[str] = None

class CreateSearchHookRequest(BaseModel):
    project_id: str
    name: str
    url: str
    auth_config: dict
    data_list_path: str
    navigation_url_formula: str
    navigation_title_formula: str

class CreateSearchHookResponse(BaseModel):
    success: bool
    message: str
    search_hook_id: Optional[str] = None

class EditSearchHookRequest(BaseModel):
    name: str
    url: str
    auth_config: dict
    data_list_path: str
    navigation_url_formula: str
    navigation_title_formula: str

class EditSearchHookResponse(BaseModel):
    success: bool
    message: str
    search_hook_id: Optional[str] = None

# Workflow Models
class Workflow(BaseModel):
    workflow_id: str
    name: str
    description: str
    inputs: dict
    steps: List[dict]
    org_id: str
    project_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CreateWorkflowRequest(BaseModel):
    name: str
    description: str
    inputs: dict
    steps: List[dict]
    project_id: Optional[str] = None

class CreateWorkflowFromCurlRequest(BaseModel):
    curl_string: str
    project_id: Optional[str] = None

class CreateWorkflowResponse(BaseModel):
    success: bool
    message: str
    workflow_id: Optional[str] = None

class ListWorkflowsResponse(BaseModel):
    success: bool
    message: str
    workflows: List[Workflow] = []
    total_count: int = 0

class DeleteWorkflowResponse(BaseModel):
    success: bool
    message: str
    workflow_id: Optional[str] = None

# Auth Config Models
class AuthConfigSource(BaseModel):
    type: str  # 'localStorage' or 'cookie'
    key: Optional[str] = None  # for localStorage key or cookie name
    path: Optional[str] = None  # optional path like 'current.token'

class AuthConfig(BaseModel):
    type: str  # 'Bearer'
    source: AuthConfigSource

class AuthConfigInfo(BaseModel):
    auth_config_id: str
    name: str
    auth_config: dict
    project_id: str
    org_id: str
    created_at: datetime
    updated_at: datetime

class CreateAuthConfigRequest(BaseModel):
    project_id: str
    name: str
    auth_config: AuthConfig

class CreateAuthConfigResponse(BaseModel):
    success: bool
    message: str
    auth_config_id: Optional[str] = None

class ListAuthConfigsResponse(BaseModel):
    success: bool
    message: str
    auth_configs: List[AuthConfigInfo] = []
    total_count: int = 0

class DeleteAuthConfigResponse(BaseModel):
    success: bool
    message: str
    auth_config_id: Optional[str] = None