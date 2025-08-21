from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from models.models import (
    CreateAuthConfigRequest, CreateAuthConfigResponse, 
    ListAuthConfigsResponse, DeleteAuthConfigResponse,
    AuthConfigInfo
)
from storage.mongo_client import get_mongo_client
from utils.auth import get_current_user

router = APIRouter(prefix="/project-settings", tags=["project-settings"])

@router.post("/auth-configs", response_model=CreateAuthConfigResponse)
def create_auth_config(
    request: CreateAuthConfigRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new auth config for a project"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        user_id = user_info.get("user_id")
        
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Validate that the project belongs to the user's organization
        project = mongo_client.get_project_by_id(request.project_id, org_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        
        # Create auth config
        auth_config_id = mongo_client.create_auth_config(
            org_id=org_id,
            project_id=request.project_id,
            name=request.name,
            auth_config=request.auth_config.dict()
        )
        
        if auth_config_id:
            return CreateAuthConfigResponse(
                success=True,
                message="Auth config created successfully",
                auth_config_id=auth_config_id
            )
        else:
            raise HTTPException(status_code=400, detail="Failed to create auth config")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/auth-configs", response_model=ListAuthConfigsResponse)
def list_auth_configs(
    project_id: str = Query(..., description="Project ID to list auth configs for"),
    user_info: dict = Depends(get_current_user)
):
    """List all auth configs for a project"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Validate that the project belongs to the user's organization
        project = mongo_client.get_project_by_id(project_id, org_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        
        # List auth configs
        auth_configs_data = mongo_client.list_auth_configs(
            org_id=org_id,
            project_id=project_id
        )
        
        # Convert to AuthConfigInfo objects
        auth_configs = []
        for config_data in auth_configs_data:
            auth_configs.append(AuthConfigInfo(
                auth_config_id=config_data["auth_config_id"],
                name=config_data["name"],
                auth_config=config_data["auth_config"],
                project_id=config_data["project_id"],
                org_id=config_data["org_id"],
                created_at=config_data["created_at"],
                updated_at=config_data["updated_at"]
            ))
        
        return ListAuthConfigsResponse(
            success=True,
            message="Auth configs retrieved successfully",
            auth_configs=auth_configs,
            total_count=len(auth_configs)
        )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/auth-configs/{auth_config_id}", response_model=DeleteAuthConfigResponse)
def delete_auth_config(
    auth_config_id: str,
    project_id: str = Query(..., description="Project ID that the auth config belongs to"),
    user_info: dict = Depends(get_current_user)
):
    """Delete an auth config from a project"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Validate that the project belongs to the user's organization
        project = mongo_client.get_project_by_id(project_id, org_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        
        # Delete auth config
        success = mongo_client.delete_auth_config(
            auth_config_id=auth_config_id,
            org_id=org_id,
            project_id=project_id
        )
        
        if success:
            return DeleteAuthConfigResponse(
                success=True,
                message="Auth config deleted successfully",
                auth_config_id=auth_config_id
            )
        else:
            raise HTTPException(status_code=404, detail="Auth config not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
