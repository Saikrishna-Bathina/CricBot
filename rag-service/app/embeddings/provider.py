"""Configurable embedding provider orchestrator."""

from typing import List
from app.core.config import settings
from app.embeddings.gemini import GeminiEmbeddingProvider
from app.embeddings.local import generate_local_vector
from app.core.logging import logger


class EmbeddingProvider:
    def __init__(self):
        self.provider_type = settings.EMBEDDING_PROVIDER.lower()
        self.dimensions = settings.EMBEDDING_DIMENSIONS
        self.gemini_provider = GeminiEmbeddingProvider(model=settings.EMBEDDING_MODEL)

    async def get_embedding(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimensions

        if self.provider_type == "gemini" and settings.api_key:
            vector = await self.gemini_provider.get_embedding(text)
            if vector and len(vector) == self.dimensions:
                return vector
            logger.warning("Gemini embedding returned None/mismatched dims; falling back to local deterministic embedding.")

        # Local fallback
        vector = generate_local_vector(text, self.dimensions)
        if len(vector) != self.dimensions:
            raise ValueError(f"Embedding dimension mismatch: expected {self.dimensions}, got {len(vector)}")
        return vector

    async def get_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        results = []
        for text in texts:
            emb = await self.get_embedding(text)
            results.append(emb)
        return results


_default_provider = None


def get_embedding_provider() -> EmbeddingProvider:
    global _default_provider
    if _default_provider is None:
        _default_provider = EmbeddingProvider()
    return _default_provider
