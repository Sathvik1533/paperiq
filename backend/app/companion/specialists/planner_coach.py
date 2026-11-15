"""
Student Planning and Progress Specialist.
Constructs personalized daily study schedules, monitors exam readiness,
and guides revision strategies based on exam deadlines.

v2.1: LLM-enhanced planner with day-by-day structured schedules,
      explicit study-day elicitation, and improved fallback.
"""
import re
from typing import Dict, Any, List, Tuple
from app.companion.specialists.base import BaseSpecialist, resolve_subject
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.llm.base import TaskType
from app.database import get_db
from app.constants.r22_subjects import ALL_R22_SUBJECTS
from app.logger import get_logger

log = get_logger(__name__)


def _safe_get_db():
    try:
        return get_db()
    except Exception:
        return None


def _extract_days_from_query(query: str) -> int | None:
    """
    Pull an explicit number of study days from the user's query.
    Returns None if no number is detected so we can ask for it.
    """
    # e.g. "7-day", "7 day", "seven day", "in 5 days"
    word_map = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
        "fourteen": 14, "fifteen": 15, "thirty": 30,
    }
    # Numeric match
    num_match = re.search(r"\b(\d+)\s*[-\s]?days?\b", query, re.IGNORECASE)
    if num_match:
        return int(num_match.group(1))
    # Word match
    for word, val in word_map.items():
        if re.search(r"\b" + word + r"\b", query, re.IGNORECASE):
            return val
    return None


# ---------------------------------------------------------------------------
# Static, subject-specific 7-day schedules (deterministic fallback)
# ---------------------------------------------------------------------------

_SCHEDULE_7DAY: dict[str, str] = {
    "A6CS15": """\
| Day | Focus Area | Topics & Deliverables | Hours |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I – Divide & Conquer** | Asymptotic notations (O/Ω/Θ), Master Theorem (3 cases), Merge Sort trace, Quick Sort worst-case analysis, Strassen's matrix multiply | 3.0 |
| **Day 2** | **Unit II – Greedy Method** | Fractional Knapsack proof, Job Sequencing with Deadlines (table trace), Prim's MST on 6-vertex graph, Kruskal's with Union-Find, Dijkstra's SSSP | 3.0 |
| **Day 3** | **Unit III – Dynamic Programming** | Principle of Optimality, Floyd-Warshall D^(k) matrix step-by-step, OBST e[i,j]/w[i,j]/root[i,j] tables, 0/1 Knapsack DP table trace | 3.5 |
| **Day 4** | **Unit IV – Backtracking** | 4-Queens & 8-Queens state-space tree with place(k,i) bounding, Sum of Subsets problem tree, Graph m-colorability pruning | 3.0 |
| **Day 5** | **Unit V – Branch & Bound + NP** | LC B&B for 0/1 Knapsack (upper bound = greedy relaxation), TSP LC B&B tour expansion, Cook's Theorem proof sketch, NP-Hard vs NP-Complete | 3.5 |
| **Day 6** | **High-Frequency PYQ Drill** | 10-mark timed questions from MLRIT 2021–2024 papers: Knapsack (DP + LCBB), Floyd-Warshall, 8-Queens, Kruskal's, NP-Completeness | 3.5 |
| **Day 7** | **Final Revision & Mock Exam** | Part A 2M blitz (20 definitions in 30 min) + full 3-hr mock exam (60 marks, autonomous pattern), review mistakes | 3.0 |""",

    "A6CS18": """\
| Day | Focus Area | Topics & Deliverables | Hours |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I – Network Models & Physical Layer** | OSI vs TCP/IP models, Packet vs Circuit Switching, Transmission Media, Framing | 2.5 |
| **Day 2** | **Unit II – Data Link Layer & MAC** | Flow Control (Stop-and-Wait, Go-Back-N, Selective Repeat), Error Detection (CRC, Checksum), CSMA/CD | 3.0 |
| **Day 3** | **Unit III – Network Layer & Routing** | IPv4/IPv6 Addressing, Subnetting, Distance Vector (Bellman-Ford) & Link State (Dijkstra) routing traces | 3.5 |
| **Day 4** | **Unit IV – Transport Layer** | TCP vs UDP, TCP 3-Way Handshake, TCP Congestion Control (AIMD, Slow Start), Leaky Bucket / Token Bucket | 3.0 |
| **Day 5** | **Unit V – Application Layer & Security** | DNS, HTTP/HTTPS, SMTP, RSA Cryptography numerical, Symmetric vs Asymmetric encryption | 3.0 |
| **Day 6** | **PYQ Sprint (2024–2025 Regular)** | Timed 10M questions: CRC calculation, Dijkstra routing table, TCP connection management, Subnet calculation | 3.5 |
| **Day 7** | **Final Revision & Mock Exam** | Part A 1M blitz (10 definitions in 20 min) + full 3-hr mock exam (60 marks autonomous pattern), review mistakes | 3.0 |""",
}

_SCHEDULE_GENERIC = """\
| Day | Focus Area | Topics & Deliverables | Hours |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I – Foundations** | Core definitions, formal notations, architectural overview, key formulas | 2.5 |
| **Day 2** | **Unit II – Core Mechanisms** | Mathematical representations, design principles, structured processes | 3.0 |
| **Day 3** | **Unit III – Algorithms & Models** | High-probability Part B questions, algorithm traces, numerical problems | 3.5 |
| **Day 4** | **Unit IV – Policies & Strategies** | Real-world policies, comparative analysis, edge-case walkthroughs | 3.0 |
| **Day 5** | **Unit V – Advanced Topics & Numericals** | Derivations, proofs, complex numerical problems, boundary conditions | 3.0 |
| **Day 6** | **PYQ Sprint** | Solve 5 previous 10M Part B questions under timed conditions | 3.5 |
| **Day 7** | **Final Revision & Mock** | Part A 2M blitz + 3-hour full mock exam | 3.0 |"""


def _build_plan_markdown(subject_code: str, subject_info: dict, days: int) -> str:
    """
    Construct the structured plan markdown deterministically.
    Uses subject-specific schedules for known codes, generic for others.
    When days != 7, we adjust the header label; for multi-day flexibility
    we could interpolate, but keep the 7-day grid as the gold standard.
    """
    schedule_md = _SCHEDULE_7DAY.get(subject_code, _SCHEDULE_GENERIC)
    days_label = f"{days}-Day" if days else "7-Day"
    total_hours = round((days or 7) * 3.0, 1)

    return f"""### 🗓️ {days_label} Study Masterplan — {subject_info['name']} (`{subject_code}`)

**Target**: A+ Grade (80%+ SGPA Bracket) | **Daily Commitment**: 3.0–3.5 hrs  
**Regulation**: MLRIT Autonomous R22 | **Projected Total**: {total_hours} hrs across {days or 7} days

---

{schedule_md}

---

#### 📈 Exam-Focused Strategy (R22 Autonomous Pattern)

| Priority | Action | Why |
| :--- | :--- | :--- |
| 🔴 **High** | Cover Units III & V first if short on time | Algorithmic numericals = deterministic 10M scores |
| 🟡 **Medium** | Write Part A definitions by hand each morning | 10M in Part A; zero partial credit if skipped |
| 🟢 **Habit** | Solve one past 10M question under timed conditions daily | Exam simulation beats passive re-reading every time |

> **Format drill**: Each 10M answer = Introduction (2 lines) + Algorithm/Derivation (steps, diagrams) + Example trace + Time complexity. Write it in 15–18 minutes.
"""


class PlannerCoachSpecialist(BaseSpecialist):
    specialist_type = SpecialistType.PLANNER_COACH
    badge = "Study Planner Coach"
    description = "Adaptive study planning, daily revision schedules, and exam readiness tracking."

    # LLM system context for study plan generation
    _SYSTEM_INSTRUCTION = (
        "You are PaperIQ Study Planner Coach for MLRIT Autonomous R22 engineering students. "
        "Your sole purpose is to build realistic, day-by-day study schedules. Rules:\n"
        "1. ALWAYS produce a Markdown table with Day | Focus Area | Topics & Deliverables | Hours columns.\n"
        "2. Each day maps to exactly ONE R22 syllabus unit (5 units total); Days 6–7 are PYQ drill and mock exam.\n"
        "3. Topics must be specific exam-ready items (algorithm names, numerical problem types) — NEVER generic advice like 'stay motivated' or 'take breaks'.\n"
        "4. If the student hasn't stated how many days they have, ask ONCE: 'How many days do you have before the exam?'\n"
        "5. Never invent subject codes or units not in the R22 curriculum."
    )

    _LLM_PROMPT_TEMPLATE = """\
Student request: "{query}"
Subject: {subject_name} ({subject_code}), R22 Autonomous
Study days available: {days_label}
Syllabus units (5 total):
{units_summary}

Task: Produce a precise day-by-day study schedule as a Markdown table.
Columns: Day | Focus Area | Topics & Deliverables | Hours
Rules:
- Day 1–5: one R22 unit per day, with specific topic names (not generic headings)
- Day 6: High-frequency Past Year Question (PYQ) drill — name the specific 10M questions likely to appear
- Day 7: Final revision + full mock exam simulation
- Hours per day: 2.5–3.5 (realistic for a college student)
- NO filler text. NO motivational quotes. NO generic headings like "Advanced Topics".
After the table, add a 3-row Priority Table (High / Medium / Habit) with actionable exam tips.
"""

    # Short unit summaries for LLM context injection
    _UNIT_SUMMARIES: dict[str, str] = {
        "A6CS15": (
            "Unit I: Divide & Conquer (Master Theorem, Merge/Quick Sort, Strassen's)\n"
            "Unit II: Greedy Method (Fractional Knapsack, MST, Dijkstra)\n"
            "Unit III: Dynamic Programming (Floyd-Warshall, OBST, 0/1 Knapsack DP)\n"
            "Unit IV: Backtracking (N-Queens, Sum of Subsets, Graph Coloring)\n"
            "Unit V: Branch & Bound + NP-Completeness (LCBB 0/1 Knapsack, TSP, Cook's Theorem)"
        ),
        "A6CS18": (
            "Unit I: Network Models & Physical Layer (OSI, TCP/IP, Switching, Transmission)\n"
            "Unit II: Data Link Layer & MAC (Flow Control, Error Detection, CSMA/CD)\n"
            "Unit III: Network Layer & Routing (IPv4/IPv6, Subnetting, Distance Vector, Link State)\n"
            "Unit IV: Transport Layer (TCP vs UDP, 3-Way Handshake, Congestion Control)\n"
            "Unit V: Application Layer & Security (DNS, HTTP, SMTP, RSA Cryptography)"
        ),
    }
    _UNIT_SUMMARIES_DEFAULT = (
        "Unit I: Foundational concepts and formal definitions\n"
        "Unit II: Core mechanisms and mathematical models\n"
        "Unit III: Algorithms, design patterns and optimizations\n"
        "Unit IV: Management policies and system strategies\n"
        "Unit V: Advanced topics, verification and applications"
    )

    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction]]:
        db = _safe_get_db()
        user_id = context.get("user_id")
        subject_code, subject_info = resolve_subject(query, context)

        # ── 1. Check existing DB study plan ──────────────────────────────────
        existing_plan = None
        try:
            if db and user_id:
                plan_res = db.table("study_plans").select("*").eq("user_id", user_id).limit(1).execute()
                if plan_res.data:
                    existing_plan = plan_res.data[0]
        except Exception as e:
            log.debug(f"[PlannerCoach] Plan check: {e}")

        # ── 2. Extract days from query ────────────────────────────────────────
        days = _extract_days_from_query(query)

        # ── 3. Try LLM-enhanced plan ──────────────────────────────────────────
        response_content = ""
        provider_name = "system"
        model_name = "deterministic_fallback"
        is_fallback = True

        if days is not None:
            # We have enough info — ask LLM for a fully personalized schedule
            units_summary = self._UNIT_SUMMARIES.get(subject_code, self._UNIT_SUMMARIES_DEFAULT)
            days_label = f"{days} days"

            llm_prompt = self._LLM_PROMPT_TEMPLATE.format(
                query=query,
                subject_name=subject_info["name"],
                subject_code=subject_code,
                days_label=days_label,
                units_summary=units_summary,
            )

            llm_resp = await self.call_llm_response(llm_prompt, TaskType.STUDY_PLAN_GENERATION)
            if llm_resp and llm_resp.content.strip():
                response_content = (
                    f"### 🗓️ {days}-Day Study Masterplan — {subject_info['name']} (`{subject_code}`)\n\n"
                    + llm_resp.content.strip()
                )
                provider_name = llm_resp.provider
                model_name = llm_resp.model_used
                is_fallback = False
                log.info(f"[PlannerCoach] LLM plan generated via {provider_name} (model={model_name})")

        # ── 4. Deterministic fallback ─────────────────────────────────────────
        if not response_content:
            # days is None → prompt student; also used when LLM unavailable
            if days is None:
                day_question = (
                    f"\n\n> 📅 **Quick question**: How many days do you have before your "
                    f"**{subject_info['name']}** exam? "
                    f"Reply with a number (e.g. *7 days*) and I'll tailor this plan precisely.\n\n"
                    f"In the meantime, here's the standard 7-day masterplan:\n"
                )
            else:
                day_question = ""

            response_content = day_question + _build_plan_markdown(subject_code, subject_info, days or 7)
            is_fallback = (days is None) or True  # LLM was unavailable

        # ── 5. Citations ──────────────────────────────────────────────────────
        citations: List[Citation] = []
        if existing_plan:
            citations.append(Citation(
                source_type="schedule",
                reference_id=existing_plan.get("id"),
                title="Active Study Plan from Dashboard",
                url=None,
                metadata={
                    "exam_date": existing_plan.get("exam_date"),
                    "hours": existing_plan.get("hours_per_day"),
                },
            ))
        else:
            citations.append(Citation(
                source_type="syllabus",
                reference_id=subject_code,
                title=f"R22 Curriculum Structure — {subject_info['name']} ({subject_code})",
                url=None,
                metadata={
                    "credit_weight": subject_info.get("credits", 3.0),
                    "semester": subject_info.get("semester", 1),
                },
            ))

        suggested_actions = [
            SuggestedAction(label="Open Study Planner", action_type="navigate", payload="/planner"),
            SuggestedAction(
                label=f"Check Repeated {subject_info.get('short', 'DAA')} Questions",
                action_type="query",
                payload=f"Which questions are frequently repeated in previous {subject_info.get('short', 'DAA')} papers?",
            ),
            SuggestedAction(
                label=f"Retrieve {subject_info.get('short', 'DAA')} Past Papers",
                action_type="query",
                payload=f"Find previous {subject_info.get('short', 'DAA')} question papers",
            ),
        ]

        meta = {
            "provider": provider_name,
            "model_used": model_name,
            "is_fallback": is_fallback,
        }

        return response_content, citations, suggested_actions, meta

