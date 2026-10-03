"""Law-aware chunker producing deterministic, verifiable chunks with metadata."""

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
    "drs": ["player review", "umpire's call", "decision review system"],
    "concussion": ["concussion substitute", "like for like substitute"],
    "powerplay": ["powerplay", "fielding restrictions"],
    "super over": ["super over", "tie"],
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
    effective_date: str = "2022-10-01",
) -> List[Dict[str, Any]]:
    """Transforms parsed clauses into MongoDB DocumentChunk records."""
    chunks: List[Dict[str, Any]] = []

    for idx, clause in enumerate(clauses):
        content = clause.content.strip()
        if not content:
            continue

        # If clause contains subclauses (e.g. 28.3.1, 28.3.2), break by subclause
        subclause_pattern = re.compile(r"(?:^|\n)(\d{1,2}\.\d{1,2}\.\d{1,2})\s+", re.MULTILINE)
        subclause_splits = list(subclause_pattern.finditer(content))

        if len(subclause_splits) > 1:
            # We have multiple subclauses in this block
            for s_idx, match in enumerate(subclause_splits):
                sub_num = match.group(1)
                start_pos = match.start()
                end_pos = subclause_splits[s_idx + 1].start() if s_idx + 1 < len(subclause_splits) else len(content)
                sub_text = content[start_pos:end_pos].strip()

                content_hash = hashlib.sha256(sub_text.encode("utf-8")).hexdigest()
                tags = extract_tags(sub_text)

                chunks.append({
                    "documentId": document_id,
                    "lawNumber": clause.law_number,
                    "clauseNumber": sub_num,
                    "title": f"{clause.title} ({sub_num})",
                    "content": sub_text,
                    "tokenCount": len(sub_text.split()),
                    "chunkIndex": len(chunks),
                    "parentLaw": clause.parent_law,
                    "effectiveDate": effective_date,
                    "format": format_type,
                    "competition": competition_type,
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
        elif len(subclause_splits) == 1 and clause.clause_number.count(".") == 1:
            # Single subclause inside a section header (e.g., 28.3 header with 28.3.1 text)
            sub_num = subclause_splits[0].group(1)
            content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
            tags = extract_tags(content)

            chunks.append({
                "documentId": document_id,
                "lawNumber": clause.law_number,
                "clauseNumber": sub_num,
                "title": f"{clause.title} ({sub_num})",
                "content": content,
                "tokenCount": len(content.split()),
                "chunkIndex": len(chunks),
                "parentLaw": clause.parent_law,
                "effectiveDate": effective_date,
                "format": format_type,
                "competition": competition_type,
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

            chunks.append({
                "documentId": document_id,
                "lawNumber": clause.law_number,
                "clauseNumber": clause.clause_number,
                "title": clause.title,
                "content": content,
                "tokenCount": len(content.split()),
                "chunkIndex": len(chunks),
                "parentLaw": clause.parent_law,
                "effectiveDate": effective_date,
                "format": format_type,
                "competition": competition_type,
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

    return chunks
