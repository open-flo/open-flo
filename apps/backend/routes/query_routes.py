from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.models import ChatRequest, ChatResponse, QueryRequest, FeedbackRequest, FeedbackResponse, Navigation, Flow
import uuid
import time
from concurrent.futures import ThreadPoolExecutor
from storage import semantic_search_by_project
from storage.mongo_client import get_mongo_client
import traceback
from llm.query_classification import classify_query
from llm.get_help import get_help

router = APIRouter(prefix="/query", tags=["query"])

# Thread pool executor for background logging
executor = ThreadPoolExecutor(max_workers=4)

def log_request_background(request_id: str, project_id: str, request_query: str, 
                          response: dict, log_type: str, time_taken: float, 
                          error: str = None):
    """Background function to log requests without blocking the response"""
    try:
        mongo_client = get_mongo_client()
        mongo_client.create_log_entry(
            request_id=request_id,
            project_id=project_id,
            request_query=request_query,
            response=response,
            log_type=log_type,
            time_taken=time_taken,
            error=error
        )
        print(f"✅ Background logging completed for request_id: {request_id}")
    except Exception as e:
        print(f"❌ Background logging failed for request_id {request_id}: {e}")

@router.post("")
def query_endpoint(
    payload: QueryRequest,
    project_id: Optional[str] = Query(None, description="Project ID for filtering")
):
    """
        Query endpoint which will return top k matching endpoints for a given query
    """
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required")
    
    # Generate UUID for this request
    request_id = str(uuid.uuid4())
    start_time = time.time()
    error_message = None
    
    try:
        # Perform fuzzy search
        search_results = semantic_search_by_project(
            query=payload.query,
            project_id=project_id,
            limit=payload.k or 4,
            score_threshold=0
        )
        
        # Format results according to the expected output
        formatted_results = []
        for result in search_results:
            formatted_result = {
                "url": result["url"],
                "type": "Navigate",
                "title": result["title"],
                "description": result["best_phrase"]  # Use best_phrase as description
            }
            formatted_results.append(formatted_result)
        
        response_data = {
            "status": "success",
            "message": "Query processed successfully",
            "request_id": request_id,
            "results": formatted_results
        }
        
        # Log the request in background
        time_taken = time.time() - start_time
        executor.submit(
            log_request_background,
            request_id=request_id,
            project_id=project_id,
            request_query=payload.query,
            response=response_data,
            log_type="query",
            time_taken=time_taken,
            error=error_message
        )
        
        return response_data
        
    except Exception as e:
        traceback.print_exc()
        error_message = str(e)
        print(f"❌ Error in query endpoint: {e}")
        
        # Log the error in background
        time_taken = time.time() - start_time
        executor.submit(
            log_request_background,
            request_id=request_id,
            project_id=project_id,
            request_query=payload.query,
            response={"error": error_message},
            log_type="query",
            time_taken=time_taken,
            error=error_message
        )
        
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    payload: ChatRequest,
    project_id: str = Query(..., description="Project ID for filtering")
):
    """Chat endpoint that queries the external API"""
    print(f"💬 Chat request received: {payload.query}")
    
    # Generate UUID for this request
    request_id = str(uuid.uuid4())
    start_time = time.time()
    error_message = None
    
    try:
        # Initialize MongoDB client
        mongo_client = get_mongo_client()
        
        # Prepare the request data for the external API
        request_data = {
            "query": payload.query,
            "k": 4,
            "min_score": 0.0,
            "max_tokens": 1000,
            "temperature": 0.1,
            "use_reranking": True,
            "use_colpali": False,
            "end_user_id": project_id
        }

        response = None
        classification_response = classify_query(payload.query, payload.flows)

        print(f"🔍 Classification response: {classification_response}")
        
        if classification_response.flow_name or classification_response.corrections:
            response = ChatResponse(
                success=True,
                message=classification_response.corrections,
                completion=classification_response.corrections,
                query=payload.query,
                request_id=request_id,
                flow_name=classification_response.flow_name,
                inputs=classification_response.inputs
            )
        else:
            # Check if knowledge base has any entries for this project 
            knowledge_result = mongo_client.list_knowledge_base_entries(
                project_id=project_id,
                limit=1
            )
            
            has_knowledge_base = knowledge_result["success"] and knowledge_result["total_count"] > 0
            
            if has_knowledge_base:
                # TODO: Implement knowledge base
                pass
            else:
                # No knowledge base available, use get_help function
                print(f"📚 No knowledge base available, using get_help function")
                
                # Get navigations for this project 
                navigations_data = mongo_client.get_navigations_by_org_and_project(org_id=None, project_id=project_id)
                
                # Convert navigations data to Navigation objects
                navigations = []
                for nav_data in navigations_data:
                    nav = Navigation(
                        navigation_id=nav_data.get("navigation_id", ""),
                        title=nav_data.get("title", ""),
                        url=nav_data.get("url", ""),
                        phrases=nav_data.get("phrases", []),
                        updated_at=nav_data.get("updated_at")
                    )
                    navigations.append(nav)
                
                # Use get_help function to generate response
                help_response = get_help(navigations, payload.flows, payload.query)
                
                response = ChatResponse(
                    success=True,
                    message="Help response generated successfully",
                    completion=help_response,
                    query=payload.query,
                    request_id=request_id
                )
                    
        # Log the successful request in background
        time_taken = time.time() - start_time
        executor.submit(
            log_request_background,
            request_id=request_id,
            project_id=project_id,
            request_query=payload.query,
            response=response.dict(),
            log_type="chat",
            time_taken=time_taken,
            error=error_message
        )
        
        return response
               
                
    except Exception as e:
        error_message = str(e)
        print(f"❌ Error in chat endpoint: {e}")
        
        # Log the timeout error in background
        time_taken = time.time() - start_time
        executor.submit(
            log_request_background,
            request_id=request_id,
            project_id=project_id,
            request_query=payload.query,
            response={"error": error_message},
            log_type="chat",
            time_taken=time_taken,
            error=error_message
        )
        
      
        # Log the request error in background
        time_taken = time.time() - start_time
        executor.submit(
            log_request_background,
            request_id=request_id,
            project_id=project_id,
            request_query=payload.query,
            response={"error": error_message},
            log_type="chat",
            time_taken=time_taken,
            error=error_message
        )
        
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/feedback", response_model=FeedbackResponse)
def feedback_endpoint(
    payload: FeedbackRequest,
    project_id: str = Query(..., description="Project ID for filtering"),
    request_id: str = Query(..., description="Request ID to update feedback for")
):
    """Feedback endpoint to capture user feedback on query/chat responses
    
    This endpoint has no authentication requirement as specified.
    Updates the feedback_response field for a specific log entry.
    """
    print(f"📝 Feedback request received for request_id: {request_id}, feedback: {payload.response}")
    
    try:
        mongo_client = get_mongo_client()
        
        # Update the log entry with feedback
        result = mongo_client.update_log_feedback(
            request_id=request_id,
            feedback_response=payload.response
        )
        
        if result["success"]:
            print(f"✅ Feedback updated successfully for request_id: {request_id}")
            return FeedbackResponse(
                success=True,
                message="Feedback updated successfully",
                request_id=request_id
            )
        else:
            print(f"❌ Failed to update feedback: {result['message']}")
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in feedback endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal server error") 