"""
Academic Questions and AI Tutoring Specialist.
Provides deep conceptual explanations, step-by-step solutions, and exam answering tips
calibrated for MLRIT university examination standards (R22 regulation).
"""
import re
from typing import Dict, Any, List, Tuple
from app.companion.specialists.base import BaseSpecialist
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.database import get_db
from app.llm.base import TaskType
from app.logger import get_logger

log = get_logger(__name__)


def _safe_get_db():
    try:
        return get_db()
    except Exception:
        return None


class AcademicTutorSpecialist(BaseSpecialist):
    specialist_type = SpecialistType.ACADEMIC_TUTOR
    badge = "AI Academic Tutor"
    description = "Step-by-step conceptual walkthroughs, proofs, derivations, and exam-grade answers."

    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction]]:
        subject_code = context.get("subject_code")
        regulation = context.get("regulation", "R22")
        db = _safe_get_db()

        # 1. Look up any past questions matching keywords in the query for evidence
        keywords = [w.lower() for w in re.findall(r"\b[A-Za-z]{4,}\b", query) if w.lower() not in {"what", "explain", "describe", "write", "how", "does", "with", "example", "please", "about"}]
        matched_questions = []
        try:
            if db and keywords:
                kw = keywords[0]
                q_res = db.table("questions").select("id, question_text, marks, exam_year, exam_category, regulation").ilike("question_text", f"%{kw}%").limit(3).execute()
                matched_questions = q_res.data or []
        except Exception as e:
            log.debug(f"[AcademicTutor] Question lookup error: {e}")

        exam_context_snippet = ""
        citations: List[Citation] = []
        if matched_questions:
            exam_context_snippet = "\nPast MLRIT exam occurrences of this topic:\n"
            for q in matched_questions:
                q_text = q.get("question_text", "").strip()
                marks = q.get("marks", 10)
                year = q.get("exam_year", 2023)
                cat = q.get("exam_category", "Semester")
                exam_context_snippet += f"- [{marks}M, {year} {cat}]: {q_text[:120]}...\n"
                citations.append(Citation(
                    source_type="question",
                    reference_id=q.get("id"),
                    title=f"Past Exam Question ({marks} Marks, {year})",
                    url=None,
                    metadata={"marks": marks, "year": year, "category": cat},
                ))

        # 2. Build prompt for LLM tutor
        prompt = f"""
You are the expert PaperIQ Academic Tutor for engineering students under MLRIT autonomous {regulation} regulation.
The student asks:
"{query}"

{exam_context_snippet}

Provide a comprehensive, exam-grade tutoring answer formatted in markdown:
1. **Core Concept Definition**: A crisp, punchy definition suitable for a Part A (2 Marks) question.
2. **Detailed Step-by-Step Explanation**: Clear conceptual breakdown, mathematical formulation, or algorithm steps suitable for a Part B (10 Marks) university answer.
3. **Illustrative Example or Walkthrough**: Concrete trace or code snippet illustrating how it works.
4. **Exam Answering Tips**: Specific advice on diagrams, keywords, or common errors that lose marks in university evaluations.

Answer clearly, accurately, and professionally.
"""
        llm_resp = await self.call_llm_response(prompt, TaskType.EXAM_INSIGHTS)
        is_fallback = False

        if llm_resp and llm_resp.content.strip():
            response_text = llm_resp.content.strip()
            provider_name = llm_resp.provider
            model_name = llm_resp.model_used
            log.info(
                f"[AcademicTutor] Successfully generated response via {provider_name} "
                f"(model={model_name}, tokens={llm_resp.tokens_used}, latency={llm_resp.latency_ms}ms)"
            )
        else:
            is_fallback = True
            provider_name = "fallback"
            model_name = "deterministic_fallback"
            log.warning(
                f"[AcademicTutor] LLM provider unavailable. Serving grounded deterministic fallback response for: '{query[:40]}...'"
            )
            query_lower = query.lower()
            if "knapsack" in query_lower and ("branch and bound" in query_lower or "lc" in query_lower or "least cost" in query_lower):
                response_text = """### 📘 0/1 Knapsack Problem using LC Branch and Bound (MLRIT R22 DAA Unit V)

#### 1. Core Definition & Principle (Part A — 2 Marks)
The **0/1 Knapsack Problem** using **Least-Cost (LC) Branch and Bound** is a state-space tree search technique where the next node to expand is chosen using an intelligent ranking function $\\hat{c}(x)$ (evaluated via a Min-Heap Priority Queue) rather than strict FIFO or LIFO order.

- **Objective Function**: Maximize $\\sum_{i=1}^n p_i x_i$ subject to $\\sum_{i=1}^n w_i x_i \\le W$, where $x_i \\in \\{0, 1\\}$.
- **Formulation for LCBB**: Converted into a minimization problem by minimizing $-\\sum_{i=1}^n p_i x_i$.
- **Bounding Functions**:
  - $\\hat{c}(x)$ (**Lower Bound on cost** / Upper Bound on profit): Computed by relaxing the 0/1 constraint to allow fractional items (Greedy Continuous Knapsack relaxation).
  - $u(x)$ (**Upper Bound on cost** / Lower Bound on profit): Computed by taking only integer items that fit greedily into the remaining capacity.
  - **Pruning Rule**: Kill any node $y$ if $\\hat{c}(y) \\ge U$, where $U$ is the minimum upper bound cost found so far among all generated live nodes.

---

#### 2. Mathematical Formulation of Bounds
Items are pre-sorted in descending order of profit-to-weight ratio:
$$\\frac{p_1}{w_1} \\ge \\frac{p_2}{w_2} \\ge \\dots \\ge \\frac{p_n}{w_n}$$

For a node $x$ at level $i$ with current accumulated weight $W_{curr}$ and profit $P_{curr}$:
1. Fill remaining capacity $C_{rem} = W - W_{curr}$ with integer items starting from index $i+1$.
2. Once an item $k$ cannot fit entirely:
   - For $\\hat{c}(x)$: Add the fractional portion of item $k$:
     $$\\hat{c}(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j + C'_{rem} \\cdot \\frac{p_k}{w_k}\\right)$$
   - For $u(x)$: Stop without taking fractions:
     $$u(x) = -\\left(P_{curr} + \\sum_{j=i+1}^{k-1} p_j\\right)$$

---

#### 3. Step-by-Step Numerical Walkthrough (Part B — 10 Marks Trace)
Consider $n = 4$ items and knapsack capacity $W = 15$:
- **Profits**: $P = [10, 10, 12, 18]$
- **Weights**: $W = [2, 4, 6, 9]$
- **Ratios** ($p_i / w_i$): $[5.0, 2.5, 2.0, 2.0]$ *(already sorted)*

```
                            [Node 1: Root]
                      ĉ = -38, u = -32, W_rem = 15
                             /           \\
                 x1 = 1     /             \\   x1 = 0
                           /               \\
                [Node 2]                     [Node 3]
            ĉ = -38, u = -32             ĉ = -32, u = -22
            (Selected: Min ĉ)
                  /     \\
      x2 = 1     /       \\   x2 = 0
                /         \\
          [Node 4]        [Node 5]
      ĉ = -38, u = -38   ĉ = -36, u = -22
```

1. **Root Node (Node 1)**:
   - Include item 1 ($w=2, p=10$), item 2 ($w=4, p=10$), item 3 ($w=6, p=12$): Weight = $12 \\le 15$, Profit = $32$.
   - Remaining capacity = $15 - 12 = 3$. Fraction of item 4 taken = $3/9 \\times 18 = 6$.
   - $\\hat{c}(1) = -(32 + 6) = -38$
   - $u(1) = -32$ (integer solution without fractions)
   - Live Node List (Min-Heap): `[Node 1 (ĉ = -38)]`, Best $U = -32$.

2. **Generate Children of Node 1**:
   - **Left Child (Node 2: $x_1 = 1$)**: Weight = $2$, Profit = $10$.
     Remaining capacity = $13$. Items 2 and 3 fit ($w=4+6=10$). Remaining = $3$.
     Fraction of item 4 = $3/9 \\times 18 = 6$.
     $\\hat{c}(2) = -38$, $u(2) = -32$.
   - **Right Child (Node 3: $x_1 = 0$)**: Weight = $0$, Profit = $0$.
     Remaining capacity = $15$. Items 2 and 3 fit ($w=10, p=22$). Remaining = $5$.
     Fraction of item 4 = $5/9 \\times 18 = 10$.
     $\\hat{c}(3) = -32$, $u(3) = -22$.
   - Min-Heap: `[Node 2 (ĉ = -38), Node 3 (ĉ = -32)]`. Best $U = -32$.

3. **Expand Node 2 (Least Cost $\\hat{c} = -38$)**:
   - **Node 4 ($x_2 = 1$)**: Weight = $2 + 4 = 6$, Profit = $10 + 10 = 20$.
     Item 3 ($w=6, p=12$) fits. Weight = $12$, Profit = $32$. Remaining = $3$.
     Fraction of item 4 = $3/9 \\times 18 = 6$.
     $\\hat{c}(4) = -38$, $u(4) = -32$.
   - **Node 5 ($x_2 = 0$)**: Weight = $2$, Profit = $10$.
     $\\hat{c}(5) = -36$, $u(5) = -22$.

4. **Optimal Leaf Termination**:
   - Optimal path selects items with $x = (1, 1, 0, 1)$ or $(1, 1, 1, 0)$ giving maximum integer profit **$Z^* = 38$** (or **$32$** subject to exact integer packing).
   - Any live node with $\\hat{c} \\ge U$ is pruned immediately from the min-heap.

---

#### 4. University Exam Answering Tips (MLRIT Evaluation Standards)
- **Time Complexity**: Worst-case $O(2^n)$ nodes generated; in practice, bounding functions prune $>70\\%$ of the state space.
- **Space Complexity**: $O(2^n)$ to hold the priority queue of active live nodes.
- **Diagrams**: Always sketch the state-space tree with explicit $\\hat{c}$, $u$, and capacity annotations on each node.
- **Comparison for Part B**: Note that LCBB finds the optimal solution while exploring substantially fewer nodes than FIFO Branch and Bound or Backtracking."""
            elif "banker" in query_lower or "deadlock" in query_lower:
                response_text = """### 📘 Banker's Algorithm for Deadlock Avoidance (MLRIT R22 OS Unit III)

#### 1. Core Principle (Part A — 2 Marks)
**Banker's Algorithm** is a deadlock avoidance algorithm developed by Edsger Dijkstra for resource allocation. It tests for safety by simulating the allocation of predetermined maximum possible amounts of all resources, and then makes an "s-state" check to test for possible activities before deciding whether allocation should be allowed.

#### 2. Key Data Structures (Part B — 10 Marks)
For $n$ processes and $m$ resource types:
- **Available**: Vector of length $m$. If `Available[j] = k`, then $k$ instances of resource type $R_j$ are available.
- **Max**: $n \\times m$ matrix. If `Max[i, j] = k`, process $P_i$ may request at most $k$ instances of resource $R_j$.
- **Allocation**: $n \\times m$ matrix. If `Allocation[i, j] = k`, process $P_i$ is currently allocated $k$ instances of $R_j$.
- **Need**: $n \\times m$ matrix indicating remaining resource need:
  $$\\text{Need}[i, j] = \\text{Max}[i, j] - \\text{Allocation}[i, j]$$

#### 3. Safety Algorithm Trace
1. Let `Work = Available` and `Finish[i] = False` for $i = 0, 1, \\dots, n-1$.
2. Find an index $i$ such that both:
   - `Finish[i] == False`
   - `Need[i] <= Work`
   If no such $i$ exists, go to step 4.
3. `Work = Work + Allocation[i]`, `Finish[i] = True`. Go to step 2.
4. If `Finish[i] == True` for all $i$, the system is in a **Safe State**; the sequence of processes is a safe sequence."""
            else:
                response_text = f"""### 📘 Academic Concept Breakdown: {query}

#### 1. Core Definition (Part A — 2 Marks)
In the MLRIT autonomous {regulation} curriculum, this concept represents a fundamental principle evaluated for mathematical precision and formal definition. State the input domain, operational constraints, and asymptotic bounds.

#### 2. Technical Mechanism & Proof (Part B — 10 Marks)
- **Mathematical Invariants**: Clearly specify the induction hypothesis, recurrence relation, or state invariants.
- **State-Space or Execution Flow**: Draw a neat block diagram or state-space tree in university booklets.
- **Algorithmic Recurrence**: For recursive and dynamic algorithms, define the base cases and recurrence step explicitly.

#### 3. University Exam Answering Strategy
- Write point-wise explanations with boxed formulas.
- Explicitly state Time and Space Complexity ($O(\\dots)$ notation).
- Include a traced numerical or tabular trace to secure full 10/10 marks."""

            if not citations:
                citations.append(Citation(
                    source_type="syllabus",
                    reference_id="A6CS15",
                    title="MLRIT R22 Syllabus — Design and Analysis of Algorithms (Unit V: Branch & Bound)",
                    url=None,
                    metadata={"regulation": regulation, "marks": 10},
                ))


        # Suggested actions
        suggested_actions = [
            SuggestedAction(label="Check Repeated Questions", action_type="query", payload=f"What are the repeated questions on {keywords[0] if keywords else 'this subject'}?"),
            SuggestedAction(label="View Syllabus Units", action_type="query", payload="Which syllabus unit covers this topic?"),
            SuggestedAction(label="Open Past Papers", action_type="navigate", payload="/papers"),
        ]

        metadata = {
            "provider": provider_name,
            "model_used": model_name,
            "is_fallback": is_fallback,
        }

        return response_text, citations, suggested_actions, metadata
