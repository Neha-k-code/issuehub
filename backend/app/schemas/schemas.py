from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, field_validator


# ─── Error envelope ──────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


# ─── Auth ────────────────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Users ───────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserMini(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


# ─── Projects ─────────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    name: str
    key: str
    description: Optional[str] = None

    @field_validator("key")
    @classmethod
    def key_valid(cls, v: str) -> str:
        v = v.strip().upper()
        if not v.isalnum():
            raise ValueError("Key must be alphanumeric")
        if len(v) < 2 or len(v) > 10:
            raise ValueError("Key must be 2–10 characters")
        return v

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name cannot be empty")
        return v.strip()


class ProjectOut(BaseModel):
    id: int
    name: str
    key: str
    description: Optional[str]
    created_at: datetime
    member_count: int = 0
    current_user_role: Optional[str] = None

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    email: EmailStr
    role: str

    @field_validator("role")
    @classmethod
    def role_valid(cls, v: str) -> str:
        if v not in ("member", "maintainer"):
            raise ValueError("Role must be 'member' or 'maintainer'")
        return v


class MemberOut(BaseModel):
    user: UserMini
    role: str

    model_config = {"from_attributes": True}


# ─── Issues ──────────────────────────────────────────────────────────────────

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    assignee_id: Optional[int] = None

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v: str) -> str:
        if v not in ("low", "medium", "high", "critical"):
            raise ValueError("Priority must be low, medium, high, or critical")
        return v


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[int] = None

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("open", "in_progress", "resolved", "closed"):
            raise ValueError("Invalid status")
        return v

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ("low", "medium", "high", "critical"):
            raise ValueError("Invalid priority")
        return v


class IssueOut(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    reporter: UserMini
    assignee: Optional[UserMini]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IssueListOut(BaseModel):
    items: List[IssueOut]
    total: int
    page: int
    limit: int
    pages: int


# ─── Comments ────────────────────────────────────────────────────────────────

class CommentCreate(BaseModel):
    body: str

    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Comment body cannot be empty")
        return v.strip()


class CommentOut(BaseModel):
    id: int
    issue_id: int
    author: UserMini
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}
