from typing import Optional, Tuple
from app.scrapers.base import PaperScraper, ScraperUnavailableError
from app.scrapers.playwright_scraper import PlaywrightScraper
from app.scrapers.requests_scraper import RequestsScraper
from app.scrapers.manual_upload import ManualUploadAdapter
from app.scrapers.colleges.mlrit import MLRITScraper
from app.logger import get_logger

log = get_logger(__name__)

# Registry: college scraper_type -> scraper class
COLLEGE_SCRAPERS: dict[str, type] = {
    "mlrit": MLRITScraper,
    "generic": PlaywrightScraper,
}


class ScraperFactory:
    """
    Returns a working scraper for the given college.
    Fallback chain: Playwright -> Requests -> ManualUpload
    """

    @staticmethod
    async def get_scraper(scraper_type: str = "mlrit") -> Tuple[PaperScraper, str]:
        """
        Returns (scraper_instance, strategy_name).
        Tries each strategy in order until one is available.
        """
        # 1. College-specific scraper (uses Playwright internally)
        college_cls = COLLEGE_SCRAPERS.get(scraper_type, PlaywrightScraper)
        scraper = college_cls()
        if await scraper.health_check():
            log.info(f"[ScraperFactory] Using {scraper.name} scraper")
            return scraper, scraper.name

        # 2. Generic RequestsScraper fallback
        log.warning(f"[ScraperFactory] {scraper.name} unavailable, trying RequestsScraper")
        scraper = RequestsScraper()
        if await scraper.health_check():
            log.info("[ScraperFactory] Using requests scraper")
            return scraper, "requests"

        # 3. ManualUpload (always available)
        log.warning("[ScraperFactory] All auto-scrapers failed, using ManualUpload")
        return ManualUploadAdapter(), "manual"

    @staticmethod
    def get_scraper_sync(scraper_type: str = "mlrit") -> PaperScraper:
        """Synchronous, no health-check — use only for non-network init."""
        college_cls = COLLEGE_SCRAPERS.get(scraper_type, PlaywrightScraper)
        return college_cls()
