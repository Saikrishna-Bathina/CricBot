"""Law-aware chunker producing deterministic, verifiable chunks compatible with both Mongoose and FastAPI."""

import hashlib
import re
from typing import Any, Dict, List, Optional
from app.ingestion.law_parser import ParsedClause

CRICKET_TAG_KEYWORDS = {
    "helmet": ["helmet", "protective equipment", "headgear"],
    "penalty runs": ["penalty", "5 penalty runs", "penalty runs"],
    "dead ball": ["dead ball", "ball ceases to be in play", "become dead", "becomes dead"],
    "no ball": ["no ball", "front foot", "overstepping", "free hit"],
    "wide": ["wide ball", "passing wide"],
    "run out": ["run out", "breaking the wicket", "backing up", "non-striker"],
    "stumped": ["stumped", "wicket-keeper"],
    "lbw": ["leg before wicket", "lbw", "pitched in line", "intercepted"],
    "caught": ["caught", "boundary catch", "clean catch"],
    "timed out": ["timed out", "incoming batter"],
    "obstructing the field": ["obstructing", "willful obstruction"],
    "free hit": ["free hit", "no-ball"],
    "drs": ["player review", "umpire's call", "decision review system", "review"],
    "concussion": ["concussion substitute", "like for like substitute"],
    "powerplay": ["powerplay", "fielding restrictions"],
    "super over": ["super over", "tie"],
    "impact player": ["impact player", "substitute player"],
    "short run": ["short run"],
    "follow on": ["follow-on", "follow on"],
    "appeal": ["appeal", "how's that", "umpire decision"],
    "bouncer": ["short-pitched", "bouncer", "above shoulder"],
}


def extract_tags(text: str) -> List[str]:
    tags = set()
    text_lower = text.lower()
    for tag_name, keywords in CRICKET_TAG_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            tags.add(tag_name)
    return sorted(list(tags))


def create_chunks_from_clauses(
    clauses: List[ParsedClause],
    document_id: str,
    format_type: str = "All",
    competition_type: str = "All",
    effective_date: str = "2026-10-01",
    issuing_org: str = "MCC",
    document_version: str = "Official Edition",
) -> List[Dict[str, Any]]:
    """Transforms parsed clauses into dual-compatible MongoDB DocumentChunk records."""
    raw_chunks: List[Dict[str, Any]] = []

    formats_list = [format_type.upper()] if format_type != "All" else ["ALL"]
    competitions_list = [competition_type.upper()] if competition_type != "All" else []

    for idx, clause in enumerate(clauses):
        content = clause.content.strip()
        word_count = len(content.split())
        if word_count < 6 and not any(kw in content.lower() for kw in ["dead", "out", "ball", "run", "player"]):
            continue

        # Check for subclause splits (e.g. 28.3.1, 28.3.2)
        subclause_pattern = re.compile(r"(?:^|\n)(\d{1,2}\.\d{1,2}\.\d{1,2})\s+", re.MULTILINE)
        subclause_splits = list(subclause_pattern.finditer(content))

        if len(subclause_splits) > 1:
            for s_idx, match in enumerate(subclause_splits):
                sub_num = match.group(1)
                start_pos = match.start()
                end_pos = subclause_splits[s_idx + 1].start() if s_idx + 1 < len(subclause_splits) else len(content)
                sub_text = content[start_pos:end_pos].strip()
                if len(sub_text.split()) < 5:
                    continue

                content_hash = hashlib.sha256(sub_text.encode("utf-8")).hexdigest()
                tags = extract_tags(sub_text)

                raw_chunks.append({
                    "documentId": document_id,
                    "lawNumber": int(clause.law_number) if clause.law_number is not None else None,
                    "clauseNumber": sub_num,
                    "title": f"{clause.title} ({sub_num})",
                    "lawTitle": clause.title,
                    "text": sub_text,
                    "content": sub_text,
                    "tokenCount": len(sub_text.split()),
                    "sectionHeading": clause.parent_law,
                    "parentLaw": clause.parent_law,
                    "documentVersion": document_version,
                    "issuingOrganisation": issuing_org,
                    "applicableFormats": formats_list,
                    "applicableCompetitions": competitions_list,
                    "format": format_type,
                    "competition": competition_type,
                    "pageStart": clause.page_start,
                    "pageEnd": clause.page_end,
                    "contentHash": content_hash,
                    "tags": tags,
                    "metadata": {
                        "pageStart": clause.page_start,
                        "pageEnd": clause.page_end,
                        "printedPageStart": clause.printed_page_start,
                        "printedPageEnd": clause.printed_page_end,
                        "contentHash": content_hash,
                        "confidence": 1.0,
                    }
                })
        else:
            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            tags = extract_tags(content)

            raw_chunks.append({
                "documentId": document_id,
                "lawNumber": int(clause.law_number) if clause.law_number is not None else None,
                "clauseNumber": clause.clause_number,
                "title": clause.title,
                "lawTitle": clause.title,
                "text": content,
                "content": content,
                "tokenCount": word_count,
                "sectionHeading": clause.parent_law,
                "parentLaw": clause.parent_law,
                "documentVersion": document_version,
                "issuingOrganisation": issuing_org,
                "applicableFormats": formats_list,
                "applicableCompetitions": competitions_list,
                "format": format_type,
                "competition": competition_type,
                "pageStart": clause.page_start,
                "pageEnd": clause.page_end,
                "contentHash": content_hash,
                "tags": tags,
                "metadata": {
                    "pageStart": clause.page_start,
                    "pageEnd": clause.page_end,
                    "printedPageStart": clause.printed_page_start,
                    "printedPageEnd": clause.printed_page_end,
                    "contentHash": content_hash,
                    "confidence": 1.0,
                }
            })

    # Deduplication across identical clause numbers (retaining body text over TOC/index)
    deduped_map: Dict[str, Dict[str, Any]] = {}

    for chunk in raw_chunks:
        c_num = chunk["clauseNumber"]
        if c_num not in deduped_map:
            deduped_map[c_num] = chunk
        else:
            existing = deduped_map[c_num]
            if chunk["tokenCount"] > existing["tokenCount"] * 1.5:
                deduped_map[c_num] = chunk
            elif existing["tokenCount"] > chunk["tokenCount"] * 1.5:
                pass
            else:
                merged_content = f"{existing['content']}\n{chunk['content']}".strip()
                existing["text"] = merged_content
                existing["content"] = merged_content
                existing["tokenCount"] = len(merged_content.split())
                existing["pageEnd"] = chunk["pageEnd"]
                existing["metadata"]["pageEnd"] = chunk["metadata"]["pageEnd"]
                existing["contentHash"] = hashlib.sha256(merged_content.encode("utf-8")).hexdigest()
                existing["tags"] = sorted(list(set(existing["tags"] + chunk["tags"])))

    final_chunks = list(deduped_map.values())
    for i, c in enumerate(final_chunks):
        c["chunkIndex"] = i

    return final_chunks
