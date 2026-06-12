import sys
from pathlib import Path

# Add project root to path so we can import recommender
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import sqlite3
import json

from api.services import ai
from recommender.scorer import load_all_data, rank_schemes

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = Path("cache/schemes.db")

def get_all_data():
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.row_factory = sqlite3.Row
        data = load_all_data(conn)
        return data
    finally:
        conn.close()

class ExplainRequest(BaseModel):
    scheme: Dict[str, Any]
    intent: str
    language: Optional[str] = "English"

class ChatRequest(BaseModel):
    scheme: Dict[str, Any]
    message: str

@app.post("/api/explain")
def explain(request: ExplainRequest):
    try:
        if request.intent == "explain" or request.intent == "eligible" or request.intent == "next":
            result = ai.explain_scheme(request.scheme, request.language)
        elif request.intent == "documents":
            result = ai.explain_documents(request.scheme, request.language)
        else:
            raise HTTPException(status_code=400, detail="Invalid intent")
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        result = ai.process_chat(request.scheme, request.message)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/schemes/rank")
def rank(profile: Dict[str, Any]):
    data = get_all_data()
    ranked = rank_schemes(profile, data)
    return {
        "schemes": ranked[:100],
        "total": len(ranked),
        "profile_summary": "Ranked based on your profile"
    }

@app.get("/scheme/{slug}")
def get_scheme(slug: str):
    data = get_all_data()
    for scheme in data:
        if scheme["slug"] == slug:
            # Ensure required fields for Next.js are present
            scheme["matched_criteria"] = []
            scheme["eligibility_grid"] = []
            scheme["application_process"] = []
            
            # Extract tags as list
            raw_tags = scheme.get("listing_tags") or scheme.get("detail_tags") or "[]"
            try:
                scheme["tags"] = json.loads(raw_tags)
            except:
                scheme["tags"] = []

            if scheme.get("application_process_json"):
                try:
                    scheme["application_process"] = json.loads(scheme["application_process_json"])
                except:
                    pass
            return scheme
    raise HTTPException(status_code=404, detail="Not Found")

@app.get("/schemes/browse")
def browse(q: Optional[str] = None, page: int = 1):
    data = get_all_data()
    filtered = data
    if q:
        q = q.lower()
        filtered = [s for s in filtered if q in str(s.get("scheme_name", "")).lower() or q in str(s.get("listing_brief", "")).lower()]
    
    # Format schemes for BrowseResult
    formatted = []
    for s in filtered:
        try:
            tags = json.loads(s.get("listing_tags") or "[]")
        except:
            tags = []
        formatted.append({
            "slug": s["slug"],
            "scheme_name": s["scheme_name"],
            "ministry": s.get("ministry"),
            "state": s.get("listing_state"),
            "level": s.get("level", "Central"),
            "category": s.get("category", ""),
            "brief_description": s.get("listing_brief", ""),
            "tags": tags
        })
    
    per_page = 20
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "schemes": formatted[start:end],
        "total": len(formatted),
        "page": page,
        "per_page": per_page
    }

@app.get("/insights/stats")
def stats():
    data = get_all_data()
    total = len(data)
    state = len([s for s in data if s.get("level") == "State"])
    central = total - state
    return {
        "total_schemes": total,
        "state_schemes": state,
        "central_schemes": central,
        "student_schemes": len([s for s in data if s.get("occ_student")]),
        "farmer_schemes": len([s for s in data if s.get("occ_farmer")]),
        "women_specific": len([s for s in data if s.get("gender_female") and not s.get("gender_any")]),
        "states_covered": len(set(s.get("listing_state") for s in data if s.get("listing_state")))
    }
