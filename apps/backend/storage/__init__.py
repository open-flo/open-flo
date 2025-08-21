# Storage package for Redis, Vector, Graph, and MongoDB functionality

from .redis_client import redis_client
from .mongo_client import get_mongo_client
from .search_utils import fuzzy_search_by_project, semantic_search_by_project

def initialize_storage():
    """
    Initialize all storage systems on startup.
    This function should be called when the application starts.
    """
    print("🔄 Initializing storage systems...")
    
    try:
        # Initialize MongoDB
        mongo_client = get_mongo_client()
        if mongo_client.is_connected():
            print("✅ MongoDB initialized")
        else:
            print("⚠️ MongoDB initialization failed")
        
    except Exception as e:
        print(f"❌ Error initializing storage systems: {e}")
        raise

def get_storage_status():
    """
    Get the status of all storage systems.
    
    Returns:
        dict: Status information for each storage system
    """
    status = {
        "redis": False,
        "mongodb": False,
    }
    
    try:
        # Test Redis connection
        redis_client.ping()
        status["redis"] = True
    except Exception:
        pass
    
    try:
        # Test MongoDB connection
        mongo_client = get_mongo_client()
        status["mongodb"] = mongo_client.is_connected()
    except Exception:
        pass
    
    return status

__all__ = [
    'redis_client',
    'get_mongo_client',
    'fuzzy_search_by_project',
    'semantic_search_by_project',
    'initialize_storage',
    'get_storage_status'
] 