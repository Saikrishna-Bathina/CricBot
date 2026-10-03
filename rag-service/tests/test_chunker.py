"""Tests for law-aware parsing and chunking on extracted pages."""

from pathlib import Path
import pytest
from app.ingestion.pdf_extractor import PDFExtractor
from app.ingestion.law_parser import parse_law_text
from app.ingestion.chunker import create_chunks_from_clauses

FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent / "knowledge-base" / "fixtures" / "synthetic_law_fixture.pdf"


def test_parse_law_text_identifies_laws_and_clauses():
    extractor = PDFExtractor()
    extracted = extractor.extract_document(FIXTURE_PATH)
    clauses = parse_law_text(extracted["pages"])

    assert len(clauses) >= 2

    clause_nums = [c.clause_number for c in clauses]
    assert any("28.3" in num or "28.1" in num for num in clause_nums)
    assert any("41.16" in num for num in clause_nums)

    # Verify Law 28 clause metadata
    law28_clause = next(c for c in clauses if "28" in c.clause_number)
    assert law28_clause.law_number == 28.0
    assert "Law 28" in law28_clause.parent_law


def test_create_chunks_subdivides_subclauses():
    extractor = PDFExtractor()
    extracted = extractor.extract_document(FIXTURE_PATH)
    clauses = parse_law_text(extracted["pages"])

    chunks = create_chunks_from_clauses(
        clauses,
        document_id="mock_doc_123",
        format_type="All",
        competition_type="All",
    )

    assert len(chunks) >= 3

    # Check for subclause granularity (28.3.1 and 28.3.2)
    subclauses = [c["clauseNumber"] for c in chunks]
    assert "28.3.1" in subclauses
    assert "28.3.2" in subclauses

    helmet_chunk = next(c for c in chunks if c["clauseNumber"] == "28.3.2")
    assert "penalty runs" in helmet_chunk["tags"]
    assert "dead ball" in helmet_chunk["tags"]
    assert helmet_chunk["metadata"]["contentHash"] is not None
