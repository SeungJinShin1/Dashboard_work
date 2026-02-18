from fastapi import APIRouter, HTTPException
from services.gemini import gemini_service
from services.firebase import get_db
from datetime import datetime, timedelta

router = APIRouter(prefix="/briefing", tags=["briefing"])

# In-memory cache for briefing
briefing_cache = {
    "date": None,
    "content": None,
    "uid": None
}

@router.get("/")
async def get_briefing(uid: str = "default_user", force_refresh: bool = False):
    global briefing_cache
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # 1. Check Cache
    if not force_refresh and briefing_cache["date"] == today_str and briefing_cache["uid"] == uid and briefing_cache["content"]:
        return {"briefing": briefing_cache["content"]}

    # 2. Init Dates
    today_date = datetime.now().date()
    tomorrow_date = today_date + timedelta(days=1)
    
    # This week end (Sunday)
    # weekday: Mon=0, Sun=6. Days to add = 6 - weekday
    days_to_sunday = 6 - today_date.weekday()
    this_week_end = today_date + timedelta(days=days_to_sunday)
    
    # Next week
    next_week_start = this_week_end + timedelta(days=1)
    next_week_end = next_week_start + timedelta(days=6)

    tasks = []
    all_events = []
    memos = []

    # 3. Fetch Data
    db = get_db()
    if db:
        try:
            # Tasks
            tasks_ref = db.collection("tasks").where("uid", "==", uid).where("is_deleted", "==", False).where("is_completed", "==", False).stream()
            tasks = [t.to_dict() for t in tasks_ref]
            
            # Events (Fetch all future events roughly, or logic to fetch >= today)
            # Firebase filtering by string range works for YYYY-MM-DD
            events_ref = db.collection("events").where("date", ">=", today_str).stream()
            all_events = [e.to_dict() for e in events_ref]
            
            # Memos
            memo_doc = db.collection("memos").document(uid).get()
            if memo_doc.exists:
                memos = memo_doc.to_dict().get("items", [])
        except Exception as e:
            print(f"Error fetching data from DB: {e}")
            # Fallback to demo
            from services.store import demo_tasks, demo_events, demo_memos
            tasks = demo_tasks
            all_events = demo_events
            memos = demo_memos
    else:
        # Demo Mode
        from services.store import demo_tasks, demo_events, demo_memos
        tasks = demo_tasks
        all_events = demo_events
        memos = demo_memos

    # 4. Filter and Bucket Events & Tasks
    today_events = []
    tomorrow_events = []
    this_week_events = []
    next_week_events = []

    for e in all_events:
        try:
            e_date = datetime.strptime(e.get('date'), "%Y-%m-%d").date()
            if e_date < today_date:
                continue
                
            if e_date == today_date:
                today_events.append(e)
            elif e_date == tomorrow_date:
                tomorrow_events.append(e)
            elif today_date < e_date <= this_week_end:
                this_week_events.append(e)
            elif next_week_start <= e_date <= next_week_end:
                next_week_events.append(e)
        except:
            continue

    # Bucket Tasks
    overdue_tasks = []
    today_tasks_list = []
    upcoming_tasks = []
    no_date_tasks = []

    for t in tasks:
        due = t.get('due_date')
        content = t.get('content')
        prio = t.get('priority', 'Medium')
        
        if not due:
            no_date_tasks.append(f"- {content} (P: {prio})")
            continue
            
        try:
            # due_date might be YYYY-MM-DD or ISO. 
            # In create_task (routers/tasks.py), it seems to be just passed through.
            # Let's assume YYYY-MM-DD
            if 'T' in due: due = due.split('T')[0]
            
            due_dt = datetime.strptime(due, "%Y-%m-%d").date()
            
            task_str = f"- {content} (Due: {due}, P: {prio})"
            
            if due_dt < today_date:
                overdue_tasks.append(task_str)
            elif due_dt == today_date:
                today_tasks_list.append(task_str)
            else:
                upcoming_tasks.append(task_str)
        except:
             no_date_tasks.append(f"- {content} (P: {prio})")

    # Sort
    today_events.sort(key=lambda x: x.get('time', '00:00'))
    tomorrow_events.sort(key=lambda x: x.get('time', '00:00'))
    this_week_events.sort(key=lambda x: x.get('date'))
    next_week_events.sort(key=lambda x: x.get('date'))

    # Helper format
    def fmt_events(evts):
        if not evts: return "일정 없음"
        return "\n".join([f"- [{e.get('date')}] {e.get('time', 'All Day')} {e.get('title')} ({e.get('location', '')})" for e in evts])

    # 5. Generate Prompt
    prompt = f"""
    Current Date: {today_str} ({today_date.strftime('%A')})
    User: Head Teacher

    [Overdue Tasks] (Must be addressed)
    {chr(10).join(overdue_tasks) or "None"}

    [Today's Tasks] (Due Today)
    {chr(10).join(today_tasks_list) or "None"}
    
    [Upcoming Tasks]
    {chr(10).join(upcoming_tasks[:5]) or "None"}

    [General Tasks]
    {chr(10).join(no_date_tasks[:5]) or "None"}

    [Today's Schedule ({today_str})]
    {fmt_events(today_events)}

    [Tomorrow's Schedule]
    {fmt_events(tomorrow_events)}

    [Rest of This Week]
    {fmt_events(this_week_events)}

    [Next Week]
    {fmt_events(next_week_events)}

    [Memos]
    {chr(10).join([f"- {m.get('text')}" for m in memos if not m.get('checked')]) or "No memos."}

    System Prompt:
    당신은 학교 교무부장의 유능한 비서입니다. 위 정보를 바탕으로 브리핑을 작성하세요.
    
    **중요:** [Overdue Tasks]와 [Today's Tasks]는 오늘 반드시 처리해야 할 [오늘의 중점] 사항으로 다루세요.
    
    **반드시 아래 형식을 지켜주세요:**
    
    [오늘의 중점 (할 일 및 일정)]
    - (중요한 마감기한이 지난 일이나 오늘 마감인 일, 중요 일정 등을 강조)
    
    [오늘 일정]
    - (시간) (내용) (장소/담당)
    
    [내일 일정]
    - ...
    
    [이번 주 주요 일정]
    - ...
    
    [다음 주 주요 예고]
    - ...
    
    [기타 메모 및 할 일]
    - ...

    **규칙:**
    1. 날짜가 없는 섹션은 "일정 없음"으로 표시.
    2. 할 일 목록 중 날짜가 명시된 것은 해당 날짜 또는 '오늘의 중점'에 반영.
    3. 정중한 격식체(하십시오체) 사용.
    """

    try:
        briefing_text = await gemini_service.generate_content(prompt)
        
        # Cache
        briefing_cache["date"] = today_str
        briefing_cache["content"] = briefing_text
        briefing_cache["uid"] = uid
        
        return {"briefing": briefing_text}
        
    except Exception as e:
         print(f"Error generating briefing: {e}")
         raise HTTPException(status_code=500, detail=f"Failed to generate briefing: {e}")
