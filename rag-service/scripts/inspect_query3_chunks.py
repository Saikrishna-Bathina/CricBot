import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.retrieval.retriever import get_hybrid_retriever

async def test():
    await connect_to_mongo()
    retriever = get_hybrid_retriever()
    q = "Can a batsman be given out LBW off a No ball in Test cricket?"
    res = await retriever.retrieve(query=q, format_filter="Test", competition_filter="ICC", limit=7)
    print("Total retrieved chunks:", len(res["chunks"]))
    for i, c in enumerate(res["chunks"]):
        title = (c.get("title") or "")[:50]
        print(f"[{i}] Clause: {c.get('clauseNumber')} | Title: {title} | Comp: {c.get('competition')} | Format: {c.get('format')} | Score: {c.get('authorityScore')}")
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
