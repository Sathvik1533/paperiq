// B2 fix: report uses `id` not `report_id`
// B3 fix: `question_count` aligned, total_papers/total_questions added

export interface College {
  id: string
  name: string
  short_name: string
  portal_url?: string
  scraper_type?: string
}

export interface Subject {
  id: string
  name: string
  code: string
  college_id?: string  // optional — fallback entries constructed without a DB row won't have this
  regulation?: string
  semester?: number
  year?: number
}

export interface Branch {
  id: string
  name: string
  short_name: string
  college_id: string
}

export interface ParsedQuestion {
  id: string
  paper_id: string
  question_text: string
  unit_number?: number
  marks?: number
  question_type?: string
  co?: string
  part?: string
  is_or_question?: boolean
}

export interface TopicFrequency {
  topic: string
  unit?: string | number
  unit_number?: number
  frequency: number
  years: number[]
  paper_ids?: string[]
  marks?: number
}

export interface UnitDistribution {
  unit: string
  unit_number?: number
  question_count: number
  percentage: number
}

export interface RepeatedQuestion {
  question_text: string
  frequency: number
  years: number[]
  marks?: number
  paper_ids?: string[]
  question_type?: string
}

export interface HighProbabilityTopic {
  topic: string
  probability: string          // 'Very High' | 'High' | 'Medium' | 'Low'
  score?: number
  unit?: string | number
  evidence_papers?: string[]
}

export interface PredictedQuestion {
  question_text: string
  confidence: number
  evidence_count: number
  years: number[]
  unit?: string | number
  marks?: number
  evidence?: Array<{ paper_id: string; year: number | string; exam_type: string }>
}

// B2 fix: `id` is the correct field name from backend
export interface AnalysisReport {
  id: string                   // was: report_id — fixed B2
  subject_id: string
  subject_name?: string
  regulation: string
  branch_id?: string
  year_from?: number
  year_to?: number
  question_count: number       // backend field name
  total_papers?: number
  total_questions?: number     // alias for question_count
  topic_frequency: TopicFrequency[]
  unit_distribution: UnitDistribution[]
  repeated_questions: RepeatedQuestion[]
  high_probability_topics: HighProbabilityTopic[]
  predicted_questions: PredictedQuestion[]
  trend_heatmap?: Record<string, Record<string, number>>
  generated_at?: string
  expires_at?: string
  status?: string
}

export interface StudyDayPlan {
  date: string
  topics: string[]
  hours: number
  priority: 'must_study' | 'high' | 'medium' | 'low'
  tasks?: string[]
  completed_tasks?: boolean[]
}

export interface StudyPlan {
  plan_id: string
  report_id: string
  exam_date: string
  hours_per_day: number
  target_grade: string
  total_days?: number
  study_days?: number
  daily_plan: StudyDayPlan[]
  priority_map?: Record<string, string[]>
  warnings?: string[]
}

export interface ReadinessScore {
  score: number
  grade_prediction: string
  weak_areas: string[]
  strong_areas?: string[]
  topic_coverage_score?: number
  practice_score?: number
  plan_completion_score?: number
  syllabus_coverage_score?: number
  recommendations?: Array<{ action: string; reason: string; priority: string }>
}

export interface MockQuestion {
  question_text: string
  marks: number
  unit?: number | string
  question_type?: string
  confidence?: number
  evidence?: Array<{ paper_id: string; year: number | string; exam_type: string }>
  part?: string
}

export interface MockExam {
  mock_id: string
  report_id?: string
  regulation: string
  questions: MockQuestion[]
  part_a_questions?: MockQuestion[]
  part_b_questions?: MockQuestion[]
  total_marks: number
  part_a_count: number
  part_b_count: number
  duration_minutes?: number
  generated_at?: string
}

export interface ScrapeJob {
  job_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  stage?: string
  progress_pct?: number
  progress?: number
  message?: string
  papers_found?: number
  papers_new?: number
  scraper_used?: string
}

export interface Paper {
  id: string
  title: string
  exam_year: number
  exam_month?: string
  exam_type: string
  regulation: string
  subject_id: string
  extraction_status: 'pending' | 'success' | 'failed'
  btech_year?: number
  max_marks?: number
  parsed_questions?: ParsedQuestion[]
}

export interface SyllabusTopic {
  id: string
  syllabus_id: string
  unit_number: number
  unit_name: string
  topic_name: string
  subtopics?: string[]
}

export interface Syllabus {
  id: string
  subject_id: string
  regulation: string
  source_type: string
  parsed_units?: Array<{
    unit_number: number
    unit_name: string
    topics: Array<{ name: string; subtopics?: string[] }>
  }>
  created_at?: string
}

export interface CoverageUnit {
  unit_number: number
  unit_name: string
  coverage_pct: number
  covered_topics: string[]
  uncovered_topics: string[]
  matched_questions: number
}

export interface CoverageReport {
  overall_coverage_pct: number
  total_topics: number
  covered_topics: number
  unit_coverage: CoverageUnit[]
  topic_mapping: Array<{
    topic_name: string
    matched_questions: Array<{ question_text: string; paper_id: string; year: number }>
    coverage_pct: number
  }>
  warning?: string
}

export interface UserProfile {
  id: string
  full_name?: string
  college_id?: string
  branch_id?: string
  regulation?: string
  current_year?: number
  current_semester?: number
  target_cgpa?: number
  target_marks?: number
  hours_per_day?: number
  preparation_level?: 'beginner' | 'intermediate' | 'advanced'
  onboarding_complete?: boolean
  avatar_url?: string
}
