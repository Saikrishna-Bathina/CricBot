"""Health and readiness check endpoints."""

from fastapi import APIRouter, status
from app.db.mongo import client
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health", status_code=status.HTTP_200_OK)
async def get_health():
    """Liveness probe: verifies service is running."""
    return {
        "status": "healthy",
        "service": "cricbot-rag-service",
        "version": "1.0.0",
        "llmModel": settings.LLM_MODEL,
        "embeddingModel": settings.EMBEDDING_MODEL,
    }


@router.get("/ready", status_code=status.HTTP_200_OK)
async def get_ready():
    """Readiness probe: verifies MongoDB connection."""
    db_connected = False
    if client:
        try:
            await client.admin.command("ping")
            db_connected = True
        except Exception:
            db_connected = False

    return {
        "status": "ready" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
        "environment": settings.ENVIRONMENT,
    }
