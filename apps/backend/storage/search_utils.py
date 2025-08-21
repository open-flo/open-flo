import faiss
import numpy as np
import json
import os
from sentence_transformers import SentenceTransformer
from collections import defaultdict
from rapidfuzz import process
from storage.mongo_client import get_mongo_client

# Module-level initialization - create FAISS indices by project
def _build_project_indices():
    """Build FAISS indices for each project on module load"""
    print("Building FAISS indices by project...")
    mongo_client = get_mongo_client()
    collection = mongo_client.client["trail_blazer"]["app_navigations"]
    
    # Create indices directory
    os.makedirs("faiss_indices", exist_ok=True)
    
    # Group data by project_id
    project_data = defaultdict(list)
    for doc in collection.find():
        project_id = doc.get("project_id")
        if project_id:
            url = doc["url"]
            title = doc.get("title", "")
            navigation_id = doc.get("navigation_id", "")
            for phrase in doc.get("phrases", []):
                project_data[project_id].append({
                    "url": url,
                    "phrase": phrase,
                    "title": title,
                    "navigation_id": navigation_id
                })
    
    if not project_data:
        print("No project data found for FAISS indices")
        return
    
    # Load model once
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Process each project
    for project_id, items in project_data.items():
        phrases = [item["phrase"] for item in items]
        
        # Create embeddings
        embeddings = model.encode(phrases, convert_to_numpy=True, normalize_embeddings=True)
        
        # Build FAISS index
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        # Save index and metadata
        index_path = f"faiss_indices/{project_id}.index"
        metadata_path = f"faiss_indices/{project_id}_metadata.json"
        
        faiss.write_index(index, index_path)
        with open(metadata_path, 'w') as f:
            json.dump(items, f)
        
        print(f"✓ Created index for project {project_id}: {len(items)} phrases")
    
    print(f"✓ Completed building indices for {len(project_data)} projects")

# Build indices on module load
try:
    global model
    model = SentenceTransformer("all-MiniLM-L6-v2")
    _build_project_indices()
except Exception as e:
    print(f"Warning: Failed to build FAISS indices: {e}")


def fuzzy_search_by_project(query: str, project_id: str, limit: int = 5, score_threshold: int = 60):
    """Fuzzy search by project_id with navigation_id support"""
    mongo_client = get_mongo_client()

    # Access the app_navigations collection through the existing client
    collection = mongo_client.client["trail_blazer"]["app_navigations"]

    # Get all documents for the project
    project_data = list(collection.find({"project_id": project_id}))

    if not project_data:
        return []

    results = []

    for doc in project_data:
        url = doc["url"]
        phrases = doc["phrases"]
        navigation_id = doc.get("navigation_id", "")

        # Find matches for all phrases in this URL
        matches = process.extract(query, phrases, limit=len(
            phrases), score_cutoff=score_threshold)

        if matches:
            # Get the maximum score for this URL
            max_score = max(score for _, score, _ in matches)

            # Get the best matching phrase
            best_match = max(matches, key=lambda x: x[1])
            best_phrase = best_match[0]

            results.append({
                "url": url,
                "title": doc["title"],
                "navigation_id": navigation_id,
                "best_phrase": best_phrase,
                "max_score": max_score,
                "all_matches": [(phrase, score) for phrase, score, _ in matches]
            })

    # Sort by max_score in descending order and return top K
    results.sort(key=lambda x: x["max_score"], reverse=True)
    return results[:limit]


def semantic_search_by_project(query: str, project_id: str, limit: int = 5, score_threshold: float = 0.0):
    """Semantic search using FAISS index for a specific project"""
    index_path = f"faiss_indices/{project_id}.index"
    metadata_path = f"faiss_indices/{project_id}_metadata.json"
    
    # Check if index exists
    if not os.path.exists(index_path) or not os.path.exists(metadata_path):
        print(f"No FAISS index found for project {project_id}")
        return []
    
    try:
        # Load index and metadata
        index = faiss.read_index(index_path)
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Load model and encode query
        query_embedding = model.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        
        # Search
        scores, indices = index.search(query_embedding, min(limit * 2, len(metadata)))
        
        # Process results
        results = []
        seen_urls = set()
        
        for score, idx in zip(scores[0], indices[0]):
            if score < score_threshold:
                continue
                
            item = metadata[idx]
            url = item["url"]
            
            # Group by URL to avoid duplicates
            if url not in seen_urls:
                seen_urls.add(url)
                results.append({
                    "url": url,
                    "title": item["title"],
                    "navigation_id": item["navigation_id"],
                    "best_phrase": item["phrase"],
                    "max_score": float(score),
                })
                
                if len(results) >= limit:
                    break
        
        return results
        
    except Exception as e:
        print(f"Error in semantic search: {e}")
        return []
    