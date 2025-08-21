from fastapi import APIRouter, HTTPException
from models.models import EarlyAccessRequest, EarlyAccessResponse
from storage.mongo_client import get_mongo_client

router = APIRouter(prefix="/user", tags=["user"])

mongo_client = get_mongo_client()

@router.post("/early-access", response_model=EarlyAccessResponse)
def request_early_access(payload: EarlyAccessRequest):
    """Request early access by providing an email address"""
    try:
        result = mongo_client.add_early_access_request(payload.email)
        return EarlyAccessResponse(**result)
    except Exception as e:
        print(f"Error processing early access request: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 