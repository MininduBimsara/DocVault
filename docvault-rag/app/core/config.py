from pydantic_settings import BaseSettings
from pydantic import field_validator
import pathlib


class Settings(BaseSettings):
    # ── Server ────────────────────────────────────────────────────────────────
    PORT: int = 8000

    # ── Internal auth ─────────────────────────────────────────────────────────
    INTERNAL_RAG_KEY: str = ""

    # ── Storage paths ─────────────────────────────────────────────────────────
    FILE_STORAGE_PATH: str = "../shared-storage"
    CHROMA_PATH: str = "./chroma"

    # ── Gemini chat / Hugging Face embeddings ────────────────────────────────
    GEMINI_API_KEY: str = ""                           # Required at runtime
    HF_EMBEDDINGS_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    GEMINI_CHAT_MODEL: str = "models/gemini-1.5-flash"
    EMBED_BATCH_SIZE: int = 25                         # chunks per embedding batch
    EMBED_BATCH_DELAY_MS: int = 200                    # ms delay between batches
    RETRIEVAL_TOP_K: int = 5

    # ── PDF processing ────────────────────────────────────────────────────────
    MIN_PAGE_CHARS: int = 50                           # skip pages below this

    # ── Express API (webhook target) ──────────────────────────────────────────
    API_SERVICE_URL: str = "http://localhost:4000"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("FILE_STORAGE_PATH", mode="before")
    @classmethod
    def resolve_storage_path(cls, v: str) -> str:
        """Resolve relative path to absolute from the project root."""
        base = pathlib.Path(__file__).resolve().parent.parent.parent  # repo root
        return str((base / v).resolve())

    @field_validator("CHROMA_PATH", mode="before")
    @classmethod
    def resolve_chroma_path(cls, v: str) -> str:
        base = pathlib.Path(__file__).resolve().parent.parent.parent
        return str((base / "docvault-rag" / v).resolve())


settings = Settings()
