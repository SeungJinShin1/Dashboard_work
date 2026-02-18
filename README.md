# Head Teacher AI Dashboard (HT-Dashboard)

A minimal, SaaS-style personal dashboard designed for a school Head Teacher, leveraging **Gemini 3.0 Flash** for automation.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI
- **Backend**: FastAPI, Python 3.10+
- **AI**: Gemini 3.0 Flash (via `google-generativeai`)
- **Database**: Firebase Firestore

## Setup Instructions

### Backend
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate virtual environment:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment:
   - Copy `.env.example` to `.env`.
   - Add your `GEMINI_API_KEY`.
   - Set `FIREBASE_CREDENTIALS_PATH` to your Firebase Service Account JSON.
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   Server will run at `http://127.0.0.1:8000`.

### Frontend
1. Navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   App will run at `http://localhost:3000`.

## Features Implemented
- **App Shell**: Sidebar navigation with strict color palette.
- **AI To-Do List**: Smart task entry with auto-extraction of formatting details.
- **Morning Briefing**: Daily summary widget powered by Gemini.

## Color Palette
- Primary: `#3F4739` (Deep Olive)
- Secondary: `#F1BF98` (Soft Peach)
