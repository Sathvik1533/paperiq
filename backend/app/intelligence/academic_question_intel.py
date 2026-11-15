"""
Shared Academic Question Intelligence Layer.
Provides verified previous question paper data, marks allocations,
curriculum mapping, and exam question matching across all PaperIQ modules:
- AI Academic Tutor
- Exam Pattern Analyst
- Student Study Planner
- Question Bank & Document Vault

Guaranteed single source of truth for MLRIT Autonomous R22 examinations.
"""
from __future__ import annotations
import re
from typing import Optional, List, Dict, Any, Tuple, Set
from collections import defaultdict
import uuid
from pydantic import BaseModel, Field

from app.database import get_db
from app.constants.r22_subjects import ALL_R22_SUBJECTS
from app.constants.r22_3_1_allowlist import (
    is_supported_3_1_code,
    SUPPORTED_3_1_CODES,
    OFFICIAL_3_1_SUBJECTS,
)
from app.logger import get_logger

log = get_logger(__name__)

SUPPORTED_3_1_SUBJECT_IDS: Set[str] = {
    info["id"] for info in OFFICIAL_3_1_SUBJECTS.values() if "id" in info
}

PAPER_SLUG_TO_UUID: Dict[str, str] = {
    "paper-mlrit-daa-r22-dec2023": "c3010000-0000-0000-0000-000000000001",
    "paper-mlrit-daa-r22-feb2024": "c3010000-0000-0000-0000-000000000001",
    "paper-mlrit-os-r22-may2024": "c2020000-0000-0000-0000-000000000011",
    "paper-mlrit-os-r22-june2023": "c2020000-0000-0000-0000-000000000012",
    "paper-mlrit-dm-r22-feb2024": "c2020000-0000-0000-0000-000000000008",
    "paper-mlrit-dbms-r22-may2024": "c2020000-0000-0000-0000-000000000009",
    "paper-mlrit-dbms-r22-june2023": "c2020000-0000-0000-0000-000000000010",
}

def resolve_paper_id(paper_id: str) -> str:
    """
    Resolve paper identifier whether passed as UUID or slug.
    If valid UUID string, returns normalized UUID string.
    If slug, resolves to canonical UUID matching seed IDs in 011_seed_r22_3_1_and_3_2_curriculum.sql.
    """
    if not paper_id:
        return ""
    clean_id = str(paper_id).strip()
    if clean_id in PAPER_SLUG_TO_UUID:
        return PAPER_SLUG_TO_UUID[clean_id]
    try:
        return str(uuid.UUID(clean_id))
    except ValueError:
        return str(uuid.uuid5(uuid.NAMESPACE_DNS, clean_id))



class VerifiedQuestion(BaseModel):
    id: str
    subject_code: str
    subject_name: str
    regulation: str = "R22"
    unit_number: int
    topic_name: str
    exam_year: int
    exam_session: str = "Regular"   # Regular | Supplementary | Mid-1 | Mid-2
    paper_id: str
    paper_title: str
    section: str                   # "Part A" (1M/2M) | "Part B" (5M/10M)
    question_number: str           # e.g. "1a", "2b", "8", "11a"
    question_text: str
    marks: int                     # 1, 5, 10
    marks_category: str            # "1_mark" | "5_marks" | "10_marks" | "10_marks_direct" | "5_marks_sub"
    is_direct_10m: bool = False
    is_subquestion_5m: bool = False
    marks_type: str = "1m"         # "1m" | "10m_direct" | "5m_sub"
    co: Optional[str] = None       # e.g. "CO1", "CO2"
    bloom_level: Optional[str] = None # e.g. "BL1", "BL2", "BL3"
    question_type: str = "theory"  # definition | theory | proof | numerical | problem | construction | comparison
    is_or_question: bool = False
    source_reference: str          # Traceable citation string e.g. "MLRIT R22 DAA Feb-2024 Regular Q8 (10M)"

    def __init__(self, **data):
        super().__init__(**data)
        # Auto-calibrate marks_type and flags
        if self.marks == 10:
            object.__setattr__(self, 'is_direct_10m', True)
            object.__setattr__(self, 'is_subquestion_5m', False)
            object.__setattr__(self, 'marks_type', '10m_direct')
            if self.marks_category == "10_marks":
                object.__setattr__(self, 'marks_category', '10_marks_direct')
        elif self.marks == 5:
            object.__setattr__(self, 'is_direct_10m', False)
            object.__setattr__(self, 'is_subquestion_5m', True)
            object.__setattr__(self, 'marks_type', '5m_sub')
            if self.marks_category == "5_marks":
                object.__setattr__(self, 'marks_category', '5_marks_sub')
        elif self.marks == 1:
            object.__setattr__(self, 'is_direct_10m', False)
            object.__setattr__(self, 'is_subquestion_5m', False)
            object.__setattr__(self, 'marks_type', '1m')
            if self.marks_category == "1_mark":
                object.__setattr__(self, 'marks_category', '1_mark')


class QuestionMatchResult(BaseModel):
    is_verified_exam_question: bool
    matched_question: Optional[VerifiedQuestion] = None
    confidence: float = 0.0        # 0.0 to 1.0
    detected_marks: Optional[int] = None
    default_format: str = "detailed" # "1_mark" | "5_marks" | "10_marks" | "detailed"
    historical_occurrences: List[Dict[str, Any]] = Field(default_factory=list)
    curriculum_context: Dict[str, Any] = Field(default_factory=dict)


def _safe_get_db():
    try:
        from app.config import settings
        from supabase import create_client
        # Prefer anon_key if service_key is a mock string, ensuring read access to live database
        key_to_use = settings.supabase_anon_key or settings.supabase_service_key
        if settings.supabase_url and key_to_use and "mock" not in key_to_use:
            return create_client(settings.supabase_url, key_to_use)
        return get_db()
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# CURATED AUTHORITATIVE MLRIT R22 QUESTION INTELLIGENCE REPOSITORY
# Grounded in official MLRIT Autonomous Semester Examination Question Papers
# ─────────────────────────────────────────────────────────────────────────────

_CURATED_QUESTIONS: List[VerifiedQuestion] = [
    # ── DAA (A6CS15) — Design and Analysis of Algorithms (R22 3-1) ───────────
    VerifiedQuestion(
        id="q-daa-001",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=5,
        topic_name="0/1 Knapsack Problem (Branch and Bound)",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Dec-2023",
        section="Part B",
        question_number="8",
        question_text="Explain 0/1 Knapsack problem using LC Branch and Bound technique with bounding equations and state space tree.",
        marks=10,
        marks_category="10_marks",
        co="CO5",
        bloom_level="BL3",
        question_type="numerical",
        source_reference="MLRIT R22 DAA Dec-2023 Regular Part B Q8 (10M)",
    ),
    VerifiedQuestion(
        id="q-daa-002",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=5,
        topic_name="0/1 Knapsack Problem (Branch and Bound)",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Feb-2024",
        section="Part B",
        question_number="9a",
        question_text="Solve 0/1 Knapsack problem using Least Cost (LC) Branch and Bound method for given weights and profits.",
        marks=10,
        marks_category="10_marks",
        co="CO5",
        bloom_level="BL3",
        question_type="problem",
        source_reference="MLRIT R22 DAA Feb-2024 Regular Part B Q9a (10M)",
    ),
    VerifiedQuestion(
        id="q-daa-003",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=1,
        topic_name="Asymptotic Notations",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Feb-2024",
        section="Part A",
        question_number="1a",
        question_text="Define Asymptotic Notations: Big-Oh, Big-Omega and Big-Theta.",
        marks=1,
        marks_category="1_mark",
        co="CO1",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DAA Feb-2024 Regular Part A Q1a (1M)",
    ),
    VerifiedQuestion(
        id="q-daa-004",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=2,
        topic_name="Minimum Cost Spanning Trees",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Dec-2023",
        section="Part B",
        question_number="4a",
        question_text="Construct Minimum Cost Spanning Tree for the given weighted graph using Kruskal's algorithm and Prim's algorithm.",
        marks=10,
        marks_category="10_marks",
        co="CO2",
        bloom_level="BL3",
        question_type="construction",
        source_reference="MLRIT R22 DAA Dec-2023 Regular Part B Q4a (10M)",
    ),
    VerifiedQuestion(
        id="q-daa-005",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=2,
        topic_name="Greedy Knapsack",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Feb-2024",
        section="Part B",
        question_number="5a",
        question_text="Explain Fractional Knapsack problem using Greedy method and state its algorithm.",
        marks=5,
        marks_category="5_marks",
        co="CO2",
        bloom_level="BL2",
        question_type="theory",
        source_reference="MLRIT R22 DAA Feb-2024 Regular Part B Q5a (5M)",
    ),
    VerifiedQuestion(
        id="q-daa-006",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=3,
        topic_name="Dynamic Programming Principle of Optimality",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Dec-2023",
        section="Part A",
        question_number="1c",
        question_text="State Principle of Optimality in Dynamic Programming.",
        marks=1,
        marks_category="1_mark",
        co="CO3",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DAA Dec-2023 Regular Part A Q1c (1M)",
    ),
    VerifiedQuestion(
        id="q-daa-007",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=3,
        topic_name="All Pairs Shortest Path (Floyd-Warshall)",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Dec-2023",
        section="Part B",
        question_number="6",
        question_text="Find All-Pairs Shortest Path for the given directed graph using Floyd-Warshall Dynamic Programming algorithm.",
        marks=10,
        marks_category="10_marks",
        co="CO3",
        bloom_level="BL3",
        question_type="problem",
        source_reference="MLRIT R22 DAA Dec-2023 Regular Part B Q6 (10M)",
    ),
    VerifiedQuestion(
        id="q-daa-008",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=4,
        topic_name="N-Queens Problem (Backtracking)",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Feb-2024",
        section="Part B",
        question_number="7a",
        question_text="Explain 4-Queens and 8-Queens problem using Backtracking with state space tree representation.",
        marks=5,
        marks_category="5_marks",
        co="CO4",
        bloom_level="BL2",
        question_type="theory",
        source_reference="MLRIT R22 DAA Feb-2024 Regular Part B Q7a (5M)",
    ),
    VerifiedQuestion(
        id="q-daa-009",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=4,
        topic_name="Hamiltonian Cycles",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Dec-2023",
        section="Part A",
        question_number="1d",
        question_text="What is a Hamiltonian Cycle in graph theory?",
        marks=1,
        marks_category="1_mark",
        co="CO4",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DAA Dec-2023 Regular Part A Q1d (1M)",
    ),
    VerifiedQuestion(
        id="q-daa-010",
        subject_code="A6CS15",
        subject_name="Design and Analysis of Algorithms",
        regulation="R22",
        unit_number=5,
        topic_name="Cook's Theorem & NP-Completeness",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c3010000-0000-0000-0000-000000000001",
        paper_title="MLRIT R22 III B.Tech I Semester Regular Examinations, Feb-2024",
        section="Part A",
        question_number="1e",
        question_text="State Cook's Theorem and define NP-Complete class.",
        marks=1,
        marks_category="1_mark",
        co="CO5",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DAA Feb-2024 Regular Part A Q1e (1M)",
    ),

    # ── Operating System (A6CS11) (R22 2-2) ──────────────────────────────────
    VerifiedQuestion(
        id="q-os-001",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=3,
        topic_name="Banker's Algorithm & Deadlock Avoidance",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000011",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part B",
        question_number="6",
        question_text="Explain Deadlock Avoidance using Banker's Algorithm with a numeric example showing whether the system is in a safe state.",
        marks=10,
        marks_category="10_marks",
        co="CO3",
        bloom_level="BL3",
        question_type="numerical",
        source_reference="MLRIT R22 OS May-2024 Regular Part B Q6 (10M)",
    ),
    VerifiedQuestion(
        id="q-os-002",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=3,
        topic_name="Deadlock Characterization",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000011",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part A",
        question_number="1c",
        question_text="What are the four necessary conditions for Deadlock occurrence?",
        marks=1,
        marks_category="1_mark",
        co="CO3",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 OS May-2024 Regular Part A Q1c (1M)",
    ),
    VerifiedQuestion(
        id="q-os-003",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=1,
        topic_name="Process Control Block",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000012",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, June-2023",
        section="Part A",
        question_number="1a",
        question_text="Define Process Control Block (PCB) and list its components.",
        marks=1,
        marks_category="1_mark",
        co="CO1",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 OS June-2023 Regular Part A Q1a (1M)",
    ),
    VerifiedQuestion(
        id="q-os-004",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=1,
        topic_name="CPU Scheduling Algorithms",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000011",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part B",
        question_number="2a",
        question_text="Compare FCFS, SJF and Round Robin CPU scheduling algorithms with Gantt chart for given arrival and burst times.",
        marks=5,
        marks_category="5_marks",
        co="CO1",
        bloom_level="BL3",
        question_type="problem",
        source_reference="MLRIT R22 OS May-2024 Regular Part B Q2a (5M)",
    ),
    VerifiedQuestion(
        id="q-os-005",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=2,
        topic_name="Process Synchronization & Semaphores",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000012",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, June-2023",
        section="Part B",
        question_number="4a",
        question_text="Explain Critical Section problem and how Semaphores solve the mutual exclusion condition.",
        marks=5,
        marks_category="5_marks",
        co="CO2",
        bloom_level="BL2",
        question_type="theory",
        source_reference="MLRIT R22 OS June-2023 Regular Part B Q4a (5M)",
    ),
    VerifiedQuestion(
        id="q-os-006",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=4,
        topic_name="Paging & Address Translation",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000011",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part B",
        question_number="8",
        question_text="Explain Paging hardware architecture with Translation Lookaside Buffer (TLB) and calculate Effective Access Time.",
        marks=10,
        marks_category="10_marks",
        co="CO4",
        bloom_level="BL3",
        question_type="numerical",
        source_reference="MLRIT R22 OS May-2024 Regular Part B Q8 (10M)",
    ),
    VerifiedQuestion(
        id="q-os-007",
        subject_code="A6CS11",
        subject_name="Operating System",
        regulation="R22",
        unit_number=4,
        topic_name="Page Replacement Algorithms",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000012",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, June-2023",
        section="Part B",
        question_number="9a",
        question_text="Calculate page faults using FIFO, LRU and Optimal page replacement algorithms for reference string with 3 page frames.",
        marks=10,
        marks_category="10_marks",
        co="CO4",
        bloom_level="BL3",
        question_type="problem",
        source_reference="MLRIT R22 OS June-2023 Regular Part B Q9a (10M)",
    ),

    # ── Discrete Mathematics (A6CS08) (R22 2-2) ──────────────────────────────
    VerifiedQuestion(
        id="q-dm-001",
        subject_code="A6CS08",
        subject_name="Discrete Mathematics",
        regulation="R22",
        unit_number=1,
        topic_name="Propositional Logic",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000008",
        paper_title="MLRIT R22 II B.Tech I Semester Regular Examinations, February-2024",
        section="Part A",
        question_number="1b",
        question_text="Define propositional logic?",
        marks=1,
        marks_category="1_mark",
        co="CO1",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DM Feb-2024 Regular Part A Q1b (1M)",
    ),
    VerifiedQuestion(
        id="q-dm-002",
        subject_code="A6CS08",
        subject_name="Discrete Mathematics",
        regulation="R22",
        unit_number=2,
        topic_name="Relations & Equivalence",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000008",
        paper_title="MLRIT R22 II B.Tech I Semester Regular Examinations, February-2024",
        section="Part A",
        question_number="1c",
        question_text="Give a suitable example for a relation, when is not equivalence.",
        marks=1,
        marks_category="1_mark",
        co="CO2",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DM Feb-2024 Regular Part A Q1c (1M)",
    ),
    VerifiedQuestion(
        id="q-dm-003",
        subject_code="A6CS08",
        subject_name="Discrete Mathematics",
        regulation="R22",
        unit_number=2,
        topic_name="Hasse Diagram & Partial Ordering",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000008",
        paper_title="MLRIT R22 II B.Tech I Semester Regular Examinations, February-2024",
        section="Part B",
        question_number="4a",
        question_text="Draw the Hasse diagram for the partial ordering on the power set e(S) where S={a,b,c} and <= is subset relation.",
        marks=5,
        marks_category="5_marks",
        co="CO2",
        bloom_level="BL2",
        question_type="construction",
        source_reference="MLRIT R22 DM Feb-2024 Regular Part B Q4a (5M)",
    ),
    VerifiedQuestion(
        id="q-dm-004",
        subject_code="A6CS08",
        subject_name="Discrete Mathematics",
        regulation="R22",
        unit_number=4,
        topic_name="Generating Functions & Recurrence Relations",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000008",
        paper_title="MLRIT R22 II B.Tech I Semester Regular Examinations, February-2024",
        section="Part B",
        question_number="8",
        question_text="Solve the recurrence relation an - 9an-1 + 20an-2 = 0 with a0 = -3, a1 = -10 using generating functions.",
        marks=10,
        marks_category="10_marks",
        co="CO4",
        bloom_level="BL3",
        question_type="numerical",
        source_reference="MLRIT R22 DM Feb-2024 Regular Part B Q8 (10M)",
    ),
    VerifiedQuestion(
        id="q-dm-005",
        subject_code="A6CS08",
        subject_name="Discrete Mathematics",
        regulation="R22",
        unit_number=5,
        topic_name="Kruskal's Algorithm for Minimum Spanning Tree",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000008",
        paper_title="MLRIT R22 II B.Tech I Semester Regular Examinations, February-2024",
        section="Part B",
        question_number="11a",
        question_text="Construct minimum spanning tree for the following graph using Kruskal's algorithm.",
        marks=5,
        marks_category="5_marks",
        co="CO5",
        bloom_level="BL2",
        question_type="construction",
        source_reference="MLRIT R22 DM Feb-2024 Regular Part B Q11a (5M)",
    ),

    # ── Database Management Systems (A6CS09) (R22 2-2) ───────────────────────
    VerifiedQuestion(
        id="q-dbms-001",
        subject_code="A6CS09",
        subject_name="Database Management Systems",
        regulation="R22",
        unit_number=3,
        topic_name="Schema Refinement & Normal Forms",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000009",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part B",
        question_number="6",
        question_text="Explain 1NF, 2NF, 3NF and BCNF with functional dependencies and decompose a given relation into BCNF.",
        marks=10,
        marks_category="10_marks",
        co="CO3",
        bloom_level="BL3",
        question_type="theory",
        source_reference="MLRIT R22 DBMS May-2024 Regular Part B Q6 (10M)",
    ),
    VerifiedQuestion(
        id="q-dbms-002",
        subject_code="A6CS09",
        subject_name="Database Management Systems",
        regulation="R22",
        unit_number=4,
        topic_name="ACID Properties of Transactions",
        exam_year=2024,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000009",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, May-2024",
        section="Part A",
        question_number="1d",
        question_text="State and define the ACID properties of a database transaction.",
        marks=1,
        marks_category="1_mark",
        co="CO4",
        bloom_level="BL1",
        question_type="definition",
        source_reference="MLRIT R22 DBMS May-2024 Regular Part A Q1d (1M)",
    ),
    VerifiedQuestion(
        id="q-dbms-003",
        subject_code="A6CS09",
        subject_name="Database Management Systems",
        regulation="R22",
        unit_number=4,
        topic_name="Two Phase Locking (2PL) Protocol",
        exam_year=2023,
        exam_session="Regular",
        paper_id="c2020000-0000-0000-0000-000000000010",
        paper_title="MLRIT R22 II B.Tech II Semester Regular Examinations, June-2023",
        section="Part B",
        question_number="8a",
        question_text="Explain Strict Two-Phase Locking (2PL) and Rigorous 2PL protocols for concurrency control.",
        marks=5,
        marks_category="5_marks",
        co="CO4",
        bloom_level="BL2",
        question_type="theory",
        source_reference="MLRIT R22 DBMS June-2023 Regular Part B Q8a (5M)",
    ),
]


class AcademicQuestionIntelligence:
    """
    Central service for querying, matching, and retrieving verified academic exam intelligence.
    Shared across Tutor, Exam Analyst, Planner, and Document Vault.
    """

    @classmethod
    def get_all_curated_questions(cls) -> List[VerifiedQuestion]:
        # Strict 3-1 scoping
        return [q for q in _CURATED_QUESTIONS if is_supported_3_1_code(q.subject_code)]

    @classmethod
    def resolve_paper_id(cls, paper_id: str) -> str:
        return resolve_paper_id(paper_id)

    @classmethod
    def get_questions_by_paper_id(cls, paper_id: str) -> List[VerifiedQuestion]:
        canonical_id = resolve_paper_id(paper_id)
        return [q for q in _CURATED_QUESTIONS if q.paper_id == canonical_id]

    @classmethod
    def find_matching_question(
        cls,
        query: str,
        subject_code: Optional[str] = None,
        regulation: str = "R22",
    ) -> QuestionMatchResult:
        """
        Match student query against verified previous exam questions.
        Uses token overlap, keyword matching, and subject scoping.
        Strict 3-1 scoping: non-3-1 subjects never match verified exam questions.
        """
        query_clean = re.sub(r"[^\w\s]", " ", query.lower()).strip()
        query_tokens = [w for w in query_clean.split() if w]
        stop_words = {
            "what", "is", "explain", "the", "and", "or", "for", "with", "of", "in",
            "describe", "give", "define", "discuss", "show", "solve", "using", "how",
            "does", "can", "you", "me", "a", "an", "to", "state", "problem", "write",
            "about", "briefly", "detail", "calculate"
        }
        query_keywords = {w for w in query_tokens if len(w) >= 3 and w not in stop_words}

        generic_academic_words = {
            "programming", "system", "systems", "algorithm", "algorithms",
            "problem", "problems", "method", "methods", "concept", "concepts",
            "theory", "process", "processes", "language", "structure", "structures"
        }

        def word_matches(w1: str, w2: str) -> bool:
            if w1 == w2:
                return True
            if len(w1) >= 4 and len(w2) >= 4:
                # Prefix matching for inflections: proposition/propositional, safe/safety, recur/recurrence
                min_len = min(len(w1), len(w2))
                prefix_len = min(min_len, 5)
                if w1[:prefix_len] == w2[:prefix_len]:
                    return True
            return False

        best_question: Optional[VerifiedQuestion] = None
        best_score = 0.0
        occurrences = []

        # 1. First check curated authoritative repository (Strict 3-1 Only)
        candidates = [q for q in _CURATED_QUESTIONS if is_supported_3_1_code(q.subject_code)]
        if subject_code:
            candidates = [q for q in candidates if q.subject_code == subject_code]

        for q in candidates:
            topic_clean = re.sub(r"[^\w\s]", " ", q.topic_name.lower())
            topic_keywords = {w for w in topic_clean.split() if len(w) >= 3 and w not in stop_words}

            q_clean = re.sub(r"[^\w\s]", " ", q.question_text.lower())
            q_tokens = [w for w in q_clean.split() if w]
            q_keywords = {w for w in q_tokens if len(w) >= 3 and w not in stop_words}

            score = 0.0

            # 1. Topic name matching
            if topic_clean.strip() in query_clean or query_clean in topic_clean.strip():
                score = 0.95
            else:
                specific_matches = [
                    qw for qw in query_keywords
                    if any(word_matches(qw, tw) for tw in topic_keywords) and qw not in generic_academic_words
                ]
                all_matches = [
                    qw for qw in query_keywords
                    if any(word_matches(qw, tw) for tw in topic_keywords)
                ]
                # Require either specific non-generic keyword match or multiple keyword matches
                if specific_matches and (len(specific_matches) >= 1 or len(all_matches) >= 2):
                    score = max(score, 0.75 + 0.20 * (len(all_matches) / max(len(topic_keywords), 1)))

            # 2. Question text matching
            if not score:
                q_match_count = sum(
                    1 for qw in query_keywords if any(word_matches(qw, tw) for tw in q_keywords)
                )
                if query_keywords:
                    overlap_ratio = q_match_count / len(query_keywords)
                    if overlap_ratio >= 0.40:
                        score = max(score, 0.50 + 0.40 * overlap_ratio)

            if score > best_score:
                best_score = score
                best_question = q

            if score >= 0.40:
                occurrences.append({
                    "paper_id": q.paper_id,
                    "paper_title": q.paper_title,
                    "year": q.exam_year,
                    "session": q.exam_session,
                    "section": q.section,
                    "question_number": q.question_number,
                    "marks": q.marks,
                    "marks_category": q.marks_category,
                    "co": q.co,
                })

        # Strict 3-1 scoping: non-3-1 subjects must never match database records (e.g. DBMS, OS)
        if subject_code and not is_supported_3_1_code(subject_code):
            return QuestionMatchResult(
                is_verified_exam_question=False,
                matched_question=None,
                confidence=0.0,
                detected_marks=None,
                default_format="detailed",
                historical_occurrences=[],
                curriculum_context={},
            )

        # 2. Check Database for additional past questions if DB is available
        db = _safe_get_db()
        if db and query_keywords:
            try:
                for kw in list(query_keywords)[:3]:
                    if len(kw) < 4 or kw in generic_academic_words:
                        continue
                    q_builder = db.table("questions").select(
                        "id, question_number, part, question_text, marks, exam_year, regulation, subject_id, co, unit_number, topic_name, bloom_level, paper_id"
                    ).ilike("question_text", f"%{kw}%")
                    if subject_code:
                        sub_res = db.table("subjects").select("id").eq("code", subject_code).limit(1).execute()
                        if sub_res.data:
                            q_builder = q_builder.eq("subject_id", sub_res.data[0]["id"])
                    db_qs = q_builder.limit(5).execute().data or []

                    for db_q in db_qs:
                        # Ensure question belongs to supported 3-1 curriculum
                        q_sub_id = db_q.get("subject_id")
                        if q_sub_id and str(q_sub_id) not in SUPPORTED_3_1_SUBJECT_IDS:
                            continue

                        marks_val = db_q.get("marks")
                        q_text = db_q.get("question_text", "")
                        q_clean_db = re.sub(r"[^\w\s]", " ", q_text.lower())
                        db_tokens = set(q_clean_db.split())
                        db_kw = {w for w in db_tokens if len(w) >= 3 and w not in stop_words}
                        overlap = query_keywords.intersection(db_kw)
                        db_score = len(overlap) / max(len(query_keywords), 1)

                        paper_id_resolved = resolve_paper_id(db_q.get("paper_id") or "c3010000-0000-0000-0000-000000000001")

                        if marks_val:
                            occurrences.append({
                                "paper_id": paper_id_resolved,
                                "year": db_q.get("exam_year", 2024),
                                "section": db_q.get("part", "Part B"),
                                "question_number": str(db_q.get("question_number", "")),
                                "marks": marks_val,
                                "co": db_q.get("co"),
                            })

                        # If not already matched by curated list, match from database
                        if db_score > best_score and marks_val and best_question is None:
                            best_score = db_score
                            sec = db_q.get("part") or ("Part A" if marks_val == 1 else "Part B")
                            q_num = str(db_q.get("question_number") or "")
                            year_val = db_q.get("exam_year") or 2024
                            sub_ref = f"MLRIT R22 {subject_code or 'EXAM'} {year_val} {sec} Q{q_num} ({marks_val}M)"
                            best_question = VerifiedQuestion(
                                id=db_q.get("id"),
                                subject_code=subject_code or "R22",
                                subject_name="MLRIT University Course",
                                regulation="R22",
                                unit_number=db_q.get("unit_number") or 1,
                                topic_name=db_q.get("topic_name") or kw.title(),
                                exam_year=year_val,
                                paper_id=paper_id_resolved,
                                paper_title=f"MLRIT Autonomous Examinations {year_val}",
                                section=sec,
                                question_number=q_num,
                                question_text=q_text,
                                marks=marks_val,
                                marks_category=f"{marks_val}_marks" if marks_val in (1, 5, 10) else "detailed",
                                co=db_q.get("co"),
                                bloom_level=db_q.get("bloom_level") or "BL2",
                                source_reference=sub_ref,
                            )
            except Exception as e:
                log.debug(f"[AcademicQuestionIntelligence] DB question scan: {e}")

        is_verified = best_score >= 0.55 and best_question is not None

        detected_marks = best_question.marks if (is_verified and best_question) else None
        default_format = "detailed"
        if detected_marks == 1:
            default_format = "1_mark"
        elif detected_marks == 5:
            default_format = "5_marks"
        elif detected_marks == 10:
            default_format = "10_marks"

        curriculum_context = {}
        if best_question:
            curriculum_context = {
                "unit_number": best_question.unit_number,
                "topic_name": best_question.topic_name,
                "co": best_question.co,
                "bloom_level": best_question.bloom_level,
                "source_reference": best_question.source_reference,
            }

        return QuestionMatchResult(
            is_verified_exam_question=is_verified,
            matched_question=best_question if is_verified else None,
            confidence=round(best_score, 2),
            detected_marks=detected_marks,
            default_format=default_format,
            historical_occurrences=occurrences,
            curriculum_context=curriculum_context,
        )

    @classmethod
    def get_questions_by_subject_and_unit(
        cls,
        subject_code: str,
        unit_number: Optional[int] = None,
        marks: Optional[int] = None,
    ) -> List[VerifiedQuestion]:
        res = [q for q in _CURATED_QUESTIONS if q.subject_code == subject_code]
        if unit_number is not None:
            res = [q for q in res if q.unit_number == unit_number]
        if marks is not None:
            res = [q for q in res if q.marks == marks]
        return res

    @classmethod
    def get_eligible_60m_questions(
        cls,
        subject_code: Optional[str] = None,
        unit_number: Optional[int] = None,
        marks_type: Optional[str] = None,
        year: Optional[int] = None,
    ) -> List[VerifiedQuestion]:
        """
        Retrieves MLRIT Autonomous R22 60-mark regular examination questions.
        Strict 60-mark rules:
        - Regular exams only (no supplementary).
        - 2024 and 2025 examinations only.
        - Segregated by mark types: 1m, 10m_direct, 5m_sub.
        """
        # Filter curated authoritative questions (Strict 3-1 only)
        res = [
            q for q in _CURATED_QUESTIONS 
            if q.regulation == "R22" 
            and q.exam_session == "Regular" 
            and q.exam_year in (2024, 2025)
            and is_supported_3_1_code(q.subject_code)
        ]
        if subject_code:
            res = [q for q in res if q.subject_code == subject_code]
        if unit_number is not None:
            res = [q for q in res if q.unit_number == unit_number]
        if marks_type:
            res = [q for q in res if q.marks_type == marks_type]
        if year:
            res = [q for q in res if q.exam_year == year]
        return res

    @classmethod
    def get_60m_question_frequencies(
        cls,
        subject_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Calculates question frequencies adhering to the 60-mark regular rule:
        - Excludes 70-mark papers.
        - Excludes supplementary papers.
        - Calculates direct 10M frequencies separately from 5M subquestion frequencies.
        - Tracks exact source papers for every question.
        """
        from app.utils.exam_pattern_validator import (
            analyze_60m_question_frequencies,
            validate_paper_60m_structure,
            PaperEligibilityStatus,
        )

        # 1. Retrieve eligible questions from curated repository
        curated_qs = cls.get_eligible_60m_questions(subject_code=subject_code)
        q_dicts = [q.model_dump() for q in curated_qs]
        paper_lookup: Dict[str, dict] = {}
        for q in curated_qs:
            if q.paper_id and q.paper_title:
                paper_lookup[q.paper_id] = {
                    "id": q.paper_id,
                    "title": q.paper_title,
                    "exam_year": q.exam_year,
                    "regulation": q.regulation,
                }

        # 2. Augment with strictly eligible DB questions if DB is available
        db = _safe_get_db()
        if db:
            try:
                # Fetch candidate papers for R22 Regular 2024–2025
                papers_res = db.table("papers").select("id, title, exam_year, exam_type, regulation").eq("regulation", "R22").eq("exam_type", "Regular").in_("exam_year", [2024, 2025]).execute()
                candidate_papers = papers_res.data or []

                if candidate_papers:
                    candidate_ids = [p["id"] for p in candidate_papers]
                    
                    # Fetch subject filter id if subject_code provided
                    target_subject_id = None
                    if subject_code:
                        sub_res = db.table("subjects").select("id").eq("code", subject_code).limit(1).execute()
                        if sub_res.data:
                            target_subject_id = sub_res.data[0]["id"]

                    # Query all questions for candidate papers (paginated)
                    all_candidate_qs = []
                    offset = 0
                    while True:
                        q_query = db.table("questions").select("*").in_("paper_id", candidate_ids).range(offset, offset + 999)
                        if target_subject_id:
                            q_query = q_query.eq("subject_id", target_subject_id)
                        batch = q_query.execute().data or []
                        all_candidate_qs.extend(batch)
                        if len(batch) < 1000:
                            break
                        offset += 1000

                    # Group questions by paper_id to perform structure validation
                    qs_by_paper = defaultdict(list)
                    for q in all_candidate_qs:
                        qs_by_paper[q.get("paper_id")].append(q)

                    # Validate each paper against 60M regular structure
                    for p in candidate_papers:
                        pid = p["id"]
                        p_qs = qs_by_paper.get(pid, [])
                        val = validate_paper_60m_structure(p, p_qs)
                        if val.get("is_eligible") and val.get("status") == PaperEligibilityStatus.ELIGIBLE_60M:
                            paper_lookup[pid] = p
                            for q in p_qs:
                                # Ensure paper_title is present for source paper display
                                q_copy = dict(q)
                                q_copy["paper_title"] = p.get("title") or f"MLRIT R22 Paper {p.get('exam_year', '')}"
                                q_dicts.append(q_copy)
            except Exception as e:
                log.warning(f"Error fetching DB questions for 60M frequencies: {e}")

        return analyze_60m_question_frequencies(q_dicts, paper_lookup=paper_lookup)
