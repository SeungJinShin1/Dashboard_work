from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini import gemini_service
from services.firebase import get_db
from datetime import datetime
import json
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])

class TaskInput(BaseModel):
    text: str

class Task(BaseModel):
    id: str
    uid: str
    content: str
    due_date: str | None = None
    priority: str | None = None
    is_completed: bool = False
    is_deleted: bool = False
    created_at: str

@router.post("/analyze")
async def analyze_task(input: TaskInput):
    """
    Analyzes raw text using Gemini to extract task details.
    """
    prompt = f"""
    You are a helpful assistant. Extract the following details from the user's input:
    - task: The main task description.
    - due_date: The due date in ISO 8601 format (YYYY-MM-DD) if mentioned. If "next Tuesday", calculate it based on today ({datetime.now().strftime('%Y-%m-%d')}). If not mentioned, return null.
    - priority: High, Medium, or Low. Infer from context (e.g., "urgent", "important" = High). Default to Medium.
    
    Return ONLY a valid JSON object.
    
    User Input: "{input.text}"
    """
    
    response_text = await gemini_service.generate_content(prompt)
    
    try:
        # cleanup code blocks if present
        clean_text = response_text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean_text)
        return data
    except Exception as e:
        print(f"Failed to parse Gemini response: {response_text}")
        raise HTTPException(status_code=500, detail="Failed to analyze task")

@router.post("/")
async def create_task(task_data: dict):
    """
    Saves a task to Firestore.
    """
    db = get_db()
    if not db:
        # Demo mode: Save to in-memory store
        from services.store import demo_tasks
        
        uid = task_data.get("uid", "default_user")
        task_id = str(uuid.uuid4())
        
        new_task = {
            "id": task_id,
            "uid": uid,
            "content": task_data.get("task", "Untitled Task"),
            "due_date": task_data.get("due_date"),
            "priority": task_data.get("priority", "Medium"),
            "is_completed": False,
            "is_deleted": False,
            "created_at": datetime.now().isoformat(),
            "note": "Demo Mode: Saved to Memory"
        }
        demo_tasks.append(new_task)
        return new_task

    # Simple validation or use Pydantic model
    uid = task_data.get("uid", "default_user") # In real app, get from auth token
    task_id = str(uuid.uuid4())
    
    new_task = {
        "id": task_id,
        "uid": uid,
        "content": task_data.get("task", "Untitled Task"),
        "due_date": task_data.get("due_date"),
        "priority": task_data.get("priority", "Medium"),
        "is_completed": False,
        "is_deleted": False,
        "created_at": datetime.now().isoformat()
    }
    
    try:
        db.collection("tasks").document(task_id).set(new_task)
        return new_task
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save task: {e}")

@router.get("/")
async def get_tasks(uid: str = "default_user"):
    db = get_db()
    if not db:
        # Demo mode: Return in-memory tasks
        from services.store import demo_tasks
        return demo_tasks
        
    try:
        # Filter by uid and non-deleted
        docs = db.collection("tasks").where("uid", "==", uid).where("is_deleted", "==", False).stream()
        tasks = [doc.to_dict() for doc in docs]
        return tasks
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tasks: {e}")

@router.patch("/{task_id}")
async def update_task(task_id: str, updates: dict):
    db = get_db()
    if not db:
        return {"status": "success", "note": "Demo Mode: Not saved"}
        
    try:
        ref = db.collection("tasks").document(task_id)
        # Ensure we only update allowed fields
        allowed_updates = {k: v for k, v in updates.items() if k in ["is_completed", "is_deleted", "priority", "content", "due_date"]}
        if allowed_updates:
            ref.update(allowed_updates)
            return {"status": "success", "updates": allowed_updates}
        return {"status": "no_updates"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update task: {e}")
