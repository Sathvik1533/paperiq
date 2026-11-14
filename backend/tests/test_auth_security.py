"""
Regression tests for authentication and authorization security.
Tests missing, malformed, expired, valid credentials, and ownership enforcement.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from jose import JWTError
from app.main import app

client = TestClient(app, raise_server_exceptions=False)


class TestUnauthenticatedAccess:
    """Verifies that protected routes reject unauthenticated requests with HTTP 401."""

    def test_planner_progress_unauthenticated_returns_401(self):
        res = client.get("/api/v1/planner/progress")
        assert res.status_code == 401
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "HTTP_401"
        assert "Authentication required" in body["error"]["message"]

    def test_analysis_overview_unauthenticated_returns_401(self):
        res = client.get("/api/v1/analysis/overview")
        assert res.status_code == 401
        body = res.json()
        assert body["success"] is False
        assert body["error"]["code"] == "HTTP_401"

    def test_planner_plan_id_unauthenticated_returns_401(self):
        res = client.get("/api/v1/planner/some-plan-id")
        assert res.status_code == 401

    def test_readiness_calculate_unauthenticated_returns_401(self):
        payload = {
            "user_id": "test-user-1",
            "subject_id": "sub-1",
            "regulation": "R22",
        }
        res = client.post("/api/v1/readiness/calculate", json=payload)
        assert res.status_code == 401

    def test_readiness_get_unauthenticated_returns_401(self):
        res = client.get("/api/v1/readiness?subject_id=sub1&regulation=R22&user_id=test-user-1")
        assert res.status_code == 401

    def test_activity_post_unauthenticated_returns_401(self):
        payload = {
            "user_id": "test-user-1",
            "activity_type": "study",
            "subject_id": "sub-1",
            "regulation": "R22",
        }
        res = client.post("/api/v1/activity", json=payload)
        assert res.status_code == 401

    def test_activity_summary_unauthenticated_returns_401(self):
        res = client.get("/api/v1/activity/summary?subject_id=sub1&regulation=R22&user_id=test-user-1")
        assert res.status_code == 401

    def test_analysis_report_unauthenticated_returns_401(self):
        res = client.get("/api/v1/analysis/some-report-id")
        assert res.status_code == 401
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "HTTP_401"

    def test_analysis_status_unauthenticated_returns_401(self):
        res = client.get("/api/v1/analysis/some-report-id/status")
        assert res.status_code == 401
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "HTTP_401"

    def test_analysis_cached_unauthenticated_returns_401(self):
        res = client.get("/api/v1/analysis/cached?subject_id=A6CS15&regulation=R22")
        assert res.status_code == 401
        assert res.json()["success"] is False
        assert res.json()["error"]["code"] == "HTTP_401"


class TestMalformedAndExpiredCredentials:
    """Verifies handling of invalid, malformed, and expired tokens."""

    def test_malformed_authorization_header(self):
        headers = {"Authorization": "Basic dXNlcjpwYXNz"}
        res = client.get("/api/v1/planner/progress", headers=headers)
        assert res.status_code == 401
        assert "Missing or malformed authorization header" in res.json()["error"]["message"]

    def test_empty_bearer_token(self):
        headers = {"Authorization": "Bearer "}
        res = client.get("/api/v1/planner/progress", headers=headers)
        assert res.status_code == 401

    @patch("app.auth.user_auth.verify_supabase_jwt", side_effect=JWTError("Signature has expired"))
    def test_expired_jwt_token(self, mock_verify):
        headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.expired"}
        res = client.get("/api/v1/planner/progress", headers=headers)
        assert res.status_code == 401
        assert "Invalid or expired token" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", side_effect=JWTError("Invalid signature"))
    def test_invalid_signature_jwt(self, mock_verify):
        headers = {"Authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.tampered"}
        res = client.get("/api/v1/analysis/overview", headers=headers)
        assert res.status_code == 401


class TestValidCredentialsAndOwnership:
    """Verifies successful authorization with valid credentials and user ownership enforcement."""

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-valid-123"})
    def test_valid_token_allows_planner_progress(self, mock_verify):
        headers = {"Authorization": "Bearer valid.jwt.token"}
        res = client.get("/api/v1/planner/progress", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["user_id"] == "user-valid-123"

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-valid-123"})
    def test_valid_token_allows_analysis_overview(self, mock_verify):
        headers = {"Authorization": "Bearer valid.jwt.token"}
        res = client.get("/api/v1/analysis/overview", headers=headers)
        assert res.status_code == 200
        body = res.json()
        assert body["success"] is True
        assert body["data"]["user_id"] == "user-valid-123"

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    def test_ownership_violation_returns_403(self, mock_verify):
        # Alice tries to calculate readiness for Bob
        headers = {"Authorization": "Bearer alice.jwt.token"}
        payload = {
            "user_id": "user-bob",
            "subject_id": "sub-1",
            "regulation": "R22",
        }
        res = client.post("/api/v1/readiness/calculate", json=payload, headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    def test_ownership_violation_on_activity_summary(self, mock_verify):
        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get(
            "/api/v1/activity/summary?subject_id=sub1&regulation=R22&user_id=user-bob",
            headers=headers,
        )
        assert res.status_code == 403


class TestSafeHandlingOfInvalidResourceIds:
    """Verifies that non-existent or malformed UUIDs return 404 rather than unhandled 500."""

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-123"})
    def test_invalid_uuid_analysis_report_returns_404(self, mock_verify):
        headers = {"Authorization": "Bearer valid.token"}
        res = client.get("/api/v1/analysis/not-a-valid-uuid-overview", headers=headers)
        assert res.status_code == 404

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-123"})
    def test_invalid_uuid_study_plan_returns_404(self, mock_verify):
        headers = {"Authorization": "Bearer valid.token"}
        res = client.get("/api/v1/planner/not-a-valid-uuid-progress", headers=headers)
        assert res.status_code == 404


class TestCrossUserDataIsolation:
    """DEF-2: Verifies cross-user analysis data isolation and prevents data leakage."""

    def test_analysis_overview_isolates_user_reports(self):
        """User A must NOT receive User B's reports even though service-role DB client is used."""
        all_reports = [
            {
                "id": "rep-alice-01",
                "user_id": "user-alice",
                "subject_id": "A6CS15",
                "regulation": "R22",
                "branch_id": "cse",
                "generated_at": "2026-11-14T10:00:00Z",
                "status": "ready",
            },
            {
                "id": "rep-alice-02",
                "user_id": "user-alice",
                "subject_id": "A6CS18",
                "regulation": "R22",
                "branch_id": "cse",
                "generated_at": "2026-11-14T09:00:00Z",
                "status": "ready",
            },
            {
                "id": "rep-bob-01",
                "user_id": "user-bob",
                "subject_id": "A6IT13",
                "regulation": "R22",
                "branch_id": "it",
                "generated_at": "2026-11-14T11:00:00Z",
                "status": "ready",
            },
            {
                "id": "rep-bob-02",
                "user_id": "user-bob",
                "subject_id": "A6CS16",
                "regulation": "R22",
                "branch_id": "cse",
                "generated_at": "2026-11-14T08:00:00Z",
                "status": "ready",
            },
        ]

        class FilteringTable:
            def __init__(self, data):
                self._data = data
                self._user_filter = None

            def select(self, *args, **kwargs):
                return self

            def eq(self, col, val):
                if col == "user_id":
                    self._user_filter = val
                return self

            def order(self, *args, **kwargs):
                return self

            def limit(self, *args, **kwargs):
                return self

            def execute(self):
                if self._user_filter:
                    matched = [r for r in self._data if r["user_id"] == self._user_filter]
                else:
                    matched = self._data  # unfiltered (the buggy behavior)
                return MagicMock(data=matched)

        mock_db = MagicMock()
        mock_db.table.side_effect = lambda t: FilteringTable(all_reports)

        with patch("app.api.analysis.get_db", return_value=mock_db):
            # 1. Alice requests overview
            with patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"}):
                res_alice = client.get(
                    "/api/v1/analysis/overview",
                    headers={"Authorization": "Bearer alice.jwt.token"},
                )
                assert res_alice.status_code == 200
                data_alice = res_alice.json()["data"]
                assert data_alice["user_id"] == "user-alice"
                assert data_alice["total_reports"] == 2
                report_ids_alice = [r["id"] for r in data_alice["reports"]]
                assert "rep-alice-01" in report_ids_alice
                assert "rep-alice-02" in report_ids_alice
                assert "rep-bob-01" not in report_ids_alice
                assert "rep-bob-02" not in report_ids_alice

            # 2. Bob requests overview
            with patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-bob"}):
                res_bob = client.get(
                    "/api/v1/analysis/overview",
                    headers={"Authorization": "Bearer bob.jwt.token"},
                )
                assert res_bob.status_code == 200
                data_bob = res_bob.json()["data"]
                assert data_bob["user_id"] == "user-bob"
                assert data_bob["total_reports"] == 2
                report_ids_bob = [r["id"] for r in data_bob["reports"]]
                assert "rep-bob-01" in report_ids_bob
                assert "rep-bob-02" in report_ids_bob
                assert "rep-alice-01" not in report_ids_bob
                assert "rep-alice-02" not in report_ids_bob


class TestComputeEndpointsProtection:
    """DEF-4: Verifies authentication, ownership, and isolation on all compute endpoints."""

    # --- Unauthenticated access (HTTP 401) ---

    def test_mock_generate_unauthenticated_returns_401(self):
        payload = {"report_id": "rep-1", "regulation": "R22", "subject_id": "A6CS15"}
        res = client.post("/api/v1/mock/generate", json=payload)
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    def test_mock_get_unauthenticated_returns_401(self):
        res = client.get("/api/v1/mock/some-mock-uuid")
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    def test_analysis_generate_unauthenticated_returns_401(self):
        payload = {"subject_id": "A6CS15", "regulation": "R22"}
        res = client.post("/api/v1/analysis/generate", json=payload)
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    def test_analysis_run_unauthenticated_returns_401(self):
        payload = {"subject_id": "A6CS15", "regulation": "R22"}
        res = client.post("/api/v1/analysis/run", json=payload)
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    def test_analysis_simple_unauthenticated_returns_401(self):
        payload = {
            "user_id": "user-alice",
            "subject_id": "A6CS15",
            "exam_category": "Semester",
            "exam_attempt": "Regular",
        }
        res = client.post("/api/v1/analysis/simple", json=payload)
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    # --- Resource Ownership & Cross-User Tampering (HTTP 403) ---

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.planner.get_db")
    def test_mock_generate_cross_user_report_access_blocked(self, mock_get_db, mock_verify):
        """Alice cannot generate a mock exam from Bob's private report."""
        bob_report = {
            "id": "rep-bob-private",
            "user_id": "user-bob",
            "regulation": "R22",
            "subject_id": "A6CS15",
            "report_data": {"regulation": "R22", "user_id": "user-bob"},
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[bob_report])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        payload = {"report_id": "rep-bob-private", "regulation": "R22", "subject_id": "A6CS15"}
        res = client.post("/api/v1/mock/generate", json=payload, headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.planner.get_db")
    def test_mock_get_cross_user_access_blocked(self, mock_get_db, mock_verify):
        """Alice cannot read Bob's mock exam."""
        bob_mock = {
            "id": "mock-bob-123",
            "user_id": "user-bob",
            "subject_id": "A6CS15",
            "mock_data": {"questions": []},
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[bob_mock])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/mock/mock-bob-123", headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.analysis.get_db")
    def test_analysis_report_cross_user_access_blocked(self, mock_get_db, mock_verify):
        """Alice cannot read Bob's analysis report via GET /analysis/{report_id}."""
        bob_report = {
            "id": "rep-bob-777",
            "user_id": "user-bob",
            "subject_id": "A6CS15",
            "report_data": {"id": "rep-bob-777", "user_id": "user-bob"},
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[bob_report])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/analysis/rep-bob-777", headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.analysis.get_db")
    def test_analysis_status_cross_user_access_blocked(self, mock_get_db, mock_verify):
        """Alice cannot read the status of Bob's analysis report."""
        bob_report = {
            "id": "rep-bob-777",
            "status": "ready",
            "user_id": "user-bob",
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[bob_report])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/analysis/rep-bob-777/status", headers=headers)
        assert res.status_code == 403
        assert "Cannot access another user's resources" in res.json()["error"]["message"]

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.analysis.get_db")
    def test_analysis_cached_isolates_user_reports(self, mock_get_db, mock_verify):
        """Alice querying GET /analysis/cached cannot receive Bob's cached report."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        # Return empty list when queried for Alice's user_id
        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.eq.return_value.gt.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(data=[])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/analysis/cached?subject_id=A6CS15&regulation=R22", headers=headers)
        assert res.status_code == 404
        assert "No cached report found" in res.json()["error"]["message"]

    # --- Authorized Owner Access (HTTP 200/201) ---

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.planner.MockExamGenerator")
    @patch("app.api.planner.get_db")
    def test_mock_generate_authorized_owner_associates_user(self, mock_get_db, mock_gen_cls, mock_verify):
        """Alice can generate a mock exam from Alice's report, and the generated mock is associated with Alice."""
        alice_report = {
            "id": "rep-alice-01",
            "user_id": "user-alice",
            "regulation": "R22",
            "subject_id": "A6CS15",
            "report_data": {
                "regulation": "R22",
                "user_id": "user-alice",
                "high_probability_topics_classified": [],
                "repeated_questions": [],
            },
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[alice_report])

        mock_gen = MagicMock()
        mock_gen.generate.return_value = {
            "mock_id": "mock-alice-new",
            "questions": [],
            "total_marks": 70,
            "part_a_count": 5,
            "part_b_count": 5,
        }
        mock_gen_cls.return_value = mock_gen

        headers = {"Authorization": "Bearer alice.jwt.token"}
        payload = {"report_id": "rep-alice-01", "regulation": "R22", "subject_id": "A6CS15"}
        res = client.post("/api/v1/mock/generate", json=payload, headers=headers)
        assert res.status_code == 201
        data = res.json()
        assert data["mock_id"] == "mock-alice-new"
        assert data["user_id"] == "user-alice"

        # Verify DB insert record included user_id
        inserted_record = mock_db.table.return_value.insert.call_args[0][0]
        assert inserted_record["user_id"] == "user-alice"
        assert inserted_record["id"] == "mock-alice-new"

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.planner.get_db")
    def test_mock_get_authorized_owner_access(self, mock_get_db, mock_verify):
        """Alice can read Alice's mock exam."""
        alice_mock = {
            "id": "mock-alice-123",
            "user_id": "user-alice",
            "subject_id": "A6CS15",
            "total_marks": 70,
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[alice_mock])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/mock/mock-alice-123", headers=headers)
        assert res.status_code == 200
        assert res.json()["id"] == "mock-alice-123"

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.analysis.get_db")
    def test_analysis_report_authorized_owner_access(self, mock_get_db, mock_verify):
        """Alice can read Alice's analysis report."""
        alice_report = {
            "id": "rep-alice-01",
            "user_id": "user-alice",
            "subject_id": "A6CS15",
            "report_data": {"id": "rep-alice-01", "user_id": "user-alice", "status": "ready"},
        }
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[alice_report])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/analysis/rep-alice-01", headers=headers)
        assert res.status_code == 200
        assert res.json()["id"] == "rep-alice-01"

    # --- 404 Responses for Nonexistent Resources ---

    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "user-alice"})
    @patch("app.api.planner.get_db")
    def test_nonexistent_mock_returns_404(self, mock_get_db, mock_verify):
        """Nonexistent mock ID returns HTTP 404."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_db.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value = MagicMock(data=[])

        headers = {"Authorization": "Bearer alice.jwt.token"}
        res = client.get("/api/v1/mock/nonexistent-mock-id", headers=headers)
        assert res.status_code == 404
        assert "Mock exam not found" in res.json()["error"]["message"]
