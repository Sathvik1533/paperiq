import os
import re
import httpx
from typing import List
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

from app.scrapers.base import PaperScraper, ScraperError, ScraperTimeoutError
from app.models.paper import PaperMeta
from app.utils.file_utils import ensure_dir
from app.config import settings
from app.logger import get_logger

log = get_logger(__name__)

_MID1_KEYWORDS   = ["mid-1", "mid1", "mid-i ", "mid-i-", "midterm-1", "midterm1", "unit test 1", "ct1"]
_MID2_KEYWORDS   = ["mid-2", "mid2", "mid-ii", "mid ii", "midterm-2", "midterm2", "unit test 2", "ct2"]
_SUPPLE_KEYWORDS = ["supply", "supple", "supplementary"]


def _detect_exam_category(label: str) -> str:
    lower = label.lower()
    if any(k in lower for k in _MID1_KEYWORDS):
        return "Mid-1"
    if any(k in lower for k in _MID2_KEYWORDS):
        return "Mid-2"
    return "Semester"


def _detect_exam_type(label: str) -> str:
    return "Supplementary" if any(w in label.lower() for w in _SUPPLE_KEYWORDS) else "Regular"


class RequestsScraper(PaperScraper):
    """
    HTTP-based scraper using httpx. Fallback when Playwright is unavailable.
    list_papers() accepts exam_categories and exam_attempts filters.
    """
    name = "requests"

    def __init__(self):
        self._client = httpx.AsyncClient(
            timeout=settings.scraper_timeout_seconds,
            follow_redirects=True,
            headers={"User-Agent": "PaperIQ/1.0 (exam intelligence platform)"},
        )

    async def health_check(self) -> bool:
        try:
            r = await self._client.get("https://www.google.com", timeout=5)
            return r.status_code == 200
        except Exception:
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
        categories = set(exam_categories) if exam_categories else {"Semester", "Mid-1", "Mid-2"}
        attempts   = set(exam_attempts)   if exam_attempts   else {"Regular", "Supplementary"}

        log.info(
            f"[RequestsScraper] Fetching portal: {portal_url} "
            f"categories={categories} attempts={attempts}"
        )
        try:
            resp = await self._client.get(portal_url)
            resp.raise_for_status()
        except httpx.TimeoutException as e:
            raise ScraperTimeoutError(f"Timeout fetching {portal_url}") from e
        except Exception as e:
            raise ScraperError(f"Failed to fetch portal: {e}") from e

        soup = BeautifulSoup(resp.text, "html.parser")
        base_path = portal_url.rsplit("/", 1)[0]
        roman = {1: "I", 2: "II", 3: "III", 4: "IV"}.get(btech_year, "II")

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

            if exam_type not in attempts:
                continue
            if exam_category not in categories:
                continue

            month_match = re.search(
                r'(January|February|March|April|May|June|July|'
                r'August|September|October|November|December)',
                label, re.I
            )
            exam_month = month_match.group(1).capitalize() if month_match else "Unknown"
            full_url   = urljoin(base_path + "/", href)
            file_name  = href.split("/")[-1]

            papers.append(PaperMeta(
                url=full_url,
                file_name=file_name,
                exam_year=exam_year,
                exam_month=exam_month,
                exam_type=exam_type,
                exam_category=exam_category,
                btech_year=btech_year,
                label=label,
            ))

        log.info(f"[RequestsScraper] Found {len(papers)} matching archives")
        return papers

    async def download(self, paper: PaperMeta, dest_dir: str) -> str:
        ensure_dir(dest_dir)
        dest_path = os.path.join(dest_dir, paper.file_name)

        if os.path.exists(dest_path):
            log.info(f"[RequestsScraper] Already cached: {paper.file_name}")
            return dest_path

        log.info(f"[RequestsScraper] Downloading: {paper.url}")
        try:
            async with self._client.stream("GET", paper.url) as resp:
                resp.raise_for_status()
                with open(dest_path, "wb") as f:
                    async for chunk in resp.aiter_bytes(65536):
                        f.write(chunk)
        except httpx.TimeoutException as e:
            raise ScraperTimeoutError(f"Timeout downloading {paper.url}") from e
        except Exception as e:
            raise ScraperError(f"Download failed: {e}") from e

        log.info(f"[RequestsScraper] Saved: {dest_path}")
        return dest_path

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self._client.aclose()
