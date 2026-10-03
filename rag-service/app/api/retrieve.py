"""Retrieval-only endpoint allowing inspection of retrieved candidates before answer generation."""

from typing import Any, Dict, Optional
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.retrieval.retriever import get_hybrid_retriever

router = APIRouter(tags=["Retrieval"])


class RetrievalRequest(BaseModel):
    query: str
    format: Optional[str] = "All"
    competition: Optional[str] = "All"
    limit: Optional[int] = 5


@router.post("/retrieve", status_code=status.HTTP_200_OK)
async def retrieve_candidates(req: RetrievalRequest):
    retriever = get_hybrid_retriever()
    res = await retriever.retrieve(
        query=req.query,
        format_filter=req.format,
        competition_filter=req.competition,
        limit=req.limit or 5,
    )
    return res
