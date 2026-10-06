import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.repositories.chunks import ChunkRepository
from app.retrieval.filters import extract_query_intent
from app.retrieval.fusion import reciprocal_rank_fusion

async def test():
    await connect_to_mongo()
    repo = ChunkRepository()
    q = "Can a batsman be given out LBW off a No ball in Test cricket?"
    intent = extract_query_intent(q, default_format="Test")
    
    # 1. Search 36
    res_36 = await repo.find_by_clause_or_law(clause_number="36", format_filter="Test", competition_filter="International", limit=30)
    # 2. Search 21
    res_21 = await repo.find_by_clause_or_law(clause_number="21", format_filter="Test", competition_filter="International", limit=30)
    # 3. Keywords
    res_kw = await repo.keyword_search(intent["keywords"], limit=30, format_filter="Test", competition_filter="International")
    
    print("res_36 count:", len(res_36))
    print("res_21 count:", len(res_21))
    print("res_kw count:", len(res_kw))
    
    # Check where 36.1 and 36.1.1 are in res_36 and res_kw
    for idx, c in enumerate(res_36[:5]):
        print(f"res_36[{idx}]: {c.get('clauseNumber')} {c.get('title')}")
    for idx, c in enumerate(res_kw[:5]):
        print(f"res_kw[{idx}]: {c.get('clauseNumber')} {c.get('title')}")

    ranked_lists = [res_36, res_21, res_kw]
    fused = reciprocal_rank_fusion(ranked_lists, k=60, top_n=20)
    print("\nFUSED TOP 10:")
    for idx, c in enumerate(fused[:10]):
        print(f"[{idx}] {c.get('clauseNumber')} {c.get('title')} - RRF: {c.get('rrfScore')}")

    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test())
