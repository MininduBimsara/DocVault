""" docvault-rag — FastAPI entry point """

import os
import pathlib

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routes.health import router as health_router
from app.routes.ingest import router as ingest_router
from app.routes.rag_chat import router as rag_chat_router


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Ensure shared-storage exists ──────────────────────────────────────────
    storage = pathlib.Path(settings.FILE_STORAGE_PATH)
    if not storage.exists():
        storage.mkdir(parents=True, exist_ok=True)
        print(f"[docvault-rag] Created shared storage at: {storage}")
    else:
        print(f"[docvault-rag] Shared storage path OK: {storage}")

    print("")
    print("┌────────────────────────────────────────────────────┐")
    print("│             docvault-rag  ✓  RUNNING               │")
    print("├────────────────────────────────────────────────────┤")
    print(f"│  URL           http://localhost:{settings.PORT}             │")
    print(f"│  Chroma Path   {str(settings.CHROMA_PATH)[-34:]:<34} │")
    print(f"│  File Storage  {str(settings.FILE_STORAGE_PATH)[-34:]:<34} │")
    print("└────────────────────────────────────────────────────┘")
    print("")

    yield  # application is running here

    # ── Shutdown hooks (future use) ───────────────────────────────────────────
    print("[docvault-rag] Shutting down...")


# ── App factory ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="docvault-rag",
    description="RAG pipeline service: embeddings, Chroma, ingestion, retrieval.",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(health_router, prefix="/health", tags=["health"])
app.include_router(ingest_router, prefix="/ingest", tags=["ingest"])
app.include_router(rag_chat_router, prefix="/rag", tags=["rag"])
