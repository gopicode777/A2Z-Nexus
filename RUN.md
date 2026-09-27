# A2Z Nexus — Run Guide

## Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy ..\.env.example ..\.env
uvicorn main:app --reload --port 8000
```

## Frontend (new terminal)
```powershell
cd frontend
npm install
npm run dev
```

Frontend API base: `http://localhost:8000/api` (override with `VITE_API_URL`).

API docs: `http://localhost:8000/docs`

Never commit `.env` or real API credentials.
