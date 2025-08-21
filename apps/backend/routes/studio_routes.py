from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from models.models import (
    StudioInitRequest, StudioInitResponse, 
    StudioConfigResponse, StudioConfigUpdateRequest, StudioConfigUpdateResponse
)
from storage.mongo_client import get_mongo_client
from utils.auth import get_current_user
from llm.studio_config import generate_studio_color_config
from utils.studio import get_screenshot_base64

router = APIRouter(prefix="/studio", tags=["studio"])


@router.post("/init", response_model=StudioInitResponse)
def init_studio(
    request: StudioInitRequest,
    user_info: dict = Depends(get_current_user)
):
    """Initialize studio with URL and user auth token"""
    try:
        # Get current user info
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        org_id = user_info.get("org_id")
        project_id = request.project_id

        mongo_client = get_mongo_client()

        # check if project exists
        project_info = mongo_client.get_project_by_id(project_id)
        if not project_info:
            raise HTTPException(status_code=404, detail="Project not found")

        screenshot_base64 = get_screenshot_base64(request.url)
        studio_color_config = generate_studio_color_config(screenshot_base64)

        studio_config = {
            "buttonSize": 60,
            "buttonPosition": {
                "bottom": 20, 
                "right": 20
            },
            "zIndex": 999999,
            "keyboardShortcuts": True,
            "projectId": project_id,
            "themeColors": studio_color_config,
            "suggestions": [
                "Show me the dashboard?",
                "open crm dashboard",
                "show organization hierarchy?"
            ]
        }

        # save config to db
        mongo_client.add_studio_config(
            project_id, org_id, studio_config, user_info.get("user_id"))

        return StudioInitResponse(
            success=True,
            config=studio_config
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/config", response_model=StudioConfigResponse)
def get_studio_config(
    project_id: str = Query(..., description="Project ID to get studio config for"),
    user_info: dict = Depends(get_current_user)
):
    """Get studio configuration for a project"""
    try:
        mongo_client = get_mongo_client()

        # Get current user info
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        org_id = user_info.get("org_id")

        if not org_id:
            raise HTTPException(
                status_code=400, detail="User not associated with any organization")

        # Get project info to verify access
        project_info = mongo_client.get_project_by_id(project_id)
        if not project_info or project_info.get("org_id") != org_id:
            raise HTTPException(
                status_code=404, detail="Project not found or access denied")

        # get config from db
        studio_config = mongo_client.get_studio_config(project_id)
        if not studio_config:
            raise HTTPException(
                status_code=404, detail="Studio config not found")

        return StudioConfigResponse(
            success=True,
            message="Studio config retrieved successfully",
            project_id=project_id,
            config=studio_config
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/config", response_model=StudioConfigUpdateResponse)
def update_studio_config(
    request: StudioConfigUpdateRequest,
    user_info: dict = Depends(get_current_user)
):
    """Update studio configuration for a project"""
    try:
        mongo_client = get_mongo_client()

        # Get current user info
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")

        user_id = user_info.get("user_id")
        org_id = user_info.get("org_id")

        if not org_id:
            raise HTTPException(
                status_code=400, detail="User not associated with any organization")

        # Get project info to verify access
        project_info = mongo_client.get_project_by_id(request.project_id)
        if not project_info or project_info.get("org_id") != org_id:
            raise HTTPException(
                status_code=404, detail="Project not found or access denied")

        # update config in db
        mongo_client.add_studio_config(request.project_id, request.config)

        return StudioConfigUpdateResponse(
            success=True,
            message="Studio config updated successfully",
            project_id=request.project_id,
            config=request.config
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")
