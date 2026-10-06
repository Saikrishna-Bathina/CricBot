import asyncio
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.generation.answer_service import AnswerService

async def main():
    await connect_to_mongo()
    try:
        service = AnswerService()
        queries = [
            ("What happens if a fielder deliberately stops the ball with their cap?", "All", "All"),
            ("How many bouncers are permitted per over in the IPL?", "T20", "IPL"),
            ("Can a batsman be given out LBW off a No ball in Test cricket?", "Test", "ICC"),
        ]

        for q, fmt, comp in queries:
            print(f"\n==========================================")
            print(f"QUERY: {q} [Format: {fmt}, Comp: {comp}]")
            res = await service.answer_question(q, format_filter=fmt, competition_filter=comp)
            print(f"STATUS: {res.status}")
            print(f"ANSWER:\n{res.answer}")
            print(f"CITATIONS ({len(res.citations)}):")
            for cit in res.citations:
                print(f" - [{cit.clauseNumber}] {cit.title} ({cit.parentLaw})")
            print(f"DIAGNOSTICS: {res.diagnostics}")
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())
