import { supabase } from './supabase'
import type {
  College,
  Subject,
  AnalysisReport,
  StudyPlan,
  ReadinessScore,
  MockExam,
  ScrapeJob,
  Paper,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

async function fetchWithAuth<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export async function getColleges(): Promise<College[]> {
  return fetchWithAuth<College[]>('/colleges')
}

export async function getSubjects(collegeId: number): Promise<Subject[]> {
  return fetchWithAuth<Subject[]>(`/subjects?college_id=${collegeId}`)
}

export async function triggerScrape(
  collegeId: number,
  subjectId: number | undefined,
  yearFrom: number,
  yearTo: number
): Promise<ScrapeJob> {
  return fetchWithAuth<ScrapeJob>('/scrape/trigger', {
    method: 'POST',
    body: JSON.stringify({ college_id: collegeId, subject_id: subjectId, year_from: yearFrom, year_to: yearTo }),
  })
}

export async function getJobStatus(jobId: string): Promise<ScrapeJob> {
  return fetchWithAuth<ScrapeJob>(`/scrape/jobs/${jobId}`)
}

export async function runAnalysis(
  subjectId: number,
  regulation: string,
  branchId: number | undefined,
  yearFrom: number,
  yearTo: number
): Promise<{ report_id: string }> {
  return fetchWithAuth<{ report_id: string }>('/analysis/run', {
    method: 'POST',
    body: JSON.stringify({
      subject_id: subjectId,
      regulation,
      branch_id: branchId,
      year_from: yearFrom,
      year_to: yearTo,
    }),
  })
}

export async function getAnalysis(reportId: string): Promise<AnalysisReport> {
  return fetchWithAuth<AnalysisReport>(`/analysis/${reportId}`)
}

export async function getCachedAnalysis(
  subjectId: number,
  regulation: string,
  branchId: number | undefined,
  yearFrom: number,
  yearTo: number
): Promise<AnalysisReport | null> {
  const params = new URLSearchParams({
    subject_id: String(subjectId),
    regulation,
    year_from: String(yearFrom),
    year_to: String(yearTo),
  })
  if (branchId !== undefined) params.set('branch_id', String(branchId))
  try {
    return await fetchWithAuth<AnalysisReport>(`/analysis/cached?${params}`)
  } catch {
    return null
  }
}

export async function generatePlan(
  reportId: string,
  examDate: string,
  hoursPerDay: number,
  targetGrade: string,
  regulation: string,
  syllabusId: number | undefined,
  subjectId: number
): Promise<StudyPlan> {
  return fetchWithAuth<StudyPlan>('/planner/generate', {
    method: 'POST',
    body: JSON.stringify({
      report_id: reportId,
      exam_date: examDate,
      hours_per_day: hoursPerDay,
      target_grade: targetGrade,
      regulation,
      syllabus_id: syllabusId,
      subject_id: subjectId,
    }),
  })
}

export async function calculateReadiness(
  userId: string,
  subjectId: number,
  regulation: string,
  planId?: string
): Promise<ReadinessScore> {
  return fetchWithAuth<ReadinessScore>('/planner/readiness', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, subject_id: subjectId, regulation, plan_id: planId }),
  })
}

export async function generateMock(
  reportId: string,
  regulation: string,
  subjectId: number
): Promise<MockExam> {
  return fetchWithAuth<MockExam>('/mock/generate', {
    method: 'POST',
    body: JSON.stringify({ report_id: reportId, regulation, subject_id: subjectId }),
  })
}

export async function getPapers(subjectId: number, regulation: string): Promise<Paper[]> {
  return fetchWithAuth<Paper[]>(`/papers?subject_id=${subjectId}&regulation=${regulation}`)
}
