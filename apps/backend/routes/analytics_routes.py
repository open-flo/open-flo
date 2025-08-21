from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from models.models import AnalyticsResponse, AnalyticsTimeRange, DailyInteractionCount, FeedbackCount
from storage.mongo_client import get_mongo_client
from utils.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])

mongo_client = get_mongo_client()

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    project_id: str = Query(..., description="Project ID for analytics"),
    time_range: Optional[AnalyticsTimeRange] = Query(AnalyticsTimeRange.DAYS_7, description="Time range for analytics"),
    current_user: dict = Depends(get_current_user)
):
    """Get analytics data for a project
    
    Returns:
    - Total number of interactions (queries + chats)
    - Number of queries grouped by day
    - Number of chats grouped by day  
    - Feedback positive & negative count
    """
    
    # Validate that the user has access to this project
    # Get user's organization
    user_org_id = current_user.get("org_id")
    if not user_org_id:
        raise HTTPException(status_code=403, detail="User organization not found")
    
    # Get project to verify access
    project = mongo_client.get_project_by_id(project_id, org_id=user_org_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    # Convert time range to days
    time_range_days = {
        AnalyticsTimeRange.DAYS_7: 7,
        AnalyticsTimeRange.DAYS_30: 30,
        AnalyticsTimeRange.DAYS_90: 90
    }[time_range]
    
    # Get analytics data from MongoDB
    analytics_data = mongo_client.get_analytics_data(project_id, time_range_days)
    
    if not analytics_data["success"]:
        raise HTTPException(status_code=500, detail=analytics_data["message"])
    
    # Convert daily interactions to proper model format
    daily_interactions = []
    for day_data in analytics_data["daily_interactions"]:
        daily_interactions.append(DailyInteractionCount(
            date=day_data["date"],
            queries=day_data["queries"],
            chats=day_data["chats"],
            total=day_data["total"]
        ))
    
    # Convert feedback summary to proper model format
    feedback_summary = FeedbackCount(
        positive=analytics_data["feedback_summary"]["positive"],
        negative=analytics_data["feedback_summary"]["negative"],
        total=analytics_data["feedback_summary"]["total"]
    )
    
    return AnalyticsResponse(
        success=True,
        message="Analytics data retrieved successfully",
        time_range=time_range.value,
        total_interactions=analytics_data["total_interactions"],
        total_queries=analytics_data["total_queries"],
        total_chats=analytics_data["total_chats"],
        daily_interactions=daily_interactions,
        feedback_summary=feedback_summary
    ) 