"""Tests for query preprocessing, RRF fusion, and authority reranking."""

import pytest
from app.retrieval.filters import extract_query_intent
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.reranker import rerank_by_authority_and_context


def test_extract_query_intent_exact_clause():
    intent = extract_query_intent("What is the penalty under Law 28.3.2 in a T20 match?")
    assert intent["clauseNumber"] == "28.3.2"
    assert intent["lawNumber"] == 28.0
    assert intent["format"] == "T20I"


def test_extract_query_intent_ipl_competition():
    intent = extract_query_intent("Can the bowling team take an Impact Player review in IPL?")
    assert intent["competition"] == "IPL"
    assert intent["format"] == "T20"


def test_reciprocal_rank_fusion():
    list1 = [
        {"_id": "c1", "title": "Helmet struck"},
        {"_id": "c2", "title": "Dead ball"},
    ]
    list2 = [
        {"_id": "c2", "title": "Dead ball"},
        {"_id": "c3", "title": "Wide ball"},
    ]

    fused = reciprocal_rank_fusion([list1, list2], k=60, top_n=3)
    assert len(fused) == 3
    # c2 appears in both lists, so its merged RRF score should rank highest
    assert fused[0]["_id"] == "c2"


def test_rerank_by_authority_competition_precedence():
    candidates = [
        {"_id": "gen_1", "clauseNumber": "21.1", "format": "All", "competition": "All", "rrfScore": 0.05},
        {"_id": "ipl_1", "clauseNumber": "21.19", "format": "T20", "competition": "IPL", "rrfScore": 0.048},
    ]

    reranked = rerank_by_authority_and_context(
        candidates,
        requested_format="T20",
        requested_competition="IPL",
        target_clause="21.19",
    )

    # The IPL specific clause with exact target match should rank #1
    assert reranked[0]["_id"] == "ipl_1"
