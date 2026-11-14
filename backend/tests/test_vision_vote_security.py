"""
Security and integrity tests for Vision Roadmap voting (/api/v1/vision/vote).
Verifies feature whitelisting, duplicate vote prevention, voter fingerprinting,
authenticated voting, JWT verification, rate limiting, and public read access.
"""
import hashlib
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from jose import JWTError

from app.main import app
from app.limiter import limiter

client = TestClient(app, raise_server_exceptions=False)


class TestVisionVoteSecurity:
    """Security verification for vision voting."""

    @pytest.fixture(autouse=True)
    def reset_limiter_fixture(self):
        limiter.reset()
        yield
        limiter.reset()

    def test_empty_feature_id_returns_400(self):
        res = client.post("/api/v1/vision/vote", json={"feature_id": ""})
        assert res.status_code == 400
        msg = res.json().get("error", {}).get("message", "")
        assert "feature_id is required" in msg

    def test_unapproved_feature_id_rejected(self):
        res = client.post("/api/v1/vision/vote", json={"feature_id": "crypto_miner_3000"})
        assert res.status_code == 400
        msg = res.json().get("error", {}).get("message", "")
        assert "Invalid feature_id" in msg

    def test_public_read_votes_for_feature(self):
        # Public read should succeed unauthenticated even with no DB configured
        res = client.get("/api/v1/vision/votes/exam_intelligence")
        assert res.status_code == 200
        data = res.json()
        assert "feature_id" in data
        assert "count" in data
        assert isinstance(data["count"], int)

    def test_public_list_all_votes(self):
        res = client.get("/api/v1/vision/votes")
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True
        votes = data.get("votes", {})
        assert "exam_intelligence" in votes
        assert "exam_mentor" in votes
        assert "academic_os" in votes
        assert "the_future" in votes

    @patch("app.api.vision_vote.get_db")
    def test_rpc_record_vote_success(self, mock_get_db):
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 42}
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={"User-Agent": "TestBrowser/1.0"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["count"] == 42
        assert body["feature_id"] == "exam_intelligence"

    @patch("app.api.vision_vote.get_db")
    def test_duplicate_vote_prevention(self, mock_get_db):
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {
            "status": "already_voted",
            "count": 42,
            "message": "Vote has already been recorded for this feature",
        }
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={"User-Agent": "TestBrowser/1.0"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "already_voted"
        assert "already recorded" in body["message"]

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    def test_authenticated_user_vote_deduplication(self, mock_verify, mock_get_db):
        mock_verify.return_value = {"sub": "student-uuid-999"}
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        # First vote succeeds via fallback tables
        mock_db.rpc.side_effect = Exception("No RPC")
        # Duplicate check finds no existing vote
        mock_existing = MagicMock()
        mock_existing.data = []
        # Count check
        mock_count = MagicMock()
        mock_count.data = [{"count": 5}]

        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_count

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_mentor"},
            headers={"Authorization": "Bearer valid.token.here"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    # =========================================================================
    # DEF-1: Regression tests for Vision Votes JWT verification
    # =========================================================================

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    def test_valid_authenticated_jwt_identifies_user_uuid(self, mock_verify, mock_get_db):
        """1. Valid authenticated JWT must be identified using verified Supabase user UUID."""
        user_uuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
        mock_verify.return_value = {"sub": user_uuid}
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 10}
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_mentor"},
            headers={
                "Authorization": "Bearer valid.jwt.token",
                "User-Agent": "AuthenticClient/1.0",
            },
        )
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        # Verify RPC was called with the verified user UUID and deterministic user hash
        expected_hash = hashlib.sha256(f"user:{user_uuid}".encode()).hexdigest()
        mock_db.rpc.assert_called_once_with(
            "record_vision_vote",
            {
                "p_feature_id": "exam_mentor",
                "p_voter_hash": expected_hash,
                "p_user_id": user_uuid,
            },
        )

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", side_effect=JWTError("Invalid signature"))
    def test_invalid_jwt_rejected_with_401(self, mock_verify, mock_get_db):
        """2. Invalid JWTs must be rejected with HTTP 401 (cannot silently downgrade to anon)."""
        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={
                "Authorization": "Bearer invalid.tampered.token",
                "User-Agent": "TamperedClient/1.0",
            },
        )
        assert res.status_code == 401
        assert "Invalid or expired token" in res.json()["error"]["message"]

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", side_effect=JWTError("Signature has expired"))
    def test_expired_jwt_rejected_with_401(self, mock_verify, mock_get_db):
        """3. Expired JWTs must be rejected with HTTP 401 (cannot silently downgrade to anon)."""
        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "academic_os"},
            headers={
                "Authorization": "Bearer expired.jwt.token",
                "User-Agent": "ExpiredClient/1.0",
            },
        )
        assert res.status_code == 401
        assert "Invalid or expired token" in res.json()["error"]["message"]

    def test_malformed_bearer_token_rejected_with_401(self):
        """Malformed or non-bearer Authorization header is rejected with HTTP 401."""
        res1 = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={"Authorization": "Bearer "},
        )
        assert res1.status_code == 401

        res2 = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={"Authorization": "Basic dXNlcjpwYXNz"},
        )
        assert res2.status_code == 401

    @patch("app.api.vision_vote.get_db")
    def test_anonymous_voter_preserves_anon_mechanism(self, mock_get_db):
        """4. Anonymous voter without Authorization header is correctly hashed as anon."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 3}
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "the_future"},
            headers={"User-Agent": "AnonStudentBrowser/2.0"},
        )
        assert res.status_code == 200

        called_args = mock_db.rpc.call_args[0][1]
        assert called_args["p_user_id"] is None
        expected_hash = hashlib.sha256(b"anon:testclient:AnonStudentBrowser/2.0:v1").hexdigest()
        assert called_args["p_voter_hash"] == expected_hash

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    def test_duplicate_authenticated_vote(self, mock_verify, mock_get_db):
        """5. Duplicate authenticated vote for the same feature is rejected."""
        mock_verify.return_value = {"sub": "authenticated-uuid-456"}
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {
            "status": "already_voted",
            "count": 15,
            "message": "Vote already recorded for this feature",
        }
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_mentor"},
            headers={"Authorization": "Bearer valid.token.456"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "already_voted"
        assert body["count"] == 15

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    def test_authenticated_user_cannot_bypass_dedup_with_changed_user_agent(self, mock_verify, mock_get_db):
        """6. Authenticated user attempting to vote again with a changed User-Agent cannot bypass deduplication."""
        mock_verify.return_value = {"sub": "student-uuid-stable-123"}
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        # First vote with Chrome
        mock_rpc_first = MagicMock()
        mock_rpc_first.execute.return_value.data = {"status": "voted", "count": 1}
        mock_db.rpc.return_value = mock_rpc_first

        res1 = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "academic_os"},
            headers={
                "Authorization": "Bearer valid.token",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0",
            },
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "ok"
        hash_1 = mock_db.rpc.call_args[0][1]["p_voter_hash"]

        # Second vote with Safari (attempting Sybil evasion via User-Agent rotation)
        mock_rpc_second = MagicMock()
        mock_rpc_second.execute.return_value.data = {
            "status": "already_voted",
            "count": 1,
            "message": "Vote already recorded for this feature",
        }
        mock_db.rpc.return_value = mock_rpc_second

        res2 = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "academic_os"},
            headers={
                "Authorization": "Bearer valid.token",
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/17.0",
            },
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "already_voted"
        hash_2 = mock_db.rpc.call_args[0][1]["p_voter_hash"]

        # Voter hashes must be identical because authenticated hash depends only on user UUID
        assert hash_1 == hash_2
        assert hash_1 == hashlib.sha256(b"user:student-uuid-stable-123").hexdigest()

    @patch("app.api.vision_vote.get_db")
    def test_async_coroutine_verify_jwt_awaited_cleanly(self, mock_get_db):
        """Regression test for DEF-1: async coroutine verify_supabase_jwt must be properly awaited."""
        user_uuid = "async-user-uuid-1111"
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 20}
        mock_db.rpc.return_value = mock_rpc

        async def async_verify(token):
            return {"sub": user_uuid}

        with patch("app.auth.jwt_verifier.verify_supabase_jwt", side_effect=async_verify):
            res = client.post(
                "/api/v1/vision/vote",
                json={"feature_id": "exam_intelligence"},
                headers={"Authorization": "Bearer valid.async.token"},
            )
            assert res.status_code == 200
            assert res.json()["status"] == "ok"
            called_args = mock_db.rpc.call_args[0][1]
            assert called_args["p_user_id"] == user_uuid
            assert called_args["p_voter_hash"] == hashlib.sha256(f"user:{user_uuid}".encode()).hexdigest()

    @patch("app.api.vision_vote.get_db")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    def test_table_fallback_duplicate_vote_rejection(self, mock_verify, mock_get_db):
        """Duplicate vote is rejected even when database RPC is unavailable and fallback tables are used."""
        mock_verify.return_value = {"sub": "student-uuid-fallback"}
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db

        # RPC raises exception, forcing table fallback
        mock_db.rpc.side_effect = Exception("RPC not found")
        # Duplicate check returns an existing row
        mock_existing = MagicMock()
        mock_existing.data = [{"id": "existing-vote-id"}]
        mock_count = MagicMock()
        mock_count.data = [{"count": 8}]

        mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_existing
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_count

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_mentor"},
            headers={"Authorization": "Bearer valid.token"},
        )
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "already_voted"
        assert body["count"] == 8
        assert "already recorded" in body["message"]

    # =========================================================================
    # DEF-3: Regression tests for Voting Rate Limiting
    # =========================================================================

    @patch("app.api.vision_vote.get_db")
    def test_rate_limit_enforced_after_5_requests(self, mock_get_db):
        """Verify rate limit of 5 requests per minute is strictly enforced on POST /vision/vote."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 1}
        mock_db.rpc.return_value = mock_rpc

        # First 5 requests within the minute must succeed (HTTP 200)
        for i in range(5):
            res = client.post(
                "/api/v1/vision/vote",
                json={"feature_id": "exam_intelligence"},
                headers={"User-Agent": f"Client-{i}"},
            )
            assert res.status_code == 200, f"Request {i+1} failed with {res.status_code}"

        # 6th request must be rejected with HTTP 429 Too Many Requests
        res6 = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={"User-Agent": "Client-6"},
        )
        assert res6.status_code == 429
        body = res6.json()
        assert body["success"] is False
        assert body["error"]["code"] == "HTTP_429"
        assert "Rate limit exceeded" in body["error"]["message"]

    @patch("app.api.vision_vote.get_db")
    def test_rate_limit_normal_voting_behavior(self, mock_get_db):
        """Verify normal voting behavior functions cleanly under the rate limit."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 5}
        mock_db.rpc.return_value = mock_rpc

        res = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_mentor"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    @patch("app.api.vision_vote.get_db")
    def test_sybil_defense_cannot_bypass_rate_limit_with_spoofed_headers(self, mock_get_db):
        """Ensure client-supplied headers (e.g. X-Forwarded-For, User-Agent) cannot bypass rate limiter."""
        mock_db = MagicMock()
        mock_get_db.return_value = mock_db
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = {"status": "voted", "count": 1}
        mock_db.rpc.return_value = mock_rpc

        # Consume the 5 requests allowance with rotating spoof headers
        for i in range(5):
            res = client.post(
                "/api/v1/vision/vote",
                json={"feature_id": "exam_intelligence"},
                headers={
                    "X-Forwarded-For": f"198.51.100.{i+10}",
                    "User-Agent": f"SpoofBot/{i}.0",
                },
            )
            assert res.status_code == 200

        # 6th request attempting to spoof a different client IP header must still be rate-limited
        res_spoofed = client.post(
            "/api/v1/vision/vote",
            json={"feature_id": "exam_intelligence"},
            headers={
                "X-Forwarded-For": "203.0.113.250",
                "User-Agent": "SpoofBot/99.0",
            },
        )
        assert res_spoofed.status_code == 429

