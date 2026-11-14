"""
Student Planning and Progress Specialist.
Constructs personalized daily study schedules, monitors exam readiness,
and guides revision strategies based on exam deadlines.
"""
from typing import Dict, Any, List, Tuple
from app.companion.specialists.base import BaseSpecialist, resolve_subject
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.database import get_db
from app.constants.r22_subjects import ALL_R22_SUBJECTS
from app.logger import get_logger

log = get_logger(__name__)


def _safe_get_db():
    try:
        return get_db()
    except Exception:
        return None


class PlannerCoachSpecialist(BaseSpecialist):
    specialist_type = SpecialistType.PLANNER_COACH
    badge = "Study Planner Coach"
    description = "Adaptive study planning, daily revision schedules, and exam readiness tracking."

    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction]]:
        db = _safe_get_db()
        user_id = context.get("user_id")
        subject_code, subject_info = resolve_subject(query, context)

        # Check existing study plan in DB
        existing_plan = None
        readiness_score = None
        try:
            if db and user_id:
                plan_res = db.table("study_plans").select("*").eq("user_id", user_id).limit(1).execute()
                if plan_res.data:
                    existing_plan = plan_res.data[0]
                score_res = db.table("readiness_scores").select("*").eq("user_id", user_id).limit(1).execute()
                if score_res.data:
                    readiness_score = score_res.data[0]
        except Exception as e:
            log.debug(f"[PlannerCoach] Plan check: {e}")

        # Subject-specific daily schedule definitions
        schedule_tables = {
            "A6CS15": """| Day | Focus Area | High-Yield Topics & Study Deliverables | Target Hours |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I: Divide & Conquer** | Master Theorem, Recurrence Relations, Merge Sort, Quick Sort, Strassen's Matrix Multiplication | 3.0 hrs |
| **Day 2** | **Unit II: Greedy Method** | Fractional Knapsack, Job Sequencing with Deadlines, Prim's and Kruskal's MST, Dijkstra's Algorithm | 3.0 hrs |
| **Day 3** | **Unit III: Dynamic Programming** | All-Pairs Shortest Paths (Floyd-Warshall), Optimal Binary Search Trees (OBST), 0/1 Knapsack Tabulation | 3.5 hrs |
| **Day 4** | **Unit IV: Backtracking** | 8-Queens / 4-Queens State Space Tree, Sum of Subsets Problem, Graph Coloring (m-colorability) | 3.0 hrs |
| **Day 5** | **Unit V: Branch & Bound / NP** | Least-Cost Branch and Bound (0/1 Knapsack LCBB), TSP with LCBB, Cook's Theorem & NP-Completeness | 3.5 hrs |
| **Day 6** | **High-Frequency PYQ Drill** | Solve repeated 10-Mark questions from 2021–2024 MLRIT examination papers under timed exam conditions | 3.5 hrs |
| **Day 7** | **Final Revision & Mock Exam** | Part A 2M definitions blitz + 3-Hour Full Timed Mock Exam (60 Marks autonomous pattern) | 3.0 hrs |""",
            "A6CS09": """| Day | Focus Area | High-Yield Topics & Study Deliverables | Target Hours |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I: OS Overview & CPU Scheduling** | System Calls, Dual-Mode Operations, Process State Transitions, Scheduling (FCFS, SJF, RR) | 2.5 hrs |
| **Day 2** | **Unit II: Process Synchronization** | Critical Section Problem, Peterson's Solution, Semaphores, Dining Philosophers & Producer-Consumer | 3.0 hrs |
| **Day 3** | **Unit III: Deadlocks** | Banker's Algorithm (Safety & Resource Request), Resource Allocation Graphs, Avoidance vs Detection | 3.5 hrs |
| **Day 4** | **Unit IV: Memory Management** | Paging vs Segmentation, Demand Paging, Page Replacement Algorithms (FIFO, LRU, Optimal numericals) | 3.0 hrs |
| **Day 5** | **Unit V: Storage & Disk Scheduling** | File System Allocation, Disk Scheduling Algorithms (FCFS, SSTF, SCAN, C-SCAN head movement traces) | 3.0 hrs |
| **Day 6** | **PYQ Sprint (2021–2024)** | Solve repeated 10M questions under timed conditions | 3.5 hrs |
| **Day 7** | **Final Revision & Mock Exam** | Part A 2M definitions blitz + full 3-hr mock test | 3.0 hrs |"""
        }

        schedule_md = schedule_tables.get(subject_code, f"""| Day | Focus Area | High-Yield Topics | Estimated Time |
| :---: | :--- | :--- | :---: |
| **Day 1** | **Unit I: Foundations** | Core Architecture, Principles, Definitions | 2.5 hrs |
| **Day 2** | **Unit II: Mechanisms** | Mathematical representations, Structured processes | 3.0 hrs |
| **Day 3** | **Unit III: Heavyweight Algorithms** | High-probability Part B questions & traces | 3.5 hrs |
| **Day 4** | **Unit IV: Management Policies** | Real-world policies, trade-off comparisons | 3.0 hrs |
| **Day 5** | **Unit V: Advanced & Numericals** | Scoring numericals, derivations & proofs | 3.0 hrs |
| **Day 6** | **PYQ Sprint (2021–2024)** | Solve repeated 10M questions under timed conditions | 3.5 hrs |
| **Day 7** | **Final Revision & Mock Exam** | Part A 2M definitions blitz + full 3-hr mock test | 3.0 hrs |""")

        # Construct adaptive 7-day study plan
        plan_markdown = f"""### 🗓️ Recommended 7-Day Study Masterplan: {subject_info['name']} (`{subject_code}`)

**Target**: Scoring A+ (80%+ SGPA Grade Bracket) | **Daily Commitment**: 3.0 – 3.5 Hours/Day  
**Regulation**: MLRIT Autonomous R22 | **Total Projected Study Time**: 22.5 Hours

---

{schedule_md}

---

#### 📈 Strategic Readiness Guidance:
1. **Prioritize High-Scoring Units**: Units 2, 3, and 5 contain algorithmic numericals and deterministic proofs with zero subjective marking deduction.
2. **Daily Active Recall**: Begin each day with 15 minutes of blank-sheet writing of key formulas and recurrences before reviewing notes.
3. **Practice Booklet Formatting**: Allocate 15-18 minutes per 10-Mark question with neat diagrams, step numbering, and boxed final answers.
"""

        citations = []
        if existing_plan:
            citations.append(Citation(
                source_type="schedule",
                reference_id=existing_plan.get("id"),
                title="Active Study Plan from Dashboard",
                url=None,
                metadata={"exam_date": existing_plan.get("exam_date"), "hours": existing_plan.get("hours_per_day")},
            ))
        else:
            citations.append(Citation(
                source_type="syllabus",
                reference_id=subject_code,
                title=f"R22 Curriculum Structure — {subject_info['name']} ({subject_code})",
                url=None,
                metadata={"credit_weight": subject_info.get("credits", 3.0), "semester": subject_info.get("semester", 1)},
            ))

        suggested_actions = [
            SuggestedAction(label="Open Study Planner", action_type="navigate", payload="/planner"),
            SuggestedAction(label="Check Repeated DAA Questions", action_type="query", payload=f"Which questions are frequently repeated in previous {subject_info.get('short', 'DAA')} papers?"),
            SuggestedAction(label="Retrieve DAA Past Papers", action_type="query", payload=f"Find previous {subject_info.get('short', 'DAA')} question papers"),
        ]

        return plan_markdown, citations, suggested_actions

