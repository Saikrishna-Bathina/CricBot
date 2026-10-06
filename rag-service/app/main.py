"""Main FastAPI application entrypoint for CricBot RAG Service."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.errors import CricBotError
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.api.health import router as health_router
from app.api.retrieve import router as retrieve_router
from app.api.answer import router as answer_router
from app.api.scenarios import router as scenarios_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing CricBot Python RAG Service...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down CricBot Python RAG Service...")
    await close_mongo_connection()


app = FastAPI(
    title="CricBot Python RAG Service",
    description="Official Cricket Laws & Match Playing Conditions RAG Microservice",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware allowing configured origins
cors_origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if cors_origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(CricBotError)
async def cricbot_error_handler(request: Request, exc: CricBotError):
    logger.error("CricBot operational error: %s", exc.message)
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"status": "error", "message": exc.message, "details": exc.details},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"status": "error", "message": "Internal RAG service error."},
    )


# Register API routes
app.include_router(health_router)
app.include_router(retrieve_router)
app.include_router(answer_router)
app.include_router(scenarios_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
