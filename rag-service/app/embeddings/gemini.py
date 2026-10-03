"""Google Gemini embedding provider using official google-genai SDK or httpx fallback."""

from typing import List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger


class GeminiEmbeddingProvider:
    def __init__(self, api_key: Optional[str] = None, model: str = "text-embedding-004"):
        self.api_key = api_key or settings.api_key
        self.model = model

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self.api_key:
            return None
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:embedContent?key={self.api_key}"
        payload = {
            "model": f"models/{self.model}",
            "content": {"parts": [{"text": text[:2000]}]},
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    values = data.get("embedding", {}).get("values", [])
                    if values:
                        return values
                else:
                    logger.warning("Gemini embedding error HTTP %s: %s", res.status_code, res.text)
        except Exception as exc:
            logger.warning("Gemini embedding call failed: %s", exc)
        return None
