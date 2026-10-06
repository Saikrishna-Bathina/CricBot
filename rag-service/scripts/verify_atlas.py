"""Verify live Atlas database records, competition variations, and watermark audit."""

import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_documents_collection, get_chunks_collection


async def verify():
    await connect_to_mongo()
    docs_col = get_documents_collection()
    chunks_col = get_chunks_collection()

    total_docs = await docs_col.count_documents({})
    total_chunks = await chunks_col.count_documents({})
    print(f"Total Documents in Atlas: {total_docs}")
    print(f"Total Chunks in Atlas: {total_chunks}")

    print("\nOfficial Documents Ingested:")
    cursor = docs_col.find({})
    async for d in cursor:
        fmt = d.get("format", "All")
        comp = d.get("competition", "All")
        title = d.get("title", "")
        count = d.get("chunkCount", 0)
        status = d.get("status", "")
        print(f"  - [{fmt}/{comp}] {title} ({count} clauses, status: {status})")

    print("\nVerifying Specific High-Priority Official Clauses:")
    # 1. Helmet penalty Law 28.3
    c28 = await chunks_col.find_one({"clauseNumber": {"$regex": "^28.3"}})
    if c28:
        print(f"  [PASS] Law 28.3 Helmet: Clause {c28.get('clauseNumber')} | Title: {c28.get('title') or c28.get('lawTitle')}")
    else:
        print("  [FAIL] Law 28.3 not found")

    # 2. Non-striker run out Law 41.16
    c41 = await chunks_col.find_one({"clauseNumber": {"$regex": "^41.16"}})
    if c41:
        print(f"  [PASS] Law 41.16 Non-striker: Clause {c41.get('clauseNumber')} | Title: {c41.get('title') or c41.get('lawTitle')}")
    else:
        print("  [FAIL] Law 41.16 not found")

    # 3. Free Hit clause in T20I (21.19)
    c21 = await chunks_col.find_one({"clauseNumber": {"$regex": "^21.19"}})
    if c21:
        print(f"  [PASS] Clause 21.19 Free Hit: Clause {c21.get('clauseNumber')} | Title: {c21.get('title') or c21.get('lawTitle')}")
    else:
        print("  [FAIL] Clause 21.19 Free Hit not found")

    # 4. IPL Bouncer allowance (41.6.1.8 - Two short-pitched balls allowed per over)
    ipl_chunk = await chunks_col.find_one({"competition": "IPL", "content": {"$regex": "more than two fast short pitched", "$options": "i"}})
    if ipl_chunk:
        print(f"  [PASS] IPL Two-Bouncer Rule (41.6): Clause {ipl_chunk.get('clauseNumber')} | Text: {ipl_chunk.get('content')[:90]}...")
    else:
        print("  [FAIL] IPL 2-Bouncers rule not found")

    # 5. Check if any Studocu watermark leaked into content
    watermark_check = await chunks_col.count_documents({"content": {"$regex": "studocu", "$options": "i"}})
    print(f"\nStudocu watermark leak audit in chunks: {watermark_check} occurrences (Expected: 0)")
    assert watermark_check == 0, "Watermark was found in chunk content!"

    await close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(verify())
