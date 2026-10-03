"""Async MongoDB connection manager using Motor."""

from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    global client, db
    logger.info("Connecting to MongoDB Atlas at %s...", settings.MONGODB_URI.split("@")[-1])
    client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGODB_DB_NAME]
    try:
        # Lightweight ping to verify connection
        await client.admin.command("ping")
        logger.info("MongoDB Atlas connected successfully (database: %s)", settings.MONGODB_DB_NAME)
    except Exception as exc:
        logger.warning("MongoDB ping failed on startup (will retry on query): %s", exc)


async def close_mongo_connection():
    global client
    if client:
        logger.info("Closing MongoDB connection...")
        client.close()
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    global db
    if db is None:
        raise RuntimeError("Database is not initialized. Call connect_to_mongo first.")
    return db


def get_documents_collection():
    return get_db()["documents"]


def get_chunks_collection():
    return get_db()["documentchunks"]
