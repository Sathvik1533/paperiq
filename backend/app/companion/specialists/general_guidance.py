"""
General Guidance and Orchestration Assistant.
Handles onboarding queries, platform navigation, study strategy overviews,
and directs students to appropriate specialist capabilities.
"""
from typing import Dict, Any, List, Tuple
from app.companion.specialists.base import BaseSpecialist
from app.companion.models import Citation, SuggestedAction, SpecialistType
from app.logger import get_logger

log = get_logger(__name__)


class GeneralGuidanceSpecialist(BaseSpecialist):
    specialist_type = SpecialistType.GENERAL_MENTOR
    badge = "AI Companion Guide"
    description = "Study strategy guidance, platform navigation, and capability coordination."

    async def handle(
        self,
        query: str,
        context: Dict[str, Any],
    ) -> Tuple[str, List[Citation], List[SuggestedAction]]:
        query_clean = query.strip().lower()
        is_simple_greeting = query_clean in {"hi", "hello", "hey", "help", "who are you", "what can you do", "start", "menu"}

        response_text = ""
        is_fallback = False
        provider_name = "system"
        model_name = "system_menu"

        if not is_simple_greeting and len(query.split()) > 3:
            # Connect to Groq for open-ended student guidance & study strategy questions
            guidance_prompt = f"""
You are the PaperIQ AI Companion Guide for engineering students under MLRIT autonomous R22 regulation.
The student asks for general study guidance or academic navigation:
"{query}"

Provide clear, encouraging, structured advice:
1. Ground the advice in autonomous university exam patterns (Part A 2M definitions, Part B 10M long answers).
2. Recommend concrete study workflows (Syllabus check, PYQ repetition analysis, 7-day masterplan).
3. Point out which PaperIQ specialist can help with specific tasks.

Format in clean markdown with bullet points.
"""
            llm_resp = await self.call_llm_response(guidance_prompt)
            if llm_resp and llm_resp.content.strip():
                response_text = llm_resp.content.strip()
                provider_name = llm_resp.provider
                model_name = llm_resp.model_used
                is_fallback = False
                log.info(f"[GeneralGuidance] Generated advice via {provider_name} (model={model_name})")
            else:
                is_fallback = True
                provider_name = "fallback"
                model_name = "deterministic_fallback"
                log.warning(f"[GeneralGuidance] LLM provider unavailable. Serving fallback guidance.")

        if not response_text:
            response_text = f"""### 👋 Welcome to PaperIQ AI Companion

I am your dedicated academic co-pilot for MLRIT autonomous examinations (R22 regulation). I orchestrate 5 specialized intelligence layers to help you score maximum marks with minimum wasted effort:

---

#### 🧠 Specialist Capabilities You Can Ask Me:

1. **AI Academic Tutor** (`academic_tutor`):
   - *"Explain Banker's Algorithm with an example."*
   - *"Explain 0/1 Knapsack using Branch and Bound with state-space tree."*
   - *"Derive the time complexity of Kruskal's Algorithm."*
   - *"Give me a Part A (1M) definition of greedy choice property."*

2. **Syllabus & Curriculum Intelligence** (`syllabus_intelligence`):
   - *"What topics are in Design and Analysis of Algorithms Unit 2?"*
   - *"Show me all R22 3-1 semester subjects."*
   - *"What are the Course Outcomes for Computer Networks?"*

3. **Exam Pattern Analyst** (`exam_prep_analyst`):
   - *"What are the most repeated questions in DAA?"*
   - *"Which topics have the highest frequency in 3-1 Regular exams?"*
   - *"Show me the marks distribution between Part A and Part B."*

4. **Study Planner Coach** (`planner_coach`):
   - *"I have my DAA exam in 5 days, plan my study schedule."*
   - *"How can I improve my Exam Readiness Score to 85%?"*
   - *"Which units in Cloud & DevOps should I prioritize first?"*

5. **Document Retriever** (`document_retriever`):
   - *"Find the 2024 Regular 60-mark paper for DAA."*
   - *"Where can I download past question papers for Computer Networks?"*

---
*Type any question above or choose a quick action below to get started!*
"""

        citations = []
        suggested_actions = [
            SuggestedAction(label="Repeated Questions in DAA", action_type="query", payload="What are the repeated questions in Design and Analysis of Algorithms?"),
            SuggestedAction(label="7-Day Study Plan (DAA)", action_type="query", payload="Create a 7-day study plan for DAA"),
            SuggestedAction(label="0/1 Knapsack LCBB Trace", action_type="query", payload="Explain 0/1 Knapsack using LC Branch and Bound with state-space tree"),
            SuggestedAction(label="Browse Past Papers", action_type="navigate", payload="/papers"),
        ]

        metadata = {
            "provider": provider_name,
            "model_used": model_name,
            "is_fallback": is_fallback,
        }

        return response_text, citations, suggested_actions, metadata
