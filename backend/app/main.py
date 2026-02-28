"""DocVault Chat – FastAPI application entry point."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.health import router as health_router
from app.api.protected import router as protected_router
from app.core.config import settings
from app.core.database import close_db, connect_db, ensure_indexes
from app.core.logging import setup_logging

# ---------------------------------------------------------------------------
# Bootstrap logging
# ---------------------------------------------------------------------------
setup_logging(level=logging.DEBUG if settings.DEBUG else logging.INFO)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Create FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(protected_router)

# ---------------------------------------------------------------------------
# Startup / shutdown hooks
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def on_startup() -> None:
    logger.info("DocVault Chat API starting up …")
    await connect_db()
    await ensure_indexes()


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("DocVault Chat API shutting down …")
    await close_db()

