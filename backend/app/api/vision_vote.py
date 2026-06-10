from fastapi import APIRouter, HTTPException
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class VoteRequest(BaseModel):
    feature_id: str

@router.post("/vision/vote")
async def vote_feature(vote: VoteRequest):
    """Increment vote count for a vision roadmap feature."""
    db = get_db()
    try:
        # Check if feature exists
        existing = db.table("vision_votes").select("count").eq("feature_id", vote.feature_id).execute()
        if existing.data:
            # Optimistic lock: read current count, update only if count hasn't changed
            current = existing.data[0]["count"]
            result = db.table("vision_votes").update({"count": current + 1}).eq("feature_id", vote.feature_id).eq("count", current).execute()
            if not result.data:
                # Count changed between read and update (race condition) — retry once
                existing2 = db.table("vision_votes").select("count").eq("feature_id", vote.feature_id).single().execute()
                if existing2.data:
                    new_current = existing2.data["count"]
                    db.table("vision_votes").update({"count": new_current + 1}).eq("feature_id", vote.feature_id).eq("count", new_current).execute()
        else:
            # First vote — insert with count=1
            db.table("vision_votes").insert({"feature_id": vote.feature_id, "count": 1}).execute()
        
        return {"status": "ok", "feature_id": vote.feature_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vision/votes/{feature_id}")
async def get_votes(feature_id: str):
    """Retrieve vote count for a specific feature."""
    db = get_db()
    try:
        result = db.table("vision_votes").select("count").eq("feature_id", feature_id).execute()
        if result.data:
            return {"feature_id": feature_id, "count": result.data[0]["count"]}
        else:
            return {"feature_id": feature_id, "count": 0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
