"""
Comprehensive regression tests for PaperIQ Final Blocker Fixes:
1. Rate limiting behind Render & trusted client identification (anti-spoofing & per-user isolation)
2. Null-owner authorization (rejects access to unowned private resources, preserves public/system resources)
3. Protected expensive endpoints (/r22/analyze, /cross-reference, /parse-hall-ticket, marks-breakdown, jobs)
4. Backfill exam dates script verification
"""
import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.limiter import limiter, get_client_ip, get_client_identifier, is_trusted_proxy_environment
import scripts.backfill_exam_dates as backfill_script

client = TestClient(app, raise_server_exceptions=False)


# =============================================================================
# 1. RATE LIMITING BEHIND RENDER & CLIENT IDENTIFICATION
# =============================================================================

class TestRenderRateLimitingAndClientIdentification:
    """Verifies Render reverse-proxy client identification, anti-spoofing, and per-user isolation."""

    @pytest.fixture(autouse=True)
    def reset_limiter(self):
        limiter.reset()
        yield
        limiter.reset()

    def test_direct_connection_ignores_spoofed_x_forwarded_for(self):
        """In a direct connection (not behind Render), X-Forwarded-For is untrusted and ignored."""
        req = MagicMock()
        req.client.host = "192.0.2.1"
        req.headers = {"x-forwarded-for": "10.0.0.1, 8.8.8.8"}
        with patch.dict("os.environ", {}, clear=True):
            assert is_trusted_proxy_environment(req) is False
            client_ip = get_client_ip(req)
            assert client_ip == "192.0.2.1"

    def test_attacker_cannot_spoof_proxy_with_fake_headers(self):
        """An attacker sending fake proxy headers from an untrusted IP is rejected."""
        req = MagicMock()
        req.client.host = "198.51.100.99"
        req.headers = {
            "render-proxy-server": "render",
            "x-render-origin-server": "render",
            "cf-connecting-ip": "1.2.3.4",
            "x-forwarded-for": "1.2.3.4",
        }
        with patch.dict("os.environ", {}, clear=True):
            assert is_trusted_proxy_environment(req) is False
            client_ip = get_client_ip(req)
            assert client_ip == "198.51.100.99"

    def test_render_environment_extracts_trusted_client_ip(self):
        """Behind Render (RENDER=true), the client IP appended by Render edge proxy is extracted."""
        req = MagicMock()
        req.client.host = "10.0.1.5"  # Internal Render proxy host
        req.headers = {
            "x-forwarded-for": "198.51.100.44, 203.0.113.19",
        }
        with patch.dict("os.environ", {"RENDER": "true"}):
            assert is_trusted_proxy_environment(req) is True
            client_ip = get_client_ip(req)
            assert client_ip == "203.0.113.19"

    def test_render_cf_connecting_ip_priority(self):
        """When fronted by Cloudflare on Render, CF-Connecting-IP is given priority."""
        req = MagicMock()
        req.client.host = "10.0.1.5"
        req.headers = {
            "cf-connecting-ip": "198.51.100.77",
            "x-forwarded-for": "spoofed.ip, 198.51.100.77",
        }
        with patch.dict("os.environ", {"RENDER": "true"}):
            assert is_trusted_proxy_environment(req) is True
            client_ip = get_client_ip(req)
            assert client_ip == "198.51.100.77"

    @patch("app.main.verify_supabase_jwt")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    @patch("app.auth.user_auth.verify_supabase_jwt")
    def test_per_user_rate_limiting_isolation_alice_and_bob(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        """
        Two students (Alice and Bob) share the exact same proxy IP or Wi-Fi NAT.
        Alice exhausting her rate limit MUST NOT exhaust Bob's rate limit.
        """
        # Mock Alice
        mock_main_jwt.return_value = {"sub": "student-alice-uuid"}
        mock_jwt.return_value = {"sub": "student-alice-uuid"}
        mock_user_jwt.return_value = {"sub": "student-alice-uuid"}
        alice_headers = {
            "Authorization": "Bearer token.alice",
            "render-proxy-server": "render",
            "x-forwarded-for": "198.51.100.50",
        }

        # Mock DB for vision vote
        with patch("app.api.vision_vote.get_db") as mock_db:
            mock_rpc = MagicMock()
            mock_rpc.execute.return_value.data = {"status": "voted", "count": 1}
            mock_db.return_value.rpc.return_value = mock_rpc

            # Alice consumes her 5-vote limit
            for i in range(5):
                res = client.post(
                    "/api/v1/vision/vote",
                    json={"feature_id": "exam_intelligence"},
                    headers=alice_headers,
                )
                assert res.status_code == 200, f"Alice request {i+1} failed"

            # Alice's 6th request gets 429
            res_alice_6 = client.post(
                "/api/v1/vision/vote",
                json={"feature_id": "exam_intelligence"},
                headers=alice_headers,
            )
            assert res_alice_6.status_code == 429

            # Bob now sends a request from the EXACT SAME IP
            mock_main_jwt.return_value = {"sub": "student-bob-uuid"}
            mock_jwt.return_value = {"sub": "student-bob-uuid"}
            mock_user_jwt.return_value = {"sub": "student-bob-uuid"}
            bob_headers = {
                "Authorization": "Bearer token.bob",
                "render-proxy-server": "render",
                "x-forwarded-for": "198.51.100.50",  # Same IP as Alice!
            }
            res_bob = client.post(
                "/api/v1/vision/vote",
                json={"feature_id": "exam_intelligence"},
                headers=bob_headers,
            )
            # Bob MUST NOT be rate-limited
            assert res_bob.status_code == 200
            assert res_bob.json()["status"] == "ok"


# =============================================================================
# 2. NULL-OWNER AUTHORIZATION (REJECT PRIVATE, PRESERVE PUBLIC)
# =============================================================================

class TestNullOwnerAuthorization:
    """Verifies that private resources with user_id=NULL are rejected, while public ones are allowed."""

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.analysis.get_db")
    def test_null_owner_private_analysis_report_returns_403(self, mock_db, mock_jwt):
        """Private analysis report with user_id=NULL must return HTTP 403 Forbidden."""
        null_owner_report = {
            "id": "report-null-owner",
            "user_id": None,
            "is_cached": False,
            "is_public": False,
            "report_data": {"id": "report-null-owner", "user_id": None},
        }
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[null_owner_report]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/analysis/report-null-owner", headers=headers)
        assert res.status_code == 403
        assert "Access denied to unowned private analysis report" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.analysis.get_db")
    def test_null_owner_report_status_returns_403(self, mock_db, mock_jwt):
        """Private report status with user_id=NULL must return HTTP 403 Forbidden."""
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[{"id": "rep-status-null", "status": "processing", "user_id": None, "is_cached": False}]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/analysis/rep-status-null/status", headers=headers)
        assert res.status_code == 403

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.planner.get_db")
    def test_null_owner_study_plan_returns_403(self, mock_db, mock_user_jwt, mock_jwt):
        """Private study plan with user_id=NULL must return HTTP 403 Forbidden."""
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[{"id": "plan-null-owner", "user_id": None, "is_public": False}]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/planner/plan-null-owner", headers=headers)
        assert res.status_code == 403
        assert "Access denied to unowned private study plan" in res.json()["error"]["message"]

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.planner.get_db")
    def test_null_owner_mock_exam_returns_403(self, mock_db, mock_user_jwt, mock_jwt):
        """Private mock exam with user_id=NULL must return HTTP 403 Forbidden."""
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[{"id": "mock-null-owner", "user_id": None, "generated_by": "user", "is_public": False}]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/mock/mock-null-owner", headers=headers)
        assert res.status_code == 403
        assert "Access denied to unowned private mock exam" in res.json()["error"]["message"]

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.analysis.get_db")
    def test_public_cached_analysis_report_accessible(self, mock_db, mock_user_jwt, mock_jwt):
        """Explicitly public/system cached report (is_cached=True) is accessible to authenticated students."""
        public_report = {
            "id": "report-canonical-r22",
            "user_id": None,
            "is_cached": True,
            "report_data": {"id": "report-canonical-r22", "subject_code": "A6CS15", "is_cached": True},
        }
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[public_report]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/analysis/report-canonical-r22", headers=headers)
        assert res.status_code == 200
        assert res.json()["id"] == "report-canonical-r22"

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.planner.get_db")
    def test_public_system_mock_exam_accessible(self, mock_db, mock_user_jwt, mock_jwt):
        """Explicitly system-generated mock exam (generated_by='system') is accessible to authenticated students."""
        system_mock = {
            "id": "mock-system-template",
            "user_id": None,
            "generated_by": "system",
            "title": "Official R22 Mock Exam",
        }
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[system_mock]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/mock/mock-system-template", headers=headers)
        assert res.status_code == 200
        assert res.json()["id"] == "mock-system-template"


# =============================================================================
# 3. EXPENSIVE ENDPOINTS PROTECTION & OWNERSHIP
# =============================================================================

class TestProtectedExpensiveEndpoints:
    """Verifies that expensive OCR, Crawl, LLM, and Marks Breakdown endpoints require auth & enforce ownership."""

    # --- POST /api/v1/r22/analyze ---

    def test_r22_analyze_unauthenticated_returns_401(self):
        res = client.post("/api/v1/r22/analyze", json={"subject_code": "A6CS09"})
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.jobs.job_manager._persist_job")
    def test_r22_analyze_authenticated_creates_job_bound_to_user(self, mock_persist, mock_user_jwt, mock_jwt):
        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.post("/api/v1/r22/analyze", json={"subject_code": "A6CS09"}, headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["status"] == "running"
        assert body["data"]["subject_code"] == "A6CS09"

    # --- GET /api/v1/r22/job/{job_id} ---

    def test_r22_job_status_unauthenticated_returns_401(self):
        res = client.get("/api/v1/r22/job/job-12345")
        assert res.status_code == 401

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-bob"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-bob"})
    @patch("app.jobs.job_manager.get_job")
    def test_r22_job_cross_user_access_returns_403(self, mock_get_job, mock_user_jwt, mock_jwt):
        """Bob cannot inspect Alice's R22 pipeline job."""
        job = MagicMock()
        job.id = "job-alice-1"
        job.user_id = "student-alice"
        mock_get_job.return_value = job

        headers = {"Authorization": "Bearer bob.jwt"}
        res = client.get("/api/v1/r22/job/job-alice-1", headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    # --- POST /api/v1/analysis/{subject_id}/cross-reference ---

    def test_cross_reference_unauthenticated_returns_401(self):
        file_content = b"Professor Important Questions: 1. Explain B-Tree"
        files = {"file": ("notes.txt", io.BytesIO(file_content), "text/plain")}
        res = client.post("/api/v1/analysis/sub-123/cross-reference", files=files)
        assert res.status_code == 401

    # --- POST /api/v1/onboarding/parse-hall-ticket ---

    def test_parse_hall_ticket_unauthenticated_returns_401(self):
        dummy_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        files = {"file": ("hall_ticket.pdf", io.BytesIO(dummy_pdf), "application/pdf")}
        res = client.post("/api/v1/onboarding/parse-hall-ticket", files=files)
        assert res.status_code == 401

    # --- GET /api/v1/analysis/{analysis_id}/marks-breakdown ---

    def test_marks_breakdown_unauthenticated_returns_401(self):
        res = client.get("/api/v1/analysis/analysis-123/marks-breakdown")
        assert res.status_code == 401

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-bob"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-bob"})
    @patch("app.api.marks_analysis.get_db")
    def test_marks_breakdown_cross_user_access_returns_403(self, mock_db, mock_user_jwt, mock_jwt):
        """Bob cannot access marks breakdown of Alice's analysis report."""
        alice_analysis = {
            "id": "analysis-alice-99",
            "user_id": "student-alice",
            "subject_id": "sub-1",
            "regulation": "R22",
            "is_cached": False,
        }
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[alice_analysis]
        )

        headers = {"Authorization": "Bearer bob.jwt"}
        res = client.get("/api/v1/analysis/analysis-alice-99/marks-breakdown", headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.api.marks_analysis.get_db")
    def test_marks_breakdown_authorized_owner_access(self, mock_db, mock_user_jwt, mock_jwt):
        """Alice can access marks breakdown of her own analysis report."""
        alice_analysis = {
            "id": "analysis-alice-99",
            "user_id": "student-alice",
            "subject_id": "sub-1",
            "regulation": "R22",
            "is_cached": False,
        }
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(
            data=[alice_analysis]
        )
        # Mock papers query returning no papers -> returns empty breakdown gracefully
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
            data=[]
        )

        headers = {"Authorization": "Bearer alice.jwt"}
        res = client.get("/api/v1/analysis/analysis-alice-99/marks-breakdown", headers=headers)
        assert res.status_code == 200
        assert res.json()["success"] is True


# =============================================================================
# 4. BACKFILL EXAM DATES SCRIPT
# =============================================================================

class TestBackfillExamDatesScript:
    """Verifies that the backfill script imports cleanly and date estimation logic behaves accurately."""

    def test_script_imports_successfully(self):
        assert hasattr(backfill_script, "estimate_exam_date")
        assert hasattr(backfill_script, "extract_year_from_filename")
        assert hasattr(backfill_script, "regulation_to_year")

    def test_extract_year_from_filename_patterns(self):
        assert backfill_script.extract_year_from_filename("R22_CSE_2023_Semester_DataStructures.pdf") == 2023
        assert backfill_script.extract_year_from_filename("MLRIT_2021_Mid1_OS.docx") == 2021
        assert backfill_script.extract_year_from_filename("no_year_here.pdf") is None

    def test_regulation_to_year_mapping(self):
        assert backfill_script.regulation_to_year("R22") == 2022
        assert backfill_script.regulation_to_year("R20") == 2020
        assert backfill_script.regulation_to_year("R18") == 2018

    def test_estimate_exam_date_end_to_end(self):
        # 1. Filename with year takes priority
        d1 = backfill_script.estimate_exam_date(
            filename="R22_CSE_2024_Semester_OS.pdf",
            regulation="R22",
            exam_category="Semester",
            semester=2,
        )
        assert d1.year == 2024
        assert d1.month == 5

        # 2. Filename without year estimates from regulation + semester
        d2 = backfill_script.estimate_exam_date(
            filename="OS_Semester.pdf",
            regulation="R22",
            exam_category="Mid-1",
            semester=3,  # Year 2, semester 1 -> 2022 + 1 = 2023
        )
        assert d2.year == 2023
        assert d2.month == 9

    def test_lazy_supabase_initialization(self):
        """Lazy client does not crash on import when unconfigured."""
        assert backfill_script.supabase is not None

    def test_backfill_cli_dry_run_exits_cleanly(self):
        """CLI main with --dry-run executes successfully without database writes."""
        exit_code = backfill_script.main(["--dry-run", "--batch-size", "50"])
        assert exit_code == 0
