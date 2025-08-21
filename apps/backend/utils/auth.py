from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from storage.redis_client import redis_client
from storage.mongo_client import get_mongo_client
import json
from typing import Optional, Dict

security = HTTPBearer()
mongo_client = get_mongo_client()

def verify_token(token: str) -> Optional[Dict]:
    """Verify token and return user data"""
    try:
        token_data = redis_client.get(f"token:{token}")
        if not token_data:
            return None
        
        # Ensure we have a string to parse
        if isinstance(token_data, bytes):
            token_data = token_data.decode('utf-8')
        
        return json.loads(str(token_data))
    except Exception as e:
        print(f"Error verifying token: {e}")
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Dependency to get current authenticated user"""
    token = credentials.credentials
    user_data = verify_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get full user data from MongoDB
    user = mongo_client.get_user_by_email(user_data["email"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Dependency that requires authentication and returns user email"""
    user_data = get_current_user(credentials)
    return user_data["email"] 