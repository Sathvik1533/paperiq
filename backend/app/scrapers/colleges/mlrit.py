from typing import List
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
    ) -> List[PaperMeta]:
        log.info(f"[MLRITScraper] Listing II B.Tech papers {year_from}–{year_to}")
        papers = await super().list_papers(
            portal_url=portal_url,
            btech_year=btech_year,
            year_from=year_from,
            year_to=year_to,
        )
        log.info(f"[MLRITScraper] Total archives discovered: {len(papers)}")
        return papers
