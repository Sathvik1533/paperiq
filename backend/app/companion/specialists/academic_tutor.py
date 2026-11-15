"""
Academic Questions and AI Tutoring Specialist — Companion 2.0.
Provides exam-aware academic tutoring calibrated for MLRIT Autonomous R22 university examination standards.
Supports explicit mark calibration:
- 1 Mark (Part A crisp definition, key formula, <= 70 words)
- 5 Marks (Part B sub-question: definition, 3-4 mechanisms, compact trace, complexity)
- 10 Marks (Part B major question: formal problem, mathematical formulation, step-by-step algorithm, trace, complexity & evaluation rubric)
- Detailed (Deep conceptual intuition, proofs, and pedagogical mastery)
Supports tone calibration:
- Exam-ready English (University evaluation rubric phrasing)
- Simple English (Clear, intuitive analogies)
- Detailed Conceptual (Formal theoretical derivations)
"""
from __future__ import annotations
import re
from typing import Dict, Any, List, Tuple
from app.companion.specialists.base import BaseSpecialist, resolve_subject
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.intelligence.academic_question_intel import AcademicQuestionIntelligence, QuestionMatchResult
from app.algorithms.knapsack_solver import try_solve_knapsack_from_query
from app.constants.r22_3_1_allowlist import is_supported_3_1_code, PROHIBITED_SUBJECT_NAMES
from app.llm.base import TaskType
from app.logger import get_logger

log = get_logger(__name__)


class AcademicTutorSpecialist(BaseSpecialist):
    specialist_type = SpecialistType.ACADEMIC_TUTOR
    badge = "AI Academic Tutor"
    description = "Exam-calibrated solutions (1M, 5M, 10M, Detailed), mathematical proofs, algorithm traces, and valuation rubrics."

    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction], Dict[str, Any]]:
        subject_code, subject_info = resolve_subject(query, context)
        regulation = context.get("regulation", "R22")
        answer_format = context.get("answer_format", "detailed")
        tone_preference = context.get("tone_preference", "exam_ready")

        # Scope verification: MLRIT R22 3-1 only
        is_3_1 = is_supported_3_1_code(subject_code)
        scope_prefix = ""
        if not is_3_1 or subject_code in PROHIBITED_SUBJECT_NAMES:
            sub_title = PROHIBITED_SUBJECT_NAMES.get(subject_code, subject_info.get("name", subject_code))
            scope_prefix = (
                f"> [!NOTE] **Scope Notice — PaperIQ Supported Scope: MLRIT Autonomous R22 — 3-1 Only**\n"
                f"> PaperIQ is currently dedicated exclusively to MLRIT R22 3-1 (Third Year, First Semester) curriculum:\n"
                f"> - **Design and Analysis of Algorithms (A6CS15)**\n"
                f"> - **Cloud and DevOps (A6IT13)**\n"
                f"> - **Computer Networks (A6CS18)**\n"
                f"> - **Information Retrieval Systems (A6IT26)**\n"
                f"> - **Natural Language Processing (A6AI14)**\n"
                f">\n"
                f"> The subject you inquired about (**{sub_title}**) is outside the active 3-1 release. "
                f"No official university examination paper records or historical frequency calculations are retrieved for this subject.\n"
                f"> Below is a general educational explanation:\n\n"
            )

        # 1. Match query against verified academic examination questions (3-1 only)
        match_result: QuestionMatchResult = context.get("question_match") or AcademicQuestionIntelligence.find_matching_question(
            query=query,
            subject_code=subject_code if is_3_1 else None,
            regulation=regulation,
        )

        # Auto format resolution if set to auto
        resolved_format = answer_format
        if resolved_format == "auto":
            resolved_format = match_result.default_format or "detailed"

        citations: List[Citation] = []
        exam_context_snippet = ""

        # Grounding with verified exam evidence
        if match_result.is_verified_exam_question and match_result.matched_question:
            mq = match_result.matched_question
            exam_context_snippet = (
                f"\n[VERIFIED MLRIT EXAM OCCURRENCE]:\n"
                f"- Course: {mq.subject_name} ({mq.subject_code}, {mq.regulation})\n"
                f"- Examination: {mq.paper_title}\n"
                f"- Position: {mq.section} Question {mq.question_number} ({mq.marks} Marks)\n"
                f"- Unit: Unit {mq.unit_number} ({mq.topic_name}) | CO: {mq.co} | Bloom: {mq.bloom_level}\n"
                f"- Historical Exam Occurrences: {len(match_result.historical_occurrences)} time(s)\n"
            )
            citations.append(Citation(
                source_type="question",
                reference_id=mq.id,
                title=f"{mq.source_reference}",
                url=None,
                metadata={
                    "marks": mq.marks,
                    "marks_category": mq.marks_category,
                    "year": mq.exam_year,
                    "paper_title": mq.paper_title,
                    "section": mq.section,
                    "question_number": mq.question_number,
                    "co": mq.co,
                    "bloom_level": mq.bloom_level,
                    "verified": True,
                },
            ))
        else:
            # Topic-level curriculum citation
            unit_num = match_result.curriculum_context.get("unit_number", 1)
            citations.append(Citation(
                source_type="syllabus",
                reference_id=subject_code,
                title=f"MLRIT R22 Syllabus — {subject_info.get('name', 'Course')} (Unit {unit_num})",
                url=None,
                metadata={"regulation": regulation, "subject_code": subject_code, "verified": True},
            ))

        # Check for verified dynamic algorithm solving or numerical input solicitation
        knapsack_direct = try_solve_knapsack_from_query(query)
        if knapsack_direct:
            suggested_actions = self._build_contextual_actions(query, subject_code, resolved_format, match_result)
            metadata = {
                "provider": "verified_solver",
                "model_used": "knapsack_lcbb_dynamic_engine",
                "is_fallback": False,
                "resolved_format": resolved_format,
                "resolved_tone": tone_preference,
                "is_verified_exam_question": match_result.is_verified_exam_question,
                "matched_exam_marks": match_result.detected_marks,
                "matched_exam_year": match_result.matched_question.exam_year if match_result.matched_question else None,
                "source_reference": match_result.matched_question.source_reference if match_result.matched_question else None,
            }
            return knapsack_direct, citations, suggested_actions, metadata

        # 2. Build format-calibrated prompting for LLM
        format_instructions = self._get_format_instructions(resolved_format)
        tone_instructions = self._get_tone_instructions(tone_preference)

        prompt = f"""
You are the expert PaperIQ Academic Tutor for engineering students under MLRIT Autonomous {regulation} regulation.
The student asks:
"{query}"

Target Course: {subject_info.get('name', 'Course')} ({subject_code})
Target Regulation: {regulation}
Requested Answer Depth: {resolved_format.upper()}
Requested Tone: {tone_preference.replace('_', ' ').title()}

{exam_context_snippet}

FORMAT & DEPTH REQUIREMENTS:
{format_instructions}

TONE REQUIREMENTS:
{tone_instructions}

MATHEMATICAL RENDERING RULES:
- Use standard LaTeX math delimited with $...$ for inline math and $$...$$ on its own line for display math.
- Never write broken or unescaped LaTeX symbols.
- Render clean mathematical expressions: equations, bounds, summations, matrices.

Answer strictly adhering to the requested format and word constraints.
"""
        llm_resp = await self.call_llm_response(prompt, TaskType.EXAM_INSIGHTS)
        is_fallback = False

        if llm_resp and llm_resp.content.strip():
            response_text = llm_resp.content.strip()
            provider_name = llm_resp.provider
            model_name = llm_resp.model_used
            log.info(
                f"[AcademicTutor] Generated {resolved_format} response via {provider_name} "
                f"(model={model_name}, tokens={llm_resp.tokens_used}, latency={llm_resp.latency_ms}ms)"
            )
        else:
            # Deterministic, grounded fallback calibrated by mark category
            is_fallback = True
            provider_name = "fallback"
            model_name = "deterministic_fallback"
            log.warning(
                f"[AcademicTutor] LLM unavailable. Serving deterministic {resolved_format} response for query: '{query[:40]}...'"
            )
            response_text = self._generate_deterministic_fallback(
                query=query,
                subject_code=subject_code,
                subject_info=subject_info,
                regulation=regulation,
                format_type=resolved_format,
                match_result=match_result,
            )

        # 3. Contextual Suggested Actions based on format & subject
        suggested_actions = self._build_contextual_actions(query, subject_code, resolved_format, match_result)

        metadata = {
            "provider": provider_name,
            "model_used": model_name,
            "is_fallback": is_fallback,
            "resolved_format": resolved_format,
            "resolved_tone": tone_preference,
            "is_verified_exam_question": match_result.is_verified_exam_question,
            "matched_exam_marks": match_result.detected_marks,
            "matched_exam_year": match_result.matched_question.exam_year if match_result.matched_question else None,
            "source_reference": match_result.matched_question.source_reference if match_result.matched_question else None,
        }

        final_text = scope_prefix + response_text if scope_prefix else response_text
        return final_text, citations, suggested_actions, metadata

    def _get_format_instructions(self, format_type: str) -> str:
        if format_type == "1_mark":
            return """
- **1 MARK (Part A) ANSWER**:
- Target length: 40 to 70 words strictly.
- Give a direct, high-precision academic definition or principle statement.
- State exactly one core equation, invariant, or key rule.
- Do NOT include lengthy introductions, historical background, multiple steps, or full diagrams.
- Punchy, crisp, and directly scoring 1/1 marks.
"""
        elif format_type == "5_marks":
            return """
- **5 MARKS (Part B Sub-question) ANSWER**:
- Target length: 180 to 250 words.
- Structure into 3 clear sections:
  1. **Core Definition & Principle**: Precise definition with scope.
  2. **Key Mechanism & Algorithm/Properties**: 3–4 numbered steps, property points, or pseudo-steps.
  3. **Compact Illustrative Example or Diagram Trace**: Short concrete demonstration or mathematical trace.
  4. **Key Asymptotic Bounds / Valuation Tip**: Time/Space complexity or scoring key.
"""
        elif format_type == "10_marks":
            return """
- **10 MARKS (Part B Full Question) ANSWER**:
- Target length: 450 to 650 words.
- Provide a comprehensive, full-score university examination structure:
  1. **Problem Definition & Formulation**: Formal inputs, constraints, and objective function.
  2. **Mathematical Formulation & Bounding Invariants**: Rigorous equations and theoretical criteria.
  3. **Complete Step-by-Step Algorithm / Derivation**: Detailed walkthrough with numbered phases.
  4. **Traced Concrete Numerical Example or State-Space Tree**: Explicit input numbers, live node calculations, pruning conditions, and final solution path.
  5. **Asymptotic Complexity & Evaluation Scheme**: Big-Oh time and space analysis + specific evaluation rubric advice on where students lose marks.
"""
        else:  # detailed
            return """
- **DETAILED CONCEPTUAL EXPLANATION**:
- Target length: 350 to 500 words.
- Focus on deep intuition, why the concept exists, real-world analogies, rigorous step-by-step breakdown, edge cases, and comparative tradeoffs against alternative algorithms or techniques.
"""

    def _get_tone_instructions(self, tone: str) -> str:
        if tone == "simple":
            return "- Tone: Simple, accessible English. Use everyday analogies, avoid convoluted academic jargon where simple words suffice, and explain every step intuitively."
        elif tone == "conceptual":
            return "- Tone: Rigorous, theoretical, proof-oriented English. Ground statements in formal invariants, mathematical precision, and academic proofs."
        else:  # exam_ready
            return "- Tone: Formal university examination English. Match standard MLRIT autonomous evaluation rubrics, precise technical terms, bold keywords, and scoring points."

    def _generate_deterministic_fallback(
        self,
        query: str,
        subject_code: str,
        subject_info: Dict[str, Any],
        regulation: str,
        format_type: str,
        match_result: QuestionMatchResult,
    ) -> str:
        query_lower = query.lower()
        verified_prefix = ""
        if match_result.is_verified_exam_question and match_result.matched_question:
            mq = match_result.matched_question
            verified_prefix = f"> **[VERIFIED MLRIT {mq.regulation} EXAM QUESTION — {mq.marks}M ({mq.exam_year} {mq.section} Q{mq.question_number})]**\n\n"

        # 1. Knapsack Branch and Bound
        if "knapsack" in query_lower and ("branch and bound" in query_lower or "lc" in query_lower or "least cost" in query_lower):
            if format_type == "1_mark":
                return (
                    f"{verified_prefix}### 📘 0/1 Knapsack using LC Branch and Bound (1 Mark — Part A)\n\n"
                    "The **0/1 Knapsack problem using Least-Cost (LC) Branch and Bound** is a state-space tree search algorithm "
                    "that selects the next live node to expand using a ranking function $\\hat{c}(x)$ (evaluated via a Min-Heap) "
                    "computed by continuous fractional knapsack relaxation, pruning any node with $\\hat{c}(x) \\ge U$."
                )
            elif format_type == "5_marks":
                return (
                    f"{verified_prefix}### 📘 0/1 Knapsack using LC Branch and Bound (5 Marks — Part B)\n\n"
                    "#### 1. Core Principle & Objective\n"
                    "The **0/1 Knapsack problem** maximizes $\\sum_{i=1}^n p_i x_i$ subject to $\\sum_{i=1}^n w_i x_i \\le W$ with $x_i \\in \\{0, 1\\}$. "
                    "In LCBB, this is converted to a minimization problem by minimizing $-\\sum p_i x_i$.\n\n"
                    "#### 2. Bounding Functions\n"
                    "- **Lower Bound $\\hat{c}(x)$**: Computed by greedily filling remaining capacity including the fractional portion of the next item:\n"
                    "  $$\\hat{c}(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j + C'_{rem} \\cdot \\frac{p_k}{w_k}\\right)$$\n"
                    "- **Upper Bound $u(x)$**: Integer-only greedy packing without fractions:\n"
                    "  $$u(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j\\right)$$\n\n"
                    "#### 3. Pruning Rule & Complexity\n"
                    "- **Pruning**: Any generated node with $\\hat{c}(y) \\ge U$ is immediately killed ($U = \\min$ upper bound so far).\n"
                    "- **Complexity**: Worst-case time $O(2^n)$, but LCBB prunes $>70\\%$ of state space in practice using a min-heap priority queue."
                )
            else:  # 10_marks or detailed
                return (
                    f"{verified_prefix}### 📘 0/1 Knapsack Problem using LC Branch and Bound (10 Marks — Part B)\n\n"
                    "#### 1. Problem Specification (MLRIT R22 DAA Unit V)\n"
                    "Given $n$ items with profits $p_i > 0$ and weights $w_i > 0$, and knapsack capacity $W$:\n"
                    "$$\\text{Maximize } \\sum_{i=1}^n p_i x_i \\quad \\text{subject to } \\sum_{i=1}^n w_i x_i \\le W, \\quad x_i \\in \\{0, 1\\}$$\n"
                    "To apply **Least-Cost Branch and Bound (LCBB)**, we convert maximization to minimization by minimizing $-\\sum p_i x_i$.\n\n"
                    "#### 2. Ranking and Bounding Functions\n"
                    "Items are sorted in descending order of profit-to-weight ratio: $\\frac{p_1}{w_1} \\ge \\frac{p_2}{w_2} \\ge \\dots \\ge \\frac{p_n}{w_n}$.\n\n"
                    "At any live node $x$ at level $i$ with accumulated profit $P_{curr}$ and remaining capacity $C_{rem} = W - W_{curr}$:\n"
                    "1. **Lower Bound Function $\\hat{c}(x)$**: Obtained by relaxing the 0/1 constraint to allow fractional items (Continuous Knapsack solution):\n"
                    "   $$\\hat{c}(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j + C'_{rem} \\cdot \\frac{p_k}{w_k}\\right)$$\n"
                    "2. **Upper Bound Function $u(x)$**: Obtained by greedily packing only complete integer items:\n"
                    "   $$u(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j\\right)$$\n"
                    "3. **Pruning Criterion**: If a newly generated node $y$ satisfies $\\hat{c}(y) \\ge U$ (where $U$ is the global minimum $u$ found so far), kill node $y$.\n\n"
                    "#### 3. State-Space Tree Trace ($n=4, W=15$)\n"
                    "Given Items: Item 1 ($p_1=10, w_1=2$), Item 2 ($p_2=10, w_2=4$), Item 3 ($p_3=12, w_3=6$), Item 4 ($p_4=18, w_4=9$).\n"
                    "Ratios $p_i/w_i$: $5.0, 2.5, 2.0, 2.0$ (in sorted ratio order).\n\n"
                    "| Node | Level | Decision | Weight | Profit | $\\hat{c}$ (Lower Bound) | $u$ (Upper Bound) | Status / Action |\n"
                    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
                    "| **1** | 0 | Root (Start) | 0 | 0 | -38 | -32 | Enqueue in Min-Heap, Initial $U = -32$ |\n"
                    "| **2** | 1 | $x_1 = 1$ | 2 | 10 | -38 | -32 | Enqueued (Child of 1) |\n"
                    "| **3** | 1 | $x_1 = 0$ | 0 | 0 | -32 | -22 | Enqueued (Child of 1) |\n"
                    "| **4** | 2 | $x_2 = 1$ | 6 | 20 | -38 | -32 | Enqueued (Child of 2) |\n"
                    "| **5** | 2 | $x_2 = 0$ | 2 | 10 | -36 | -22 | Enqueued (Child of 2) |\n"
                    "| **6** | 3 | $x_3 = 1$ | 12 | 32 | -38 | -32 | Enqueued (Child of 4) |\n"
                    "| **7** | 3 | $x_3 = 0$ | 6 | 20 | -38 | -38 | Enqueued; Greedy integer packs Item 4 &rarr; **Updates $U = -38$** |\n"
                    "| **8** | 4 | $x_4 = 0$ | 12 | 32 | -32 | -32 | Pruned immediately ($\\hat{c}=-32 > U=-38$) |\n"
                    "| **9** | 4 | $x_4 = 1$ | 15 | 38 | -38 | -38 | **Optimal Leaf Reached!** Feasible solution found |\n"
                    "| **10** | 4 | $x_4 = 0$ | 6 | 20 | -20 | -20 | Pruned immediately ($\\hat{c}=-20 > U=-38$) |\n"
                    "| **5** | 2 | $x_2 = 0$ | 2 | 10 | -36 | -22 | Pruned from heap ($\\hat{c}=-36 > U=-38$) |\n"
                    "| **3** | 1 | $x_1 = 0$ | 0 | 0 | -32 | -22 | Pruned from heap ($\\hat{c}=-32 > U=-38$) |\n\n"
                    "**Optimal Solution**: Select Items 1, 2, and 4: $x^* = (1, 1, 0, 1)$.\n"
                    "- **Total Weight**: $w_1 + w_2 + w_4 = 2 + 4 + 9 = 15 \\le 15$\n"
                    "- **Maximum Optimal Profit**: $p_1 + p_2 + p_4 = 10 + 10 + 18 = \\mathbf{38}$\n\n"
                    "#### 4. University Valuation Rubric & Complexity\n"
                    "- **Time Complexity**: $O(2^n)$ worst-case, with practical pruning eliminating $>70\\%$ of branches.\n"
                    "- **Space Complexity**: $O(2^n)$ required for the priority queue (Min-Heap).\n"
                    "- **Full Marks Tip**: Explicitly show the Min-Heap queue states at every expansion level."
                )

        # 2. Banker's Algorithm
        elif "banker" in query_lower or "deadlock" in query_lower:
            if format_type == "1_mark":
                return (
                    f"{verified_prefix}### 📘 Banker's Algorithm (1 Mark — Part A)\n\n"
                    "**Banker's Algorithm** is a deadlock avoidance algorithm that tests whether granting a process's resource request "
                    "maintains the system in a **Safe State**—a state where there exists at least one safe sequence $\\langle P_1, \\dots, P_n \\rangle$ "
                    "ensuring every process can complete without deadlock."
                )
            elif format_type == "5_marks":
                return (
                    f"{verified_prefix}### 📘 Banker's Algorithm & Safe State (5 Marks — Part B)\n\n"
                    "#### 1. Core Principle\n"
                    "Developed by Edsger Dijkstra, Banker's Algorithm dynamically inspects resource allocation state to ensure "
                    "circular wait conditions cannot form.\n\n"
                    "#### 2. Key Data Structures\n"
                    "- **Available[m]**: Currently free instances of each of the $m$ resource types.\n"
                    "- **Max[n][m]**: Maximum demand declared by each process $P_i$.\n"
                    "- **Allocation[n][m]**: Resources currently assigned to $P_i$.\n"
                    "- **Need[n][m]**: Remaining resources required:\n"
                    "  $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$\n\n"
                    "#### 3. Safety Check Condition\n"
                    "Find $P_i$ such that $\\text{Finish}[i] = \\text{False}$ and $\\text{Need}_i \\le \\text{Work}$. "
                    "When found, update $\\text{Work} = \\text{Work} + \\text{Allocation}_i$ until all finish."
                )
            else:
                return (
                    f"{verified_prefix}### 📘 Deadlock Avoidance using Banker's Algorithm (10 Marks — Part B)\n\n"
                    "#### 1. Concept & Formal Definition (MLRIT R22 OS Unit III)\n"
                    "Banker's Algorithm is a **deadlock avoidance** mechanism that guarantees a system never enters an unsafe state. "
                    "When a process requests resources, the system simulates granting it and verifies whether a **Safe Sequence** exists.\n\n"
                    "#### 2. Matrices & State Equations\n"
                    "For $n$ processes and $m$ resource types:\n"
                    "- $\\text{Available}[m]$: Free resource vector.\n"
                    "- $\\text{Max}[n][m]$ and $\\text{Allocation}[n][m]$: Maximum claim and current allocations.\n"
                    "- $\\text{Need}[n][m]$ matrix calculation:\n"
                    "  $$\\text{Need}[i][j] = \\text{Max}[i][j] - \\text{Allocation}[i][j]$$\n\n"
                    "#### 3. 5-Process Numeric Safety Algorithm Trace\n\n"
                    "| Process | Allocation (A B C) | Max (A B C) | Need (A B C) | Available (A B C) | Status |\n"
                    "| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                    "| $P_0$ | 0 1 0 | 7 5 3 | 7 4 3 | 3 3 2 | Waiting |\n"
                    "| $P_1$ | 2 0 0 | 3 2 2 | **1 2 2** | **3 3 2** | $\\text{Need} \\le \\text{Work}$ &rarr; Safe |\n"
                    "| $P_2$ | 3 0 2 | 9 0 2 | 6 0 0 | 5 3 2 | Executed |\n"
                    "| $P_3$ | 2 1 1 | 2 2 2 | 0 1 1 | 7 4 3 | Executed |\n"
                    "| $P_4$ | 0 0 2 | 4 3 3 | 4 3 1 | 7 4 5 | Executed |\n\n"
                    "**Safe Sequence**: $\\langle P_1, P_3, P_4, P_0, P_2 \\rangle$. Because all processes terminate safely, the state is safe.\n\n"
                    "#### 4. University Answering Tips\n"
                    "- Time complexity of safety check: $O(m \\cdot n^2)$.\n"
                    "- Always explicitly derive the Need matrix before executing the Safety Algorithm in exam booklets."
                )

        # 3. Propositional Logic
        elif "propositional logic" in query_lower:
            if format_type == "1_mark":
                return (
                    f"{verified_prefix}### 📘 Propositional Logic (1 Mark — Part A)\n\n"
                    "**Propositional Logic** (also known as sentential logic) is a branch of discrete mathematical logic that studies "
                    "declarative statements (propositions) that are either strictly **True (T)** or **False (F)**, but never both simultaneously, "
                    "connected by logical operators ($\\neg, \\land, \\lor, \\rightarrow, \\leftrightarrow$)."
                )
            else:
                return (
                    f"{verified_prefix}### 📘 Propositional Logic & Truth Connectives (MLRIT R22 Discrete Mathematics)\n\n"
                    "#### 1. Definition (Part A — 2 Marks)\n"
                    "A proposition is a declarative sentence that is either true or false. Elementary propositions are combined using logical connectives:\n"
                    "- Negation: $\\neg P$\n"
                    "- Conjunction: $P \\land Q$\n"
                    "- Disjunction: $P \\lor Q$\n"
                    "- Implication: $P \\rightarrow Q$ (Equivalently $\\neg P \\lor Q$)\n"
                    "- Biconditional: $P \\leftrightarrow Q$\n\n"
                    "#### 2. Tautology & Equivalence Rules (Part B — 10 Marks)\n"
                    "A statement formula is a **tautology** if its truth value is True under all possible truth valuations of its propositional variables."
                )

        # Generic Subject Concept Fallback
        else:
            if format_type == "1_mark":
                return (
                    f"{verified_prefix}### 📘 {query} (1 Mark — Part A)\n\n"
                    f"In the MLRIT {regulation} {subject_info.get('name', 'Course')} curriculum, **{query}** represents a fundamental principle. "
                    "State the precise definition, input constraints, and governing invariant in concise technical language."
                )
            elif format_type == "5_marks":
                return (
                    f"{verified_prefix}### 📘 {query} (5 Marks — Part B)\n\n"
                    f"#### 1. Academic Definition\n"
                    f"Under MLRIT Autonomous {regulation} standards, {query} is evaluated for technical accuracy and structured reasoning.\n\n"
                    "#### 2. Core Mechanism & Key Points\n"
                    "1. **Input Specifications & Preconditions**: Clearly state the problem inputs and constraints.\n"
                    "2. **Algorithmic / Architectural Breakdown**: Numbered sequence of operational phases.\n"
                    "3. **Invariants & Recurrences**: Specify governing mathematical bounds or equations.\n\n"
                    "#### 3. Summary & Asymptotic Bounds\n"
                    "State the execution complexity and key scoring factors required for full 5 marks."
                )
            else:
                return (
                    f"{verified_prefix}### 📘 Academic Breakdown: {query} (10 Marks — Part B)\n\n"
                    f"#### 1. Formal Specification ({subject_info.get('name', 'Course')} — {regulation})\n"
                    f"Comprehensive university examination breakdown for **{query}**.\n\n"
                    "#### 2. Mathematical Principles & Architecture\n"
                    "- Define system inputs, state spaces, and transition functions.\n"
                    "- State governing equations and invariant conditions.\n\n"
                    "#### 3. Step-by-Step Procedure & Algorithm\n"
                    "1. Initialization of data structures.\n"
                    "2. Core iterative or recursive evaluation step.\n"
                    "3. Termination condition and optimal state extraction.\n\n"
                    "#### 4. University Valuation Strategy\n"
                    "- Write structured, point-wise answers with labeled diagrams and equations.\n"
                    "- Explicitly state worst-case Time Complexity and Space Complexity."
                )

    def _build_contextual_actions(
        self,
        query: str,
        subject_code: str,
        current_format: str,
        match_result: QuestionMatchResult,
    ) -> List[SuggestedAction]:
        actions = []

        # 1. Format-switching actions
        if current_format != "1_mark":
            actions.append(SuggestedAction(
                label="Convert to 1-Mark Answer",
                action_type="query",
                payload=f"Give a concise 1-mark Part A answer for: {query}",
            ))
        if current_format != "5_marks":
            actions.append(SuggestedAction(
                label="Format as 5-Mark Answer",
                action_type="query",
                payload=f"Provide a structured 5-mark answer for: {query}",
            ))
        if current_format != "10_marks":
            actions.append(SuggestedAction(
                label="Format as 10-Mark Answer",
                action_type="query",
                payload=f"Provide a full 10-mark Part B answer with walkthrough for: {query}",
            ))

        # 2. Contextual exam navigation actions
        if match_result.is_verified_exam_question and match_result.matched_question:
            mq = match_result.matched_question
            actions.append(SuggestedAction(
                label=f"View {mq.exam_year} Exam Paper",
                action_type="query",
                payload=f"Show me the {mq.exam_year} question paper for {mq.subject_code}",
            ))
        else:
            actions.append(SuggestedAction(
                label="Check Repeated Questions",
                action_type="query",
                payload=f"What are the most repeated questions in {subject_code}?",
            ))

        return actions[:3]
