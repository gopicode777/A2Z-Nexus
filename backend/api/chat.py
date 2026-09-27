"""
Chat router — powered by the AI Orchestrator.

POST /api/chat
GET  /api/chat/sessions/{session_id}
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from database.engine import get_db
from database.models import ChatMessage, ChatSession, Project, User
from models.schemas import ChatRequest, ChatResponse
from services.ai_service import ai_provider

router = APIRouter(prefix="/chat", tags=["chat"])


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    from orchestrator.orchestrator import Orchestrator

    # The owner is always the authenticated user — any user_id in the body is ignored.
    user_id = current_user.id

    # Resolve or create session (a session belonging to another user cannot be reused)
    session_id = payload.session_id
    if session_id:
        result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
        session = result.scalar_one_or_none()
        if session is None or session.user_id != user_id:
            session_id = None

    if not session_id:
        session = ChatSession(
            id=str(uuid.uuid4()),
            user_id=user_id,
            project_id=payload.project_id,
            created_at=_now(),
        )
        db.add(session)
        await db.flush()
        session_id = session.id

    # Load conversation history for context
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
        .limit(20)
    )
    history = [
        {"role": m.role, "content": m.content}
        for m in history_result.scalars().all()
        if m.role in ("user", "assistant")
    ]

    # Load project context if project_id provided (and owned by this user)
    project: dict | None = None
    if payload.project_id:
        proj_result = await db.execute(
            select(Project).where(Project.id == payload.project_id, Project.user_id == user_id)
        )
        proj_obj = proj_result.scalar_one_or_none()
        if proj_obj:
            project = {
                "id": proj_obj.id,
                "name": proj_obj.name,
                "description": proj_obj.description,
                "repository_path": proj_obj.repository_path,
                "technology": proj_obj.technology,
            }

    # Store user message
    user_msg = ChatMessage(
        id=str(uuid.uuid4()),
        session_id=session_id,
        role="user",
        content=payload.message,
        created_at=_now(),
    )
    db.add(user_msg)

    # Run the orchestrator
    orchestrator = Orchestrator(ai_provider())
    orch_result = await orchestrator.process(
        message=payload.message,
        project=project,
        conversation_history=history,
    )

    # Store assistant response
    assistant_msg_id = str(uuid.uuid4())
    assistant_msg = ChatMessage(
        id=assistant_msg_id,
        session_id=session_id,
        role="assistant",
        content=orch_result.content,
        agent_used=",".join(orch_result.agents_used),
        created_at=_now(),
    )
    db.add(assistant_msg)
    await db.commit()

    return ChatResponse(
        session_id=session_id,
        message_id=assistant_msg_id,
        content=orch_result.content,
        agents_used=orch_result.agents_used,
        metadata={
            "intent": orch_result.intent,
            **orch_result.metadata,
        },
    )


@router.get("/sessions/{session_id}")
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Session not found.")

    msgs_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = msgs_result.scalars().all()
    return {
        "session_id": session_id,
        "project_id": session.project_id,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "agent_used": m.agent_used,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }
