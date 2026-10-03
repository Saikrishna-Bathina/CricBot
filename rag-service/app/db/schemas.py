"""Pydantic schemas matching the MongoDB/Mongoose models."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    sourceUrl: Optional[str] = None
    originalFilename: Optional[str] = None
    language: str = "en"
    pageCount: Optional[int] = None
    extractionNotes: Optional[str] = None
    reviewedBy: Optional[str] = None
    effectiveStartDate: Optional[str] = None
    effectiveEndDate: Optional[str] = None
    supersedes: Optional[str] = None


class DocumentModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    edition: str
    effectiveDate: str
    format: str = "All"
    competition: str = "All"
    authority: str = "MCC"
    status: str = "pending"
    chunkCount: int = 0
    checksum: Optional[str] = None
    metadata: DocumentMetadata = Field(default_factory=DocumentMetadata)
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True


class ChunkMetadata(BaseModel):
    pageStart: Optional[int] = None
    pageEnd: Optional[int] = None
    printedPageStart: Optional[int] = None
    printedPageEnd: Optional[int] = None
    contentHash: Optional[str] = None
    confidence: float = 1.0


class DocumentChunkModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    documentId: str
    lawNumber: Optional[float] = None
    clauseNumber: str
    title: str
    content: str
    tokenCount: int = 0
    embedding: Optional[List[float]] = None
    embeddingModel: str = "text-embedding-004"
    embeddingDimensions: int = 768
    chunkIndex: int = 0
    parentLaw: Optional[str] = None
    effectiveDate: Optional[str] = None
    format: str = "All"
    competition: str = "All"
    tags: List[str] = Field(default_factory=list)
    metadata: ChunkMetadata = Field(default_factory=ChunkMetadata)
    createdAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
