# PaperIQ — API Contract

Base URL: `/api/v1`

## Response Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "cached": false,
    "generated_at": "2026-06-04T07:00:00Z",
    "source_papers": 10,
    "total_questions": 284
  },
  "error": null
}
```

## Endpoints

### System
```
GET  /health                  → { status, version, db, storage, llm }
GET  /llm/health              → { providers: [{ name, status, latency_ms }] }
GET  /llm/active              → currently active provider
```

### Auth
```
POST /auth/google
POST /auth/logout
GET  /auth/me
```

### Academic Structure
```
GET  /colleges
GET  /colleges/{id}/branches
GET  /subjects?college=&branch=&year=&regulation=
```

### Scraping
```
POST /scrape/trigger          Body: { college_id, subject_id, year_from, year_to, force_refresh }
GET  /scrape/jobs/{job_id}    → { status, stage, progress_pct, papers_found, error_log }
GET  /scrape/jobs
```

### Papers
```
GET  /papers?subject_id=&year=&exam_type=&regulation=
GET  /papers/{id}
GET  /papers/{id}/download
GET  /papers/{id}/questions
POST /papers/upload
```

### Questions
```
GET  /questions?subject_id=&unit=&type=&marks=&year_from=&year_to=
GET  /questions/{id}          → Question + paper metadata (evidence trail)
```

### Analysis
```
POST /analysis/run            Body: { subject_id, college_id, branch_id, year_from, year_to }
GET  /analysis/{report_id}
GET  /analysis/{report_id}/status
GET  /analysis/cached?subject_id=&year_from=&year_to=
```

### Syllabus
```
POST /syllabus/upload
GET  /syllabus?subject_id=&regulation=
GET  /syllabus/{id}/coverage?report_id=
```

### Study Planner
```
POST /planner/generate        Body: { report_id, exam_date, hours_per_day, target_grade }
GET  /planner/{id}
```

### Readiness
```
GET  /readiness?subject_id=&plan_id=
POST /readiness/recalculate
```

### Mock Exam
```
POST /mock/generate           Body: { report_id, unit_filter[], marks_total }
GET  /mock/{id}
```

### Activity
```
POST /activity
GET  /activity/summary?subject_id=
```

### Plans (stub)
```
GET  /plans
GET  /subscriptions/me
```
