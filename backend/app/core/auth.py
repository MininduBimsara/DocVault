"""Auth dependency – extracts and validates the JWT from the HttpOnly cookie."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from fastapi import HTTPException, Request, status

from app.core.config import settings
from app.core.database import get_db
from app.models.user import UserResponse, user_doc_to_response


# ---------- JWT helpers ----------

_ALGORITHM = "HS256"


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT with userId + email."""
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRES_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify JWT. Raises on invalid / expired."""
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


# ---------- FastAPI dependency ----------


async def get_current_user(request: Request) -> UserResponse:
    """Read the JWT cookie, validate it, load the user from DB, and return a safe user object."""
    token = request.cookies.get(settings.COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    db = get_db()
    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user_doc_to_response(user_doc)
