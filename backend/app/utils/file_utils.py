import os
import aiofiles
from pathlib import Path
from app.config import settings


def ensure_dir(path: str) -> str:
    Path(path).mkdir(parents=True, exist_ok=True)
    return path


def download_dir() -> str:
    return ensure_dir(settings.scraper_download_dir)


async def write_bytes(path: str, data: bytes) -> None:
    async with aiofiles.open(path, "wb") as f:
        await f.write(data)


def file_extension(path: str) -> str:
    return Path(path).suffix.lower().lstrip(".")
