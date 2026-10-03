"""Repository for Document records in MongoDB."""

from typing import List, Optional
from bson import ObjectId
from app.db.mongo import get_documents_collection


class DocumentRepository:
    def __init__(self):
        self._col = None

    @property
    def col(self):
        if self._col is None:
            self._col = get_documents_collection()
        return self._col

    async def find_by_id(self, doc_id: str) -> Optional[dict]:
        try:
            oid = ObjectId(doc_id) if ObjectId.is_valid(doc_id) else doc_id
            return await self.col.find_one({"_id": oid})
        except Exception:
            return None

    async def find_approved(self, format_filter: Optional[str] = None) -> List[dict]:
        query = {"status": "approved"}
        if format_filter and format_filter.lower() != "all":
            query["$or"] = [{"format": "All"}, {"format": format_filter}]
        cursor = self.col.find(query)
        return await cursor.to_list(length=100)

    async def find_by_checksum(self, checksum: str) -> Optional[dict]:
        return await self.col.find_one({"checksum": checksum})

    async def upsert_document(self, doc_data: dict) -> str:
        checksum = doc_data.get("checksum")
        if checksum:
            existing = await self.find_by_checksum(checksum)
            if existing:
                await self.col.update_one({"_id": existing["_id"]}, {"$set": doc_data})
                return str(existing["_id"])
        result = await self.col.insert_one(doc_data)
        return str(result.inserted_id)
