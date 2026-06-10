import logging
import sys
import uuid
from contextvars import ContextVar
from .config import settings

# Correlation ID for request tracing
correlation_id: ContextVar[str] = ContextVar("correlation_id", default="-")


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        
        class StructuredFormatter(logging.Formatter):
            def format(self, record):
                cid = correlation_id.get()
                if settings.is_production:
                    return (
                        f'{{"time":"{self.formatTime(record)}","level":"{record.levelname}",'
                        f'"logger":"{record.name}","correlation_id":"{cid}",'
                        f'"message":"{record.getMessage()}"}}'
                    )
                fmt = f"%(asctime)s | %(levelname)-8s | {cid[:8]} | %(name)s | %(message)s"
                return fmt.format(record)
        
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))
    return logger
