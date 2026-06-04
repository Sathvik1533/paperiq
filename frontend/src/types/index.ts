export interface College {
  id: number
  name: string
  code: string
  location?: string
}

export interface Subject {
  id: number
  name: string
  code: string
  college_id: number
  regulation?: string
  branch?: string
  semester?: number
}

export interface ParsedQuestion {
  id: number
  paper_id: number
  question_text: string
  unit?: string
  marks?: number
  question_type?: string
  year?: number
  regulation?: string
}

export interface AnalysisPaper {
  paper_id: number
  title: string
  year: number
  exam_type: string
}

export interface TopicFrequency {
  topic: string
  unit?: string
  frequency: number
  years: number[]
  marks?: number
}

export interface UnitDistribution {
  unit: string
  question_count: number
  percentage: number
}

export interface RepeatedQuestion {
  question_text: string
  frequency: number
  years: number[]
  marks?: number
  paper_ids: number[]
}

export interface HighProbabilityTopic {
  topic: string
  probability: 'Very High' | 'High' | 'Medium' | 'Low'
  score: number
  unit?: string
}

export interface PredictedQuestion {
  question_text: string
  confidence: number
  evidence_count: number
  years: number[]
  unit?: string
  marks?: number
}

export interface AnalysisReport {
  report_id: string
  subject_id: number
  subject_name?: string
  regulation: string
  branch_id?: number
  year_from: number
  year_to: number
  total_papers: number
  total_questions: number
  topic_frequency: TopicFrequency[]
  unit_distribution: UnitDistribution[]
  repeated_questions: RepeatedQuestion[]
  high_probability_topics: HighProbabilityTopic[]
  predicted_questions: PredictedQuestion[]
  papers?: AnalysisPaper[]
  created_at?: string
}

export interface StudyDayPlan {
  date: string
  topics: string[]
  hours: number
  priority: 'must_study' | 'high' | 'medium' | 'low'
}

export interface StudyPlan {
  plan_id: string
  report_id: string
  exam_date: string
  hours_per_day: number
  target_grade: string
  daily_plan: StudyDayPlan[]
  created_at?: string
}

export interface ReadinessScore {
  score: number
  grade_prediction: string
  weak_areas: string[]
  strong_areas: string[]
  recommendation?: string
}

export interface Question {
  id: number
  question_text: string
  options?: string[]
  correct_answer?: string
  marks: number
  unit?: string
}

export interface MockExam {
  mock_id: string
  report_id: string
  regulation: string
  questions: Question[]
  total_marks: number
  duration_minutes: number
  created_at?: string
}

export interface ScrapeJob {
  job_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  stage?: string
  progress?: number
  message?: string
  college_id?: number
  subject_id?: number
}

export interface Paper {
  id: number
  title: string
  year: number
  exam_type: string
  regulation: string
  subject_id: number
  extraction_status: 'pending' | 'completed' | 'failed'
  parsed_questions?: ParsedQuestion[]
}

export interface UserProfile {
  id: string
  user_id: string
  college_id?: number
  branch?: string
  regulation?: string
  current_year?: number
  semester?: number
  target_cgpa?: number
  target_marks?: number
  hours_per_day?: number
  preparation_level?: 'beginner' | 'intermediate' | 'advanced'
  subject_id?: number
}
