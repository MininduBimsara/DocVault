"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# Load .env file from the backend root (one level up from app/)
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_env_path)


def _get_env(key: str, default: str = "") -> str:
    return os.getenv(key, default)


@dataclass(frozen=True)
class Settings:
    """Immutable application settings sourced from environment variables."""

    # --- Server ---
    APP_NAME: str = "DocVault Chat API"
    DEBUG: bool = field(default_factory=lambda: _get_env("DEBUG", "false").lower() == "true")

    # --- MongoDB ---
    MONGODB_URI: str = field(default_factory=lambda: _get_env("MONGODB_URI", "mongodb://localhost:27017"))
    MONGODB_DB_NAME: str = field(default_factory=lambda: _get_env("MONGODB_DB_NAME", "docvault"))

    # --- Auth ---
    JWT_SECRET: str = field(default_factory=lambda: _get_env("JWT_SECRET", "change-me-in-production"))
    JWT_EXPIRES_DAYS: int = field(default_factory=lambda: int(_get_env("JWT_EXPIRES_DAYS", "7")))
    COOKIE_NAME: str = field(default_factory=lambda: _get_env("COOKIE_NAME", "docvault_token"))
    COOKIE_SECURE: bool = field(default_factory=lambda: _get_env("COOKIE_SECURE", "false").lower() == "true")

    # --- Frontend ---
    FRONTEND_ORIGIN: str = field(default_factory=lambda: _get_env("FRONTEND_ORIGIN", "http://localhost:3000"))

    # --- LLM (placeholder) ---
    LLM_PROVIDER: str = field(default_factory=lambda: _get_env("LLM_PROVIDER", "openai"))
    LLM_API_KEY: str = field(default_factory=lambda: _get_env("LLM_API_KEY", ""))

    # --- Vector store (placeholder) ---
    CHROMA_PATH: str = field(default_factory=lambda: _get_env("CHROMA_PATH", "./data/chroma"))

    # --- File storage (placeholder) ---
    FILE_STORAGE_PATH: str = field(default_factory=lambda: _get_env("FILE_STORAGE_PATH", "./data/uploads"))

    # --- CORS ---
    CORS_ORIGINS: list[str] = field(
        default_factory=lambda: [
            o.strip()
            for o in _get_env("CORS_ORIGINS", "http://localhost:3000").split(",")
            if o.strip()
        ]
    )


# Singleton used throughout the app
settings = Settings()
