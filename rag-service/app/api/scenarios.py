"""Scenario analysis endpoint for match incident rulings."""

from typing import Optional
from fastapi import APIRouter, status
from pydantic import BaseModel
from app.generation.answer_service import get_answer_service
from app.generation.schemas import ScenarioAnalysisResponse

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


class ScenarioRequest(BaseModel):
    scenario: str
    format: Optional[str] = "All"
    competition: Optional[str] = "All"


@router.post("/analyze", response_model=ScenarioAnalysisResponse, status_code=status.HTTP_200_OK)
async def analyze_scenario(req: ScenarioRequest):
    service = get_answer_service()
    return await service.analyze_scenario(
        scenario_description=req.scenario,
        format_filter=req.format,
        competition_filter=req.competition,
    )
