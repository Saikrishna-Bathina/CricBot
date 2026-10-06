"""Gemini LLM client with structured JSON parsing and graceful error handling."""

import json
import re
from typing import Any, Dict, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger


class GeminiClient:
    def __init__(self, api_key: Optional[str] = None, model: str = None):
        self.api_key = api_key or settings.api_key
        primary_model = model or settings.LLM_MODEL
        # Candidate models fallback chain
        fallback_candidates = [primary_model, "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash", "gemma-4-31b-it"]
        # Deduplicate while preserving order
        self.models = []
        for m in fallback_candidates:
            if m and m not in self.models:
                self.models.append(m)

    async def generate_json(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """Calls Gemini API with model fallback and parses structured JSON response."""
        if not self.api_key:
            logger.warning("No Gemini API key configured. Bypassing live LLM call.")
            return None

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.1,  # Low temperature for deterministic rule adjudications
                "responseMimeType": "application/json",
            },
        }

        for model in self.models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    res = await client.post(url, json=payload)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            cleaned = re.sub(r"^```(?:json)?\n?", "", raw_text.strip())
                            cleaned = re.sub(r"\n?```$", "", cleaned.strip())
                            return json.loads(cleaned)
                    elif res.status_code == 429:
                        logger.warning("Gemini model %s hit quota (HTTP 429). Trying next fallback model...", model)
                        continue
                    else:
                        logger.warning("Gemini LLM error with %s HTTP %s: %s", model, res.status_code, res.text[:200])
            except Exception as exc:
                logger.warning("Gemini LLM call failed for %s: %s", model, exc)

        return None
