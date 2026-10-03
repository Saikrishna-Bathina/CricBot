"""Citation and Claim schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class ClaimModel(BaseModel):
    text: str
    citationIds: list[str] = Field(default_factory=list)


class CitationDetail(BaseModel):
    chunkId: str
    lawNumber: Optional[float] = None
    clauseNumber: str
    title: str
    content: str
    parentLaw: Optional[str] = None
    documentId: Optional[str] = None
    printedPage: Optional[int] = None
    verified: bool = True
