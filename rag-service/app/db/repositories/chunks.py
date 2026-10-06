"""Repository for DocumentChunk records in MongoDB with Atlas Vector and Exact Fallback."""

import math
import re
from typing import Any, Dict, List, Optional
from bson import ObjectId
from app.db.mongo import get_chunks_collection
from app.core.config import settings
from app.core.logging import logger


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


class ChunkRepository:
    def __init__(self):
        self._col = None

    @property
    def col(self):
        if self._col is None:
            self._col = get_chunks_collection()
        return self._col

    async def find_by_id(self, chunk_id: str) -> Optional[dict]:
        try:
            oid = ObjectId(chunk_id) if ObjectId.is_valid(chunk_id) else chunk_id
            return await self.col.find_one({"_id": oid})
        except Exception:
            return None

    async def find_by_ids(self, chunk_ids: List[str]) -> List[dict]:
        if not chunk_ids:
            return []
        valid_oids = [ObjectId(cid) for cid in chunk_ids if ObjectId.is_valid(cid)]
        query = {"_id": {"$in": valid_oids}}
        cursor = self.col.find(query)
        return await cursor.to_list(length=len(chunk_ids))

    async def find_by_clause_or_law(
        self,
        clause_number: Optional[str] = None,
        law_number: Optional[float] = None,
        format_filter: Optional[str] = None,
        competition_filter: Optional[str] = None,
        limit: int = 30,
    ) -> List[dict]:
        base_match = {}
        if clause_number:
            escaped = re.escape(clause_number)
            base_match["clauseNumber"] = {"$regex": f"^{escaped}", "$options": "i"}
        elif law_number is not None:
            base_match["lawNumber"] = law_number

        if not base_match:
            return []

        filters = []
        if format_filter and format_filter.lower() != "all":
            filters.append({
                "$or": [
                    {"format": {"$in": ["All", format_filter]}},
                    {"applicableFormats": {"$in": ["ALL", format_filter.upper()]}},
                ]
            })
        if competition_filter and competition_filter.lower() != "all":
            filters.append({
                "$or": [
                    {"competition": {"$in": ["All", competition_filter]}},
                    {"applicableCompetitions": {"$in": ["ALL", competition_filter.upper(), competition_filter]}},
                ]
            })

        query = {"$and": [base_match] + filters} if filters else base_match
        cursor = self.col.find(query).limit(limit)
        results = await cursor.to_list(length=limit)

        # Fallback to general clause match if filtered set is empty
        if not results and filters:
            cursor = self.col.find(base_match).limit(limit)
            results = await cursor.to_list(length=limit)

        return results

    async def keyword_search(
        self,
        terms: List[str],
        limit: int = 20,
        format_filter: Optional[str] = None,
        competition_filter: Optional[str] = None,
    ) -> List[dict]:
        if not terms:
            return []

        valid_terms = sorted([t.strip() for t in terms if len(t.strip()) > 2], key=len, reverse=True)
        if not valid_terms:
            return []

        # If multi-word phrases or long terms exist, use them as primary query
        phrases = [t for t in valid_terms if " " in t or len(t) >= 6]
        search_terms = phrases if phrases else valid_terms
        regex_pattern = "|".join([re.escape(t) for t in search_terms])

        text_clause = {
            "$or": [
                {"title": {"$regex": regex_pattern, "$options": "i"}},
                {"lawTitle": {"$regex": regex_pattern, "$options": "i"}},
                {"content": {"$regex": regex_pattern, "$options": "i"}},
                {"text": {"$regex": regex_pattern, "$options": "i"}},
                {"tags": {"$in": [t.lower() for t in terms]}},
            ]
        }

        filters = []
        if format_filter and format_filter.lower() != "all":
            filters.append({
                "$or": [
                    {"format": {"$in": ["All", format_filter]}},
                    {"applicableFormats": {"$in": ["ALL", format_filter.upper()]}},
                ]
            })
        if competition_filter and competition_filter.lower() != "all":
            filters.append({
                "$or": [
                    {"competition": {"$in": ["All", competition_filter]}},
                    {"applicableCompetitions": {"$in": ["ALL", competition_filter.upper(), competition_filter]}},
                ]
            })

        query = {"$and": [text_clause] + filters} if filters else text_clause
        cursor = self.col.find(query).limit(limit)
        results = await cursor.to_list(length=limit)

        # Fallback to general keyword match if filtered search returns empty
        if not results and filters:
            cursor = self.col.find(text_clause).limit(limit)
            results = await cursor.to_list(length=limit)

        return results


    async def vector_search(self, query_vector: List[float], limit: int = 10, format_filter: Optional[str] = None) -> List[dict]:
        """Runs Atlas Vector Search; if pipeline fails or returns empty, uses exact in-memory cosine fallback."""
        filter_dict = {}
        if format_filter and format_filter.lower() != "all":
            filter_dict["$or"] = [{"format": {"$in": ["All", format_filter]}}, {"applicableFormats": {"$in": ["ALL", format_filter.upper()]}}]

        # Attempt Atlas $vectorSearch pipeline
        pipeline = [
            {
                "$vectorSearch": {
                    "index": settings.VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": limit * 10,
                    "limit": limit,
                    **({"filter": filter_dict} if filter_dict else {}),
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "documentId": 1,
                    "lawNumber": 1,
                    "clauseNumber": 1,
                    "title": 1,
                    "lawTitle": 1,
                    "content": 1,
                    "text": 1,
                    "parentLaw": 1,
                    "sectionHeading": 1,
                    "format": 1,
                    "competition": 1,
                    "tags": 1,
                    "metadata": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            }
        ]

        try:
            cursor = self.col.aggregate(pipeline)
            results = await cursor.to_list(length=limit)
            if results and len(results) > 0:
                return results
        except Exception as exc:
            logger.warning("Atlas $vectorSearch failed (%s). Engaging exact cosine fallback.", exc)

        # Fallback: exact in-memory cosine similarity over candidate chunks
        logger.info("Executing exact cosine similarity fallback over candidate chunks.")
        query = {}
        if format_filter and format_filter.lower() != "all":
            query["$or"] = [{"format": {"$in": ["All", format_filter]}}, {"applicableFormats": {"$in": ["ALL", format_filter.upper()]}}]
        cursor = self.col.find(
            query,
            {
                "embedding": 1,
                "clauseNumber": 1,
                "title": 1,
                "lawTitle": 1,
                "content": 1,
                "text": 1,
                "lawNumber": 1,
                "parentLaw": 1,
                "sectionHeading": 1,
                "format": 1,
                "competition": 1,
                "tags": 1,
                "metadata": 1,
                "documentId": 1,
            },
        ).limit(500)
        candidates = await cursor.to_list(length=500)

        scored = []
        for cand in candidates:
            emb = cand.get("embedding")
            if emb:
                score = cosine_similarity(query_vector, emb)
                cand_copy = dict(cand)
                cand_copy.pop("embedding", None)
                cand_copy["score"] = score
                scored.append(cand_copy)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:limit]

    async def insert_many(self, chunks: List[dict]):
        if chunks:
            for c in chunks:
                doc_id = c.get("documentId")
                if doc_id and isinstance(doc_id, str) and ObjectId.is_valid(doc_id):
                    c["documentId"] = ObjectId(doc_id)
            await self.col.insert_many(chunks)

    async def delete_by_document_id(self, document_id: str):
        try:
            oid = ObjectId(document_id) if ObjectId.is_valid(document_id) else document_id
            await self.col.delete_many({"documentId": oid})
        except Exception as exc:
            logger.error("Failed to delete chunks for document %s: %s", document_id, exc)
