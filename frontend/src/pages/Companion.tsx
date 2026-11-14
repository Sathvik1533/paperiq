import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
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
  specialist: string
  color: string
  prompt: string
}

// Quick starter prompts mapped across all 5 specialist capabilities
const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: 'school',
    title: 'Explain Banker’s Algorithm',
    subtitle: 'Step-by-step trace & exam answer',
    specialist: 'AI Academic Tutor',
    color: 'border-orange-500/30 text-orange-400 bg-orange-500/5',
    prompt: 'Explain Deadlock avoidance and Banker’s Algorithm with a numeric trace for university exams',
  },
  {
    icon: 'menu_book',
    title: 'Unit 3 Syllabus Deep Dive',
    subtitle: 'Curriculum & Course Outcomes',
    specialist: 'Syllabus Intelligence',
    color: 'border-purple-500/30 text-purple-400 bg-purple-500/5',
    prompt: 'What topics and Course Outcomes are covered in Operating Systems Unit 3?',
  },
  {
    icon: 'insights',
    title: 'Repeated Question Patterns',
    subtitle: 'Frequency trends & predictions',
    specialist: 'Exam Pattern Analyst',
    color: 'border-blue-500/30 text-blue-400 bg-blue-500/5',
    prompt: 'What are the most repeated questions and high-probability topics in Operating Systems?',
  },
  {
    icon: 'calendar_today',
    title: '7-Day Study Masterplan',
    subtitle: 'Daily target pacing & readiness',
    specialist: 'Study Planner Coach',
    color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5',
    prompt: 'Create a 7-day study masterplan for my upcoming Operating Systems exam',
  },
  {
    icon: 'folder_open',
    title: 'Retrieve 2024 Question Paper',
    subtitle: 'Direct authentic archive links',
    specialist: 'Document Retriever',
    color: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/5',
    prompt: 'Find the 2024 Semester question paper for Operating Systems with direct links',
  },
]

// Common R22 subjects for quick filtering
const R22_SUBJECT_OPTIONS = [
  { code: 'A6CS15', name: 'Design and Analysis of Algorithms (DAA)' },
  { code: 'A6CS09', name: 'Operating Systems (OS)' },
  { code: 'A6CS07', name: 'Database Management Systems (DBMS)' },
  { code: 'A6CS18', name: 'Computer Networks (CN)' },
  { code: 'A6IT13', name: 'Cloud and DevOps (CD)' },
  { code: 'A6CS03', name: 'Java Programming (OOPS)' },
  { code: 'A6BS04', name: 'Discrete Mathematics (DMS)' },
]

function renderInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={match.index} className="font-semibold text-white">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={match.index} className="bg-neutral-950 px-1.5 py-0.5 rounded text-[11px] text-primary-container font-mono border border-neutral-800">
          {token.slice(1, -1)}
        </code>
      )
    } else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        parts.push(
          <a key={match.index} href={linkMatch[2]} className="text-primary-container hover:underline font-medium">
            {linkMatch[1]}
          </a>
        )
      } else {
        parts.push(token)
      }
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(<em key={match.index} className="italic text-neutral-300">{token.slice(1, -1)}</em>)
    }
    lastIndex = tokenRegex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : [text]
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let tableRows: string[][] = []
  let inTable = false

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return
    const [header, , ...body] = tableRows
    elements.push(
      <div key={`table-${key}`} className="my-3 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60">
        <table className="w-full text-xs text-left border-collapse">
          {header && (
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/80">
                {header.map((col, idx) => (
                  <th key={idx} className="py-2 px-3 font-semibold text-neutral-200">
                    {renderInlineFormatting(col)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {body.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-neutral-800/50 hover:bg-neutral-800/20">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2 px-3 text-neutral-300">
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

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

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

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-neutral-200 uppercase tracking-wider mt-3 mb-1">
          {renderInlineFormatting(trimmed.slice(5))}
        </h4>
      )
    } else if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-2">
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
          <span className="text-primary-container shrink-0 mt-0.5">•</span>
          <span className="flex-1">{renderInlineFormatting(trimmed.slice(2))}</span>
        </div>
      )
    } else if (/^\d+\.\s/.test(trimmed)) {
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)$/)
      if (numMatch) {
        elements.push(
          <div key={i} className="flex items-start gap-2 text-xs text-neutral-300 my-1 ml-2">
            <span className="font-mono text-primary-container shrink-0 text-[11px]">{numMatch[1]}.</span>
            <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
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

  if (inTable) {
    flushTable(lines.length)
  }

  return <div className="space-y-0.5">{elements}</div>
}

export function Companion() {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('A6CS09')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const list = await getCompanionConversations()
      setConversations(list || [])
    } catch (err) {
      console.warn('Failed to load companion conversations:', err)
    }
  }

  // Load active conversation messages
  const selectConversation = async (convId: string) => {
    try {
      setActiveConvId(convId)
      const conv = await getCompanionConversation(convId)
      setMessages(conv.messages || [])
      if (conv.subject_code) {
        setSelectedSubject(conv.subject_code)
      }
    } catch (err) {
      console.error('Failed to load conversation:', err)
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
      console.error('Failed to delete conversation:', err)
    }
  }

  // Auto-scroll to latest message
  useEffect(() => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim()
    if (!text || loading) return

    setInputText('')
    setLoading(true)

    // Optimistically render user message
    const tempStudentMsg: CompanionMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId || 'new',
      role: 'student',
      content: text,
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
      console.error('Chat error:', err)
      const errorMsg: CompanionMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId || 'new',
        role: 'assistant',
        content: `⚠️ **Unable to complete response**: ${err.message || 'Please check your connection and try again.'}`,
        citations: [],
        suggested_actions: [],
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

  const getSpecialistBadge = (specialist?: string): { name: string; color: string; icon: IconName } => {
    switch (specialist) {
      case 'academic_tutor':
        return { name: 'AI Academic Tutor', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: 'school' }
      case 'syllabus_intelligence':
        return { name: 'Syllabus Intelligence', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: 'menu_book' }
      case 'exam_prep_analyst':
        return { name: 'Exam Pattern Analyst', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: 'insights' }
      case 'planner_coach':
        return { name: 'Study Planner Coach', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: 'calendar_today' }
      case 'document_retriever':
        return { name: 'Document Retriever', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', icon: 'folder_open' }
      default:
        return { name: 'AI Companion', color: 'bg-neutral-800 text-neutral-300 border-neutral-700', icon: 'psychology' }
    }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white flex flex-col">
      <NavBar activeTab="companion" />

      {/* Main Container */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto pt-24 pb-6 px-4 flex gap-4 overflow-hidden h-[calc(100vh-6rem)]">
        {/* Left Sidebar: Session History */}
        <aside
          className={`${
            sidebarOpen ? 'w-80' : 'w-0 -ml-4 opacity-0 pointer-events-none'
          } transition-all duration-300 flex flex-col bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 overflow-hidden shrink-0`}
        >
          {/* New Chat Button */}
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-container text-white font-medium rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 mb-4"
          >
            <Icon name="add" size={16} />
            <span>New Study Session</span>
          </button>

          {/* Subject Filter Dropdown */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block">
              Target Course (R22)
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg py-2 px-3 text-xs text-neutral-200 focus:outline-none focus:border-primary-container"
            >
              {R22_SUBJECT_OPTIONS.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase px-2 mb-1 block">
              Recent Sessions
            </span>
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">
                No past sessions yet.<br />Ask a question to start!
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs transition-all ${
                    activeConvId === conv.id
                      ? 'bg-neutral-800 border border-neutral-700 text-white'
                      : 'hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon name="chat" size={16} className="text-neutral-500 group-hover:text-primary-container shrink-0" />
                    <span className="truncate font-medium">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    title="Delete session"
                  >
                    <Icon name="delete" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Center Chat Area */}
        <main className="flex-1 flex flex-col bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden relative">
          {/* Header Bar */}
          <div className="h-14 border-b border-neutral-800/80 px-4 flex items-center justify-between shrink-0 bg-neutral-950/40">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                title="Toggle sidebar"
              >
                <Icon name="menu" size={16} />
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="font-semibold text-sm">PaperIQ AI Companion</h1>
                <span className="text-[10px] bg-neutral-800 border border-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full font-mono">
                  R22 Autonomous
                </span>
              </div>
            </div>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="hidden sm:inline">Active Subject:</span>
              <span className="font-mono text-primary-container font-medium">{selectedSubject}</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center max-w-2xl mx-auto py-6">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-container to-orange-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <Icon name="psychology" size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-bold tracking-tight mb-2">How can I assist your exam preparation?</h2>
                  <p className="text-sm text-neutral-400 max-w-md mx-auto">
                    Ask academic questions, retrieve past papers, inspect syllabus units, or generate a tailored study plan.
                  </p>
                </div>

                {/* Starter Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {STARTER_PROMPTS.map((starter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(starter.prompt)}
                      className={`text-left p-3.5 rounded-xl border ${starter.color} hover:scale-[1.01] transition-transform flex flex-col justify-between`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon name={starter.icon} size={16} />
                        <span className="font-semibold text-xs text-white">{starter.title}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-1">{starter.subtitle}</p>
                      <span className="text-[10px] font-mono opacity-60 mt-2 block">{starter.specialist}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isStudent = msg.role === 'student'
                const badge = getSpecialistBadge(msg.specialist)

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                  >
                    {/* Specialist Header Badge */}
                    {!isStudent && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${badge.color}`}>
                          <Icon name={badge.icon} size={14} />
                          <span>{badge.name}</span>
                        </div>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl text-sm leading-relaxed ${
                        isStudent
                          ? 'bg-primary-container text-white rounded-tr-sm shadow-md shadow-orange-500/10 whitespace-pre-wrap'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-tl-sm'
                      }`}
                    >
                      {isStudent ? msg.content : <MarkdownContent content={msg.content} />}

                      {/* Citations / Evidence cards */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2">
                          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                            Verified Evidence & Citations:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.map((c, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-800 px-2.5 py-1 rounded-lg text-xs text-neutral-300"
                              >
                                <Icon name="verified" size={14} className="text-emerald-400" />
                                <span>{c.title}</span>
                                {c.url && (
                                  <a href={c.url} className="text-primary-container hover:underline ml-1">
                                    View
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Action Pills */}
                      {msg.suggested_actions && msg.suggested_actions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap gap-2">
                          {msg.suggested_actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={() => handleActionClick(action)}
                              className="text-xs bg-neutral-800/80 hover:bg-neutral-700/80 border border-neutral-700 text-neutral-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
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

            {/* Loading indicator */}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-neutral-400 text-xs py-2">
                <div className="w-6 h-6 rounded-full bg-primary-container/20 border border-primary-container/40 flex items-center justify-center animate-spin">
                  <Icon name="refresh" size={14} className="text-primary-container" />
                </div>
                <span>Specialist is synthesizing grounded exam response...</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-950/60">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 focus-within:border-primary-container rounded-xl p-2 transition-colors"
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
                placeholder={`Ask academic questions, past paper requests, or study plans for ${selectedSubject}...`}
                rows={1}
                className="flex-1 bg-transparent border-0 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none px-2 py-1 max-h-32"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 bg-primary-container disabled:opacity-40 disabled:hover:bg-primary-container text-white rounded-lg hover:bg-orange-600 transition-colors shrink-0"
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
