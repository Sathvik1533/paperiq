import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { NavBar } from '../components/NavBar'
import { Icon, IconName } from '../components/Icon'
import {
  sendCompanionMessage,
  getCompanionConversations,
  getCompanionConversation,
  deleteCompanionConversation,
  CompanionMessage,
  ConversationSummary,
  SuggestedAction,
} from '../lib/api'

interface StarterPrompt {
  icon: IconName
  title: string
  subtitle: string
  subjectCode: string
  prompt: string
}

import { OFFICIAL_R22_3_1_SUBJECTS } from '../constants/r22_3_1'

// 5 Meaningful Academic Actions — Strict MLRIT R22 3-1 subjects only
const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: 'school',
    title: '0/1 Knapsack Problem (DAA)',
    subtitle: 'Step-by-step Branch and Bound solution for 10 Marks',
    subjectCode: 'A6CS15',
    prompt: 'Explain 0/1 Knapsack using LC Branch and Bound with state-space tree for university exams',
  },
  {
    icon: 'router',
    title: 'Distance Vector vs Link State (CN)',
    subtitle: 'Routing algorithms comparison with diagrams & 10M format',
    subjectCode: 'A6CS18',
    prompt: 'Compare Distance Vector Routing and Link State Routing algorithms with step-by-step routing table updates',
  },
  {
    icon: 'cloud',
    title: 'CI/CD Pipeline Architecture (CD)',
    subtitle: 'Cloud & DevOps Jenkins/GitHub Actions pipeline stages',
    subjectCode: 'A6IT13',
    prompt: 'Explain the architecture and stages of a modern CI/CD pipeline in Cloud & DevOps for 10 marks',
  },
  {
    icon: 'search',
    title: 'Vector Space Model & TF-IDF (IRS)',
    subtitle: 'Document indexing and cosine similarity calculation',
    subjectCode: 'A6IT26',
    prompt: 'Explain the Vector Space Model and TF-IDF calculation with a numerical term-document matrix example for IRS',
  },
  {
    icon: 'psychology',
    title: 'Byte Pair Encoding (NLP)',
    subtitle: 'Subword tokenization algorithm and frequency updates',
    subjectCode: 'A6AI14',
    prompt: 'Explain the Byte Pair Encoding (BPE) subword tokenization algorithm with a step-by-step trace for NLP',
  },
]

// Student-facing Quick Presets (Accessible anytime)
const PRESET_SHORTCUTS = [
  { icon: 'chat' as IconName, label: 'Ask a question', promptPrefix: 'Explain ' },
  { icon: 'calendar_today' as IconName, label: 'Create a study plan', promptPrefix: 'Create a 7-day study plan for ' },
  { icon: 'insights' as IconName, label: 'Find important questions', promptPrefix: 'What are the most repeated questions in ' },
  { icon: 'menu_book' as IconName, label: 'Explore my syllabus', promptPrefix: 'Show the syllabus units and Course Outcomes for ' },
  { icon: 'search' as IconName, label: 'Find previous papers', promptPrefix: 'Find previous examination papers for ' },
]

// Strict MLRIT R22 3-1 subjects
const R22_SUBJECT_OPTIONS = OFFICIAL_R22_3_1_SUBJECTS.map((s) => ({
  code: s.code,
  name: `${s.name} (${s.short})`,
}))

// Format options with Simple English descriptions
const FORMAT_OPTIONS = [
  { id: 'auto', label: 'Auto (Exam-Aware)', hint: 'Automatically matches exam marks' },
  { id: '1_mark', label: '1 Mark', hint: 'Short definition (Part A)' },
  { id: '5_marks', label: '5 Marks', hint: 'Structured concepts (Part B)' },
  { id: '10_marks', label: '10 Marks', hint: 'Complete answer with proof/trace' },
  { id: 'detailed', label: 'Step-by-Step', hint: 'In-depth learning' },
]

// Tone options with Simple English descriptions
const TONE_OPTIONS = [
  { id: 'exam_ready', label: 'Exam Scoring Key' },
  { id: 'simple', label: 'Simple English' },
  { id: 'conceptual', label: 'Deep Dive' },
]

/**
 * Safely renders LaTeX math using KaTeX.
 * Never exposes raw LaTeX backslashes or source in normal text.
 */
function renderMath(mathStr: string, isBlock: boolean): React.ReactNode {
  try {
    const cleanMath = mathStr.trim()
    const html = katex.renderToString(cleanMath, {
      displayMode: isBlock,
      throwOnError: false,
    })
    return (
      <span
        key={`math-${Math.random()}`}
        className={isBlock ? 'block my-3 overflow-x-auto py-2 text-center text-neutral-100 font-serif' : 'inline-math px-0.5 text-neutral-100'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  } catch {
    return <code className="text-orange-400 font-mono text-xs">{mathStr}</code>
  }
}

/**
 * Inline text parser: handles inline math ($...$), bold (**...**), code (`...`), and links.
 */
function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Matches inline math $...$, bold **...**, inline code `...`, links [...](...), italics *...*
  const tokenRegex = /(\$[^$\n]+\$|\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]

    if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
      parts.push(renderMath(token.slice(1, -1), false))
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {renderInlineFormatting(token.slice(2, -2))}
        </strong>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="bg-neutral-950 px-1.5 py-0.5 rounded text-[11px] text-orange-400 font-mono border border-neutral-800"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 underline underline-offset-2 font-medium"
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        parts.push(token)
      }
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-neutral-300">
          {token.slice(1, -1)}
        </em>
      )
    }
    lastIndex = tokenRegex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : [text]
}

/**
 * Rich Markdown and Math Renderer with KaTeX support, table formatting, and verified badges.
 */
function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let inTable = false
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let inBlockMath = false
  let blockMathLines: string[] = []

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return
    const [header, , ...body] = tableRows
    elements.push(
      <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/70">
        <table className="w-full text-xs text-left border-collapse">
          {header && (
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/90">
                {header.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3.5 font-semibold text-neutral-200">
                    {renderInlineFormatting(col)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-neutral-800/40 hover:bg-neutral-800/20 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2 px-3.5 text-neutral-300">
                    {renderInlineFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
    inTable = false
  }

  const flushCodeBlock = (key: number) => {
    if (codeBlockLines.length === 0) return
    const codeContent = codeBlockLines.join('\n')
    elements.push(
      <div key={`code-${key}`} className="my-3 rounded-xl border border-neutral-800 bg-neutral-950/90 overflow-hidden">
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-neutral-900/80 border-b border-neutral-800 text-[11px] text-neutral-400">
          <span>Code Solution</span>
          <button
            onClick={() => navigator.clipboard.writeText(codeContent)}
            className="hover:text-orange-400 flex items-center gap-1 text-[11px] transition-colors"
          >
            <Icon name="content_copy" size={12} />
            <span>Copy</span>
          </button>
        </div>
        <pre className="p-3.5 text-xs text-neutral-200 font-mono overflow-x-auto leading-relaxed">
          <code>{codeContent}</code>
        </pre>
      </div>
    )
    codeBlockLines = []
    inCodeBlock = false
  }

  const flushBlockMath = (key: number) => {
    if (blockMathLines.length === 0) return
    const mathContent = blockMathLines.join('\n')
    elements.push(
      <div key={`math-block-${key}`} className="my-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800/80 overflow-x-auto">
        {renderMath(mathContent, true)}
      </div>
    )
    blockMathLines = []
    inBlockMath = false
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    // 1. Multi-line Code blocks ```
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i)
      } else {
        if (inTable) flushTable(i)
        inCodeBlock = true
      }
      continue
    }
    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      continue
    }

    // 2. Multi-line Display Math $$
    if (trimmed === '$$') {
      if (inBlockMath) {
        flushBlockMath(i)
      } else {
        if (inTable) flushTable(i)
        inBlockMath = true
      }
      continue
    }
    if (inBlockMath) {
      blockMathLines.push(rawLine)
      continue
    }

    // 3. Single-line Display Math $$...$$
    if (trimmed.startsWith('$$') && trimmed.endsWith('$$') && trimmed.length > 4) {
      if (inTable) flushTable(i)
      elements.push(
        <div key={`math-single-${i}`} className="my-2 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 overflow-x-auto">
          {renderMath(trimmed.slice(2, -2), true)}
        </div>
      )
      continue
    }

    // 4. Markdown Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim())
      const isSeparator = cells.every((c) => /^:?-+:?$/.test(c))
      if (!isSeparator) {
        tableRows.push(cells)
      }
      inTable = true
      continue
    } else if (inTable) {
      flushTable(i)
    }

    if (!trimmed) {
      continue
    }

    // 5. Verified Exam Question Highlight Block (e.g. `> **[VERIFIED...`)
    if (trimmed.startsWith('> ') && (trimmed.includes('VERIFIED') || trimmed.includes('Exam Question'))) {
      const textInside = trimmed.replace(/^>\s*/, '').replace(/\*\*/g, '')
      elements.push(
        <div
          key={`verified-${i}`}
          className="my-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center gap-2.5 shadow-sm"
        >
          <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <Icon name="verified" size={14} className="text-orange-400" />
          </div>
          <span className="text-xs font-semibold text-orange-300">
            {textInside}
          </span>
        </div>
      )
      continue
    }

    // 6. Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <blockquote
          key={i}
          className="my-2.5 pl-3 border-l-2 border-orange-500/50 text-neutral-300 text-xs italic bg-neutral-950/40 py-1 rounded-r"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      )
      continue
    }

    // 7. Headings
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-neutral-200 uppercase tracking-wider mt-3 mb-1">
          {renderInlineFormatting(trimmed.slice(5))}
        </h4>
      )
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-white mt-3.5 mb-1.5 flex items-center gap-2">
          {renderInlineFormatting(trimmed.slice(4))}
        </h3>
      )
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-white mt-4 mb-2">
          {renderInlineFormatting(trimmed.slice(3))}
        </h2>
      )
    } else if (trimmed === '---') {
      elements.push(<hr key={i} className="border-neutral-800/80 my-3" />)
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={i} className="flex items-start gap-2 text-xs text-neutral-300 my-1 ml-2">
          <span className="text-orange-400 shrink-0 mt-0.5">•</span>
          <span className="flex-1 leading-relaxed">{renderInlineFormatting(trimmed.slice(2))}</span>
        </div>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/)
      if (numMatch) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-xs text-neutral-300 my-1 ml-2">
            <span className="font-mono text-orange-400 shrink-0 text-[11px] font-semibold">{numMatch[1]}.</span>
            <span className="flex-1 leading-relaxed">{renderInlineFormatting(numMatch[2])}</span>
          </div>
        )
      }
    } else {
      elements.push(
        <p key={i} className="text-xs text-neutral-300 leading-relaxed my-1.5">
          {renderInlineFormatting(trimmed)}
        </p>
      )
    }
  }

  if (inTable) flushTable(lines.length)
  if (inCodeBlock) flushCodeBlock(lines.length)
  if (inBlockMath) flushBlockMath(lines.length)

  return <div className="space-y-0.5">{elements}</div>
}

export function Companion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('A6CS15')
  const [selectedFormat, setSelectedFormat] = useState('auto')
  const [selectedTone, setSelectedTone] = useState('exam_ready')
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : false))
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle incoming query, subject, and marks parameters from Question Intelligence / Exam Prep
  useEffect(() => {
    const qParam = searchParams.get('query')
    const sParam = searchParams.get('subject')
    const mParam = searchParams.get('marks')
    if (qParam) {
      setInputText(qParam)
      if (mParam === '1') setSelectedFormat('1_mark')
      else if (mParam === '5') setSelectedFormat('5_marks')
      else if (mParam === '10') setSelectedFormat('10_marks')
    }
    if (sParam) {
      // Find matching subject code or default
      const match = R22_SUBJECT_OPTIONS.find(
        (o) => o.code === sParam || o.name.toLowerCase().includes(sParam.toLowerCase())
      )
      if (match) setSelectedSubject(match.code)
    }
  }, [searchParams])

  // Load user's previous study sessions on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const list = await getCompanionConversations()
      setConversations(list || [])
    } catch (err) {
      console.warn('Could not load study sessions:', err)
    }
  }

  // Select an existing study chat
  const selectConversation = async (convId: string) => {
    try {
      setActiveConvId(convId)
      const conv = await getCompanionConversation(convId)
      setMessages(conv.messages || [])
      if (conv.subject_code) {
        setSelectedSubject(conv.subject_code)
      }
      if (conv.answer_format) {
        setSelectedFormat(conv.answer_format)
      }
      if (conv.tone_preference) {
        setSelectedTone(conv.tone_preference)
      }
    } catch (err) {
      console.error('Could not load chat:', err)
    }
  }

  const startNewSession = () => {
    setActiveConvId(null)
    setMessages([])
    setInputText('')
  }

  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    try {
      await deleteCompanionConversation(convId)
      if (activeConvId === convId) {
        startNewSession()
      }
      loadConversations()
    } catch (err) {
      console.error('Could not delete chat:', err)
    }
  }

  // Auto-scroll to latest message
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  // Send message with student preferences
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text || loading) return

    setInputText('')
    setLoading(true)

    // Optimistically render student's message
    const tempStudentMsg: CompanionMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || 'new',
      role: 'student',
      content: text,
      answer_format: selectedFormat,
      citations: [],
      suggested_actions: [],
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempStudentMsg])

    try {
      const response = await sendCompanionMessage({
        message: text,
        conversation_id: activeConvId || undefined,
        subject_code: selectedSubject,
        regulation: 'R22',
        answer_format: selectedFormat,
        tone_preference: selectedTone,
      })

      if (!activeConvId) {
        setActiveConvId(response.conversation_id)
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempStudentMsg.id),
        tempStudentMsg,
        response.message,
      ])

      loadConversations()
    } catch (err: any) {
      console.error('Study assistant error:', err)
      const errorMsg: CompanionMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || 'new',
        role: 'assistant',
        content: 'Something went wrong while preparing your answer. Please check your connection and tap Retry below.',
        citations: [],
        suggested_actions: [
          {
            label: 'Retry Question',
            action_type: 'query',
            payload: text,
          },
        ],
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: SuggestedAction) => {
    if (action.action_type === 'navigate') {
      navigate(action.payload)
    } else {
      handleSendMessage(action.payload)
    }
  }

  const activeSubjectInfo = R22_SUBJECT_OPTIONS.find((s) => s.code === selectedSubject)

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <NavBar activeTab="companion" />

      {/* Main Container */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto pt-20 md:pt-24 pb-4 md:pb-6 px-3 md:px-4 flex gap-4 overflow-hidden h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar: Study Sessions */}
        <aside
          className={`fixed md:relative top-20 md:top-0 bottom-4 left-3 md:left-0 z-50 md:z-0 ${
            sidebarOpen ? 'w-72 md:w-80 translate-x-0' : '-translate-x-[120%] md:translate-x-0 md:w-0 md:-ml-4 md:opacity-0 md:pointer-events-none'
          } transition-all duration-300 flex flex-col bg-neutral-900/95 md:bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 overflow-hidden shrink-0 shadow-2xl md:shadow-none`}
        >
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between mb-3 md:hidden">
            <span className="text-xs font-semibold text-neutral-300">Study Sessions</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
              title="Close drawer"
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              startNewSession()
              if (window.innerWidth < 768) setSidebarOpen(false)
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 mb-4"
          >
            <Icon name="add" size={16} />
            <span>Start New Chat</span>
          </button>

          {/* Subject Filter Dropdown */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5 block">
              Active Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-neutral-200 focus:outline-none focus:border-orange-500"
            >
              {R22_SUBJECT_OPTIONS.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Previous Chats List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase px-2 mb-1 block">
              Your Study Chats
            </span>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs leading-relaxed">
                No previous chats yet.<br />Ask a question to begin!
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => {
                    selectConversation(conv.id)
                    if (window.innerWidth < 768) setSidebarOpen(false)
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-all ${
                    activeConvId === conv.id
                      ? 'bg-neutral-800 border border-neutral-700 text-white'
                      : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon name="chat" size={16} className="text-orange-400 shrink-0" />
                    <span className="truncate font-medium">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title="Delete chat"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Chat Area */}
        <main className="flex-1 w-full min-w-0 flex flex-col bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden relative">
          {/* Top Header Bar */}
          <div className="h-14 border-b border-neutral-800/80 px-4 flex items-center justify-between shrink-0 bg-neutral-950/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Toggle chats list"
              >
                <Icon name="menu" size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                <h1 className="font-semibold text-sm">PaperIQ Study Assistant</h1>
                <span className="text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  MLRIT R22
                </span>
              </div>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="hidden sm:inline">Current Subject:</span>
              <span className="font-mono text-orange-400 font-medium">
                {activeSubjectInfo ? activeSubjectInfo.name.split('(')[1]?.replace(')', '') || activeSubjectInfo.code : selectedSubject}
              </span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-6">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Icon name="school" size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight mb-2">What would you like help with today?</h2>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
                    Ask any question, review real exam questions, check your syllabus units, or get a day-by-day study plan.
                  </p>
                </div>

                {/* 5 Academic Action Cards — Styled strictly in dark charcoal + orange accent */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STARTER_PROMPTS.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedSubject(starter.subjectCode)
                        handleSendMessage(starter.prompt)
                      }}
                      className="text-left p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-orange-500/50 hover:bg-neutral-900 transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon name={starter.icon} size={16} className="text-orange-400 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-xs text-white">{starter.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1 leading-relaxed">{starter.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isStudent = msg.role === 'student'

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                  >
                    {/* Assistant Header Badge */}
                    {!isStudent && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border border-orange-500/30 bg-orange-500/10 text-orange-400">
                          <Icon name="school" size={14} />
                          <span>PaperIQ Study Guide</span>
                        </div>
                        {msg.is_verified_exam_question && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-orange-500/40 bg-orange-500/10 text-orange-300">
                            <Icon name="verified" size={12} className="text-orange-400" />
                            <span>Real Exam Question</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[92%] sm:max-w-[85%] md:max-w-[78%] p-3.5 md:p-4 rounded-2xl text-sm leading-relaxed break-words overflow-hidden ${
                        isStudent
                          ? 'bg-orange-500 text-white rounded-tr-sm shadow-md shadow-orange-500/10 whitespace-pre-wrap font-medium'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm'
                      }`}
                    >
                      {isStudent ? msg.content : <MarkdownContent content={msg.content} />}

                      {/* Evidence / Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                            Where this answer comes from:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs text-neutral-300"
                              >
                                <Icon name="verified" size={14} className="text-orange-400" />
                                <span>{c.title}</span>
                                {c.url && (
                                  <a
                                    href={c.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-orange-400 hover:underline ml-1 font-medium"
                                  >
                                    View
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Next Steps */}
                      {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap gap-2">
                          {msg.suggested_actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={() => handleActionClick(action)}
                              className="text-xs bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 hover:border-orange-500/40 text-neutral-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                            >
                              <span>{action.label}</span>
                              <Icon name="arrow_right" size={14} className="text-neutral-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })
            )}

            {/* Loading Indicator — Simple English */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-neutral-400 text-xs py-2">
                <div className="w-5 h-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
                <span>Preparing your answer...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Format and Tone Preferences Bar */}
          <div className="px-3 md:px-4 py-2 border-t border-neutral-800/60 bg-neutral-950/80 flex items-center justify-between gap-3 text-xs overflow-x-auto no-scrollbar">
            {/* Answer Format */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-neutral-400 font-medium">Answer Style:</span>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors whitespace-nowrap ${
                      selectedFormat === fmt.id
                        ? 'bg-orange-500 text-white font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                    title={fmt.hint}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-neutral-400 font-medium">Explanation:</span>
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5">
                {TONE_OPTIONS.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors whitespace-nowrap ${
                      selectedTone === tone.id
                        ? 'bg-orange-500 text-white font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Student-Facing Presets ("What would you like to do?") */}
          <div className="px-3 md:px-4 pt-2 pb-1 border-t border-neutral-800/40 bg-neutral-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold whitespace-nowrap shrink-0 mr-1">
              Shortcuts:
            </span>
            {PRESET_SHORTCUTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const subCode = selectedSubject
                  const subName = activeSubjectInfo ? activeSubjectInfo.name.split('(')[1]?.replace(')', '') || activeSubjectInfo.code : subCode
                  setInputText(`${preset.promptPrefix}${subName}`)
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-orange-500/40 text-neutral-300 hover:text-white transition-colors whitespace-nowrap text-[11px] shrink-0"
              >
                <Icon name={preset.icon} size={12} className="text-orange-400" />
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 md:p-4 border-t border-neutral-800 bg-neutral-950/90">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 focus-within:border-orange-500 rounded-xl p-2 transition-colors"
            >
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder={`Ask any question about ${activeSubjectInfo?.name || selectedSubject}... (Shift+Enter for new line)`}
                rows={Math.min(4, Math.max(1, inputText.split('\n').length))}
                className="flex-1 bg-transparent border-0 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none px-2 py-1 max-h-32"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 bg-orange-500 disabled:opacity-40 disabled:hover:bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shrink-0 shadow-sm shadow-orange-500/20"
                title="Send question"
              >
                <Icon name="rocket" size={16} />
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
