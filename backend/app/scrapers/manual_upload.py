import os
from typing import List
from app.scrapers.base import PaperScraper, ScraperError
from app.models.paper import PaperMeta
from app.logger import get_logger

log = get_logger(__name__)


class ManualUploadAdapter(PaperScraper):
    """
    Adapter for user-uploaded files.
    list_papers() always returns empty — papers are added via /papers/upload.
    download() serves a locally staged file.
    """
    name = "manual"

    async def health_check(self) -> bool:
        return True

    async def list_papers(
        self,
        portal_url: str,
        btech_year: int = 2,
        year_from: int = 2021,
        year_to: int = 2025,
    ) -> List[PaperMeta]:
        log.info("[ManualUploadAdapter] No automatic discovery — use /papers/upload")
        return []

    async def download(self, paper: PaperMeta, dest_dir: str) -> str:
        # For manual uploads, the file is already at paper.url (local path)
        if os.path.exists(paper.url):
            return paper.url
        raise ScraperError(f"ManualUpload: file not found at {paper.url}")
