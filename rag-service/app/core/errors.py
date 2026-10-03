"""Custom exceptions and HTTP error handling for the RAG service."""

from fastapi import HTTPException, status


class CricBotError(Exception):
    """Base exception for CricBot RAG errors."""
    def __init__(self, message: str, details: dict = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}


class DocumentNotFoundError(CricBotError):
    """Raised when a cited or requested document is not found."""
    pass


class IngestionError(CricBotError):
    """Raised when a PDF ingestion fails validation or extraction."""
    pass


class RetrievalError(CricBotError):
    """Raised when vector or hybrid retrieval fails."""
    pass


class CitationValidationError(CricBotError):
    """Raised when an answer claim fails verifiable citation checks."""
    pass
