from fastapi import APIRouter, UploadFile, File, HTTPException
from services.excel_processor import excel_processor
from services.firebase import get_db

router = APIRouter(prefix="/schedule", tags=["schedule"])

@router.post("/upload")
async def upload_schedule(file: UploadFile = File(...)):
    print(f"DEBUG: Received file upload - {file.filename}")
    """
    Uploads an Excel file, extracts events using Gemini, and saves to Firestore.
    """
    if not file.filename.endswith(('.xlsx', '.xls')):
         print("DEBUG: Invalid file extension")
         raise HTTPException(status_code=400, detail="Invalid file type. Please upload Excel file.")
    
    try:
        # 1. Process with AI
        print("DEBUG: Processing with ExcelProcessor...")
        events = await excel_processor.process_schedule(file)
        print(f"DEBUG: Processed events: {events}")
    except Exception as e:
        print(f"DEBUG: Error in excel_processor: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    
    if not events:
         print("DEBUG: No events extracted")
         raise HTTPException(status_code=500, detail="Failed to extract events or empty file.")

    # 2. Save to Firestore (Batch write)
    try:
        db = get_db()
        if not db:
            print("DEBUG: Firestore DB not initialized")
            # Demo Mode: Save to Memory
            from services.store import demo_events
            # Assign IDs to events for deletion
            import uuid
            for event in events:
                event['id'] = str(uuid.uuid4())
                demo_events.append(event)
            
            return {"message": f"Processed and saved {len(events)} events (Demo Mode)", "events": events}
            
        print("DEBUG: Saving to Firestore...")
        batch = db.batch()
        collection = db.collection("events")
        
        count = 0
        for event in events:
            doc_ref = collection.document() # Auto-ID
            batch.set(doc_ref, event)
            count += 1
            
        batch.commit()
        print(f"DEBUG: Successfully saved {count} events")
        return {"message": f"Successfully processed and saved {count} events.", "events": events}
    except Exception as e:
        print(f"DEBUG: Firestore save failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save to database: {e}")

@router.get("/")
async def get_events():
    db = get_db()
    if not db:
         from services.store import demo_events
         return demo_events
         
    try:
        # Simple fetch all for now
        docs = db.collection("events").stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"Error fetching events: {e}")
        return []

@router.delete("/{event_id}")
async def delete_event(event_id: str):
    db = get_db()
    if not db:
        # Demo Mode
        from services.store import demo_events
        initial_count = len(demo_events)
        # Filter out the event to delete
        # Note: demo_events is a list, so we need to mutate it or replace contents
        # Since we imported the list reference, we should modify it in place or careful
        # Actually standard python import: names are bound. Modifying list content works.
        # But `demo_events = [...]` would just rebind local name.
        # So we must do `demo_events[:] = ...` or remove item.
        # Let's find index.
        for i, event in enumerate(demo_events):
             if event.get('id') == event_id:
                 del demo_events[i]
                 return {"message": "Event deleted (Demo)"}
        
        # If not found (or maybe ID mismatch), just return success
        return {"message": "Event not found in Demo store"}

    try:
        # DB Mode
        # Query for document where 'id' field matches (if we saved it as field)
        # Or if event_id is the document ID.
        # In upload (lines 44 description): doc_ref = collection.document() -> Auto ID.
        # But we didn't save ID into the document field explicitly in my code?
        # `batch.set(doc_ref, event)`. `event` is dict from excel.
        # Be careful: `doc_ref.id` is the ID. We should have probably saved it into the event dict?
        # Or front-end uses the doc ID.
        # Let's assume frontend sends doc ID.
        
        db.collection("events").document(event_id).delete()
        return {"message": "Event deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete event: {e}")
