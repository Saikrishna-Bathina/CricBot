"""Structured logging configuration for CricBot."""

import logging
import sys
from app.core.config import settings

def setup_logging():
    log_format = "%(asctime)s | %(levelname)-7s | %(name)s:%(lineno)d | %(message)s"
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
    )
    return logging.getLogger("cricbot_rag")

logger = setup_logging()
