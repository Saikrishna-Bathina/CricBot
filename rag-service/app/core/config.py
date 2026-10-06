"""Application settings and configuration management."""

import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SERVER_ENV = BASE_DIR.parent / "server" / ".env"
LOCAL_ENV = BASE_DIR / ".env"

env_file = str(LOCAL_ENV if LOCAL_ENV.exists() else SERVER_ENV)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=env_file,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PORT: int = 8000
    HOST: str = "127.0.0.1"

    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017/cricket_rag"
    MONGODB_DB_NAME: str = "test"

    # LLM Settings
    GEMINI_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None  # fallback from server/.env
    LLM_MODEL: str = "gemini-3.8-flash"

    # Embedding Settings
    EMBEDDING_PROVIDER: str = "local"
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSIONS: int = 768
    VECTOR_INDEX_NAME: str = "cricket_vector_index"

    # Logging & Environment
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "*"

    @property
    def api_key(self) -> str:
        """Returns the configured Gemini API key."""
        return self.GEMINI_API_KEY or self.LLM_API_KEY or ""


settings = Settings()
