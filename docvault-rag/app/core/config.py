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

    # ── PostgreSQL + pgvector ─────────────────────────────────────────────────
    POSTGRES_URL: str = "postgresql://docvault:docvault_password@localhost:5432/docvault"

    # ── Gemini chat / Hugging Face embeddings ────────────────────────────────
    GEMINI_API_KEY: str = ""                           # Required at runtime
    HF_EMBEDDINGS_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    GEMINI_CHAT_MODEL: str = "gemini-2.5-flash"
    EMBEDDING_DEVICE: str = "cpu"                      # cpu or cuda
    EMBED_BATCH_SIZE: int = 25                         # chunks per embedding batch
    EMBED_BATCH_DELAY_MS: int = 200                    # ms delay between batches
    RETRIEVAL_TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.10                 # cosine similarity threshold (1 - distance)

    # ── Text chunking ────────────────────────────────────────────────────────
    CHUNK_SIZE: int = 500                              # target tokens per chunk
    CHUNK_OVERLAP: int = 50                            # token overlap between chunks

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


settings = Settings()
