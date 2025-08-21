from fastapi import APIRouter, HTTPException, Depends, Query
from models.models import (
    ListSearchHooksResponse,
    DeleteSearchHookResponse,
    CreateSearchHookRequest,
    CreateSearchHookResponse,
    EditSearchHookRequest,
    EditSearchHookResponse
)
from routes.auth_routes import get_current_user
from storage.mongo_client import get_mongo_client
import traceback

router = APIRouter(prefix="/search-hooks", tags=["search-hooks"])
mongo_client = get_mongo_client()

@router.get("", response_model=ListSearchHooksResponse)
def list_search_hooks(
    project_id: str = Query(..., description="Project ID to filter search hooks"),
    user_info: dict = Depends(get_current_user)
):
    """Get all search hooks for the authenticated user's organization and project"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Get search hooks from MongoDB
        search_hooks = mongo_client.get_search_hooks_by_org_and_project(org_id, project_id)
        
        return ListSearchHooksResponse(
            success=True,
            message="Search hooks retrieved successfully",
            search_hooks=search_hooks,
            total_count=len(search_hooks)
        )
        
    except Exception as e:
        print(f"Error retrieving search hooks: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{search_hook_id}", response_model=DeleteSearchHookResponse)
def delete_search_hook(
    search_hook_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Delete a search hook"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Check if search hook exists and belongs to user's org
        existing_search_hook = mongo_client.get_search_hook_by_id(search_hook_id, org_id)
        if not existing_search_hook:
            raise HTTPException(status_code=404, detail="Search hook not found")
        
        # Delete search hook
        deleted = mongo_client.delete_search_hook(search_hook_id, org_id)
        
        if not deleted:
            raise HTTPException(status_code=500, detail="Failed to delete search hook")
        
        return DeleteSearchHookResponse(
            success=True,
            message="Search hook deleted successfully",
            search_hook_id=search_hook_id
        )
        
    except Exception as e:
        traceback.print_exc()
        print(f"Error deleting search hook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=CreateSearchHookResponse)
def create_search_hook(
    request: CreateSearchHookRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new search hook"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Create search hook in MongoDB
        search_hook_id = mongo_client.create_search_hook(
            org_id=org_id,
            project_id=request.project_id,
            name=request.name,
            url=request.url,
            auth_config=request.auth_config,
            data_list_path=request.data_list_path,
            navigation_url_formula=request.navigation_url_formula,
            navigation_title_formula=request.navigation_title_formula
        )
        
        if not search_hook_id:
            raise HTTPException(status_code=500, detail="Failed to create search hook")
        
        return CreateSearchHookResponse(
            success=True,
            message="Search hook created successfully",
            search_hook_id=search_hook_id
        )
        
    except Exception as e:
        print(f"Error creating search hook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/{search_hook_id}", response_model=EditSearchHookResponse)
def edit_search_hook(
    search_hook_id: str,
    request: EditSearchHookRequest,
    project_id: str = Query(..., description="Project ID"),
    user_info: dict = Depends(get_current_user)
):
    """Edit an existing search hook"""
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="Organization ID not found")
        
        # Check if search hook exists and belongs to user's org and project
        existing_search_hook = mongo_client.get_search_hook_by_id(search_hook_id, org_id)
        if not existing_search_hook:
            raise HTTPException(status_code=404, detail="Search hook not found")
        
        # Update search hook in MongoDB
        success = mongo_client.update_search_hook(
            search_hook_id=search_hook_id,
            org_id=org_id,
            project_id=project_id,
            name=request.name,
            url=request.url,
            auth_config=request.auth_config,
            data_list_path=request.data_list_path,
            navigation_url_formula=request.navigation_url_formula,
            navigation_title_formula=request.navigation_title_formula
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update search hook")
        
        return EditSearchHookResponse(
            success=True,
            message="Search hook updated successfully",
            search_hook_id=search_hook_id
        )
        
    except Exception as e:
        print(f"Error updating search hook: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
