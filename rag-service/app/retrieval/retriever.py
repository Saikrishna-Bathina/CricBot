"""Hybrid Retriever orchestrator combining vector search, exact match, and RRF."""

from typing import Any, Dict, List, Optional
from app.db.repositories.chunks import ChunkRepository
from app.embeddings.provider import get_embedding_provider
from app.retrieval.filters import extract_query_intent
from app.retrieval.fusion import reciprocal_rank_fusion
from app.retrieval.reranker import rerank_by_authority_and_context
from app.core.logging import logger


class HybridRetriever:
    def __init__(self):
        self.chunk_repo = ChunkRepository()
        self.embedding_provider = get_embedding_provider()

    async def retrieve(
        self,
        query: str,
        format_filter: Optional[str] = None,
        competition_filter: Optional[str] = None,
        limit: int = 5,
    ) -> Dict[str, Any]:
        """Performs multi-stage hybrid retrieval across semantic, keyword, and exact law indexes."""
        # 1. Intent extraction
        intent = extract_query_intent(query, default_format=format_filter or "All")
        active_format = format_filter if (format_filter and format_filter != "All") else intent["format"]
        active_competition = competition_filter if (competition_filter and competition_filter != "All") else intent["competition"]

        ranked_lists: List[List[Dict[str, Any]]] = []

        # 2. Clause and Law lookup (direct and inferred concepts)
        clauses_to_check = []
        if intent.get("clauseNumber"):
            clauses_to_check.append(intent["clauseNumber"])
        for c in intent.get("inferredClauses", []):
            if c not in clauses_to_check:
                clauses_to_check.append(c)

        laws_to_check = []
        if intent.get("lawNumber") is not None:
            laws_to_check.append(intent["lawNumber"])
        for l in intent.get("inferredLaws", []):
            if l not in laws_to_check:
                laws_to_check.append(l)

        if clauses_to_check:
            for c_num in clauses_to_check:
                c_res = await self.chunk_repo.find_by_clause_or_law(
                    clause_number=c_num,
                    format_filter=active_format,
                    competition_filter=active_competition,
                    limit=30,
                )
                if c_res:
                    ranked_lists.append(c_res)
        elif laws_to_check:
            for l_num in laws_to_check:
                l_res = await self.chunk_repo.find_by_clause_or_law(
                    law_number=l_num,
                    format_filter=active_format,
                    competition_filter=active_competition,
                    limit=30,
                )
                if l_res:
                    ranked_lists.append(l_res)

        # 3. Keyword / Lexical search with format/competition awareness
        keywords = intent.get("keywords", [])
        if keywords:
            keyword_results = await self.chunk_repo.keyword_search(
                keywords,
                limit=30,
                format_filter=active_format,
                competition_filter=active_competition,
            )
            if keyword_results:
                ranked_lists.append(keyword_results)

        # 4. Semantic vector search
        query_vector = await self.embedding_provider.get_embedding(query)
        vector_results = await self.chunk_repo.vector_search(
            query_vector=query_vector,
            limit=limit * 3,
            format_filter=active_format,
        )
        if vector_results:
            ranked_lists.append(vector_results)

        if not ranked_lists:
            return {
                "query": query,
                "intent": intent,
                "chunks": [],
                "diagnostics": {"totalCandidates": 0, "listsMerged": 0},
            }

        # 5. Fusion via RRF (retain top 60 candidates for reranker)
        fused_candidates = reciprocal_rank_fusion(ranked_lists, k=60, top_n=60)

        # 6. Authority and version reranking
        target_clause = intent.get("clauseNumber")
        target_law = intent.get("lawNumber")
        reranked = rerank_by_authority_and_context(
            candidates=fused_candidates,
            requested_format=active_format,
            requested_competition=active_competition,
            target_clause=target_clause,
            target_law=target_law,
            target_clauses=clauses_to_check,
            keywords=intent.get("keywords"),
        )

        final_chunks = reranked[:limit]

        # 7. Convert ObjectIds to strings
        cleaned_chunks = []
        for c in final_chunks:
            c_dict = dict(c)
            if "_id" in c_dict:
                c_dict["id"] = str(c_dict["_id"])
            if "documentId" in c_dict:
                c_dict["documentId"] = str(c_dict["documentId"])

            # Normalize across Mongoose and FastAPI schema representations
            c_dict["content"] = c_dict.get("content") or c_dict.get("text") or ""
            c_dict["text"] = c_dict["content"]
            c_dict["title"] = c_dict.get("title") or c_dict.get("lawTitle") or f"Clause {c_dict.get('clauseNumber', '')}"
            c_dict["lawTitle"] = c_dict["title"]
            c_dict["parentLaw"] = c_dict.get("parentLaw") or c_dict.get("sectionHeading") or "Cricket Laws"
            c_dict["sectionHeading"] = c_dict["parentLaw"]

            c_dict.pop("embedding", None)
            cleaned_chunks.append(c_dict)

        return {
            "query": query,
            "intent": intent,
            "chunks": cleaned_chunks,
            "diagnostics": {
                "totalCandidates": len(fused_candidates),
                "rankedListsMerged": len(ranked_lists),
                "topScore": cleaned_chunks[0].get("authorityScore") if cleaned_chunks else 0.0,
            }
        }


_retriever_instance = None


def get_hybrid_retriever() -> HybridRetriever:
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = HybridRetriever()
    return _retriever_instance
