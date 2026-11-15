import { supabase } from './supabase'
import { OFFICIAL_R22_3_1_SUBJECTS, filterTo31Subjects } from '../constants/r22_3_1'
import type {
  College, Subject, AnalysisReport, StudyPlan, ReadinessScore,
  MockExam, ScrapeJob, Paper, Syllabus, SyllabusTopic, CoverageReport,
} from '../types'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000/api/v1'

export async function fetchWithAuth<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error || !session || !session.access_token) {
    // Bug 2 Fix: Silently abort the doomed request and route to auth
    const { useAuthStore } = await import('../store/authStore')
    useAuthStore.getState().signOut()
    throw new Error('Session expired. Please log in again.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  headers['Authorization'] = `Bearer ${session.access_token}`
  
  // Custom SWR Engine: Instant hydration from localStorage for GET requests
  const cacheKey = `paperiq_swr_${path}`
  const isGet = !options.method || options.method.toUpperCase() === 'GET'

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API ${res.status}: ${text}`)
    }
    const data = await res.json()
    
    // Silently update cache in the background
    if (isGet && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(cacheKey, JSON.stringify(data))
    }
    return data
  } catch (err) {
    // GLOBAL FETCH INTERCEPTOR: The Network Shield
    // If a network connection drops or the backend dies ("Failed to fetch"), we intercept the exception immediately.
    // Instead of letting the component throw a red layout error, we silently catch it, pull the last valid
    // dataset from localStorage, and serve it directly back to the component as if the server succeeded.
    if (isGet && typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        console.warn(`[NETWORK SHIELD] Backend connection dropped for ${path}. Suppressing error and hydrating directly from local cache.`);
        return JSON.parse(cached) as T
      }
    }
    
    // If it's a POST/mutation and it drops, the ActionButton's silent retry will handle the loop.
    // If it's a GET and we have zero cache, we throw but the component-level fail-safes (like mock arrays) will catch it.
    throw err;
  }
}

// ── Academic ──────────────────────────────────────────────────────────────

export async function getColleges(): Promise<College[]> {
  const res = await fetchWithAuth<{ data: College[] } | College[]>('/colleges')
  return (res as any).data ?? (res as College[])
}

export async function getSubjects(collegeId: string): Promise<Subject[]> {
  try {
    const res = await fetchWithAuth<{ data: Subject[] } | Subject[]>(`/subjects?college=${collegeId}`)
    const raw = (res as any).data ?? (res as Subject[])
    const filtered = filterTo31Subjects(raw || [])
    return filtered.length > 0 ? (filtered as unknown as Subject[]) : (OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[])
  } catch {
    return OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[]
  }
}

export async function getBranches(collegeId: string): Promise<{ id: string; name: string; short_name: string }[]> {
  const res = await fetchWithAuth<{ data: any[] } | any[]>(`/colleges/${collegeId}/branches`)
  return (res as any).data ?? (res as any[])
}

// ── Scraping ──────────────────────────────────────────────────────────────

export async function triggerScrape(
  collegeId: string,
  subjectId: string | undefined,
  yearFrom: number,
  yearTo: number,
  regulation?: string,
  examCategories?: string[],
  examAttempts?: string[],
): Promise<{ job_id: string }> {
  return fetchWithAuth('/scrape/trigger', {
    method: 'POST',
    body: JSON.stringify({
      college_id: collegeId,
      subject_id: subjectId,
      year_from: yearFrom,
      year_to: yearTo,
      regulation,
      exam_categories: examCategories,
      exam_attempts: examAttempts,
    }),
  })
}

export async function getJobStatus(jobId: string): Promise<ScrapeJob> {
  return fetchWithAuth(`/scrape/jobs/${jobId}`)
}

// ── Analysis ──────────────────────────────────────────────────────────────

export async function runAnalysis(
  subjectId: string,
  regulation: string,
  branchId: string | undefined,
  yearFrom: number,
  yearTo: number,
): Promise<{ report_id: string }> {
  return fetchWithAuth('/analysis/run', {
    method: 'POST',
    body: JSON.stringify({ subject_id: subjectId, regulation, branch_id: branchId, year_from: yearFrom, year_to: yearTo }),
  })
}

export async function getAnalysis(reportId: string): Promise<AnalysisReport> {
  const res = await fetchWithAuth<any>(`/analysis/${reportId}`)
  const report: AnalysisReport = res.data ?? res
  // B3 fix: normalise field name aliases
  if (!report.total_questions && (report as any).question_count) {
    report.total_questions = (report as any).question_count
  }
  return report
}

export async function getAnalysisStatus(reportId: string): Promise<{ status: string }> {
  return fetchWithAuth(`/analysis/${reportId}/status`)
}

export async function getCachedAnalysis(
  subjectId: string,
  regulation: string,
  branchId?: string,
  yearFrom?: number,
  yearTo?: number,
): Promise<AnalysisReport | null> {
  const params = new URLSearchParams({ subject_id: subjectId, regulation })
  if (branchId) params.set('branch_id', branchId)
  if (yearFrom) params.set('year_from', String(yearFrom))
  if (yearTo) params.set('year_to', String(yearTo))
  try { return await fetchWithAuth<AnalysisReport>(`/analysis/cached?${params}`) }
  catch { return null }
}

// ── Papers ────────────────────────────────────────────────────────────────

export async function getPapers(subjectId: string, regulation: string): Promise<Paper[]> {
  const res = await fetchWithAuth<{ data: Paper[] } | Paper[]>(
    `/papers?subject_id=${subjectId}&regulation=${regulation}`
  )
  return (res as any).data ?? (res as Paper[])
}

// ── Planner ───────────────────────────────────────────────────────────────

export async function generatePlan(
  reportId: string,
  examDate: string,
  hoursPerDay: number,
  targetGrade: string,
  regulation: string,
  syllabusId: string | undefined,
  subjectId: string,
  preparationLevel: string = 'intermediate',
): Promise<StudyPlan> {
  const body: Record<string, unknown> = {
    report_id: reportId,
    exam_date: examDate,
    hours_per_day: hoursPerDay,
    target_grade: targetGrade,
    regulation,
    subject_id: subjectId,
    preparation_level: preparationLevel,
  }
  if (syllabusId) body.syllabus_id = syllabusId  // B5 fix: only send if defined
  return fetchWithAuth('/planner/generate', { method: 'POST', body: JSON.stringify(body) })
}

export async function calculateReadiness(
  userId: string,
  subjectId: string,
  regulation: string,
  planId?: string,
): Promise<ReadinessScore> {
  return fetchWithAuth('/readiness/calculate', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, subject_id: subjectId, regulation, study_plan_id: planId }),
  })
}

export async function generateMock(
  reportId: string,
  regulation: string,
  subjectId: string,
): Promise<MockExam> {
  return fetchWithAuth('/mock/generate', {
    method: 'POST',
    body: JSON.stringify({ report_id: reportId, regulation, subject_id: subjectId }),
  })
}

// ── Syllabus ──────────────────────────────────────────────────────────────

export async function uploadSyllabus(
  file: File,
  subjectId: string,
  regulation: string,
  branchId?: string,
  semester?: number,
): Promise<{ syllabus_id: string; units_found: number; total_topics: number; units: any[] }> {
  const { data: { session } } = await supabase.auth.getSession()
  const form = new FormData()
  form.append('file', file)
  form.append('subject_id', subjectId)
  form.append('regulation', regulation)
  if (branchId) form.append('branch_id', branchId)
  if (semester) form.append('semester', String(semester))
  const res = await fetch(`${BASE_URL}/syllabus/upload`, {
    method: 'POST',
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
    body: form,
  })
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`)
  const json = await res.json()
  return json.data ?? json
}

export async function getSyllabi(subjectId: string, regulation: string): Promise<Syllabus[]> {
  const res = await fetchWithAuth<{ data: Syllabus[] }>(`/syllabus?subject_id=${subjectId}&regulation=${regulation}`)
  return res.data ?? []
}

export async function getSyllabusTopics(syllabusId: string): Promise<SyllabusTopic[]> {
  const res = await fetchWithAuth<{ data: SyllabusTopic[] }>(`/syllabus/${syllabusId}/topics`)
  return res.data ?? []
}

export async function getSyllabusCoverage(
  syllabusId: string,
  subjectId: string,
  regulation: string,
): Promise<CoverageReport> {
  const params = new URLSearchParams({ subject_id: subjectId, regulation })
  const res = await fetchWithAuth<{ data: CoverageReport } | CoverageReport>(`/syllabus/${syllabusId}/coverage?${params}`)
  return (res as any).data ?? (res as CoverageReport)
}

export async function mapTopics(
  subjectId: string,
  regulation: string,
  syllabusId?: string,
): Promise<{ mapped: number; skipped_already_mapped: number; no_syllabus_match: number }> {
  return fetchWithAuth('/topics/map', {
    method: 'POST',
    body: JSON.stringify({ subject_id: subjectId, regulation, syllabus_id: syllabusId }),
  })
}

// ── Activity ──────────────────────────────────────────────────────────────

export async function logActivity(
  userId: string,
  activityType: string,
  subjectId: string,
  regulation: string,
  referenceId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await fetchWithAuth('/activity', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, activity_type: activityType, subject_id: subjectId, regulation, reference_id: referenceId, metadata }),
  })
}

// ── Profile (B4 fix) ──────────────────────────────────────────────────────

export async function getUserProfile(userId: string) {
  try {
    const res = await fetchWithAuth<{ data: any }>(`/profile/${userId}/context`)
    return res.data
  } catch (error) {
    // Profile not found or error - return null to allow fallback behavior
    console.warn('Profile fetch failed, using fallback:', error)
    return null
  }
}

export async function upsertUserProfile(userId: string, profile: Record<string, unknown>) {
  await updateProfile(userId, profile)
}

// ── Onboarding ────────────────────────────────────────────────────────────

export async function parseHallTicket(file: File): Promise<{
  branch: string | null
  regulation: string | null
  year: number | null
  semester: number | null
  semester_display: string | null
  subject_codes: string[]
  subjects: Array<{code: string; name: string}>
  confidence: string
}> {
  const { data: { session } } = await supabase.auth.getSession()
  const form = new FormData()
  form.append('file', file)
  
  // IMPORTANT: Do NOT set Content-Type header for FormData
  // The browser will automatically set it with the correct multipart/form-data boundary
  const headers: Record<string, string> = {}
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  
  const res = await fetch(`${BASE_URL}/onboarding/parse-hall-ticket`, {
    method: 'POST',
    headers,
    body: form,
  })
  
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Hall ticket parse failed: ${text}`)
  }
  
  return res.json()
}

export async function confirmHallTicketProfile(profile: {
  branch: string
  regulation: string
  year: number
  semester: number
  subject_codes: string[]
}): Promise<{ success: boolean }> {
  return fetchWithAuth('/onboarding/confirm-hall-ticket', {
    method: 'POST',
    body: JSON.stringify(profile),
  })
}

// ── Beta Student Experience ───────────────────────────────────────────────

export async function getSubjectsForSemester(_semester: number, regulation: string = 'R22'): Promise<Subject[]> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('regulation', regulation)
      .order('code', { ascending: true })
    if (error) {
      throw error
    }
    const filtered = filterTo31Subjects(data || [])
    return filtered.length > 0 ? (filtered as unknown as Subject[]) : (OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[])
  } catch {
    return OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[]
  }
}

export async function generateAnalysis(
  subjectId: string,
  regulation: string,
  examCategory?: string,
): Promise<any> {
  const body: any = {
    subject_id: subjectId,
    regulation,
  }
  if (examCategory) {
    // Map frontend filter values to exact DB values (title case as stored by exam_classifier.py)
    const catMap: Record<string, string> = { mid1: 'Mid-1', mid2: 'Mid-2', semester: 'Semester' }
    body.exam_category = catMap[examCategory] || examCategory
  }
  
  const res = await fetchWithAuth('/analysis/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return (res as any).data ?? res
}

// ── Stats ────────────────────────────────────────────────────────────────

export interface PlatformStats {
  papers: number | null
  questions: number | null
  subjects: number | null
  is_live: boolean
  is_demo?: boolean
  label?: string
}

export async function getStats(timeoutMs = 5000): Promise<PlatformStats> {
  // Public endpoint — must NOT force authentication or call signOut
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const CACHE_KEY = 'paperiq_verified_stats'

  try {
    const res = await fetch(`${BASE_URL}/stats`, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API ${res.status}: ${text}`)
    }

    const json = await res.json()
    if (json && json.data) {
      const isLive = Boolean(json.data.is_live && json.success)
      const data: PlatformStats = {
        papers: typeof json.data.papers === 'number' ? json.data.papers : null,
        questions: typeof json.data.questions === 'number' ? json.data.questions : null,
        subjects: typeof json.data.subjects === 'number' ? json.data.subjects : null,
        is_live: isLive,
        is_demo: Boolean(json.data.is_demo),
        label: json.data.label ?? (isLive ? 'Live' : 'Snapshot'),
      }

      if (data.is_live && typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      }
      return data
    }

    throw new Error('Invalid stats payload received from backend')
  } catch (err) {
    clearTimeout(timeoutId)

    // Check for verified cached stats in localStorage
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          return {
            ...parsed,
            is_live: false,
            label: 'Verified Cache',
          }
        } catch {
          // Ignore parse errors on cached item
        }
      }
    }

    // Never present fabricated numbers as live data! Return truthful unavailable state.
    return {
      papers: null,
      questions: null,
      subjects: null,
      is_live: false,
      is_demo: false,
      label: 'Unavailable',
    }
  }
}

// ── Feedback ─────────────────────────────────────────────────────────────

export async function submitFeedback(feedback: {
  page: string
  rating: number
  hours_saved?: string
  trigger?: string
}): Promise<void> {
  await fetchWithAuth('/feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  })
}

// ── Profile (backend) ────────────────────────────────────────────────────

export async function updateProfile(userId: string, profile: Record<string, unknown>): Promise<void> {
  await fetchWithAuth(`/profile/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(profile),
  })
}

export async function deleteProfile(userId: string): Promise<void> {
  await fetchWithAuth(`/profile/${userId}`, {
    method: 'DELETE',
  })
}

// ── Subjects (filtered) ──────────────────────────────────────────────────

export async function getSubjectsByFilter(_semester: number, _regulation: string): Promise<Subject[]> {
  try {
    const res = await fetchWithAuth<{ data: Subject[] }>(`/subjects/filter?semester=${_semester}&regulation=${_regulation}`)
    const filtered = filterTo31Subjects(res.data ?? [])
    return filtered.length > 0 ? (filtered as unknown as Subject[]) : (OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[])
  } catch {
    return OFFICIAL_R22_3_1_SUBJECTS as unknown as Subject[]
  }
}

// ── Questions (batch) ────────────────────────────────────────────────────

export async function getQuestionsBatch(paperIds: string[]): Promise<any[]> {
  const res = await fetchWithAuth<{ data: any[] }>('/questions/batch', {
    method: 'POST',
    body: JSON.stringify({ paper_ids: paperIds }),
  })
  return res.data ?? []
}

// ── AI Companion ─────────────────────────────────────────────────────────

export interface Citation {
  source_type: string
  reference_id?: string
  title: string
  url?: string
  metadata?: Record<string, any>
}

export interface SuggestedAction {
  label: string
  action_type: 'navigate' | 'query' | 'filter'
  payload: string
}

export interface CompanionMessage {
  id: string
  conversation_id: string
  role: 'student' | 'assistant' | 'system'
  content: string
  intent?: string
  specialist?: string
  citations: Citation[]
  suggested_actions: SuggestedAction[]
  answer_format?: string
  is_verified_exam_question?: boolean
  source_reference?: string
  provider?: string
  model_used?: string
  is_fallback?: boolean
  created_at: string
}

export interface CompanionConversation {
  id: string
  user_id: string
  title: string
  subject_code?: string
  regulation: string
  answer_format?: string
  tone_preference?: string
  unit_number?: number
  created_at: string
  updated_at: string
  messages: CompanionMessage[]
}

export interface ConversationSummary {
  id: string
  title: string
  subject_code?: string
  regulation: string
  answer_format?: string
  tone_preference?: string
  unit_number?: number
  message_count: number
  last_message_preview?: string
  created_at: string
  updated_at: string
}

export interface ChatResponse {
  conversation_id: string
  message: CompanionMessage
  specialist_badge: string
  specialist_description: string
  suggested_actions: SuggestedAction[]
  provider?: string
  model_used?: string
  is_fallback?: boolean
  resolved_format?: string
  resolved_tone?: string
  is_verified_exam_question?: boolean
  matched_exam_marks?: number
  matched_exam_year?: number
  source_reference?: string
}

export interface SpecialistCapabilityInfo {
  id: string
  name: string
  description: string
  sample_queries: string[]
  badge_color: string
}

export async function sendCompanionMessage(payload: {
  message: string
  conversation_id?: string
  subject_code?: string
  regulation?: string
  answer_format?: string
  tone_preference?: string
  unit_number?: number
}): Promise<ChatResponse> {
  return fetchWithAuth<ChatResponse>('/companion/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCompanionConversations(): Promise<ConversationSummary[]> {
  return fetchWithAuth<ConversationSummary[]>('/companion/conversations')
}

export async function getCompanionConversation(conversationId: string): Promise<CompanionConversation> {
  return fetchWithAuth<CompanionConversation>(`/companion/conversations/${conversationId}`)
}

export async function deleteCompanionConversation(conversationId: string): Promise<{ success: boolean }> {
  return fetchWithAuth<{ success: boolean }>(`/companion/conversations/${conversationId}`, {
    method: 'DELETE',
  })
}

export async function getCompanionSpecialists(): Promise<SpecialistCapabilityInfo[]> {
  return fetchWithAuth<SpecialistCapabilityInfo[]>('/companion/specialists')
}
