"""
Reminders router.

POST /api/reminders
GET  /api/reminders   ?user_id=
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_user
from database.engine import get_db
from database.models import Reminder, User
from models.schemas import ReminderCreate, ReminderResponse

router = APIRouter(prefix="/reminders", tags=["reminders"])


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@router.post("", response_model=ReminderResponse, status_code=201)
async def create_reminder(
    payload: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReminderResponse:
    reminder = Reminder(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        project_id=payload.project_id,
        title=payload.title,
        description=payload.description or "",
        due_date=payload.due_date,
        created_at=_now(),
    )
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return ReminderResponse.model_validate(reminder)


@router.get("", response_model=list[ReminderResponse])
async def list_reminders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ReminderResponse]:
    result = await db.execute(
        select(Reminder)
        .where(Reminder.user_id == current_user.id)
        .order_by(Reminder.created_at.desc())
    )
    reminders = result.scalars().all()
    return [ReminderResponse.model_validate(r) for r in reminders]
