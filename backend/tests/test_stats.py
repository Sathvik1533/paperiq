"""
Tests for Platform Statistics endpoint (/api/v1/stats).
Verifies that live database counts are returned truthfully, and that errors
never return fabricated numbers masquerading as live statistics.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestStatsIntegrity:
    """Tests data integrity and truthfulness of platform stats."""

    @patch("app.api.stats.get_db")
    def test_stats_returns_actual_database_counts(self, mock_get_db):
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        def table_side_effect(name):
            mock_tbl = MagicMock()
            if name == "papers":
                mock_tbl.select.return_value.execute.return_value.count = 123
            elif name == "questions":
                mock_tbl.select.return_value.execute.return_value.count = 980
            elif name == "subjects":
                mock_tbl.select.return_value.execute.return_value.count = 11
            return mock_tbl

        mock_db.table.side_effect = table_side_effect

        res = client.get("/api/v1/stats")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        data = body["data"]
        assert data["papers"] == 123
        assert data["questions"] == 980
        assert data["subjects"] == 11
        assert data["is_live"] is True
        assert data["source"] == "database"

    @patch("app.api.stats.get_db")
    def test_stats_database_failure_returns_unavailable_without_invented_data(self, mock_get_db):
        mock_get_db.side_effect = RuntimeError("Database down")

        res = client.get("/api/v1/stats")
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is False
        data = body["data"]
        assert data["is_live"] is False
        assert data["papers"] is None
        assert data["questions"] is None
        assert data["subjects"] is None
        assert data["source"] == "unavailable"
