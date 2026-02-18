from fastapi import APIRouter, HTTPException, Depends
from services.firebase import get_db
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/memos", tags=["memos"])

class MemoItem(BaseModel):
    id: str
    text: str
    checked: bool = False

# Note: Pydantic v2 uses `bool` not `boolean`, need to be careful with types.
# Actually `bool` is correct python type.
class MemoRequest(BaseModel):
    items: List[dict] # Simply accept list of dicts to match frontend structure

@router.get("/")
async def get_memos(uid: str = "default_user"):
    db = get_db()
    if db:
        try:
            # Assuming single doc for user's memo list for simplicity, or collection of items
            # For "Simple Memo", a single document containing the list is easier to sync than meaningful individual docs
            doc_ref = db.collection("memos").document(uid)
            doc = doc_ref.get()
            if doc.exists:
                return doc.to_dict().get("items", [])
            return []
        except Exception as e:
             print(f"DB Error: {e}")
             return []
    else:
        # Demo Mode
        from services.store import demo_memos
        return demo_memos

@router.post("/")
async def save_memos(request: MemoRequest, uid: str = "default_user"):
    db = get_db()
    if db:
        try:
            doc_ref = db.collection("memos").document(uid)
            doc_ref.set({"items": request.items})
            return {"message": "Saved"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        # Demo Mode
        from services.store import demo_memos
        demo_memos.clear()
        demo_memos.extend(request.items)
        return {"message": "Saved to Demo Store"}
