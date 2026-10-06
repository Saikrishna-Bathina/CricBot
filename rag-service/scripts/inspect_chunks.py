"""Inspect chunk distribution in MongoDB Atlas."""

import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_chunks_collection


async def inspect_chunks():
    await connect_to_mongo()
    col = get_chunks_collection()

    total = await col.count_documents({})
    print(f"Total chunks in collection: {total}")

    cursor = col.find({}, {"clauseNumber": 1, "title": 1, "lawNumber": 1, "parentLaw": 1}).limit(20)
    print("\nSample 20 chunks:")
    async for doc in cursor:
        print(f"  Law {doc.get('lawNumber')}: Clause '{doc.get('clauseNumber')}' - Title: '{doc.get('title')}' | Parent: '{doc.get('parentLaw')}'")

    print("\nChunks grouped by Law Number:")
    pipeline = [{"$group": {"_id": "$lawNumber", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
    async for row in col.aggregate(pipeline):
        print(f"  Law {row['_id']}: {row['count']} chunks")

    # Search for protective helmet
    print("\nSearching for helmet:")
    cursor2 = col.find({"content": {"$regex": "helmet", "$options": "i"}}).limit(5)
    async for c in cursor2:
        print(f"  FOUND HELMET: Law {c.get('lawNumber')} | Clause {c.get('clauseNumber')} | Title: {c.get('title')}")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(inspect_chunks())
