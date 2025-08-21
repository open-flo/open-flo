# 📌 TrailBlazer Service

A Python microservice that helps guide users through web app journeys by intelligently predicting the next checkpoint using semantic search and graph-based navigation.

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Redis server running on localhost:6379
- Memgraph database running on localhost:7687 (or compatible Neo4j instance)
- OpenAI API key for semantic search

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd trail-blazer
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file with:
   ```env
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Memgraph Configuration
   MEMGRAPH_URL=bolt://localhost:7687
   MEMGRAPH_USERNAME=
   MEMGRAPH_PASSWORD=
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Start required services:**
   ```bash
   # Start Redis server
   redis-server
   
   # Start Memgraph (or Neo4j)
   # Docker: docker run -p 7687:7687 -p 7444:7444 memgraph/memgraph
   ```

5. **Run the service:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

The service will be available at `http://localhost:8000`

## 🏗️ Storage Systems

The TrailBlazer service uses a multi-layered storage approach:

### 1. **Graph Database (Memgraph/Neo4j)**
- Stores UI elements and their relationships
- Enables pathfinding between interface components
- Auto-initializes with comprehensive UI element data on startup

### 2. **Vector Store (ChromaDB + OpenAI)**
- Provides semantic search capabilities for UI elements
- Uses OpenAI embeddings for natural language understanding
- Allows queries like "create a new team" → finds relevant UI elements

### 3. **Redis Cache**
- Stores user trail histories and checkpoints
- Fast access for session management

## 📖 API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

### Endpoint: `GET /health`
Check service and storage system status:

**Response:**
```json
{
  "status": "healthy",
  "storage_systems": {
    "redis": true,
    "graph": true,
    "vector": true,
    "ui_elements_count": 120
  },
  "message": "Found 120 UI elements"
}
```

### Endpoint: `POST /next`

**Request:**
```json
{
  "checkpoints": ["Login", "Dashboard", "Settings"],
  "objective": "create a new team"
}
```

**Query Parameter:**
- `trail_id` (optional): Existing trail ID to continue a journey

**Response:**
```json
{
  "id": 5,
  "checkpoint": "teams_create_button",
  "trail_id": "uuid-string"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `MEMGRAPH_URL` | Memgraph connection URL | `bolt://localhost:7687` |
| `MEMGRAPH_USERNAME` | Database username | `` |
| `MEMGRAPH_PASSWORD` | Database password | `` |
| `OPENAI_API_KEY` | OpenAI API key | Required |

### Storage Initialization

The service automatically initializes all storage systems on startup:
1. Clears and recreates graph database with UI elements
2. Extracts UI elements and populates vector store
3. Verifies Redis connectivity

## 🧠 Prediction Logic

The service uses a hybrid approach:

1. **Semantic Search**: Uses OpenAI embeddings to find UI elements matching user intent
2. **GPT-4o-mini Selection**: Intelligently selects the best match from candidates
3. **Graph Pathfinding**: Finds navigation paths between UI elements
4. **Trail Memory**: Remembers user's previous interactions

## 🏗️ Project Structure

```
trailblazer/
├── main.py                    # FastAPI service with startup initialization
├── models/
│   └── models.py             # Request/Response models
├── storage/
│   ├── __init__.py           # Storage package with initialization
│   ├── redis_client.py       # Redis connection
│   ├── trail_store.py        # Trail history management
│   ├── vector_store.py       # ChromaDB + OpenAI embeddings
│   ├── graph_store.py        # Memgraph database operations
│   └── queries.py            # All database queries
├── llm/
│   └── predictor.py          # Prediction function wrapper
├── prompts/
│   └── next_check_point.py   # Prompt templates
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

## 📊 Example Usage

```bash
# Check service health
curl http://localhost:8000/health

# Start a new trail with semantic search
curl -X POST "http://localhost:8000/next" \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoints": ["Login", "Dashboard", "Settings"],
    "objective": "view employees working from SF"
  }'

# Continue existing trail
curl -X POST "http://localhost:8000/next?trail_id=your-trail-id" \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoints": ["Profile", "Security", "Logout"]
  }'
```

## 🔍 Semantic Search Examples

The vector store can understand various user intents:

- `"Create a new team"` → `teams_create_button`
- `"View employees working from SF"` → `emp_filter_location`
- `"Objectives that are overdue"` → `obj_global_tab_overdue`
- `"Find login button"` → Navigation path to login elements

## 🎯 Future Enhancements

- Add TTL to Redis keys to expire old trails
- Add authentication for tracking users securely
- Collect metrics on trail usage for analytics
- Expand UI element database with more applications
- Add support for dynamic UI element discovery
- Implement A/B testing for different prediction strategies 