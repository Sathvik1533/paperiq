"""Milestone 1 scraper tests."""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.scrapers.requests_scraper import RequestsScraper
from app.scrapers.scraper_factory import ScraperFactory
from app.scrapers.manual_upload import ManualUploadAdapter
from app.models.paper import PaperMeta


MLRIT_SAMPLE_HTML = """
<html><body>
<p><a href="II-BTECH-Dec24.rar">II-B.Tech-December2024</a></p>
<p><a href="II-BTech-Aug2024.rar">II-B.Tech-August2024</a></p>
<p><a href="I-B.Tech-July2024.rar">I-B.Tech-July2024</a></p>
<p><a href="III-BTech-June25.rar">III-B.Tech-June2025</a></p>
</body></html>
"""


class TestRequestsScraper:
    @pytest.mark.asyncio
    async def test_list_papers_filters_btech_year(self):
        scraper = RequestsScraper()
        with patch.object(scraper._client, "get") as mock_get:
            mock_resp = AsyncMock()
            mock_resp.text = MLRIT_SAMPLE_HTML
            mock_resp.raise_for_status = lambda: None
            mock_get.return_value = mock_resp

            papers = await scraper.list_papers(
                portal_url="https://example.com/portal.html",
                btech_year=2,
                year_from=2024,
                year_to=2025,
            )
        # Should only return II B.Tech papers in 2024-2025
        assert all(p.btech_year == 2 for p in papers)
        assert all(2024 <= p.exam_year <= 2025 for p in papers)
        assert len(papers) == 2

    @pytest.mark.asyncio
    async def test_paper_meta_fields(self):
        scraper = RequestsScraper()
        with patch.object(scraper._client, "get") as mock_get:
            mock_resp = AsyncMock()
            mock_resp.text = MLRIT_SAMPLE_HTML
            mock_resp.raise_for_status = lambda: None
            mock_get.return_value = mock_resp

            papers = await scraper.list_papers(
                portal_url="https://example.com/portal.html",
                btech_year=2,
                year_from=2024,
                year_to=2024,
            )
        assert len(papers) >= 1
        p = papers[0]
        assert p.exam_year == 2024
        assert p.file_name.endswith(".rar")
        assert p.exam_month in [
            "January","February","March","April","May","June",
            "July","August","September","October","November","December"
        ]


class TestManualUploadAdapter:
    @pytest.mark.asyncio
    async def test_list_papers_returns_empty(self):
        adapter = ManualUploadAdapter()
        papers = await adapter.list_papers("https://example.com")
        assert papers == []

    @pytest.mark.asyncio
    async def test_health_check_always_true(self):
        adapter = ManualUploadAdapter()
        assert await adapter.health_check() is True


class TestScraperFactory:
    @pytest.mark.asyncio
    async def test_falls_back_to_manual_when_all_fail(self):
        with patch(
            "app.scrapers.colleges.mlrit.MLRITScraper.health_check",
            new_callable=AsyncMock, return_value=False
        ), patch(
            "app.scrapers.requests_scraper.RequestsScraper.health_check",
            new_callable=AsyncMock, return_value=False
        ):
            scraper, strategy = await ScraperFactory.get_scraper("mlrit")
            assert strategy == "manual"
