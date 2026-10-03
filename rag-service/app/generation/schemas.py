"""Pydantic schemas for evidence-grounded answer generation and scenario analysis."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


from app.citations.schemas import ClaimModel, CitationDetail


class AnswerResponse(BaseModel):
    status: str = "answered"  # answered, needs_clarification, insufficient_evidence, conflicting_evidence
    answer: str
    claims: List[ClaimModel] = Field(default_factory=list)
    citations: List[CitationDetail] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    clarifyingQuestions: List[str] = Field(default_factory=list)
    diagnostics: Dict[str, Any] = Field(default_factory=dict)


class ScenarioAnalysisResponse(BaseModel):
    status: str = "analyzed"
    factsIdentified: List[str] = Field(default_factory=list)
    missingFacts: List[str] = Field(default_factory=list)
    governingAuthority: str = "MCC Laws / ICC Playing Conditions"
    applicableClauses: List[str] = Field(default_factory=list)
    ruling: str
    umpireAction: str
    conditionalOutcomes: List[str] = Field(default_factory=list)
    citations: List[CitationDetail] = Field(default_factory=list)
    diagnostics: Dict[str, Any] = Field(default_factory=dict)
