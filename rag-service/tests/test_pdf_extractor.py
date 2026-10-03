"""Tests for PyMuPDF extraction on synthetic cricket PDF fixture."""

from pathlib import Path
import pytest
from app.ingestion.pdf_extractor import PDFExtractor, calculate_pdf_sha256

FIXTURE_PATH = Path(__file__).resolve().parent.parent.parent / "knowledge-base" / "fixtures" / "synthetic_law_fixture.pdf"


def test_calculate_pdf_sha256():
    sha = calculate_pdf_sha256(FIXTURE_PATH)
    assert isinstance(sha, str)
    assert len(sha) == 64


def test_pdf_extraction_page_count_and_text():
    extractor = PDFExtractor()
    result = extractor.extract_document(FIXTURE_PATH)

    assert result["filename"] == "synthetic_law_fixture.pdf"
    assert result["pageCount"] == 2
    assert len(result["pages"]) == 2

    page1 = result["pages"][0]
    assert page1.page_index == 1
    assert "LAW 28 - THE FIELDER" in page1.raw_text
    assert "28.3" in page1.raw_text
    assert page1.printed_page == 1

    page2 = result["pages"][1]
    assert page2.page_index == 2
    assert "LAW 41 - UNFAIR PLAY" in page2.raw_text
    assert "41.16" in page2.raw_text
    assert page2.printed_page == 2
