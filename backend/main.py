import os
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path) # Load env vars before imports
print(f"DEBUG: Loading .env from {env_path}, Exists: {os.path.exists(env_path)}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import tasks, briefing, schedule, memos

app = FastAPI(
    title="Head Teacher Dashboard API",
    root_path="/api",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

@app.get("/debug/config")
async def debug_config():
    key = os.getenv("GEMINI_API_KEY")
    has_key = key is not None and len(key) > 10
    masked_key = f"{key[:5]}...{key[-5:]}" if has_key and key else "None"
    
    from services.gemini import gemini_service
    gemini_status = "Configured" if gemini_service.api_key else "Not Configured"
    
    return {
        "env_path_exists": os.path.exists(env_path) if 'env_path' in globals() else "Unknown",
        "has_gemini_key": has_key,
        "masked_key": masked_key,
        "gemini_service_status": gemini_status,
        "cwd": os.getcwd()
    }

@app.get("/debug/env")
async def debug_env():
    import os
    env_vars = {}
    for k, v in os.environ.items():
        if "KEY" in k or "SECRET" in k or "TOKEN" in k or "CREDENTIALS" in k or "PASSWORD" in k:
            env_vars[k] = f"{v[:5]}...{v[-5:]}" if v and len(v) > 10 else "SET (Lenght: " + str(len(v)) + ")"
        else:
            env_vars[k] = v
    return env_vars

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://dashboard-work-seungjinshin1s-projects.vercel.app", # Example
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily allow all for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import tasks, briefing, schedule, memos

# ... (omitted)

app.include_router(tasks.router)
app.include_router(briefing.router)
app.include_router(schedule.router)
app.include_router(memos.router)

@app.get("/")
async def read_root():
    return {"message": "Head Teacher Dashboard API is running"}

@app.get("/health")
async def health_check():
    import os
    from backend.services.firebase import get_db

    status = {
        "status": "ok",
        "gemini": "unknown",
        "firebase": "unknown",
        "env_loaded": False
    }

    # 1. Check Env
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        status["env_loaded"] = True
        # 2. Check Gemini Service
        from services.gemini import gemini_service
        status["gemini"] = "configured" if gemini_service.api_key else "not_configured"
        status["gemini_model"] = gemini_service.model_name
    else:
        status["env_loaded"] = False
        status["gemini"] = "missing_api_key"

    # 3. Check Firebase
    try:
        db = get_db()
        if db:
            status["firebase"] = "connected"
        else:
            status["firebase"] = "not_initialized"
    except Exception as e:
        status["firebase"] = f"error: {str(e)}"

    return status
