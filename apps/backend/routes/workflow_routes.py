from fastapi import APIRouter, HTTPException, Depends, Query
from models.models import (
    CreateWorkflowRequest, CreateWorkflowFromCurlRequest, CreateWorkflowResponse,
    ListWorkflowsResponse, DeleteWorkflowResponse, Workflow
)
from storage.mongo_client import get_mongo_client
from utils.auth import get_current_user
from llm.workflow_schema import get_workflow_schema

router = APIRouter(prefix="/workflows", tags=["workflows"])

mongo_client = get_mongo_client()

@router.get("/", response_model=ListWorkflowsResponse)
def list_workflows(
    project_id: str = Query(..., description="Project ID is required"),
    user_info: dict = Depends(get_current_user)
):
    """List all workflows for the organization"""
    print(f"📋 List workflows request received")
    print(f"🏢 Org ID: {user_info.get('org_id')}")
    print(f"📁 Project ID: {project_id}")
    
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Get workflows from MongoDB
        workflows_data = mongo_client.list_workflows(org_id, project_id)
        
        # Convert to Workflow models
        workflows = []
        for wf_data in workflows_data:
            workflow = Workflow(
                workflow_id=wf_data["workflow_id"],
                name=wf_data["name"],
                description=wf_data["description"],
                inputs=wf_data["inputs"],
                steps=wf_data["steps"],
                org_id=wf_data["org_id"],
                project_id=wf_data.get("project_id"),
                created_at=wf_data.get("created_at"),
                updated_at=wf_data.get("updated_at")
            )
            workflows.append(workflow)
        
        print(f"✅ Found {len(workflows)} workflows")
        
        return ListWorkflowsResponse(
            success=True,
            message=f"Successfully retrieved {len(workflows)} workflows",
            workflows=workflows,
            total_count=len(workflows)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error listing workflows: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/", response_model=CreateWorkflowResponse)
def create_workflow(
    payload: CreateWorkflowRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new workflow"""
    print(f"➕ Create workflow request received")
    print(f"📋 Workflow name: {payload.name}")
    print(f"📝 Description: {payload.description}")
    
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Get default project for this organization if not specified
        project_id = None
        if payload.project_id:
            project_id = payload.project_id
        else:
            default_project = mongo_client.get_default_project(org_id)
            if default_project:
                project_id = default_project.get("project_id")
        
        # Validate inputs
        if not isinstance(payload.inputs, dict):
            raise HTTPException(status_code=400, detail="Inputs must be a JSON object")
        
        # Validate steps
        if not isinstance(payload.steps, list):
            raise HTTPException(status_code=400, detail="Steps must be a JSON array")
        
        # Create workflow in MongoDB
        workflow_id = mongo_client.create_workflow(
            org_id=org_id,
            project_id=project_id,
            name=payload.name,
            description=payload.description,
            inputs=payload.inputs,
            steps=payload.steps
        )
        
        if not workflow_id:
            raise HTTPException(status_code=500, detail="Failed to create workflow")
        
        print(f"✅ Workflow created successfully with ID: {workflow_id}")
        
        return CreateWorkflowResponse(
            success=True,
            message="Workflow created successfully",
            workflow_id=workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating workflow: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/from-curl", response_model=CreateWorkflowResponse)
def create_workflow_from_curl(
    payload: CreateWorkflowFromCurlRequest,
    user_info: dict = Depends(get_current_user)
):
    """Create a new workflow from a curl string"""
    print(f"➕ Create workflow from curl request received")
    print(f"📋 Curl string: {payload.curl_string[:100]}...")
    
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Get default project for this organization if not specified
        project_id = None
        if payload.project_id:
            project_id = payload.project_id
        else:
            default_project = mongo_client.get_default_project(org_id)
            if default_project:
                project_id = default_project.get("project_id")
        
        # Generate workflow schema from curl string
        workflow_schema = get_workflow_schema(payload.curl_string)
        
        if not workflow_schema:
            raise HTTPException(status_code=500, detail="Failed to generate workflow schema from curl string")
        
        # Extract workflow data from schema
        name = workflow_schema.get("name", "Generated Workflow")
        description = workflow_schema.get("description", "Workflow generated from curl command")
        inputs = workflow_schema.get("inputs", {})
        steps = workflow_schema.get("steps", [])
        
        # Validate generated data
        if not isinstance(inputs, dict):
            raise HTTPException(status_code=500, detail="Generated inputs must be a JSON object")
        
        if not isinstance(steps, list):
            raise HTTPException(status_code=500, detail="Generated steps must be a JSON array")
        
        # Create workflow in MongoDB
        workflow_id = mongo_client.create_workflow(
            org_id=org_id,
            project_id=project_id,
            name=name,
            description=description,
            inputs=inputs,
            steps=steps
        )
        
        if not workflow_id:
            raise HTTPException(status_code=500, detail="Failed to create workflow")
        
        print(f"✅ Workflow created successfully from curl with ID: {workflow_id}")
        
        return CreateWorkflowResponse(
            success=True,
            message="Workflow created successfully from curl string",
            workflow_id=workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating workflow from curl: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{workflow_id}", response_model=DeleteWorkflowResponse)
def delete_workflow(
    workflow_id: str,
    user_info: dict = Depends(get_current_user)
):
    """Delete a workflow"""
    print(f"🗑️ Delete workflow request received")
    print(f"🆔 Workflow ID: {workflow_id}")
    
    try:
        org_id = user_info.get("org_id")
        if not org_id:
            raise HTTPException(status_code=400, detail="User not associated with any organization")
        
        # Delete workflow from MongoDB
        success = mongo_client.delete_workflow(workflow_id, org_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Workflow not found or access denied")
        
        print(f"✅ Workflow deleted successfully: {workflow_id}")
        
        return DeleteWorkflowResponse(
            success=True,
            message="Workflow deleted successfully",
            workflow_id=workflow_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting workflow: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

