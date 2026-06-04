import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { useAnalysisStore } from '../store/analysisStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

interface ProviderStatus {
  name: string
  status: string
  models?: Record<string, string>
}

export function Settings() {
  const { user, signOut } = useAuthStore()
  const { regulation, setRegulation } = useAnalysisStore()

  const [llmStatus, setLlmStatus] = useState<{ providers: ProviderStatus[]; active: string } | null>(null)
  const [health, setHealth] = useState<{ status: string; db: string; version: string } | null>(null)
  const [loadingLlm, setLoadingLlm] = useState(false)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [extractStatus, setExtractStatus] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    // Load health and extract status in parallel on mount
    setLoadingHealth(true)
    setLoadingLlm(true)

    Promise.all([
      fetch(`${BASE_URL}/health`).then(r => r.json()).catch(() => null),
      fetch(`${BASE_URL}/llm/health`).then(r => r.json()).catch(() => null),
      fetch(`${BASE_URL}/extract/status`).then(r => r.json()).catch(() => null),
    ]).then(([h, l, e]) => {
      if (h) setHealth(h.data ?? h)
      if (l) setLlmStatus(l.data ?? l)
      if (e) setExtractStatus(e.data ?? e)
    }).finally(() => {
      setLoadingHealth(false)
      setLoadingLlm(false)
    })
  }, [])

  async function handleRefreshExtraction() {
    try {
      await fetch(`${BASE_URL}/extract/run`, { method: 'POST' })
      const r = await fetch(`${BASE_URL}/extract/status`)
      const j = await r.json()
      setExtractStatus(j.data ?? j)
    } catch {}
  }

  async function handleRefreshParsing() {
    try {
      await fetch(`${BASE_URL}/parse/run`, { method: 'POST' })
    } catch {}
  }

  const statusDot = (ok: boolean) => (
    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
  )

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">

        <h1 className="text-2xl font-bold text-white">Settings</h1>

        {/* System Health */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-white font-semibold">System Status</h2>
          {loadingHealth ? (
            <p className="text-gray-400 text-sm">Checking...</p>
          ) : health ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-gray-300">
                {statusDot(health.status === 'ok')}
                API — <span className="text-white ml-1">{health.status}</span>
                <span className="text-gray-500 ml-3">v{health.version}</span>
              </div>
              <div className="flex items-center text-gray-300">
                {statusDot(health.db === 'ok')}
                Database — <span className="text-white ml-1">{health.db}</span>
              </div>
            </div>
          ) : (
            <p className="text-red-400 text-sm">Backend unreachable — is it running?</p>
          )}
        </div>

        {/* LLM Providers */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-white font-semibold">LLM Providers</h2>
          {loadingLlm ? (
            <p className="text-gray-400 text-sm">Checking providers...</p>
          ) : llmStatus ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-400">
                Active: <span className="text-white font-medium">{llmStatus.active ?? 'none'}</span>
              </div>
              {(llmStatus.providers ?? []).map((p) => (
                <div key={p.name} className="flex items-center justify-between border border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    {statusDot(p.status === 'available')}
                    <span className="text-white text-sm font-medium capitalize">{p.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.status === 'available' ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
              <p className="text-gray-500 text-xs">
                Failover order: Groq → OpenRouter → Ollama. Automatic, no manual switching required.
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">LLM status unavailable.</p>
          )}
        </div>

        {/* Extraction Status */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Pipeline Status</h2>
          {extractStatus && (
            <div className="grid grid-cols-3 gap-3 text-center">
              {Object.entries(extractStatus).map(([status, count]) => (
                <div key={status} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-xl font-bold text-white">{count}</div>
                  <div className="text-gray-400 text-xs mt-1 capitalize">{status}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleRefreshExtraction}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Run Extraction
            </button>
            <button
              onClick={handleRefreshParsing}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Run Parsing
            </button>
          </div>
          <p className="text-gray-500 text-xs">
            These run automatically after scraping. Use manually if papers are stuck in "pending".
          </p>
        </div>

        {/* Regulation preference */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-white font-semibold">Default Regulation</h2>
          <div className="flex gap-2">
            {['R18', 'R22', 'R24'].map(r => (
              <button
                key={r}
                onClick={() => setRegulation(r)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  regulation === r ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-xs">This sets the default regulation across all screens.</p>
        </div>

        {/* Account */}
        <div className="bg-gray-800 rounded-xl p-6 space-y-3">
          <h2 className="text-white font-semibold">Account</h2>
          {user && (
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full" alt="avatar" />
              )}
              <div>
                <p className="text-white text-sm font-medium">{user.user_metadata?.full_name ?? 'User'}</p>
                <p className="text-gray-400 text-xs">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Backend URL */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-2">API Endpoint</h2>
          <code className="text-gray-400 text-xs bg-gray-700 px-3 py-2 rounded block break-all">{BASE_URL}</code>
        </div>

      </div>
    </div>
  )
}
