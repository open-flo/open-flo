from fastapi import APIRouter, HTTPException, Depends, Query
from models.models import (
    ListNavigationsResponse,
    DeleteNavigationResponse,
    CreateNavigationRequest,
    CreateNavigationResponse,
    EditNavigationRequest,
    EditNavigationResponse
)
from routes.auth_routes import get_current_user
from storage.mongo_client import get_mongo_client
import traceback

router = APIRouter(prefix="/navigations", tags=["navigations"])
mongo_client = get_mongo_client()

@router.get("", response_model=ListNavigationsResponse)
def list_navigations(
    project_id: str = Query(..., description="Project ID to filter navigations"),
    user_info: dict = Depends(get_current_user)
):
    """Get all navigations for the authenticated user's organization and project"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Get navigations from MongoDB
        navigations = mongo_client.get_navigations_by_org_and_project(org_id, project_id)
        
        return ListNavigationsResponse(
            success=True,
            message="Navigations retrieved successfully",
            navigations=navigations,
            total_count=len(navigations)
        )
        
    except Exception as e:
        print(f"Error retrieving navigations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{navigation_id}", response_model=DeleteNavigationResponse)
def delete_navigation(
    navigation_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Delete a navigation"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Check if navigation exists and belongs to user's org and project
        existing_navigation = mongo_client.get_navigation_by_id(navigation_id, org_id)
        if not existing_navigation:
            raise HTTPException(status_code=404, detail="Navigation not found")
        
        # Delete navigation
        deleted = mongo_client.delete_navigation(navigation_id, org_id)
        
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete navigation")
        
        return DeleteNavigationResponse(
            success=True,
            message="Navigation deleted successfully",
            navigation_id=navigation_id
        )
        
    except Exception as e:
        traceback.print_exc()
        print(f"Error deleting navigation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=CreateNavigationResponse)
def create_navigation(
    request: CreateNavigationRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new navigation"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Create navigation in MongoDB
        navigation_id = mongo_client.create_navigation(
            org_id=org_id,
            project_id=request.project_id,
            url=request.url,
            title=request.title,
            phrases=request.phrases
        )
        
        if not navigation_id:
            raise HTTPException(status_code=500, detail="Failed to create navigation")
        
        return CreateNavigationResponse(
            success=True,
            message="Navigation created successfully",
            navigation_id=navigation_id
        )
        
    except Exception as e:
        print(f"Error creating navigation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{navigation_id}", response_model=EditNavigationResponse)
def edit_navigation(
    navigation_id: str,
    request: EditNavigationRequest,
    project_id: str = Query(..., description="Project ID"),
    user_info: dict = Depends(get_current_user)
):
    """Edit an existing navigation"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Check if navigation exists and belongs to user's org and project
        existing_navigation = mongo_client.get_navigation_by_id(navigation_id, org_id)
        if not existing_navigation:
            raise HTTPException(status_code=404, detail="Navigation not found")
        
        # Update navigation in MongoDB
        success = mongo_client.update_navigation(
            navigation_id=navigation_id,
            org_id=org_id,
            project_id=project_id,
            url=request.url,
            title=request.title,
            phrases=request.phrases
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update navigation")
        
        return EditNavigationResponse(
            success=True,
            message="Navigation updated successfully",
            navigation_id=navigation_id
        )
        
    except Exception as e:
        print(f"Error updating navigation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 