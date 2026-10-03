"""Resolves citation references against MongoDB chunks and parent document records."""

from typing import Any, Dict, List, Optional
from app.db.repositories.chunks import ChunkRepository
from app.citations.schemas import CitationDetail
from app.core.logging import logger


class CitationResolver:
    def __init__(self):
        self.chunk_repo = ChunkRepository()

    async def resolve_citations(
        self,
        citation_ids: List[str],
        candidate_pool: Optional[List[Dict[str, Any]]] = None,
    ) -> List[CitationDetail]:
        """Resolves chunk IDs into detailed citation objects, checking candidate pool first."""
        pool_map = {}
        if candidate_pool:
            for c in candidate_pool:
                cid = str(c.get("id") or c.get("_id"))
                if cid:
                    pool_map[cid] = c

        resolved: List[CitationDetail] = []
        missing_ids = []

        for cid in set(citation_ids):
            if cid in pool_map:
                c = pool_map[cid]
                meta = c.get("metadata", {})
                resolved.append(
                    CitationDetail(
                        chunkId=cid,
                        lawNumber=c.get("lawNumber"),
                        clauseNumber=str(c.get("clauseNumber", "")),
                        title=c.get("title", ""),
                        content=c.get("content", ""),
                        parentLaw=c.get("parentLaw"),
                        documentId=str(c.get("documentId", "")),
                        printedPage=meta.get("printedPageStart"),
                        verified=True,
                    )
                )
            else:
                missing_ids.append(cid)

        # Lookup any remaining IDs directly in DB
        if missing_ids:
            db_chunks = await self.chunk_repo.find_by_ids(missing_ids)
            for c in db_chunks:
                cid = str(c.get("_id"))
                meta = c.get("metadata", {})
                resolved.append(
                    CitationDetail(
                        chunkId=cid,
                        lawNumber=c.get("lawNumber"),
                        clauseNumber=str(c.get("clauseNumber", "")),
                        title=c.get("title", ""),
                        content=c.get("content", ""),
                        parentLaw=c.get("parentLaw"),
                        documentId=str(c.get("documentId", "")),
                        printedPage=meta.get("printedPageStart"),
                        verified=True,
                    )
                )

        return resolved
