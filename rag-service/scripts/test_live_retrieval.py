"""Test live hybrid retrieval across the 4 core domains on MongoDB Atlas."""

import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.retrieval.retriever import get_hybrid_retriever


async def run_queries():
    await connect_to_mongo()
    retriever = get_hybrid_retriever()

    test_queries = [
        ("What is the penalty if the ball strikes a helmet on the ground?", "All", "All"),
        ("Can the bowler run out the non-striker backing up under Law 41.16?", "All", "All"),
        ("In T20 internationals, what deliveries result in a Free Hit under clause 21.19?", "T20I", "International"),
        ("How many fast short pitched deliveries (bouncers) per over are permitted in IPL?", "T20", "IPL"),
    ]

    for q, fmt, comp in test_queries:
        print(f"\n=======================================================")
        print(f"QUERY: {q} [Format: {fmt}, Comp: {comp}]")
        print(f"=======================================================")
        res = await retriever.retrieve(query=q, format_filter=fmt, competition_filter=comp, limit=3)
        chunks = res.get("chunks", [])
        print(f"Found {len(chunks)} chunks:")
        for idx, c in enumerate(chunks, 1):
            print(f"  {idx}. Clause {c.get('clauseNumber')} ({c.get('parentLaw')} | {c.get('title')}):")
            print(f"     Authority Score: {c.get('authorityScore')}")
            print(f"     Preview: {c.get('content')[:120]}...\n")

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(run_queries())
