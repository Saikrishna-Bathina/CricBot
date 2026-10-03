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
        self.model = model or settings.LLM_MODEL

    async def generate_json(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        """Calls Gemini API and parses the JSON response."""
        if not self.api_key:
            logger.warning("No Gemini API key configured. Bypassing live LLM call.")
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
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

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        # Clean code block backticks if present
                        cleaned = re.sub(r"^```(?:json)?\n?", "", raw_text.strip())
                        cleaned = re.sub(r"\n?```$", "", cleaned.strip())
                        return json.loads(cleaned)
                else:
                    logger.warning("Gemini LLM error HTTP %s: %s", res.status_code, res.text)
        except Exception as exc:
            logger.warning("Gemini LLM call failed: %s", exc)

        return None
