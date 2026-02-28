"""Protected routes – test endpoints behind auth."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import UserResponse

router = APIRouter(prefix="/protected", tags=["protected"])


@router.get("/ping")
async def ping(user: UserResponse = Depends(get_current_user)):
    return {"ok": True, "user": {"id": user.id, "email": user.email}}
