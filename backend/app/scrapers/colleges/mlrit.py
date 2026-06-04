from typing import List
from app.scrapers.playwright_scraper import PlaywrightScraper
from app.models.paper import PaperMeta
from app.logger import get_logger

log = get_logger(__name__)

MLRIT_PORTAL_URL = "https://exams.mlrinstitutions.ac.in/Old_Qp/Old_QP.html"


class MLRITScraper(PlaywrightScraper):
    """MLRIT portal scraper. Forwards exam_categories/exam_attempts to parent."""
    name = "mlrit"

    async def list_papers(
        self,
        portal_url: str = MLRIT_PORTAL_URL,
        btech_year: int = 2,
        year_from: int = 2021,
        year_to: int = 2025,
        exam_categories: list[str] | None = None,
        exam_attempts: list[str] | None = None,
    ) -> List[PaperMeta]:
        log.info(
            f"[MLRITScraper] {year_from}–{year_to} "
            f"categories={exam_categories} attempts={exam_attempts}"
        )
        papers = await super().list_papers(
            portal_url=portal_url,
            btech_year=btech_year,
            year_from=year_from,
            year_to=year_to,
            exam_categories=exam_categories,
            exam_attempts=exam_attempts,
        )
        log.info(f"[MLRITScraper] Total archives: {len(papers)}")
        return papers
