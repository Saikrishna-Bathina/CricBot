"""Tests for claim-level citation validation."""

import pytest
from app.citations.validator import CitationValidator
from app.generation.schemas import ClaimModel


@pytest.mark.asyncio
async def test_citation_validator_accepts_verified_claims():
    validator = CitationValidator()
    retrieved_chunks = [
        {
            "id": "chunk_law_28_3",
            "title": "Protective helmets belonging to the fielding side",
            "content": "5 penalty runs shall be awarded to the batting side and the ball becomes dead.",
            "clauseNumber": "28.3.2",
            "lawNumber": 28.0,
            "parentLaw": "Law 28 - The Fielder",
        }
    ]

    claims = [
        ClaimModel(
            text="Five penalty runs are awarded to the batting team if the ball strikes the helmet.",
            citationIds=["chunk_law_28_3"],
        )
    ]

    validated_claims, citations, warnings = await validator.validate_answer_citations(claims, retrieved_chunks)

    assert len(validated_claims) == 1
    assert "chunk_law_28_3" in validated_claims[0].citationIds
    assert len(citations) == 1
    assert citations[0].clauseNumber == "28.3.2"


@pytest.mark.asyncio
async def test_citation_validator_rejects_hallucinated_ids():
    validator = CitationValidator()
    retrieved_chunks = [
        {
            "id": "chunk_valid_1",
            "title": "Valid chunk",
            "content": "Valid rule content",
            "clauseNumber": "1.1",
        }
    ]

    claims = [
        ClaimModel(
            text="Unfounded claim citing an invented ID.",
            citationIds=["chunk_hallucinated_999"],
        )
    ]

    validated_claims, citations, warnings = await validator.validate_answer_citations(claims, retrieved_chunks)

    assert len(validated_claims[0].citationIds) == 0  # Stripped!
    assert len(citations) == 0
    assert any("not in the retrieved evidence set" in w for w in warnings)
