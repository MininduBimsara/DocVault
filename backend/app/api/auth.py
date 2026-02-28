"""Auth endpoints – register / login / logout / me."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response, status
from passlib.context import CryptContext

from app.core.auth import create_access_token, get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.user import (
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    user_doc_to_response,
)

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- POST /auth/register ----------


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(body: UserRegisterRequest, response: Response):
    db = get_db()

    # Check duplicate email
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user_doc = {
        "email": body.email,
        "password": pwd_ctx.hash(body.password),
        "plan": "FREE",
        "createdAt": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    # Issue token + set cookie so the user is logged in immediately after registration
    token = create_access_token(str(result.inserted_id), body.email)
    _set_auth_cookie(response, token)

    return user_doc_to_response(user_doc)


# ---------- POST /auth/login ----------


@router.post("/login", response_model=UserResponse)
async def login(body: UserLoginRequest, response: Response):
    db = get_db()

    user_doc = await db.users.find_one({"email": body.email})
    if not user_doc or not pwd_ctx.verify(body.password, user_doc["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(str(user_doc["_id"]), user_doc["email"])
    _set_auth_cookie(response, token)

    return user_doc_to_response(user_doc)


# ---------- POST /auth/logout ----------


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        path="/",
    )
    return {"ok": True}


# ---------- GET /auth/me ----------


@router.get("/me", response_model=UserResponse)
async def me(user: UserResponse = Depends(get_current_user)):
    return user


# ---------- helpers ----------


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.COOKIE_SECURE,
        max_age=settings.JWT_EXPIRES_DAYS * 86400,
        path="/",
    )
