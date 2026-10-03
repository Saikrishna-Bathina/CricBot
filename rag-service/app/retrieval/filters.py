"""Query preprocessing and filter extraction for cricket law queries."""

import re
from typing import Any, Dict, List, Optional, Tuple


def extract_query_intent(query: str, default_format: str = "All") -> Dict[str, Any]:
    """Analyzes a natural language query to extract law references, format, and search terms."""
    q_lower = query.lower()

    # 1. Exact clause numbers: e.g. "28.3.2", "41.16", "21.19"
    clause_match = re.search(r"\b(\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\b", query)
    clause_number = clause_match.group(1) if clause_match else None

    # 2. Law numbers: e.g. "Law 28", "Law 41", "Rule 16"
    law_match = re.search(r"\b(?:law|rule)\s+(\d{1,2})\b", query, re.IGNORECASE)
    law_number = float(law_match.group(1)) if law_match else None

    if clause_number and law_number is None:
        try:
            law_number = float(clause_number.split(".")[0])
        except (ValueError, IndexError):
            pass

    # 3. Format detection
    format_type = default_format
    if "test" in q_lower or "test match" in q_lower:
        format_type = "Test"
    elif "t20" in q_lower or "twenty20" in q_lower or "t20i" in q_lower:
        format_type = "T20I"
    elif "odi" in q_lower or "one day" in q_lower or "50 over" in q_lower:
        format_type = "ODI"

    # 4. Competition detection
    competition = "All"
    if "ipl" in q_lower or "indian premier league" in q_lower:
        competition = "IPL"
        if format_type == "All":
            format_type = "T20"
    elif "wpl" in q_lower or "women's premier league" in q_lower:
        competition = "WPL"
    elif "bbl" in q_lower or "big bash" in q_lower:
        competition = "BBL"
    elif "international" in q_lower or format_type in ["Test", "ODI", "T20I"]:
        competition = "International"

    # 5. Extract significant search keywords
    cleaned = re.sub(r"[^\w\s\.]", " ", q_lower)
    words = [w for w in cleaned.split() if len(w) > 2 and w not in ["what", "when", "does", "happens", "cricket", "rule", "law", "the", "and"]]

    return {
        "originalQuery": query,
        "clauseNumber": clause_number,
        "lawNumber": law_number,
        "format": format_type,
        "competition": competition,
        "keywords": words,
    }
