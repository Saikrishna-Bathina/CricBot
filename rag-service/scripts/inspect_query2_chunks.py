import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.retrieval.retriever import get_hybrid_retriever

async def test():
    await connect_to_mongo()
    retriever = get_hybrid_retriever()
    query = "How many bouncers are permitted per over in the IPL?"
    res = await retriever.retrieve(query=query, format_filter="T20", competition_filter="IPL", limit=10)
    print("Retrieved chunks count:", len(res["chunks"]))
    for i, c in enumerate(res["chunks"]):
        print(f"[{i}] Clause: {c.get('clauseNumber')} | Title: {c.get('title')} | Comp: {c.get('competition')} | Score: {c.get('authorityScore')}")
        print("    Content snippet:", c.get("content")[:120])
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
