"""Inspect Law 28 chunks specifically."""

import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_chunks_collection


async def inspect_law28():
    await connect_to_mongo()
    col = get_chunks_collection()

    cursor = col.find({"lawNumber": 28}).limit(10)
    print("Law 28 Chunks:")
    async for c in cursor:
        print(f"  Clause {c.get('clauseNumber')}: {c.get('title')} -> {c.get('content')[:80]}...")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(inspect_law28())
