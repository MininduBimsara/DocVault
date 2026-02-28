"""User model (Pydantic schemas for validation + serialisation)."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class PlanEnum(str, Enum):
    FREE = "FREE"
    PRO = "PRO"


# ---------- Request schemas ----------


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Response schemas ----------


class UserResponse(BaseModel):
    """Safe user object — never includes password."""
    id: str
    email: str
    plan: PlanEnum
    createdAt: datetime


# ---------- Internal helpers ----------


def user_doc_to_response(doc: dict) -> UserResponse:
    """Convert a raw Mongo user document to a UserResponse."""
    return UserResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        plan=doc.get("plan", PlanEnum.FREE),
        createdAt=doc["createdAt"],
    )
