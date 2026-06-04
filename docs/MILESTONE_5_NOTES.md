# Milestone 5 — Personalized Study Planner

## What Was Built

- **Study plan generator** (`app/planner/generator.py`): takes a student's target exam date, available daily hours, and the M4 prediction output. Emits a day-by-day schedule with topics ranked by predicted exam weight.
- **Readiness scorer** (`app/planner/readiness.py`): produces a 0–100 readiness score by comparing completed topics vs. predicted high-weight topics. Includes a grade prediction (A/B/C/D/F) with confidence band.
- **Planner API** (`app/api/planner.py`): endpoints to create/read/update study plans and fetch the current readiness score for the authenticated user.
- **User activity tracker** (`app/planner/activity.py`): logs topic-completion events to `user_activity`, which feeds back into the readiness score.

## Key Design Decisions

- Plans are stored in `study_plans` (one active plan per user per subject).
- Readiness score is recomputed on-demand (not cached) so it always reflects the latest activity.
- LLM is used only for plan narrative ("why this topic today") — the scheduling math is deterministic.

## Database Tables Introduced

- `study_plans` — daily schedule blobs per user/subject.
- `readiness_scores` — snapshot scores with timestamp (history kept for trend chart).
- `user_activity` — timestamped topic-completion events.

## Test Coverage

- Generator tested with edge cases: 1-day deadline, zero available hours, no predictions available.
- Readiness scorer tested for boundary scores (0 and 100).
