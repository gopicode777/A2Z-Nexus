# Frontend Replacement Guide

This document is for the team delivering the **final polished frontend**.

The temporary frontend (`frontend/`) exists only for backend testing.
Replace it entirely by dropping your new frontend folder in and pointing it at the same backend APIs.

---

## API Contract — Base URL

```
http://localhost:8000/api
```

Interactive docs: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## API Endpoints

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Backend health check |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects?user_id=` | List all projects for a user |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/{id}` | Get a project by ID |
| PATCH | `/api/projects/{id}` | Update a project |
| DELETE | `/api/projects/{id}` | Delete a project |

**ProjectCreate body:**
```json
{
  "name": "string",
  "description": "string",
  "repository_path": "string",
  "technology": "string",
  "deadline": "YYYY-MM-DD | null",
  "user_id": "string"
}
```

---

### Chat / Orchestrator
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Send a message — AI Orchestrator routes to the right agent(s) |
| GET | `/api/chat/sessions/{session_id}` | Get conversation history |

**ChatRequest body:**
```json
{
  "message": "string",
  "session_id": "string | null",
  "project_id": "string | null",
  "user_id": "string"
}
```

**ChatResponse:**
```json
{
  "session_id": "string",
  "message_id": "string",
  "content": "string (Markdown)",
  "agents_used": ["information", "code_analysis", ...],
  "metadata": {}
}
```

The `agents_used` array tells the frontend which agent(s) handled the request —
you can show this as a badge or tag in the chat UI.

---

### Agent Endpoints (direct)
| Method | Path | Agent |
|--------|------|-------|
| POST | `/api/analyze` | Code Analysis |
| POST | `/api/test/run` | Testing — run existing tests |
| POST | `/api/test/generate` | Testing — generate new tests |
| POST | `/api/recommendations` | Recommendation |
| POST | `/api/documentation` | Documentation (doc_type: readme\|setup\|api\|architecture\|changelog) |
| POST | `/api/content` | Content (content_type: description\|abstract\|presentation\|elevator_pitch\|hackathon_submission\|...) |
| POST | `/api/narration` | Narration (narration_for: demo\|presentation\|feature\|tutorial) |
| POST | `/api/submission/check` | Submission readiness |
| POST | `/api/release/check` | Release readiness |

Most agent endpoints accept:
```json
{ "project_id": "string", "user_id": "string" }
```

---

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/notifications?user_id=` | List notifications |
| GET | `/api/notifications?user_id=&unread_only=true` | Unread only |
| PATCH | `/api/notifications/{id}/read` | Mark as read |

---

### Reminders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reminders?user_id=` | List reminders |
| POST | `/api/reminders` | Create reminder |

---

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics?user_id=` | Get usage analytics |

---

## CORS

The backend allows all origins by default in development.
For production, set `FRONTEND_URL` in `.env` to your frontend domain.

---

## Replacing the frontend

1. Delete or archive `frontend/`
2. Drop your new frontend into `frontend/` (or any folder name)
3. Configure `VITE_API_URL=http://localhost:8000/api` (or equivalent)
4. All API calls must go through a centralized service layer  
   (same pattern as `frontend/src/services/api.ts` in the temporary frontend)
5. No changes to the backend are needed

---

## AI Provider

Set in `.env`:

```env
AI_PROVIDER=openai      # or: anthropic | watsonx | mock
AI_API_KEY=sk-...
AI_MODEL=gpt-4o
```

`mock` mode works offline with no API key — useful for frontend development.

---

## User authentication

The current backend uses a `user_id` string passed in request bodies/query params.
A real authentication layer (JWT, OAuth) can be added later without changing the agent or API contract.
