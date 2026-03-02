from pydantic_settings import BaseSettings
from pydantic import field_validator
import os, pathlib


class Settings(BaseSettings):
    PORT: int = 8000
    CHROMA_PATH: str = "./chroma"
    EMBEDDINGS_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    INTERNAL_RAG_KEY: str = ""
    FILE_STORAGE_PATH: str = "../shared-storage"

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
