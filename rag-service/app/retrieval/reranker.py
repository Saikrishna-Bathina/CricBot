"""Rule Authority and Version Resolution Reranker."""

from typing import Any, Dict, List, Optional


def rerank_by_authority_and_context(
    candidates: List[Dict[str, Any]],
    requested_format: str = "All",
    requested_competition: str = "All",
    target_clause: Optional[str] = None,
    target_law: Optional[float] = None,
    target_clauses: Optional[List[str]] = None,
    keywords: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Reranks candidate chunks by applying cricket governing body authority rules and keyword relevance."""
    scored_candidates = []

    clean_keywords = [k.lower() for k in (keywords or []) if len(k) > 2]
    all_targets = [tc for tc in (target_clauses or []) if tc]
    if target_clause and target_clause not in all_targets:
        all_targets.append(target_clause)

    for item in candidates:
        base_score = item.get("rrfScore", 0.0)
        c_format = item.get("format", "All")
        c_comp = item.get("competition", "All")
        clause_num = str(item.get("clauseNumber", ""))
        law_num = item.get("lawNumber")
        content_lower = (item.get("content") or item.get("text") or "").lower()
        title_lower = (item.get("title") or item.get("lawTitle") or "").lower()

        multiplier = 1.0

        # Exact clause match boost for all target clauses
        if any(clause_num.startswith(tc) for tc in all_targets):
            multiplier += 0.5
        elif target_law is not None and law_num == target_law:
            multiplier += 0.3


        # Authority hierarchy: Competition / Format specific playing conditions override general rules
        if requested_competition != "All" and c_comp == requested_competition:
            multiplier += 0.5
        elif requested_format != "All" and c_format == requested_format:
            multiplier += 0.3
        elif c_format == "All" or c_comp == "All":
            multiplier += 0.1

        # Content keyword density boost
        if clean_keywords:
            matched = sum(1 for kw in clean_keywords if kw in content_lower or kw in title_lower)
            if matched > 0:
                multiplier += 0.15 * min(matched, 4)

        final_score = base_score * multiplier
        item_copy = dict(item)
        item_copy["authorityScore"] = round(final_score, 6)
        scored_candidates.append(item_copy)

    scored_candidates.sort(key=lambda x: x["authorityScore"], reverse=True)
    return scored_candidates

