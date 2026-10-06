"""Query preprocessing and filter extraction for cricket law queries."""

import re
from typing import Any, Dict, List, Optional, Tuple

CRICKET_CONCEPT_MAP = [
    # Bouncers / fast short pitched deliveries
    (
        r"\b(?:bouncer|bouncers|short ball|short balls|short pitched|short-pitched)\b",
        {
            "clause": "41.6",
            "law": 41.0,
            "keywords": ["short pitched", "short-pitched", "fast short pitched delivery"],
        },
    ),
    # Non-striker run out / Mankad
    (
        r"\b(?:mankad|mankading|non[\s-]striker(?:'s)?\s+(?:run\s*out|leaving)|backing\s+up)\b",
        {
            "clause": "38.3",
            "law": 38.0,
            "keywords": ["non-striker leaving", "leaving their ground early"],
        },
    ),
    # LBW
    (
        r"\b(?:lbw|leg\s+before(?:\s+wicket)?)\b",
        {
            "clause": "36.1",
            "law": 36.0,
            "keywords": ["leg before wicket", "out LBW", "striker is out LBW"],
        },
    ),
    # Out / dismissal off a No ball
    (
        r"(?:(?:out|dismiss|dismissed|dismissal|lbw|bowled|caught|stumped|hit\s+wicket).*no\s*ball|no\s*ball.*(?:out|dismiss|dismissed|dismissal|lbw|bowled|caught|stumped|hit\s+wicket))",
        {
            "clause": "21.18",
            "law": 21.0,
            "keywords": ["Out from a No ball", "neither batter shall be out", "not being a No ball", "Out LBW"],
        },
    ),
    # No ball
    (
        r"\b(?:no\s+ball|noball)\b",
        {
            "law": 21.0,
            "keywords": ["No ball"],
        },
    ),


    # Free hit
    (
        r"\b(?:free\s+hit|freehit)\b",
        {
            "clause": "21.19",
            "law": 21.0,
            "keywords": ["Free Hit", "Free Hit delivery"],
        },
    ),
    # Helmet / cap / illegal fielding
    (
        r"\b(?:helmet|cap|clothing|detached\s+equipment|fielding\s+equipment)\b",
        {
            "clause": "28.3",
            "law": 28.0,
            "keywords": ["protective helmet", "Illegal fielding", "ball stopped with clothing"],
        },
    ),
    # Dead ball
    (
        r"\bdead\s+ball\b",
        {
            "clause": "20",
            "law": 20.0,
            "keywords": ["Dead ball", "ball ceases to be in play"],
        },
    ),
    # Wide ball
    (
        r"\b(?:wide|wides)\b",
        {
            "clause": "22",
            "law": 22.0,
            "keywords": ["Wide ball", "Judging a Wide"],
        },
    ),
    # Timed out
    (
        r"\btimed?\s+out\b",
        {
            "clause": "40",
            "law": 40.0,
            "keywords": ["Timed out", "incoming batter"],
        },
    ),
    # Obstructing the field
    (
        r"\b(?:obstructing|obstruct|handled\s+the\s+ball)\b",
        {
            "clause": "37",
            "law": 37.0,
            "keywords": ["Obstructing the field", "wilful obstruction"],
        },
    ),
    # Run out
    (
        r"\brun\s+out\b",
        {
            "clause": "38",
            "law": 38.0,
            "keywords": ["Run out", "wicket put down"],
        },
    ),
    # Stumped
    (
        r"\bstumped\b",
        {
            "clause": "39",
            "law": 39.0,
            "keywords": ["Stumped", "wicket-keeper"],
        },
    ),
    # Caught
    (
        r"\b(?:caught|catch|boundary\s+catch)\b",
        {
            "clause": "33",
            "law": 33.0,
            "keywords": ["Caught", "fair catch", "boundary"],
        },
    ),
    # Bowled
    (
        r"\bbowled\b",
        {
            "clause": "32",
            "law": 32.0,
            "keywords": ["Bowled", "wicket is put down"],
        },
    ),
    # Concussion substitute
    (
        r"\b(?:concussion|head\s+injury)\b",
        {
            "clause": "1.2",
            "law": 1.0,
            "keywords": ["Concussion replacement", "medical representative"],
        },
    ),
    # Impact Player (IPL)
    (
        r"\b(?:impact\s+player|impact\s+sub)\b",
        {
            "clause": "1.2",
            "law": 1.0,
            "keywords": ["Impact Player", "substitute players", "Nomination of players"],
        },
    ),
    # DLS / Duckworth Lewis
    (
        r"\b(?:dls|duckworth|rain\s+rule|par\s+score)\b",
        {
            "clause": "16",
            "law": 16.0,
            "keywords": ["DLS Method", "interrupted match", "target score"],
        },
    ),
]

CRICKET_STOP_WORDS = {
    "what", "when", "does", "happens", "cricket", "rule", "rules", "law", "laws",
    "the", "and", "how", "many", "are", "per", "can", "could", "would", "should",
    "off", "given", "give", "been", "there", "their", "under", "with", "from", "for", "out",
    "ball", "over", "is", "a", "an", "in", "on", "of", "to", "by", "or", "any",
    "which", "who", "whom", "whose", "if", "be", "as", "at", "but",
    "ipl", "wpl", "bbl", "icc", "bcci", "mcc", "test", "odi", "t20", "t20i",
    "match", "matches", "between", "play", "played", "playing", "conditions",
    "permitted", "allowed", "legal", "illegal", "call", "signal",
}



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

    # 5. Concept mapping & synonym expansion
    inferred_clauses = []
    inferred_laws = []
    concept_keywords = []

    for pattern, concept in CRICKET_CONCEPT_MAP:
        if re.search(pattern, q_lower):
            if concept.get("clause"):
                inferred_clauses.append(concept["clause"])
            if concept.get("law"):
                inferred_laws.append(concept["law"])
            concept_keywords.extend(concept.get("keywords", []))

    if not clause_number and inferred_clauses:
        clause_number = inferred_clauses[0]
    if law_number is None and inferred_laws:
        law_number = inferred_laws[0]

    # 6. Extract significant search keywords
    cleaned = re.sub(r"[^\w\s\.]", " ", q_lower)
    words = [w for w in cleaned.split() if len(w) > 2 and w not in CRICKET_STOP_WORDS]

    # Combine extracted words with concept keywords
    all_keywords = list(dict.fromkeys(concept_keywords + words))

    return {
        "originalQuery": query,
        "clauseNumber": clause_number,
        "lawNumber": law_number,
        "inferredClauses": inferred_clauses,
        "inferredLaws": inferred_laws,
        "format": format_type,
        "competition": competition,
        "keywords": all_keywords,
    }
