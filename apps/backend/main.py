from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from storage import initialize_storage, get_storage_status
from routes.auth_routes import router as auth_router
from routes.project_routes import router as project_router
from routes.query_routes import router as query_router
from routes.navigation_routes import router as navigation_router
from routes.search_hook_routes import router as search_hook_router
from routes.analytics_routes import router as analytics_router
from routes.studio_routes import router as studio_router
from routes.workflow_routes import router as workflows_router
from routes.project_settings import router as project_settings_router
import uvicorn
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    try:
        initialize_storage()
    except Exception as e:
        print(f"⚠️ Warning: Storage initialization failed: {e}")
        print("🔄 Application will continue but some features may not work")

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router)
app.include_router(project_router)
app.include_router(query_router)
app.include_router(navigation_router)
app.include_router(search_hook_router)
app.include_router(analytics_router)
app.include_router(studio_router)
app.include_router(workflows_router)
app.include_router(project_settings_router)

@app.get("/health")
def health_check():
    """Health check endpoint that includes storage status"""
    status = get_storage_status()
    
    # Determine overall health (MongoDB is optional, so we don't require it for health)
    all_systems_ok = all([
        status["redis"]
    ])
    
    return {
        "status": "healthy" if all_systems_ok else "degraded",
        "storage_systems": status,
        "message": f"Found {status['ui_elements_count']} UI elements" if all_systems_ok else "Some storage systems are unavailable"
    }

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8090))
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True,
        reload_excludes=["faiss_indices/*"]
    )