"""
Comprehensive tests for PaperIQ AI Companion:
- Authentication enforcement & 401 rejection
- Intent routing across all 5 specialist capabilities
- Full vertical slice: Student message -> Intent routing -> Specialist capability -> Grounded response -> Persistence -> Retrieval
- Multi-tenant conversation isolation (Alice vs Bob)
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.companion.orchestrator import get_companion_orchestrator
from app.companion.models import CompanionIntent, SpecialistType

client = TestClient(app, raise_server_exceptions=False)


class TestCompanionAuthentication:
    """Verifies that companion endpoints require valid student authentication."""

    def test_unauthenticated_chat_returns_401(self):
        res = client.post("/api/v1/companion/chat", json={"message": "Explain semaphores"})
        assert res.status_code == 401
        assert "Authentication required" in res.json()["error"]["message"]

    def test_unauthenticated_conversations_list_returns_401(self):
        res = client.get("/api/v1/companion/conversations")
        assert res.status_code == 401

    def test_specialists_metadata_endpoint_public_or_accessible(self):
        res = client.get("/api/v1/companion/specialists")
        assert res.status_code == 200
        specialists = res.json()
        assert len(specialists) == 5
        specialist_ids = [s["id"] for s in specialists]
        assert "academic_tutor" in specialist_ids
        assert "syllabus_intelligence" in specialist_ids
        assert "exam_prep_analyst" in specialist_ids
        assert "planner_coach" in specialist_ids
        assert "document_retriever" in specialist_ids


class TestIntentClassification:
    """Verifies intent routing logic for each specialist capability."""

    def setup_method(self):
        self.orchestrator = get_companion_orchestrator()

    def test_routes_to_academic_tutor(self):
        queries = [
            "Explain Banker's Algorithm with an example",
            "Derive the time complexity of Kruskal's algorithm",
            "What is the difference between paging and segmentation in OS?",
            "Define semaphores and explain the critical section problem",
        ]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.ACADEMIC_TUTOR, f"Query '{q}' routed to {specialist}"

    def test_routes_to_syllabus_intelligence(self):
        queries = [
            "What is the syllabus for Operating Systems Unit 3?",
            "Which topics are covered in Unit 1 of DBMS?",
            "What are the Course Outcomes (COs) for Java?",
            "Show me the curriculum structure for R22 2-2 subjects",
        ]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.SYLLABUS_INTELLIGENCE, f"Query '{q}' routed to {specialist}"

    def test_routes_to_exam_prep_analyst(self):
        queries = [
            "What are the most repeated questions in Operating Systems?",
            "Which topics have the highest probability for the Mid-1 exam?",
            "Show me the marks breakdown and frequency trends in DBMS",
            "What are the important questions for Part B?",
        ]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.EXAM_PREP_ANALYST, f"Query '{q}' routed to {specialist}"

    def test_routes_to_planner_coach(self):
        queries = [
            "I have my OS exam in 7 days, create a daily study plan",
            "How is my Exam Readiness score calculated?",
            "Create a revision schedule for my upcoming examinations",
            "How should I prepare 3 days before the test?",
        ]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.PLANNER_COACH, f"Query '{q}' routed to {specialist}"

    def test_routes_to_document_retriever(self):
        queries = [
            "Find the 2024 Semester question paper for Operating Systems",
            "Where can I download past papers for Discrete Math?",
            "Get me previous year question papers for A6CS09",
            "Show past papers from 2023",
        ]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.DOCUMENT_RETRIEVER, f"Query '{q}' routed to {specialist}"

    def test_routes_to_general_guidance(self):
        queries = ["hi", "hello there", "help", "what can you do"]
        for q in queries:
            intent, specialist = self.orchestrator.classify_intent(q)
            assert specialist == SpecialistType.GENERAL_MENTOR

    def test_additional_intent_classification_edge_cases(self):
        cases = [
            ("which questions are important for unit 1?", SpecialistType.EXAM_PREP_ANALYST),
            ("give me exam papers", SpecialistType.DOCUMENT_RETRIEVER),
            ("what topics are in unit 1?", SpecialistType.SYLLABUS_INTELLIGENCE),
            ("how should i prepare with 5 days remaining?", SpecialistType.PLANNER_COACH),
            ("derive the time complexity of kruskal algorithm", SpecialistType.ACADEMIC_TUTOR),
        ]
        for query, expected_spec in cases:
            intent, spec = self.orchestrator.classify_intent(query)
            assert spec == expected_spec, f"Query '{query}' classified as {spec}, expected {expected_spec}"


class TestCompanionVerticalSlice:
    """Verifies complete end-to-end user journey: message -> routing -> specialist -> persistence -> retrieval."""

    @patch("app.main.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    def test_full_vertical_slice_academic_tutor(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        """Alice sends an academic question and receives a grounded tutoring answer."""
        headers = {"Authorization": "Bearer alice.jwt"}
        chat_payload = {
            "message": "Explain Deadlock avoidance and Banker's Algorithm with an example",
            "subject_code": "A6CS09",
            "regulation": "R22",
        }

        res = client.post("/api/v1/companion/chat", json=chat_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert "conversation_id" in data
        conv_id = data["conversation_id"]

        msg = data["message"]
        assert msg["role"] == "assistant"
        assert msg["intent"] == "academic_tutor"
        assert msg["specialist"] == "academic_tutor"
        assert "Banker's Algorithm" in msg["content"] or "Deadlock" in msg["content"]
        assert data["specialist_badge"] == "AI Academic Tutor"
        assert len(data["suggested_actions"]) > 0

        # Verify conversation history persisted
        res_history = client.get(f"/api/v1/companion/conversations/{conv_id}", headers=headers)
        assert res_history.status_code == 200
        history_data = res_history.json()
        assert history_data["id"] == conv_id
        # Student message + Assistant message = 2 messages
        assert len(history_data["messages"]) == 2
        assert history_data["messages"][0]["role"] == "student"
        assert history_data["messages"][0]["content"] == chat_payload["message"]
        assert history_data["messages"][1]["role"] == "assistant"

        # Verify conversation list includes the session
        res_list = client.get("/api/v1/companion/conversations", headers=headers)
        assert res_list.status_code == 200
        summaries = res_list.json()
        assert any(s["id"] == conv_id for s in summaries)

    @patch("app.main.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    def test_vertical_slice_syllabus_intelligence(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        headers = {"Authorization": "Bearer alice.jwt"}
        chat_payload = {
            "message": "What is the syllabus structure for Operating Systems Unit 2?",
            "subject_code": "A6CS09",
            "regulation": "R22",
        }
        res = client.post("/api/v1/companion/chat", json=chat_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["message"]["specialist"] == "syllabus_intelligence"
        assert "Unit" in data["message"]["content"]
        assert len(data["message"]["citations"]) > 0

    @patch("app.main.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    def test_vertical_slice_planner_coach(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        headers = {"Authorization": "Bearer alice.jwt"}
        chat_payload = {
            "message": "Create a 7-day study plan for my upcoming exam",
            "subject_code": "A6CS09",
            "regulation": "R22",
        }
        res = client.post("/api/v1/companion/chat", json=chat_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["message"]["specialist"] == "planner_coach"
        assert "Day 1" in data["message"]["content"]
        assert "Masterplan" in data["message"]["content"]

    @patch("app.main.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.jwt_verifier.verify_supabase_jwt", return_value={"sub": "student-alice"})
    @patch("app.auth.user_auth.verify_supabase_jwt", return_value={"sub": "student-alice"})
    def test_vertical_slice_document_retrieval(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        headers = {"Authorization": "Bearer alice.jwt"}
        chat_payload = {
            "message": "Find past question papers from 2024 Semester",
            "subject_code": "A6CS09",
            "regulation": "R22",
        }
        res = client.post("/api/v1/companion/chat", json=chat_payload, headers=headers)
        assert res.status_code == 200
        data = res.json()
        assert data["message"]["specialist"] == "document_retriever"
        assert "Academic Document Archive" in data["message"]["content"]


class TestMultiTenantConversationIsolation:
    """Verifies that conversations are strictly private and inaccessible across students."""

    @patch("app.main.verify_supabase_jwt")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    @patch("app.auth.user_auth.verify_supabase_jwt")
    def test_bob_cannot_access_or_delete_alice_conversation(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        # 1. Alice creates a conversation
        mock_main_jwt.return_value = {"sub": "student-alice"}
        mock_jwt.return_value = {"sub": "student-alice"}
        mock_user_jwt.return_value = {"sub": "student-alice"}
        alice_headers = {"Authorization": "Bearer alice.jwt"}

        res_alice = client.post(
            "/api/v1/companion/chat",
            json={"message": "Alice confidential study notes"},
            headers=alice_headers,
        )
        assert res_alice.status_code == 200
        alice_conv_id = res_alice.json()["conversation_id"]

        # 2. Bob attempts to access Alice's conversation
        mock_main_jwt.return_value = {"sub": "student-bob"}
        mock_jwt.return_value = {"sub": "student-bob"}
        mock_user_jwt.return_value = {"sub": "student-bob"}
        bob_headers = {"Authorization": "Bearer bob.jwt"}

        res_bob_get = client.get(f"/api/v1/companion/conversations/{alice_conv_id}", headers=bob_headers)
        assert res_bob_get.status_code in (403, 404)

        # 3. Bob attempts to delete Alice's conversation
        res_bob_del = client.delete(f"/api/v1/companion/conversations/{alice_conv_id}", headers=bob_headers)
        assert res_bob_del.status_code in (403, 404)

        # 4. Alice's conversation is still intact
        mock_main_jwt.return_value = {"sub": "student-alice"}
        mock_jwt.return_value = {"sub": "student-alice"}
        mock_user_jwt.return_value = {"sub": "student-alice"}
        res_alice_verify = client.get(f"/api/v1/companion/conversations/{alice_conv_id}", headers=alice_headers)
        assert res_alice_verify.status_code == 200

    @patch("app.main.verify_supabase_jwt")
    @patch("app.auth.jwt_verifier.verify_supabase_jwt")
    @patch("app.auth.user_auth.verify_supabase_jwt")
    def test_bob_cannot_hijack_alice_conversation_id_via_chat(self, mock_user_jwt, mock_jwt, mock_main_jwt):
        """Bob cannot send a message into or hijack Alice's conversation ID."""
        # 1. Alice creates conversation
        mock_main_jwt.return_value = {"sub": "student-alice"}
        mock_jwt.return_value = {"sub": "student-alice"}
        mock_user_jwt.return_value = {"sub": "student-alice"}
        alice_headers = {"Authorization": "Bearer alice.jwt"}

        res_alice = client.post(
            "/api/v1/companion/chat",
            json={"message": "Alice secret query"},
            headers=alice_headers,
        )
        assert res_alice.status_code == 200
        alice_conv_id = res_alice.json()["conversation_id"]

        # 2. Bob tries to send a message using Alice's conversation_id
        mock_main_jwt.return_value = {"sub": "student-bob"}
        mock_jwt.return_value = {"sub": "student-bob"}
        mock_user_jwt.return_value = {"sub": "student-bob"}
        bob_headers = {"Authorization": "Bearer bob.jwt"}

        res_bob = client.post(
            "/api/v1/companion/chat",
            json={"message": "Bob hijack attempt", "conversation_id": alice_conv_id},
            headers=bob_headers,
        )
        # Should be rejected with 403 or 500 error containing 403 Forbidden
        assert res_bob.status_code in (403, 500)
        assert "403" in str(res_bob.json()) or "Forbidden" in str(res_bob.json())
