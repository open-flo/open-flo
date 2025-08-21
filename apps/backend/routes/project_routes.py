from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from models.models import (
    CreateProjectRequest, CreateProjectResponse, ProjectInfo, ListProjectsResponse,
    UpdateProjectRequest, UpdateProjectResponse, DeleteProjectResponse
)
from storage.mongo_client import get_mongo_client
from utils.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=CreateProjectResponse)
def create_project(
    request: CreateProjectRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new project for the current user's organization"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        user_id = user_info.get("user_id")
        
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Create project
        result = mongo_client.create_project(
            name=request.name,
            description=request.description,
            org_id=org_id,
            created_by_user_id=user_id,
            is_default=request.is_default
        )
        
        if result["success"]:
            return CreateProjectResponse(
                success=True,
                message=result["message"],
                project_id=result["project_id"],
                name=result["name"],
                org_id=result["org_id"]
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/", response_model=ListProjectsResponse)
def list_projects(
    status: Optional[str] = Query(None, description="Filter by project status"),
    limit: int = Query(50, ge=1, le=100, description="Number of projects to return"),
    skip: int = Query(0, ge=0, description="Number of projects to skip"),
    user_info: dict = Depends(get_current_user)
):
    """List projects for the current user's organization"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # List projects
        result = mongo_client.list_projects(
            org_id=org_id,
            status=status,
            limit=limit,
            skip=skip
        )
        
        if result["success"]:
            return ListProjectsResponse(
                success=True,
                message=result["message"],
                projects=result["projects"],
                total_count=result["total_count"]
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/default", response_model=ProjectInfo)
def get_default_project(
    user_info: dict = Depends(get_current_user)
):
    """Get the default project for the current user's organization"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Get default project
        project = mongo_client.get_default_project(org_id)
        
        if project:
            return ProjectInfo(**project)
        else:
            raise HTTPException(status_code=404, detail="Default project not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{project_id}", response_model=ProjectInfo)
def get_project(
    project_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Get a specific project by ID"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Get project
        project = mongo_client.get_project_by_id(project_id, org_id)
        
        if project:
            return ProjectInfo(**project)
        else:
            raise HTTPException(status_code=404, detail="Project not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{project_id}", response_model=UpdateProjectResponse)
def update_project(
    project_id: str,
    request: UpdateProjectRequest,
    user_info: dict = Depends(get_current_user)
):
    """Update a project"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Update project
        result = mongo_client.update_project(
            project_id=project_id,
            name=request.name,
            description=request.description,
            status=request.status.value if request.status else None,
            org_id=org_id
        )
        
        if result["success"]:
            return UpdateProjectResponse(
                success=True,
                message=result["message"],
                project=ProjectInfo(**result["project"]) if result["project"] else None
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{project_id}", response_model=DeleteProjectResponse)
def delete_project(
    project_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Delete a project (soft delete)"""
    try:
        mongo_client = get_mongo_client()
        
        # Get current user info to get org_id
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found")
        
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Delete project
        result = mongo_client.delete_project(project_id, org_id)
        
        if result["success"]:
            return DeleteProjectResponse(
                success=True,
                message=result["message"],
                project_id=result["project_id"]
            )
        else:
            raise HTTPException(status_code=400, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 