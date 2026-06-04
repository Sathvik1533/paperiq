# PaperIQ — Database Schema

Full DDL: `supabase/migrations/001_initial_schema.sql`

## Tables

| Table | Purpose |
|---|---|
| `colleges` | University records + scraper adapter type |
| `branches` | Academic branches per college |
| `subjects` | Subjects with course codes and regulation |
| `subject_branch_map` | Many-to-many: subjects ↔ branches |
| `paper_sources` | Portal URLs + scraper configs |
| `papers` | One row per QP file. Dedup via `file_hash` (SHA-256) |
| `questions` | Structured questions. Dedup via `question_hash` |
| `topics` | Canonical topic list per subject |
| `question_topics` | Many-to-many: questions ↔ topics |
| `scraping_jobs` | Background job tracking with progress |
| `analysis_reports` | Cached analysis output (7-day TTL) |
| `syllabi` | Uploaded or auto-retrieved syllabus data |
| `syllabus_topics` | Individual topics from syllabus |
| `syllabus_coverage` | Computed: syllabus topic → matched questions → frequency |
| `study_plans` | Day-by-day study schedules |
| `readiness_scores` | 0–100 per user per subject with grade prediction |
| `mock_exams` | Generated predicted exams with evidence trail |
| `saved_reports` | User bookmarks on analysis reports |
| `user_profiles` | Extension of auth.users |
| `user_activity` | Tracks practice / paper views → feeds readiness scorer |
| `plans` | Subscription plans (schema live, logic in M7) |
| `subscriptions` | User subscriptions |
| `payments` | Payment records |

## Key Design Decisions

- `file_hash` (SHA-256) on `papers` prevents re-downloading identical files
- `question_hash` on `questions` prevents duplicate question insertion
- `topic_tags TEXT[]` on `questions` uses GIN index for fast tag searches
- `analysis_reports.expires_at` = 7-day cache TTL
- All insights carry `paper_id[]` + `question_id[]` references for evidence trail
