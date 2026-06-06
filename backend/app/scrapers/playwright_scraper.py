import os
from typing import List
from app.scrapers.requests_scraper import RequestsScraper, _detect_exam_type, _detect_exam_category
from app.models.paper import PaperMeta
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)


class PlaywrightScraper(RequestsScraper):
    """
    Playwright-based scraper. Falls back to RequestsScraper for static pages.
    Passes exam_categories/exam_attempts filters through everywhere.
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
        exam_categories: list[str] | None = None,
        exam_attempts: list[str] | None = None,
    ) -> List[PaperMeta]:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            log.warning("[PlaywrightScraper] playwright not installed, falling back to requests")
            return await super().list_papers(
                portal_url, btech_year, year_from, year_to,
                exam_categories=exam_categories, exam_attempts=exam_attempts
            )

        log.info(f"[PlaywrightScraper] Rendering portal: {portal_url}")
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                page = await browser.new_page()
                await page.goto(
                    portal_url, wait_until="networkidle",
                    timeout=settings.scraper_timeout_seconds * 1000
                )
                html = await page.content()
                await browser.close()
        except Exception as e:
            log.warning(f"[PlaywrightScraper] Render failed ({e}), falling back to requests")
            return await super().list_papers(
                portal_url, btech_year, year_from, year_to,
                exam_categories=exam_categories, exam_attempts=exam_attempts
            )

        from bs4 import BeautifulSoup
        from urllib.parse import urljoin
        import re

        categories = set(exam_categories) if exam_categories else {"Semester", "Mid-1", "Mid-2"}
        attempts   = set(exam_attempts)   if exam_attempts   else {"Regular", "Supplementary"}
        roman = {1: "I", 2: "II", 3: "III", 4: "IV"}.get(btech_year, "II")

        soup = BeautifulSoup(html, "html.parser")
        base_path = portal_url.rsplit("/", 1)[0]

        papers: List[PaperMeta] = []
        for a in soup.find_all("a", href=True):
            href: str  = a["href"]
            label: str = a.get_text(strip=True)
            if not href.lower().endswith((".rar", ".zip")):
                continue
            if not any([
                label.upper().startswith(f"{roman}-B.TECH"),
                label.upper().startswith(f"{roman} B.TECH"),
                label.upper().startswith(f"{roman}-BTECH"),
                re.search(
                    r'^(January|February|March|April|May|June|July|'
                    r'August|September|October|November|December)\d{4}$',
                    label.replace(' ', ''), re.I
                )
            ]):
                continue
            year_match = re.search(r'(202[0-9]|201[0-9])', label)
            if not year_match:
                continue
            exam_year = int(year_match.group(1))
            if not (year_from <= exam_year <= year_to):
                continue

            exam_type     = _detect_exam_type(label)
            exam_category = _detect_exam_category(label)
            if exam_type not in attempts or exam_category not in categories:
                continue

            month_match = re.search(
                r'(January|February|March|April|May|June|July|'
                r'August|September|October|November|December)',
                label, re.I
            )
            exam_month = month_match.group(1).capitalize() if month_match else "Unknown"
            papers.append(PaperMeta(
                url=urljoin(base_path + "/", href),
                file_name=href.split("/")[-1],
                exam_year=exam_year,
                exam_month=exam_month,
                exam_type=exam_type,
                exam_category=exam_category,
                btech_year=btech_year,
                label=label,
            ))

        log.info(f"[PlaywrightScraper] Found {len(papers)} archives")
        return papers
