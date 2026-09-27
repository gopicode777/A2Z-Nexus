# A2Z Nexus

> **AI Multi-Agent Developer Workspace**
> *Ask. Build. Test. Improve. Ship.*

A2Z Nexus is an AI-powered workspace built for the **IBM Bob 2.0 Hackathon**.  
It orchestrates a team of specialized AI agents so developers can analyze, improve, test, document, and ship projects through one unified chat interface.
---

## Architecture Overview

```
a2z-nexus/
├── backend/          # FastAPI backend, agents, orchestrator, database
├── frontend/         # Temporary React/Vite frontend (to be replaced)
├── .env.example      # Environment variable template
└── README.md
```

### Backend structure

```
backend/
├── api/              # Route definitions (FastAPI routers)
├── orchestrator/     # AI Orchestrator — intent routing & workflow execution
├── agents/
│   ├── information/  # General technical Q&A
│   ├── code_analysis/# Project structure, issues, languages, dependencies
│   ├── testing/      # Test detection, generation, execution
│   ├── recommendation/ # Project improvement recommendations
│   ├── documentation/  # README, API docs, architecture docs
│   ├── content/      # Descriptions, abstracts, release notes
│   ├── narration/    # Demo & presentation narration
│   ├── reminder/     # Task & deadline detection + calendar integration
│   ├── submission/   # Submission readiness check
│   └── release/      # Release readiness check
├── services/         # Shared services (AI, notifications, etc.)
├── integrations/     # External integrations (Google Calendar, etc.)
├── database/         # DB engine, models, migrations
├── models/           # Pydantic request/response schemas
├── config/           # Settings & environment config
└── utils/            # Shared utilities
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt

cp ../.env.example ../.env
# Edit .env with your credentials

uvicorn main:app --reload
```

Backend runs at: http://localhost:8000  
Interactive API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## Key API Endpoints

| Method | Endpoint | Agent |
|--------|----------|-------|
| POST | `/api/chat` | AI Orchestrator |
| POST | `/api/analyze` | Code Analysis |
| POST | `/api/test/run` | Testing |
| POST | `/api/test/generate` | Testing |
| POST | `/api/recommendations` | Recommendation |
| POST | `/api/documentation` | Documentation |
| POST | `/api/content` | Content |
| POST | `/api/narration` | Narration |
| POST | `/api/reminders` | Reminder |
| GET  | `/api/reminders` | Reminder |
| POST | `/api/submission/check` | Submission |
| POST | `/api/release/check` | Release |
| GET  | `/api/notifications` | Notifications |
| GET  | `/api/analytics` | Analytics |

---

## Environment Variables

See [`.env.example`](.env.example) for all available options.

**AI providers supported:** `openai` | `anthropic` | `watsonx` | `mock`

Set `AI_PROVIDER=mock` during development to run without real API credentials.

---

## Development Notes

- The current frontend (`frontend/`) is a **temporary placeholder** for backend testing.  
  A polished frontend will be provided separately and will replace it entirely.
- All frontend→backend communication is isolated in `frontend/src/services/api.ts`.  
  This decouples the UI from implementation details.
- Never commit `.env`, `*.db`, or credential files.

---

## License

Built for the IBM Bob 2.0 Hackathon.
