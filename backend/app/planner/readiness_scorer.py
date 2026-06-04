"""
Readiness Scorer — computes a 0-100 readiness score for a student
on a specific subject+regulation pair.

Factor weights:
  topic_coverage    30%
  practice          25%
  plan_completion   25%
  syllabus_coverage 20%

Grade thresholds:
  A      >= 85
  B+     >= 75
  B      >= 65
  C      >= 55
  Pass   >= 40
  At Risk < 40

Architecture rule: NEVER uses data from a different regulation.
All DB queries are scoped with WHERE regulation = $regulation.
"""
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)

GRADE_THRESHOLDS = [
    (85, "A"),
    (75, "B+"),
    (65, "B"),
    (55, "C"),
    (40, "Pass"),
    (0,  "At Risk"),
]

WEIGHTS = {
    "topic_coverage": 0.30,
    "practice": 0.25,
    "plan_completion": 0.25,
    "syllabus_coverage": 0.20,
}


class ReadinessScorer:
    def __init__(self):
        self.db = get_db()

    def score(
        self,
        user_id: str,
        subject_id: str,
        regulation: str,
        study_plan_id: str | None = None,
    ) -> dict:
        """
        Compute and return the full readiness report for a student.
        """
        # --- 1. Fetch user_activity scoped to this regulation ---
        activities = self._fetch_activities(user_id, subject_id, regulation)

        # --- 2. Fetch study plan if provided ---
        plan = None
        if study_plan_id:
            plan = self._fetch_plan(study_plan_id, regulation)

        # --- 3. Fetch syllabus topics for this subject+regulation ---
        syllabus_topics = self._fetch_syllabus_topics(subject_id, regulation)

        # --- 4. Compute individual factor scores ---
        topic_coverage_score = self._compute_topic_coverage(activities, syllabus_topics)
        practice_score = self._compute_practice_score(activities)
        plan_completion_score = self._compute_plan_completion(plan)
        syllabus_coverage_score = self._compute_syllabus_coverage(activities, syllabus_topics)

        # --- 5. Weighted composite score ---
        composite = (
            topic_coverage_score * WEIGHTS["topic_coverage"]
            + practice_score * WEIGHTS["practice"]
            + plan_completion_score * WEIGHTS["plan_completion"]
            + syllabus_coverage_score * WEIGHTS["syllabus_coverage"]
        )
        score = round(min(100, max(0, composite)), 1)

        # --- 6. Grade prediction ---
        grade = self._predict_grade(score)

        # --- 7. Identify weak areas ---
        weak_areas = self._identify_weak_areas(activities, syllabus_topics)

        # --- 8. Build recommendations ---
        recommendations = self._build_recommendations(
            weak_areas, activities, syllabus_topics,
            plan_completion_score, practice_score
        )

        return {
            "score": score,
            "grade_prediction": grade,
            "topic_coverage_score": round(topic_coverage_score, 1),
            "practice_score": round(practice_score, 1),
            "plan_completion_score": round(plan_completion_score, 1),
            "syllabus_coverage_score": round(syllabus_coverage_score, 1),
            "weak_areas": weak_areas,
            "recommendations": recommendations,
        }

    # ------------------------------------------------------------------
    # Factor computations
    # ------------------------------------------------------------------

    def _compute_topic_coverage(self, activities: list, syllabus_topics: list) -> float:
        """Percentage of syllabus topics the student has studied."""
        if not syllabus_topics:
            # If no syllabus data, score based on study activity volume
            study_activities = [a for a in activities if a.get("activity_type") == "study"]
            return min(100, len(study_activities) * 10)

        studied_topics = set()
        for a in activities:
            if a.get("activity_type") in ("study", "practice", "mock_exam"):
                meta = a.get("metadata") or {}
                topic = meta.get("topic") or a.get("reference_id", "")
                if topic:
                    studied_topics.add(topic.lower())

        covered = sum(
            1 for t in syllabus_topics
            if t.lower() in studied_topics
        )
        return (covered / len(syllabus_topics)) * 100

    def _compute_practice_score(self, activities: list) -> float:
        """Score based on number of practice/mock sessions."""
        practice = [
            a for a in activities
            if a.get("activity_type") in ("practice", "mock_exam", "quiz")
        ]
        # Each session = 10 points, capped at 100
        return min(100, len(practice) * 10)

    def _compute_plan_completion(self, plan: dict | None) -> float:
        """Percentage of study plan tasks marked complete."""
        if not plan:
            return 50.0  # neutral if no plan

        plan_data = plan.get("plan_data") or plan
        daily_plan = plan_data.get("daily_plan", [])
        if not daily_plan:
            return 50.0

        total_tasks = sum(len(day.get("tasks", [])) for day in daily_plan)
        completed_tasks = sum(
            len([t for t in day.get("completed_tasks", []) if t])
            for day in daily_plan
        )
        if total_tasks == 0:
            return 50.0

        return (completed_tasks / total_tasks) * 100

    def _compute_syllabus_coverage(self, activities: list, syllabus_topics: list) -> float:
        """Depth of coverage — have they studied high-weight topics?"""
        if not syllabus_topics:
            return min(100, len(activities) * 5)

        # Same as topic_coverage but weighted by topic importance if available
        return self._compute_topic_coverage(activities, syllabus_topics)

    # ------------------------------------------------------------------
    # Grade + weak areas + recommendations
    # ------------------------------------------------------------------

    def _predict_grade(self, score: float) -> str:
        for threshold, grade in GRADE_THRESHOLDS:
            if score >= threshold:
                return grade
        return "At Risk"

    def _identify_weak_areas(self, activities: list, syllabus_topics: list) -> list:
        """Return topics that have not been studied."""
        if not syllabus_topics:
            return []

        studied = set()
        for a in activities:
            meta = a.get("metadata") or {}
            topic = meta.get("topic") or a.get("reference_id", "")
            if topic:
                studied.add(topic.lower())

        return [t for t in syllabus_topics if t.lower() not in studied]

    def _build_recommendations(
        self,
        weak_areas: list,
        activities: list,
        syllabus_topics: list,
        plan_completion: float,
        practice_score: float,
    ) -> list:
        recs = []

        for topic in weak_areas[:5]:
            # Try to find frequency from activity metadata or just flag as not studied
            recs.append({
                "action": f"Study {topic} — not yet covered",
                "reason": f"{topic} is part of the syllabus and has not been studied",
                "priority": "urgent",
            })

        if practice_score < 40:
            recs.append({
                "action": "Complete at least 3 practice sessions",
                "reason": "Low practice score — practice improves retention and exam readiness",
                "priority": "high",
            })

        if plan_completion < 50 and plan_completion != 50.0:
            recs.append({
                "action": "Follow your study plan more closely",
                "reason": f"Plan completion is at {plan_completion:.0f}% — consistency is key",
                "priority": "high",
            })

        if not recs:
            recs.append({
                "action": "Take a full mock exam",
                "reason": "Good coverage — mock exam will identify remaining gaps",
                "priority": "medium",
            })

        return recs

    # ------------------------------------------------------------------
    # DB helpers (all regulation-scoped)
    # ------------------------------------------------------------------

    def _fetch_activities(self, user_id: str, subject_id: str, regulation: str) -> list:
        try:
            result = (
                self.db.table("user_activity")
                .select("*")
                .eq("user_id", user_id)
                .eq("subject_id", subject_id)
                .eq("regulation", regulation)
                .execute()
            )
            return result.data or []
        except Exception as e:
            log.warning(f"Could not fetch user_activity: {e}")
            return []

    def _fetch_plan(self, study_plan_id: str, regulation: str) -> dict | None:
        try:
            result = (
                self.db.table("study_plans")
                .select("*")
                .eq("id", study_plan_id)
                .eq("regulation", regulation)
                .execute()
            )
            rows = result.data or []
            return rows[0] if rows else None
        except Exception as e:
            log.warning(f"Could not fetch study_plan {study_plan_id}: {e}")
            return None

    def _fetch_syllabus_topics(self, subject_id: str, regulation: str) -> list:
        try:
            result = (
                self.db.table("syllabus_topics")
                .select("topic_name")
                .eq("subject_id", subject_id)
                .eq("regulation", regulation)
                .execute()
            )
            return [row["topic_name"] for row in (result.data or [])]
        except Exception as e:
            log.warning(f"Could not fetch syllabus_topics: {e}")
            return []
