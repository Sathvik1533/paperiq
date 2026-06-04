# Milestone 4 — Pattern Analysis Engine

## What Was Built

- **Frequency analyzer** (`app/analysis/frequency.py`): counts how often each question/topic appears across all stored papers for a subject. Outputs ranked frequency tables.
- **Trend analyzer** (`app/analysis/trends.py`): computes year-over-year question frequency shifts to surface rising/falling topics.
- **Prediction engine** (`app/analysis/predictions.py`): combines frequency + trend scores into a weighted probability score per question/topic, flagged as HIGH / MEDIUM / LOW exam likelihood.
- **Analysis API** (`app/api/analysis.py`): REST endpoints exposing frequency, trends, and predictions per subject/college.

## Key Design Decisions

- All analysis runs over the `questions` table — the parser (M3) must have already tagged questions with `unit` and `topic` before analysis is meaningful.
- Predictions are purely statistical (no LLM call) to keep cost zero for this layer.
- Results are cached in `analysis_cache` table (TTL 24 h) so repeat API calls don't re-compute.

## Database Tables Introduced

- `analysis_cache` — stores serialized frequency/trend/prediction blobs per (college_id, subject_id, year_range) key.

## Test Coverage

- Unit tests for frequency counter edge cases (empty papers, single paper, duplicate questions).
- Integration test verifying the full analysis pipeline returns ranked results.
