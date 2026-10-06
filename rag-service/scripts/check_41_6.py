import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_chunks_collection

async def check():
    await connect_to_mongo()
    col = get_chunks_collection()
    cursor = col.find({'clauseNumber': {'$regex': r'^41\.6'}, 'competition': 'IPL'})
    chunks = await cursor.to_list(50)
    print(f'Total matching chunks: {len(chunks)}')
    for i, c in enumerate(chunks):
        title = (c.get('title') or '')[:50]
        print(f"{i}: clause={c.get('clauseNumber')} title={title}")
    await close_mongo_connection()

if __name__ == '__main__':
    asyncio.run(check())
