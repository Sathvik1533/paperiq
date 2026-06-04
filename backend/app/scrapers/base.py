from abc import ABC, abstractmethod
from typing import List, Optional
from dataclasses import dataclass, field
from app.models.paper import PaperMeta


class ScraperError(Exception):
    pass

class ScraperUnavailableError(ScraperError):
    pass

class ScraperTimeoutError(ScraperError):
    pass


class PaperScraper(ABC):
    """
    Abstract base for all paper scrapers.
    Subclass per college or per transport strategy.
    """
    name: str = "base"

    @abstractmethod
    async def list_papers(
        self,
        portal_url: str,
        btech_year: int = 2,
        year_from: int = 2021,
        year_to: int = 2025,
    ) -> List[PaperMeta]:
        """Return metadata for all matching papers on the portal."""
        ...

    @abstractmethod
    async def download(
        self,
        paper: PaperMeta,
        dest_dir: str,
    ) -> str:
        """Download archive to dest_dir. Returns local file path."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if this scraper can reach the internet."""
        ...
