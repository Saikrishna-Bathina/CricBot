"""Reciprocal Rank Fusion (RRF) for merging semantic and keyword search results."""

from typing import Any, Dict, List


def reciprocal_rank_fusion(
    ranked_lists: List[List[Dict[str, Any]]],
    k: int = 60,
    top_n: int = 10,
) -> List[Dict[str, Any]]:
    """Merges multiple ranked lists of chunks using standard Reciprocal Rank Fusion."""
    scores: Dict[str, float] = {}
    chunk_map: Dict[str, Dict[str, Any]] = {}
    retrieval_sources: Dict[str, List[str]] = {}

    for list_idx, ranked_list in enumerate(ranked_lists):
        source_name = f"ranker_{list_idx}"
        for rank, item in enumerate(ranked_list, start=1):
            item_id = str(item.get("_id") or item.get("id"))
            if not item_id:
                continue

            chunk_map[item_id] = item
            rrf_score = 1.0 / (k + rank)
            scores[item_id] = scores.get(item_id, 0.0) + rrf_score

            retrieval_sources.setdefault(item_id, []).append(source_name)

    # Sort items by merged RRF score
    sorted_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    results = []
    for item_id, score in sorted_items[:top_n]:
        chunk = dict(chunk_map[item_id])
        chunk["rrfScore"] = round(score, 6)
        chunk["retrievalSources"] = retrieval_sources.get(item_id, [])
        results.append(chunk)

    return results
