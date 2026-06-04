"""
Learner Profiler — Automatic skill level detection.
Replaces manual Beginner/Intermediate/Advanced selection.

Detects learner characteristics from:
- Current CGPA
- Readiness scores
- Study activity patterns
- Mock exam performance
- Topic completion rates
"""
from typing import Optional
from app.database import get_db
from app.logger import get_logger

log = get_logger(__name__)


class LearnerProfiler:
    """Automatically profiles learner skill level and characteristics."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.db = get_db()
    
    def compute_profile(self) -> dict:
        """
        Compute complete learner profile from user data.
        
        Returns:
            {
                "detected_skill_level": "Beginner" | "Intermediate" | "Advanced",
                "consistency_score": 0-100,
                "learning_pace": "Fast" | "Medium" | "Slow",
                "risk_areas": [...],
                "strong_areas": [...],
            }
        """
        # Fetch user context
        user_profile = self._fetch_user_profile()
        if not user_profile:
            log.warning(f"No user profile found for {self.user_id}")
            return self._default_profile()
        
        cgpa = user_profile.get("current_cgpa", 0.0)
        
        # Fetch activity metrics
        activity = self._fetch_activity_metrics()
        readiness = self._fetch_avg_readiness()
        mock_performance = self._fetch_mock_performance()
        
        # Compute skill level
        skill_level = self._compute_skill_level(cgpa, readiness, mock_performance)
        
        # Compute consistency score (0-100)
        consistency = self._compute_consistency(activity)
        
        # Compute learning pace
        pace = self._compute_learning_pace(activity, readiness)
        
        # Identify risk and strong areas
        risk_areas, strong_areas = self._identify_topic_strengths()
        
        profile = {
            "detected_skill_level": skill_level,
            "consistency_score": consistency,
            "learning_pace": pace,
            "risk_areas": risk_areas,
            "strong_areas": strong_areas,
            "avg_readiness_score": readiness,
            "avg_mock_score": mock_performance,
            "total_study_time_mins": activity.get("total_time_mins", 0),
            "papers_viewed": activity.get("papers_viewed", 0),
            "mocks_attempted": activity.get("mocks_attempted", 0),
        }
        
        # Store in learner_profiles table
        self._store_profile(profile, user_profile)
        
        return profile
    
    def _compute_skill_level(
        self,
        cgpa: float,
        readiness: float,
        mock_score: float
    ) -> str:
        """
        Detect skill level from multiple signals.
        
        Logic:
        - Advanced: CGPA >= 8.5 OR readiness >= 80 OR mock >= 85
        - Intermediate: CGPA >= 7.0 OR readiness >= 60 OR mock >= 70
        - Beginner: below thresholds
        """
        if cgpa >= 8.5 or readiness >= 80 or mock_score >= 85:
            return "Advanced"
        elif cgpa >= 7.0 or readiness >= 60 or mock_score >= 70:
            return "Intermediate"
        else:
            return "Beginner"
    
    def _compute_consistency(self, activity: dict) -> float:
        """
        Compute study consistency score (0-100).
        
        Based on:
        - Activity regularity (days active in last 30 days)
        - Session frequency
        """
        days_active = activity.get("days_active_last_30", 0)
        sessions = activity.get("session_count", 0)
        
        # Consistency = weighted average
        # 70% weight on days_active, 30% on sessions
        consistency = (days_active / 30 * 70) + (min(sessions, 30) / 30 * 30)
        
        return min(100.0, consistency)
    
    def _compute_learning_pace(self, activity: dict, readiness: float) -> str:
        """
        Detect learning pace from study time vs readiness improvement.
        
        Fast: high readiness with low study time
        Medium: balanced
        Slow: high study time with low readiness
        """
        study_hours = activity.get("total_time_mins", 0) / 60.0
        
        if study_hours == 0:
            return "Medium"  # No data yet
        
        # Efficiency = readiness per study hour
        efficiency = readiness / max(study_hours, 1)
        
        if efficiency >= 10:
            return "Fast"
        elif efficiency >= 5:
            return "Medium"
        else:
            return "Slow"
    
    def _identify_topic_strengths(self) -> tuple[list[str], list[str]]:
        """
        Identify risk areas (weak topics) and strong areas.
        
        Uses readiness_scores.weak_areas and mock exam performance.
        """
        # Fetch latest readiness scores
        result = self.db.table("readiness_scores").select(
            "weak_areas, subject_id, score"
        ).eq("user_id", self.user_id).order("calculated_at", desc=True).limit(5).execute()
        
        scores = result.data or []
        
        risk_areas = []
        strong_areas = []
        
        for score in scores:
            weak = score.get("weak_areas") or []
            risk_areas.extend(weak)
            
            # If score >= 80, subject is a strong area
            if score.get("score", 0) >= 80:
                subject = score.get("subject_id")
                if subject:
                    strong_areas.append(subject)
        
        # Deduplicate
        risk_areas = list(set(risk_areas))[:10]
        strong_areas = list(set(strong_areas))
        
        return risk_areas, strong_areas
    
    def _fetch_user_profile(self) -> Optional[dict]:
        """Fetch user profile with CGPA and academic context."""
        try:
            result = self.db.table("user_profiles").select(
                "current_cgpa, target_cgpa, study_hours_per_day, "
                "college_id, branch_id, regulation, current_year, current_semester"
            ).eq("id", self.user_id).single().execute()
            return result.data
        except Exception as e:
            log.warning(f"Failed to fetch user profile: {e}")
            return None
    
    def _fetch_activity_metrics(self) -> dict:
        """Fetch activity metrics from user_activity table."""
        # Count days active in last 30 days
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        
        result = self.db.table("user_activity").select(
            "activity_type, created_at"
        ).eq("user_id", self.user_id).gte("created_at", thirty_days_ago).execute()
        
        activities = result.data or []
        
        # Count unique days
        dates = set()
        sessions = 0
        papers_viewed = 0
        mocks_attempted = 0
        
        for activity in activities:
            date = activity.get("created_at", "")[:10]  # YYYY-MM-DD
            dates.add(date)
            
            activity_type = activity.get("activity_type", "")
            if activity_type == "session_start":
                sessions += 1
            elif activity_type == "paper_view":
                papers_viewed += 1
            elif activity_type == "mock_attempt":
                mocks_attempted += 1
        
        return {
            "days_active_last_30": len(dates),
            "session_count": sessions,
            "papers_viewed": papers_viewed,
            "mocks_attempted": mocks_attempted,
            "total_time_mins": len(activities) * 15,  # Estimate: 15 mins per activity
        }
    
    def _fetch_avg_readiness(self) -> float:
        """Fetch average readiness score across all subjects."""
        result = self.db.table("readiness_scores").select(
            "score"
        ).eq("user_id", self.user_id).order("calculated_at", desc=True).limit(10).execute()
        
        scores = result.data or []
        if not scores:
            return 0.0
        
        total = sum(s.get("score", 0) for s in scores)
        return total / len(scores)
    
    def _fetch_mock_performance(self) -> float:
        """Fetch average mock exam score."""
        # Mock exams don't have scores yet in schema
        # Return 0 for now
        return 0.0
    
    def _store_profile(self, profile: dict, user_profile: dict):
        """Store computed profile in learner_profiles table."""
        try:
            self.db.table("learner_profiles").upsert({
                "user_id": self.user_id,
                "college_id": user_profile.get("college_id"),
                "branch_id": user_profile.get("branch_id"),
                "regulation": user_profile.get("regulation"),
                "current_year": user_profile.get("current_year"),
                "current_semester": user_profile.get("current_semester"),
                "current_cgpa": user_profile.get("current_cgpa"),
                "target_cgpa": user_profile.get("target_cgpa"),
                "study_hours_per_day": user_profile.get("study_hours_per_day"),
                "detected_skill_level": profile["detected_skill_level"],
                "consistency_score": profile["consistency_score"],
                "learning_pace": profile["learning_pace"],
                "risk_areas": profile["risk_areas"],
                "strong_areas": profile["strong_areas"],
                "avg_readiness_score": profile["avg_readiness_score"],
                "avg_mock_score": profile["avg_mock_score"],
                "total_study_time_mins": profile["total_study_time_mins"],
                "papers_viewed": profile["papers_viewed"],
                "mocks_attempted": profile["mocks_attempted"],
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()
            log.info(f"Stored learner profile for user {self.user_id}")
        except Exception as e:
            log.error(f"Failed to store learner profile: {e}")
    
    def _default_profile(self) -> dict:
        """Return default profile when no data available."""
        return {
            "detected_skill_level": "Intermediate",
            "consistency_score": 50.0,
            "learning_pace": "Medium",
            "risk_areas": [],
            "strong_areas": [],
            "avg_readiness_score": 0.0,
            "avg_mock_score": 0.0,
            "total_study_time_mins": 0,
            "papers_viewed": 0,
            "mocks_attempted": 0,
        }


def compute_learner_profile(user_id: str) -> dict:
    """
    Public API: Compute and return learner profile.
    
    Call this:
    - After user completes onboarding
    - After every readiness score calculation
    - After every mock exam attempt
    - Weekly as a background job
    """
    profiler = LearnerProfiler(user_id)
    return profiler.compute_profile()
