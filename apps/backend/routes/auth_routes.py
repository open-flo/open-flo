from fastapi import APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.models import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, UserRole, UserState, CreateApiKeyRequest, CreateApiKeyResponse, ListApiKeysResponse, DeleteApiKeyResponse, RefreshApiKeyRequest, RefreshApiKeyResponse, ApiKeyInfo, UpdateUserRequest, UpdateUserResponse, UpdatePasswordRequest, UpdatePasswordResponse, LogoutResponse, InviteUsersRequest, AcceptInviteRequest, AcceptInviteResponse, UserInfo, ListUsersResponse, BatchInviteResponse
from storage.redis_client import redis_client
from storage.mongo_client import get_mongo_client
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional
from pydantic import ValidationError

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

mongo_client = get_mongo_client()

def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def store_token_in_redis(token: str, user_email: str, expires_in: int = 3600):
    """Store token in Redis with expiration"""
    # Get complete user information from MongoDB
    user = mongo_client.get_user_by_email(user_email)
    
    if user:
        token_data = {
            "user_id": user.get("user_id"),
            "email": user_email,
            "name": user.get("name"),
            "org_id": user.get("org_id"),
            "company_name": user.get("company_name"),
            "role": user.get("role"),
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(seconds=expires_in)).isoformat()
        }
    else:
        # Fallback to basic data if user not found
        token_data = {
            "email": user_email,
            "created_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(seconds=expires_in)).isoformat()
        }
    
    redis_client.setex(f"token:{token}", expires_in, json.dumps(token_data))

@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest):
    """Register a new user and create/join organization"""
    try:
        # Create user with organization in MongoDB
        result = mongo_client.create_user(payload.email, payload.password, payload.name, payload.company_name, role=UserRole.ADMIN)
        
        return RegisterResponse(
            success=result["success"],
            message=result["message"],
            user_id=result.get("user_id"),
            org_id=result.get("org_id"),
            company_name=result.get("company_name"),
            name=result.get("name")
        )
        
    except Exception as e:
        print(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    """Authenticate user and return bearer token"""
    try:
        # Validate credentials using MongoDB
        if not mongo_client.validate_user_credentials(payload.email, payload.password):
            return LoginResponse(
                success=False,
                message="Invalid email or password"
            )
        
        # Get user details to check status
        user = mongo_client.get_user_by_email(payload.email)
        if not user:
            return LoginResponse(
                success=False,
                message="User not found"
            )
        
        # Check user state
        user_status = user.get("status", UserState.PENDING)
        
        if user_status == UserState.PENDING:
            return LoginResponse(
                success=False,
                message="Your request is still pending"
            )
        elif user_status == UserState.SUSPENDED:
            return LoginResponse(
                success=False,
                message="Your account has been suspended"
            )
        elif user_status == UserState.INACTIVE:
            return LoginResponse(
                success=False,
                message="Your account is inactive"
            )
        elif user_status != UserState.ACTIVE:
            return LoginResponse(
                success=False,
                message="Your account is not active"
            )
        
        # Generate token only for active users
        token = generate_token()
        expires_in = 3600  # 1 hour
        
        # Store token in Redis
        store_token_in_redis(token, payload.email, expires_in)
        
        return LoginResponse(
            success=True,
            message="Login successful",
            token=token,
            expires_in=expires_in
        )
        
    except Exception as e:
        print(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def verify_token(token: str) -> Optional[dict]:
    """Verify token and return user data"""
    try:
        token_data = redis_client.get(f"token:{token}")
        if not token_data:
            return None
        
        # Ensure we have a string to parse
        if isinstance(token_data, bytes):
            token_data = token_data.decode('utf-8')
        
        parsed_data = json.loads(str(token_data))
        
        # If we have complete user data in token, return it
        if "user_id" in parsed_data and "name" in parsed_data:
            return parsed_data
        
        # Otherwise, fetch fresh user data from MongoDB
        if "email" in parsed_data:
            user = mongo_client.get_user_by_email(parsed_data["email"])
            if user:
                return {
                    "user_id": user.get("user_id"),
                    "email": user.get("email"),
                    "name": user.get("name"),
                    "org_id": user.get("org_id"),
                    "company_name": user.get("company_name"),
                    "role": user.get("role"),
                    "created_at": parsed_data.get("created_at"),
                    "expires_at": parsed_data.get("expires_at")
                }
        
        return parsed_data
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def verify_api_key(api_key: str) -> Optional[dict]:
    """Verify API key and return key data"""
    try:
        return mongo_client.validate_api_key(api_key)
    except Exception as e:
        print(f"Error verifying API key: {e}")
        return None

def invalidate_user_tokens(user_email: str) -> int:
    """Invalidate all bearer tokens for a specific user"""
    print(f"🔐 Invalidating all tokens for user: {user_email}")
    
    try:
        # Get all token keys
        token_keys_result = redis_client.keys("token:*")  # type: ignore
        # Convert to list to handle the response properly
        token_keys = list(token_keys_result) if token_keys_result else []  # type: ignore
        print(f"📊 Found {len(token_keys)} total tokens in Redis")
        
        invalidated_count = 0
        
        for token_key in token_keys:
            try:
                # Get token data
                token_data = redis_client.get(token_key)
                if token_data:
                    # Ensure we have a string to parse
                    if isinstance(token_data, bytes):
                        token_data = token_data.decode('utf-8')
                    
                    parsed_data = json.loads(str(token_data))
                    
                    # Check if this token belongs to the user
                    if parsed_data.get("email") == user_email:
                        redis_client.delete(token_key)
                        invalidated_count += 1
                        print(f"🗑️ Invalidated token: {token_key}")
                        
            except Exception as e:
                print(f"⚠️ Error processing token {token_key}: {e}")
                continue
        
        print(f"✅ Invalidated {invalidated_count} tokens for user: {user_email}")
        return invalidated_count
        
    except Exception as e:
        print(f"❌ Error invalidating tokens for user {user_email}: {e}")
        return 0

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> dict:
    """Get current user from either bearer token or API key"""
    user_data = None
    
    # Try API key first
    if x_api_key:
        user_data = verify_api_key(x_api_key)
        if user_data:
            return {
                "auth_type": "api_key", 
                "key_id": user_data["key_id"],
                "org_id": user_data.get("org_id"),
                "created_by_user_id": user_data.get("created_by_user_id")
            }
    
    # Try bearer token
    if credentials:
        token_data = verify_token(credentials.credentials)
        if token_data:
            return {
                "user_id": token_data.get("user_id"),
                "email": token_data["email"],
                "name": token_data.get("name"),
                "org_id": token_data.get("org_id"),
                "company_name": token_data.get("company_name"),
                "role": token_data.get("role"),
                "auth_type": "bearer_token"
            }
    
    raise HTTPException(status_code=401, detail="Invalid or missing authentication")

def get_current_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user and verify admin role"""
    token = credentials.credentials
    user_data = verify_token(token)

    print(f"🔑 User data: {user_data}")
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_email = user_data["email"]
    
    # Check if user is admin
    if not mongo_client._check_user_is_admin(user_email):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return {
        "user_id": user_data.get("user_id"),
        "email": user_data["email"],
        "name": user_data.get("name"),
        "org_id": user_data.get("org_id"),
        "company_name": user_data.get("company_name"),
        "role": user_data.get("role")
    }

@router.get("/verify")
def verify_endpoint(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
):
    """Verify bearer token or API key"""
    
    # Try API key first
    if x_api_key:
        api_key_data = verify_api_key(x_api_key)
        if api_key_data:
            return {
                "valid": True,
                "auth_type": "api_key",
                "key_id": api_key_data["key_id"],
                "org_id": api_key_data.get("org_id"),
                "created_by_user_id": api_key_data.get("created_by_user_id")
            }
    
    # Try bearer token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        user_data = verify_token(token)
        if user_data:
            return {
                "valid": True,
                "auth_type": "bearer_token",
                "user_id": user_data.get("user_id"),
                "email": user_data["email"],
                "name": user_data.get("name"),
                "org_id": user_data.get("org_id"),
                "company_name": user_data.get("company_name"),
                "role": user_data.get("role"),
                "expires_at": user_data["expires_at"]
            }
    
    raise HTTPException(status_code=401, detail="Invalid or missing authentication")

@router.get("/profile")
def get_profile(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user profile with organization info"""
    token = credentials.credentials
    user_data = verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get user details from MongoDB
    user = mongo_client.get_user_by_email(user_data["email"])
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get organization details if user has org_id
    if user.get("org_id"):
        org = mongo_client.get_organization_by_id(user["org_id"])
        if org:
            user["organization"] = {
                "org_id": org["org_id"],
                "company_name": org["company_name"],
                "user_count": org.get("user_count", 0),
                "created_at": org["created_at"]
            }
    
    return user

@router.put("/profile", response_model=UpdateUserResponse)
def update_profile(payload: UpdateUserRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update user profile information"""
    token = credentials.credentials
    user_data = verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        result = mongo_client.update_user(
            email=user_data["email"],
            name=payload.name,
            company_name=payload.company_name
        )
        
        return UpdateUserResponse(
            success=result["success"],
            message=result["message"],
            user=result.get("user")
        )
        
    except Exception as e:
        print(f"Error updating user profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/password", response_model=UpdatePasswordResponse)
async def update_password(request: Request, payload: UpdatePasswordRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Update user password"""
    print(f"🔐 Password update request received")
    
    # Log raw request details
    try:
        raw_body = await request.body()
        print(f"📋 Raw request body: {raw_body.decode('utf-8')}")
        print(f"📋 Request headers: {dict(request.headers)}")
        print(f"📋 Content type: {request.headers.get('content-type')}")
    except Exception as e:
        print(f"⚠️ Could not read raw request: {e}")
    
    # Validate payload structure
    print(f"📋 Payload received: type={type(payload)}")
    print(f"📋 Payload attributes: {dir(payload)}")
    
    try:
        print(f"📋 Payload validation: old_password={'***' if hasattr(payload, 'old_password') and payload.old_password else 'None'}, new_password={'***' if hasattr(payload, 'new_password') and payload.new_password else 'None'}")
    except Exception as e:
        print(f"❌ Error accessing payload attributes: {e}")
        raise HTTPException(status_code=422, detail=f"Invalid payload structure: {str(e)}")
    
    # Validate required fields
    if not hasattr(payload, 'old_password') or not payload.old_password:
        print("❌ Validation error: old_password is required")
        raise HTTPException(status_code=422, detail="old_password is required")
    
    if not hasattr(payload, 'new_password') or not payload.new_password:
        print("❌ Validation error: new_password is required")
        raise HTTPException(status_code=422, detail="new_password is required")
    
    if len(payload.new_password) < 6:
        print("❌ Validation error: new_password too short")
        raise HTTPException(status_code=422, detail="new_password must be at least 6 characters")
    
    # Validate string types
    if not isinstance(payload.old_password, str):
        print(f"❌ Validation error: old_password must be string, got {type(payload.old_password)}")
        raise HTTPException(status_code=422, detail="old_password must be a string")
    
    if not isinstance(payload.new_password, str):
        print(f"❌ Validation error: new_password must be string, got {type(payload.new_password)}")
        raise HTTPException(status_code=422, detail="new_password must be a string")
    
    print(f"✅ Payload validation passed")
    
    print(f"🔑 Verifying bearer token")
    token = credentials.credentials
    user_data = verify_token(token)
    
    if not user_data:
        print("❌ Token verification failed")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    print(f"✅ Token verified for user: {user_data.get('email', 'unknown')}")
    
    try:
        print(f"🔄 Calling MongoDB update_password for user: {user_data['email']}")
        result = mongo_client.update_password(
            email=user_data["email"],
            old_password=payload.old_password,
            new_password=payload.new_password
        )
        
        print(f"📊 MongoDB result: success={result.get('success')}, message={result.get('message')}")
        
        return UpdatePasswordResponse(
            success=result["success"],
            message=result["message"]
        )
        
    except Exception as e:
        print(f"❌ Exception in update_password: {e}")
        print(f"📍 Exception type: {type(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/logout", response_model=LogoutResponse)
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user and invalidate all bearer tokens"""
    print(f"🚪 Logout request received")
    
    token = credentials.credentials
    user_data = verify_token(token)
    
    if not user_data:
        print("❌ Token verification failed during logout")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_email = user_data.get("email")
    if not user_email:
        print("❌ No email found in token data")
        raise HTTPException(status_code=401, detail="Invalid token data")
    
    print(f"👤 Logging out user: {user_email}")
    
    try:
        # Invalidate all tokens for this user
        tokens_invalidated = invalidate_user_tokens(user_email)
        
        print(f"✅ Logout successful for user: {user_email}")
        print(f"📊 Tokens invalidated: {tokens_invalidated}")
        
        return LogoutResponse(
            success=True,
            message=f"Logout successful. {tokens_invalidated} token(s) invalidated.",
            tokens_invalidated=tokens_invalidated
        )
        
    except Exception as e:
        print(f"❌ Exception during logout: {e}")
        print(f"📍 Exception type: {type(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/api-keys", response_model=CreateApiKeyResponse)
def create_api_key(payload: CreateApiKeyRequest, admin_user: dict = Depends(get_current_admin_user)):
    """Create a new system-level API key"""
    print(f"🔑 Create API key request received from admin: {admin_user['email']}")
    print(f"📋 Payload: name={payload.name}, description={payload.description}, expires_in_days={payload.expires_in_days}")
    
    try:
        print(f"🔄 Calling MongoDB create_api_key")
        result = mongo_client.create_api_key(
            name=payload.name,
            description=payload.description,
            expires_in_days=payload.expires_in_days,
            org_id=admin_user.get("org_id"),
            created_by_user_id=admin_user.get("user_id")
        )
        
        print(f"📊 MongoDB result: success={result.get('success')}, message={result.get('message')}")
        print(f"📋 Response data: api_key={'***' if result.get('api_key') else 'None'}, key_id={result.get('key_id')}, expires_at={result.get('expires_at')}")
        
        return CreateApiKeyResponse(
            success=result["success"],
            message=result["message"],
            api_key=result.get("api_key"),
            key_id=result.get("key_id"),
            expires_at=result.get("expires_at"),
            org_id=result.get("org_id"),
            created_by_user_id=result.get("created_by_user_id")
        )
        
    except Exception as e:
        print(f"❌ Exception in create_api_key: {e}")
        print(f"📍 Exception type: {type(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/api-keys", response_model=ListApiKeysResponse)
def list_api_keys(include_inactive: bool = False, admin_user: dict = Depends(get_current_admin_user)):
    """List system API keys"""
    print(f"🔑 List API keys request received from admin: {admin_user['email']} (include_inactive={include_inactive})")
    
    try:
        print(f"🔄 Calling MongoDB list_api_keys method")
        api_keys = mongo_client.list_api_keys(include_inactive=include_inactive)
        
        print(f"📊 MongoDB returned {len(api_keys)} API keys")
        print(f"📋 Raw API keys data: {api_keys}")
        
        # Convert to response format
        api_key_info = []
        for i, key in enumerate(api_keys):
            print(f"📋 Processing key {i + 1}: {key}")
            
            try:
                api_key_info.append(ApiKeyInfo(
                    key_id=key["key_id"],
                    name=key["name"],
                    description=key.get("description"),
                    created_at=key["created_at"],
                    expires_at=key.get("expires_at"),
                    last_used=key.get("last_used"),
                    is_active=key["is_active"],
                    deleted_at=key.get("deleted_at"),
                    org_id=key.get("org_id"),
                    created_by_user_id=key.get("created_by_user_id")
                ))
                print(f"✅ Successfully processed key {i + 1}")
            except Exception as e:
                print(f"❌ Error processing key {i + 1}: {e}")
                print(f"📋 Key data: {key}")
        
        print(f"✅ Processed {len(api_key_info)} API keys for response")
        
        message = f"API keys retrieved successfully"
        if include_inactive:
            active_count = sum(1 for key in api_key_info if key.is_active)
            inactive_count = len(api_key_info) - active_count
            message = f"API keys retrieved successfully ({active_count} active, {inactive_count} inactive)"
        
        return ListApiKeysResponse(
            success=True,
            message=message,
            api_keys=api_key_info
        )
        
    except Exception as e:
        print(f"❌ Exception in list_api_keys: {e}")
        print(f"📍 Exception type: {type(e)}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/api-keys/{key_id}", response_model=DeleteApiKeyResponse)
def delete_api_key(key_id: str, admin_user: dict = Depends(get_current_admin_user)):
    """Delete an API key"""
    print(f"🔑 Delete API key request received from admin: {admin_user['email']} for key_id: {key_id}")
    
    try:
        result = mongo_client.delete_api_key(key_id)
        
        return DeleteApiKeyResponse(
            success=result["success"],
            message=result["message"]
        )
        
    except Exception as e:
        print(f"Error deleting API key: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/api-keys/{key_id}/refresh", response_model=RefreshApiKeyResponse)
def refresh_api_key(key_id: str, payload: RefreshApiKeyRequest, admin_user: dict = Depends(get_current_admin_user)):
    """Refresh an API key by generating a new key"""
    print(f"🔑 Refresh API key request received from admin: {admin_user['email']} for key_id: {key_id}")
    
    try:
        result = mongo_client.refresh_api_key(key_id, payload.expires_in_days)
        
        return RefreshApiKeyResponse(
            success=result["success"],
            message=result["message"],
            api_key=result.get("api_key"),
            expires_at=result.get("expires_at"),
            org_id=result.get("org_id"),
            created_by_user_id=result.get("created_by_user_id")
        )
        
    except Exception as e:
        print(f"Error refreshing API key: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/invite", response_model=BatchInviteResponse)
def invite_users(payload: InviteUsersRequest, admin_user: dict = Depends(get_current_admin_user)):
    """Invite users with individual invite IDs (admin only)"""
    print(f"📧 Batch invite request received from admin: {admin_user['email']}")
    print(f"📋 Emails to invite: {payload.emails}")
    
    try:
        # TODO: In production, this should be configurable or come from environment
        base_url = "http://localhost:3000/accept-invite"
        
        result = mongo_client.create_batch_invitation(
            emails=payload.emails,
            invited_by=admin_user['email'],
            base_url=base_url
        )
        
        # Extract invite_id from first invitation (all invitations share the same invite_id)
        invite_id = None
        processed_emails = []
        
        if result.get("invitations"):
            invite_id = result["invitations"][0]["invite_id"]
            processed_emails = [invite_data["email"] for invite_data in result["invitations"]]
        
        return BatchInviteResponse(
            success=result["success"],
            message=result["message"],
            invite_id=invite_id,
            processed_emails=processed_emails,
            failed_emails=result.get("failed_emails", [])
        )
        
    except Exception as e:
        print(f"❌ Error creating batch invitation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")



@router.post("/accept-invite/{invite_id}", response_model=AcceptInviteResponse)
def accept_invite(invite_id: str, payload: AcceptInviteRequest):
    """Accept an invitation and create user account"""
    print(f"🎯 Accept invite request received for invite_id: {invite_id}")
    print(f"📋 User name: {payload.name}, email: {payload.email}")
    
    try:
        result = mongo_client.accept_invitation(
            invite_id=invite_id,
            email=payload.email,
            name=payload.name,
            password=payload.password
        )
        
        return AcceptInviteResponse(
            success=result["success"],
            message=result["message"],
            user_id=result.get("user_id"),
            user_email=result.get("user_email")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error accepting invitation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users", response_model=ListUsersResponse)
def list_users(
    include_inactive: bool = False,
    limit: int = 100,
    skip: int = 0,
    admin_user: dict = Depends(get_current_admin_user)
):
    """List all users (admin only)"""
    print(f"👥 List users request received from admin: {admin_user['email']}")
    print(f"📋 Parameters: include_inactive={include_inactive}, limit={limit}, skip={skip}")
    
    try:
        result = mongo_client.list_users(
            include_inactive=include_inactive,
            limit=limit,
            skip=skip
        )
        
        # Convert users to UserInfo objects
        user_info_list = []
        for user_data in result.get("users", []):
            try:
                user_info = UserInfo(
                    user_id=user_data["user_id"],
                    email=user_data["email"],
                    name=user_data["name"],
                    org_id=user_data["org_id"],
                    company_name=user_data["company_name"],
                    created_at=user_data["created_at"],
                    status=user_data["status"],
                    role=user_data["role"]
                )
                user_info_list.append(user_info)
            except Exception as e:
                print(f"⚠️ Error processing user data: {e}")
                print(f"📋 User data: {user_data}")
                continue
        
        return ListUsersResponse(
            success=result["success"],
            message=result["message"],
            users=user_info_list,
            total_count=result["total_count"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error listing users: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 