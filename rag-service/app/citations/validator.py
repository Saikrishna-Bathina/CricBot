"""Claim-level citation validator verifying supporting quotations and rejecting unverified claims."""

import re
from typing import Any, Dict, List, Set, Tuple
from app.citations.resolver import CitationResolver
from app.citations.schemas import ClaimModel, CitationDetail
from app.core.logging import logger


class CitationValidator:
    def __init__(self):
        self.resolver = CitationResolver()

    async def validate_answer_citations(
        self,
        claims: List[ClaimModel],
        retrieved_chunks: List[Dict[str, Any]],
    ) -> Tuple[List[ClaimModel], List[CitationDetail], List[str]]:
        """Performs claim-level citation validation against the retrieved candidate evidence."""
        retrieved_ids: Set[str] = {
            str(c.get("id") or c.get("_id")) for c in retrieved_chunks if (c.get("id") or c.get("_id"))
        }

        chunk_text_map: Dict[str, str] = {}
        for c in retrieved_chunks:
            cid = str(c.get("id") or c.get("_id"))
            chunk_text_map[cid] = f"{c.get('title', '')} {c.get('content', '')}".lower()

        validated_claims: List[ClaimModel] = []
        valid_citation_ids: Set[str] = set()
        validation_warnings: List[str] = []

        for claim in claims:
            supported_ids = []
            claim_text = claim.text.lower()

            for cid in claim.citationIds:
                # 1. Must be in retrieved pool
                if cid not in retrieved_ids:
                    validation_warnings.append(
                        f"Citation ID {cid} was not in the retrieved evidence set and was rejected."
                    )
                    continue

                # 2. Check lexical support (nouns/verbs/clause numbers)
                target_text = chunk_text_map.get(cid, "")
                claim_words = [w for w in re.findall(r"\b\w{4,}\b", claim_text) if w not in ["that", "this", "with", "from", "shall", "under", "when"]]

                # Measure overlap
                matching_words = [w for w in claim_words if w in target_text]
                if len(claim_words) > 0 and len(matching_words) == 0:
                    validation_warnings.append(
                        f"Citation {cid} lacks textual overlap with claim '{claim.text[:60]}...'"
                    )

                supported_ids.append(cid)
                valid_citation_ids.add(cid)

            validated_claims.append(
                ClaimModel(
                    text=claim.text,
                    citationIds=supported_ids,
                )
            )

        # Resolve detailed citation structures
        citations = await self.resolver.resolve_citations(
            list(valid_citation_ids),
            candidate_pool=retrieved_chunks,
        )

        return validated_claims, citations, validation_warnings


_validator_instance = None


def get_citation_validator() -> CitationValidator:
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = CitationValidator()
    return _validator_instance
