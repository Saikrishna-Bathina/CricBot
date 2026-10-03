"""Answer generation endpoint with citations and claim validation."""

from typing import Optional
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.generation.answer_service import get_answer_service
from app.generation.schemas import AnswerResponse

router = APIRouter(tags=["Answer"])


class AnswerRequest(BaseModel):
    query: str
    format: Optional[str] = "All"
    competition: Optional[str] = "All"


@router.post("/answer", response_model=AnswerResponse, status_code=status.HTTP_200_OK)
async def generate_answer(req: AnswerRequest):
    service = get_answer_service()
    return await service.answer_question(
        query=req.query,
        format_filter=req.format,
        competition_filter=req.competition,
    )
