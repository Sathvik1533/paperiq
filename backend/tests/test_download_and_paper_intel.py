"""
Tests for Paper ID & Evidence Lookup and Mime Type Handling.
Validates:
- Paper IDs can be looked up whether passed as UUID or slug
- Curated questions use valid UUIDs matching 011 seed curriculum
- download.py view_paper and download_paper handle .docx and .pdf with proper headers
"""
import uuid
import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.intelligence.academic_question_intel import (
    AcademicQuestionIntelligence,
    resolve_paper_id,
    PAPER_SLUG_TO_UUID,
)
from app.api.download import download_paper, view_paper


class TestPaperIdLookupAndSeeds:
    def test_resolve_paper_id_with_valid_uuid(self):
        test_uuid = "c3010000-0000-0000-0000-000000000001"
        assert resolve_paper_id(test_uuid) == test_uuid

    def test_resolve_paper_id_with_curated_slug(self):
        slug = "paper-mlrit-daa-r22-dec2023"
        resolved = resolve_paper_id(slug)
        assert resolved == "c3010000-0000-0000-0000-000000000001"
        assert uuid.UUID(resolved)  # Must be valid UUID

    def test_resolve_paper_id_with_arbitrary_slug(self):
        slug = "custom-sample-paper-slug"
        resolved = resolve_paper_id(slug)
        assert resolved is not None
        assert uuid.UUID(resolved)  # Must be valid UUID5

    def test_curated_questions_use_valid_uuids_matching_011_seed(self):
        questions = AcademicQuestionIntelligence.get_all_curated_questions()
        assert len(questions) > 0
        for q in questions:
            # Must be a valid UUID
            val_uuid = uuid.UUID(q.paper_id)
            assert str(val_uuid) == q.paper_id
            # For 3-1 DAA, must match 011 seed subject ID
            if q.subject_code == "A6CS15":
                assert q.paper_id == "c3010000-0000-0000-0000-000000000001"


class TestDownloadAndMimeTypes:
    @pytest.mark.asyncio
    async def test_view_paper_handles_pdf_mime_type(self):
        mock_db = MagicMock()
        mock_db.table().select().eq().execute.return_value.data = [{
            "id": "c3010000-0000-0000-0000-000000000001",
            "storage_path": "mlrit/2024/exam_paper.pdf",
            "storage_bucket": "papers",
        }]
        mock_db.storage.from_().download.return_value = b"%PDF-1.4 simulated pdf stream"

        with patch("app.api.download.get_db", return_value=mock_db):
            resp = await view_paper("c3010000-0000-0000-0000-000000000001")
            assert resp.media_type == "application/pdf"
            assert 'inline; filename="exam_paper.pdf"' in resp.headers["Content-Disposition"]

    @pytest.mark.asyncio
    async def test_view_paper_handles_docx_mime_type(self):
        mock_db = MagicMock()
        mock_db.table().select().eq().execute.return_value.data = [{
            "id": "c3010000-0000-0000-0000-000000000001",
            "storage_path": "mlrit/2024/exam_paper.docx",
            "storage_bucket": "papers",
        }]
        mock_db.storage.from_().download.return_value = b"PK\x03\x04 simulated docx zip stream"

        with patch("app.api.download.get_db", return_value=mock_db):
            resp = await view_paper("paper-mlrit-daa-r22-dec2023")  # Test slug resolution
            assert resp.media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            assert 'inline; filename="exam_paper.docx"' in resp.headers["Content-Disposition"]

    @pytest.mark.asyncio
    async def test_download_paper_handles_slug_lookup_and_attachment(self):
        mock_db = MagicMock()
        mock_db.table().select().eq().execute.return_value.data = [{
            "id": "c3010000-0000-0000-0000-000000000001",
            "storage_path": "mlrit/2024/A6CS15_final.docx",
            "file_name": "A6CS15_final.docx",
            "storage_bucket": "papers",
        }]
        mock_db.storage.from_().download.return_value = b"PK\x03\x04 word docx bytes"

        with patch("app.api.download.get_db", return_value=mock_db):
            resp = await download_paper("paper-mlrit-daa-r22-dec2023")
            assert resp.media_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            assert 'attachment; filename="A6CS15_final.docx"' in resp.headers["Content-Disposition"]
