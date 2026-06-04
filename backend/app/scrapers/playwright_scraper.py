import os
from typing import List
from app.scrapers.requests_scraper import RequestsScraper
from app.scrapers.base import ScraperError, ScraperUnavailableError
from app.models.paper import PaperMeta
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


class PlaywrightScraper(RequestsScraper):
    """
    Playwright-based scraper for JS-rendered portals.
    Falls back to RequestsScraper behaviour for static pages.
    MLRIT portal is static HTML, so Playwright is only needed if the
    portal starts using JS rendering in the future.
    """
    name = "playwright"

    async def health_check(self) -> bool:
        try:
            from playwright.async_api import async_playwright
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                await browser.close()
            return True
        except Exception as e:
            log.warning(f"[PlaywrightScraper] Playwright not available: {e}")
            return False

    async def list_papers(
        self,
        portal_url: str,
        btech_year: int = 2,
        year_from: int = 2021,
        year_to: int = 2025,
    ) -> List[PaperMeta]:
        """
        Use Playwright to render portal, extract HTML, then delegate
        link parsing to the parent RequestsScraper logic.
        """
        try:
            from playwright.async_api import async_playwright, TimeoutError as PWTimeout
        except ImportError:
            log.warning("[PlaywrightScraper] playwright not installed, falling back to requests")
            return await super().list_papers(portal_url, btech_year, year_from, year_to)

        log.info(f"[PlaywrightScraper] Rendering portal: {portal_url}")
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(portal_url, wait_until="networkidle",
                                timeout=settings.scraper_timeout_seconds * 1000)
                html = await page.content()
                await browser.close()
        except Exception as e:
            log.warning(f"[PlaywrightScraper] Render failed ({e}), falling back to requests")
            return await super().list_papers(portal_url, btech_year, year_from, year_to)

        # Reuse RequestsScraper link-parsing by patching the response text
        from bs4 import BeautifulSoup
        from urllib.parse import urlparse, urljoin
        import re

        soup = BeautifulSoup(html, "html.parser")
        base_path = portal_url.rsplit("/", 1)[0]

        papers: List[PaperMeta] = []
        for a in soup.find_all("a", href=True):
            href: str = a["href"]
            label: str = a.get_text(strip=True)
            if not href.lower().endswith((".rar", ".zip")):
                continue
            roman = {1: "I", 2: "II", 3: "III", 4: "IV"}.get(btech_year, "II")
            if not any([
                label.upper().startswith(f"{roman}-B.TECH"),
                label.upper().startswith(f"{roman} B.TECH"),
                label.upper().startswith(f"{roman}-BTECH"),
                re.search(r'^(January|February|March|April|May|June|July|August|September|October|November|December)\d{4}$',
                          label.replace(' ', ''), re.I)
            ]):
                continue
            year_match = re.search(r'(202[0-9]|201[0-9])', label)
            if not year_match:
                continue
            exam_year = int(year_match.group(1))
            if not (year_from <= exam_year <= year_to):
                continue
            month_match = re.search(
                r'(January|February|March|April|May|June|July|August|September|October|November|December)',
                label, re.I
            )
            exam_month = month_match.group(1).capitalize() if month_match else "Unknown"
            exam_type = "Supplementary" if any(
                w in label.lower() for w in ["supply", "supple", "supplementary"]
            ) else "Regular"
            full_url = urljoin(base_path + "/", href)
            papers.append(PaperMeta(
                url=full_url,
                file_name=href.split("/")[-1],
                exam_year=exam_year,
                exam_month=exam_month,
                exam_type=exam_type,
                btech_year=btech_year,
                label=label,
            ))

        log.info(f"[PlaywrightScraper] Found {len(papers)} archives")
        return papers
