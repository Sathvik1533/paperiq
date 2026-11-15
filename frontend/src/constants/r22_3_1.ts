/**
 * MLRIT Autonomous R22 — 3-1 (Third Year, First Semester) Strict Canonical Allowlist
 * Single source of truth for all frontend components, dropdowns, cards, filters, and searches.
 *
 * Supported 3-1 Subjects:
 * - A6CS15: Design and Analysis of Algorithms (DAA)
 * - A6IT13: Cloud and DevOps (CD)
 * - A6CS18: Computer Networks (CN)
 * - A6IT26: Information Retrieval Systems (IRS)
 * - A6AI14: Natural Language Processing (NLP)
 *
 * Prohibited: 2-1, 2-2, 3-2, Operating Systems (A6CS11), DBMS (A6CS09).
 */

export interface Subject31 {
  id: string
  code: string
  name: string
  short: string
  semester: number
  year: number
  regulation: string
  branch: string
  category: string
}

export const OFFICIAL_R22_3_1_SUBJECTS: Subject31[] = [
  {
    id: 'A6CS15',
    code: 'A6CS15',
    name: 'Design and Analysis of Algorithms',
    short: 'DAA',
    semester: 1,
    year: 3,
    regulation: 'R22',
    branch: 'CSE',
    category: 'PCC',
  },
  {
    id: 'A6IT13',
    code: 'A6IT13',
    name: 'Cloud and DevOps',
    short: 'CD',
    semester: 1,
    year: 3,
    regulation: 'R22',
    branch: 'CSE',
    category: 'PCC',
  },
  {
    id: 'A6CS18',
    code: 'A6CS18',
    name: 'Computer Networks',
    short: 'CN',
    semester: 1,
    year: 3,
    regulation: 'R22',
    branch: 'CSE',
    category: 'PCC',
  },
  {
    id: 'A6IT26',
    code: 'A6IT26',
    name: 'Information Retrieval Systems',
    short: 'IRS',
    semester: 1,
    year: 3,
    regulation: 'R22',
    branch: 'CSE',
    category: 'PEC',
  },
  {
    id: 'A6AI14',
    code: 'A6AI14',
    name: 'Natural Language Processing',
    short: 'NLP',
    semester: 1,
    year: 3,
    regulation: 'R22',
    branch: 'CSE',
    category: 'PEC',
  },
]

export const OFFICIAL_R22_3_1_CODES = new Set([
  'A6CS15',
  'A6IT13',
  'A6CS18',
  'A6IT26',
  'A6AI14',
  'A6CS14', // Alias for DAA
])

export const PROHIBITED_SUBJECT_CODES = new Set([
  'A6CS11', // OS
  'A6CS09', // DBMS
  'A6CS05', // DS
  'A6IT02', // Java
  'A6CS02', 'A6CS28', 'A6CS01', // DECO
  'A6CS07', 'A6CS10', // SE
  'A6BS03', 'A6BS04', // COSM
  'A6CS08', // DM
  'A6CS13', // STF
  'A6HS08', 'A6BS05', // BEFA
  'A6IT39', 'A6IT11', 'A6CS16', // 3-2 subjects
])

export function isSupported31Subject(codeOrId?: string | null): boolean {
  if (!codeOrId) return false
  const clean = codeOrId.trim().toUpperCase()
  if (PROHIBITED_SUBJECT_CODES.has(clean)) return false
  return OFFICIAL_R22_3_1_CODES.has(clean) || OFFICIAL_R22_3_1_SUBJECTS.some(s => s.id === codeOrId || s.code === clean)
}

export function filterTo31Subjects<T extends { code?: string; id?: string }>(subjects: T[]): T[] {
  if (!Array.isArray(subjects)) return []
  return subjects.filter(s => isSupported31Subject(s.code || s.id))
}
