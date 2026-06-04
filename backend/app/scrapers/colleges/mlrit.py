from typing import List, Optional
from app.scrapers.playwright_scraper import PlaywrightScraper
from app.models.paper import PaperMeta
from app.logger import get_logger

log = get_logger(__name__)

MLRIT_PORTAL_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"


class MLRITScraper(PlaywrightScraper):
    """
    MLRIT-specific scraper.
    Inherits all logic from PlaywrightScraper (which falls back to RequestsScraper).
    Override here if MLRIT portal structure changes.
    """
    name = "mlrit"

    async def list_papers(
        self,
        portal_url: str = MLRIT_PORTAL_URL,
        btech_year: int = 2,
        year_from: int = 2021,
        year_to: int = 2025,
        regulation: Optional[str] = None,
        exam_category: Optional[str] = None,
        exam_attempt: Optional[str] = None,
    ) -> List[PaperMeta]:
        log.info(f"[MLRITScraper] Listing II B.Tech papers {year_from}–{year_to}")
        if regulation:
            log.info(f"[MLRITScraper] Filtering regulation: {regulation}")
        if exam_category:
            log.info(f"[MLRITScraper] Filtering exam category: {exam_category}")
        if exam_attempt:
            log.info(f"[MLRITScraper] Filtering exam attempt: {exam_attempt}")
        
        papers = await super().list_papers(
            portal_url=portal_url,
            btech_year=btech_year,
            year_from=year_from,
            year_to=year_to,
            regulation=regulation,
            exam_category=exam_category,
            exam_attempt=exam_attempt,
        )
        log.info(f"[MLRITScraper] Total archives discovered: {len(papers)}")
        return papers
