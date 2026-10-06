import asyncio
from app.generation.gemini_client import GeminiClient

async def test_llm():
    client = GeminiClient()
    sys_prompt = "You are a cricket umpire. Respond ONLY in valid JSON with fields: 'answer' and 'rule'."
    user_prompt = "What is the penalty if a ball in play strikes a protective helmet placed on the ground?"
    res = await client.generate_json(sys_prompt, user_prompt)
    print("Result:", res)

if __name__ == "__main__":
    asyncio.run(test_llm())
