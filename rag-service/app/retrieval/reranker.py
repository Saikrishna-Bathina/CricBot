"""Rule Authority and Version Resolution Reranker."""

from typing import Any, Dict, List, Optional


def rerank_by_authority_and_context(
    candidates: List[Dict[str, Any]],
    requested_format: str = "All",
    requested_competition: str = "All",
    target_clause: Optional[str] = None,
    target_law: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Reranks candidate chunks by applying cricket governing body authority rules."""
    scored_candidates = []

    for item in candidates:
        base_score = item.get("rrfScore", 0.0)
        c_format = item.get("format", "All")
        c_comp = item.get("competition", "All")
        clause_num = str(item.get("clauseNumber", ""))
        law_num = item.get("lawNumber")

        multiplier = 1.0

        # Exact clause match boost
        if target_clause and clause_num.startswith(target_clause):
            multiplier += 0.5
        elif target_law is not None and law_num == target_law:
            multiplier += 0.3

        # Authority hierarchy: Competition / Format specific playing conditions override general rules
        if requested_competition != "All" and c_comp == requested_competition:
            multiplier += 0.4
        elif requested_format != "All" and c_format == requested_format:
            multiplier += 0.3
        elif c_format == "All" or c_comp == "All":
            multiplier += 0.1

        final_score = base_score * multiplier
        item_copy = dict(item)
        item_copy["authorityScore"] = round(final_score, 6)
        scored_candidates.append(item_copy)

    scored_candidates.sort(key=lambda x: x["authorityScore"], reverse=True)
    return scored_candidates
