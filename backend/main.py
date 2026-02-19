import os
from dotenv import load_dotenv

# Load env vars safely
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import tasks, briefing, schedule, memos

app = FastAPI(
    title="Head Teacher Dashboard API",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# Debug endpoints removed for security

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://dashboard-work-seungjinshin1s-projects.vercel.app",
    "https://dashboard-work-liart.vercel.app",
]

# Add Vercel env var if present
if os.getenv("FRONTEND_URL"):
    origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        from backend.services.gemini import gemini_service
        status["gemini"] = "configured" if gemini_service.api_key else "not_configured"
        # status["gemini_model"] = gemini_service.model_name # Hide detail
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
        status["firebase"] = "error" # Hide detail

    return status
