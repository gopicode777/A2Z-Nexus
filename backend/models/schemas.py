"""
Shared Pydantic schemas used across multiple agents / routers.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Generic wrappers
# ---------------------------------------------------------------------------
class SuccessResponse(BaseModel):
    success: bool = True
    message: str = ""
    data: Any = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: str = ""


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Project schemas
# ---------------------------------------------------------------------------
class ProjectCreate(BaseModel):
    name: str
    description: str = ""
    repository_path: str = ""
    technology: str = ""
    deadline: str | None = None
    user_id: str | None = None  # optional — can also be passed as query param


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    repository_path: str | None = None
    technology: str | None = None
    status: str | None = None
    deadline: str | None = None


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str
    repository_path: str
    technology: str
    status: str
    health: str
    test_status: str
    open_issues: int
    deadline: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Chat schemas
# ---------------------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    project_id: str | None = None
    user_id: str = "default-user"


class ChatResponse(BaseModel):
    session_id: str
    message_id: str
    content: str
    agents_used: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Notification schemas
# ---------------------------------------------------------------------------
class NotificationResponse(BaseModel):
    id: str
    user_id: str
    project_id: str | None
    category: str
    title: str
    message: str
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Reminder schemas
# ---------------------------------------------------------------------------
class ReminderCreate(BaseModel):
    title: str
    description: str = ""
    due_date: str | None = None
    project_id: str | None = None
    user_id: str = "default-user"


class ReminderResponse(BaseModel):
    id: str
    user_id: str
    project_id: str | None
    title: str
    description: str
    due_date: str | None
    calendar_event_id: str | None
    confirmed: bool
    completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Analytics schemas
# ---------------------------------------------------------------------------
class AnalyticsResponse(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    tests_run: int
    tests_passed: int
    tests_failed: int
    recommendations_generated: int
    reminders_total: int
    agent_activity: dict[str, int] = Field(default_factory=dict)
