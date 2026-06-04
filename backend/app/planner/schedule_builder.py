"""
Schedule Builder — converts a priority_map into a day-by-day study plan.

Rules (locked):
- Last 2 days = revision of must_study topics only
- Day before those last 2 = mock exam day
- Remaining days: must_study first, then high, medium, low
- Hours per topic proportional to marks_weight
- If too many topics for available days: drop low, then medium — emit warning
"""
from datetime import date, timedelta
from app.logger import get_logger

log = get_logger(__name__)

# Minimum hours before a topic gets its own day slot
MIN_TOPIC_HOURS = 0.5


class ScheduleBuilder:
    def build(
        self,
        priority_map: dict,
        exam_date: str,
        hours_per_day: float,
        preparation_level: str = "intermediate",
    ) -> dict:
        """
        Build a daily study plan.

        Returns:
            {
                daily_plan: [{day, date, topics, hours, tasks}],
                warnings: [],
                total_days: int,
                study_days: int,
            }
        """
        today = date.today()
        exam_dt = date.fromisoformat(exam_date)
        delta = (exam_dt - today).days

        if delta <= 0:
            return {
                "daily_plan": [],
                "warnings": ["Exam date is today or in the past."],
                "total_days": 0,
                "study_days": 0,
            }

        warnings = []

        # Reserve last 2 days for revision, day before that for mock exam
        revision_days = 2
        mock_day_count = 1
        study_days = max(0, delta - revision_days - mock_day_count)

        must_study = list(priority_map.get("must_study", []))
        high = list(priority_map.get("high", []))
        medium = list(priority_map.get("medium", []))
        low = list(priority_map.get("low", []))

        # Combine all study topics in priority order
        study_topics = must_study + high + medium + low

        # Total available study hours
        total_study_hours = study_days * hours_per_day

        # Calculate time per topic proportional to marks_weight
        total_weight = sum(t.get("marks_weight", 1) for t in study_topics) or 1
        for t in study_topics:
            weight = t.get("marks_weight", 1) or 1
            t["_allocated_hours"] = max(MIN_TOPIC_HOURS, (weight / total_weight) * total_study_hours)

        # Check if total allocated hours fit in available study hours
        total_allocated = sum(t["_allocated_hours"] for t in study_topics)
        if total_allocated > total_study_hours and low:
            # Drop low priority topics first
            warnings.append(
                f"Not enough days to cover all topics. Dropping {len(low)} low-priority topics."
            )
            study_topics = [t for t in study_topics if t not in low]
            # Recalculate
            total_weight = sum(t.get("marks_weight", 1) for t in study_topics) or 1
            for t in study_topics:
                weight = t.get("marks_weight", 1) or 1
                t["_allocated_hours"] = max(MIN_TOPIC_HOURS, (weight / total_weight) * total_study_hours)

        total_allocated = sum(t["_allocated_hours"] for t in study_topics)
        if total_allocated > total_study_hours and medium:
            warnings.append(
                f"Still tight. Dropping {len(medium)} medium-priority topics."
            )
            study_topics = [t for t in study_topics if t not in medium]
            total_weight = sum(t.get("marks_weight", 1) for t in study_topics) or 1
            for t in study_topics:
                weight = t.get("marks_weight", 1) or 1
                t["_allocated_hours"] = max(MIN_TOPIC_HOURS, (weight / total_weight) * total_study_hours)

        # Build daily plan
        daily_plan = []
        day_num = 1
        current_date = today

        # --- Study days ---
        remaining_topics = list(study_topics)
        for d in range(study_days):
            day_topics = []
            day_hours_remaining = hours_per_day
            day_tasks = []

            topics_for_day = []
            while remaining_topics and day_hours_remaining > 0:
                topic = remaining_topics[0]
                needed = topic["_allocated_hours"]
                if needed <= day_hours_remaining + 0.1:  # small tolerance
                    topics_for_day.append(topic)
                    day_hours_remaining -= needed
                    remaining_topics.pop(0)
                else:
                    # Split topic across days
                    partial = dict(topic)
                    partial["_allocated_hours"] = day_hours_remaining
                    partial["topic"] = topic["topic"] + " (continued)"
                    topics_for_day.append(partial)
                    topic["_allocated_hours"] -= day_hours_remaining
                    day_hours_remaining = 0

            for t in topics_for_day:
                day_topics.append(t["topic"])
                day_tasks.append(f"Study: {t['topic']} ({t['_allocated_hours']:.1f}h)")

            if not day_topics:
                day_tasks = ["Free / buffer day"]

            daily_plan.append({
                "day": day_num,
                "date": current_date.isoformat(),
                "topics": day_topics,
                "hours": round(hours_per_day - max(0, day_hours_remaining), 2),
                "tasks": day_tasks,
                "day_type": "study",
            })
            day_num += 1
            current_date += timedelta(days=1)

        # Warn about leftover topics
        if remaining_topics:
            leftover = [t["topic"] for t in remaining_topics]
            warnings.append(f"Could not schedule: {leftover}. Add more days or increase hours/day.")

        # --- Mock exam day ---
        daily_plan.append({
            "day": day_num,
            "date": current_date.isoformat(),
            "topics": [t["topic"] for t in must_study],
            "hours": hours_per_day,
            "tasks": ["Take full mock exam under timed conditions", "Review answers after"],
            "day_type": "mock_exam",
        })
        day_num += 1
        current_date += timedelta(days=1)

        # --- Revision days ---
        revision_topics = [t["topic"] for t in must_study]
        for r in range(revision_days):
            daily_plan.append({
                "day": day_num,
                "date": current_date.isoformat(),
                "topics": revision_topics,
                "hours": hours_per_day,
                "tasks": [f"Revise: {t}" for t in revision_topics] or ["Full revision"],
                "day_type": "revision",
            })
            day_num += 1
            current_date += timedelta(days=1)

        return {
            "daily_plan": daily_plan,
            "warnings": warnings,
            "total_days": delta,
            "study_days": study_days,
        }
