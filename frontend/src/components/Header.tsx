import { useState, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'

type LlmProvider = 'openai' | 'anthropic' | 'google' | 'openrouter'

const LLM_PROVIDERS: { id: LlmProvider; label: string; icon: string; placeholder: string; url: string }[] = [
  {
    id: 'openai',
    label: 'OpenAI GPT-4o',
    icon: '🟢',
    placeholder: 'sk-...',
    url: 'https://api.openai.com/v1/models',
  },
  {
    id: 'anthropic',
    label: 'Claude 3.5 Sonnet',
    icon: '🟠',
    placeholder: 'sk-ant-...',
    url: 'https://api.anthropic.com/v1/models',
  },
  {
    id: 'google',
    label: 'Gemini Pro',
    icon: '🔵',
    placeholder: 'AIza...',
    url: 'https://generativelanguage.googleapis.com/v1/models',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    icon: '🟣',
    placeholder: 'sk-or-...',
    url: 'https://openrouter.ai/api/v1/models',
  },
]

interface LlmState {
  apiKey: string
  status: 'idle' | 'testing' | 'connected' | 'error'
  errorMsg: string
}

async function testConnection(provider: LlmProvider, apiKey: string): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey || apiKey.length < 8) return { ok: false, error: 'API key too short' }

  const providerDef = LLM_PROVIDERS.find((p) => p.id === provider)
  if (!providerDef) return { ok: false, error: 'Unknown provider' }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (provider === 'openai' || provider === 'openrouter') {
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey
      headers['anthropic-version'] = '2023-06-01'
    } else if (provider === 'google') {
      // Google uses query param for key
      const url = `${providerDef.url}?key=${apiKey}`
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(5000) })
      return { ok: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` }
    }

    const res = await fetch(providerDef.url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) return { ok: true }
    const data = await res.json().catch(() => ({}))
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` }
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'TimeoutError') return { ok: false, error: 'Connection timed out' }
    return { ok: false, error: 'Network error' }
  }
}

export type HeaderTab = 'single' | 'compare' | 'analyze' | 'workflows'

interface HeaderProps {
  activeTab: HeaderTab
  onTabChange: (tab: HeaderTab) => void
  onInputOpen: () => void
}

export default function Header({ activeTab, onTabChange, onInputOpen }: HeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showApiPanel, setShowApiPanel] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<LlmProvider>('google')
  const [llmStates, setLlmStates] = useState<Record<LlmProvider, LlmState>>({
    openai: { apiKey: '', status: 'idle', errorMsg: '' },
    anthropic: { apiKey: '', status: 'idle', errorMsg: '' },
    google: { apiKey: import.meta.env.VITE_GEMINI_API_KEY || '', status: import.meta.env.VITE_GEMINI_API_KEY ? 'connected' : 'idle', errorMsg: '' },
    openrouter: { apiKey: '', status: 'idle', errorMsg: '' },
  })
  const [showKey, setShowKey] = useState(false)

  const setLlmConfig = usePlayback((s) => s.setLlmConfig)
  const current = llmStates[selectedProvider]
  const activeProvider = LLM_PROVIDERS.find((p) => p.id === selectedProvider)!

  // Auto-load saved keys from localStorage or env on mount
  useEffect(() => {
    try {
      const savedKeysStr = localStorage.getItem('audigene_llm_keys')
      const envGeminiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
      const updated = { ...llmStates }

      if (envGeminiKey) {
        updated.google = { apiKey: envGeminiKey, status: 'connected', errorMsg: '' }
      }

      if (savedKeysStr) {
        const parsed = JSON.parse(savedKeysStr) as Record<string, string>
        for (const [prov, key] of Object.entries(parsed)) {
          if (key && updated[prov as LlmProvider]) {
            updated[prov as LlmProvider] = { apiKey: key, status: 'connected', errorMsg: '' }
          }
        }
      }

      setLlmStates(updated)
      if (updated.google.status === 'connected') {
        setSelectedProvider('google')
      } else if (updated.anthropic.status === 'connected') {
        setSelectedProvider('anthropic')
      }
    } catch {}
  }, [])

  const connectedProviders = Object.entries(llmStates).filter(([, v]) => v.status === 'connected')
  const anyConnected = connectedProviders.length > 0

  useEffect(() => {
    setLlmConfig(selectedProvider, current.apiKey, current.status === 'connected')
  }, [selectedProvider, current.apiKey, current.status, setLlmConfig])

  const updateState = (updates: Partial<LlmState>) => {
    setLlmStates((prev) => ({
      ...prev,
      [selectedProvider]: { ...prev[selectedProvider], ...updates },
    }))
  }

  const handleTestConnection = async () => {
    updateState({ status: 'testing', errorMsg: '' })
    const result = await testConnection(selectedProvider, current.apiKey)
    if (result.ok) {
      updateState({ status: 'connected' })
      try {
        const saved = JSON.parse(localStorage.getItem('audigene_llm_keys') || '{}')
        saved[selectedProvider] = current.apiKey
        localStorage.setItem('audigene_llm_keys', JSON.stringify(saved))
      } catch {}
    } else {
      updateState({ status: 'error', errorMsg: result.error || 'Unknown error' })
    }
  }

  if (isCollapsed) {
    return (
      <header className="ag-header ag-header-collapsed">
        <div className="ag-brand">
          <div className="ag-title" style={{ fontSize: '1.1rem' }}>Audi<span>Gene</span></div>
        </div>
        <button className="ag-header-toggle-btn" onClick={() => setIsCollapsed(false)}>
          ▼ EXPAND
        </button>
      </header>
    )
  }

  return (
    <header className="ag-header" style={{ position: 'relative' }}>
      {/* Brand */}
      <div className="ag-brand">
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
          <path d="M4 16C6 8 10 4 16 4C22 4 26 8 28 16C26 24 22 28 16 28C10 28 6 24 4 16Z"
            stroke="url(#lg1)" strokeWidth="2.5" />
          <path d="M8 16C10 12 13 10 16 10C19 10 22 12 24 16C22 20 19 22 16 22C13 22 10 20 8 16Z"
            stroke="url(#lg2)" strokeWidth="2" />
          <circle cx="16" cy="16" r="3" fill="#d946ef" />
          <defs>
            <linearGradient id="lg1" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563eb" />
              <stop offset="0.5" stopColor="#9333ea" />
              <stop offset="1" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="lg2" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0284c7" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
        <div className="ag-brand-text">
          <div className="ag-title">AudiGene</div>
          <div className="ag-tagline">SEE. HEAR. UNDERSTAND DNA.</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="ag-nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* 1. INPUT SEQUENCES Button First */}
        <button
          onClick={onInputOpen}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'linear-gradient(135deg, #2563eb, #0284c7)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '6px 14px', fontSize: '0.72rem', fontWeight: 800,
            cursor: 'pointer', letterSpacing: '0.04em',
            boxShadow: '0 3px 10px rgba(37,99,235,0.35)',
            transition: 'all 0.15s ease',
            marginRight: 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          🧬 INPUT SEQUENCES
        </button>

        {/* 2. SINGLE Tab */}
        <button
          className={`ag-tab-btn ${activeTab === 'single' ? 'active' : ''}`}
          onClick={() => onTabChange('single')}
        >
          SINGLE
        </button>

        {/* 3. COMPARE, ANALYZE, WORKFLOWS Tabs */}
        {(['compare', 'analyze', 'workflows'] as const).map((tab) => (
          <button
            key={tab}
            className={`ag-tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => onTabChange(tab)}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </nav>

      {/* Actions */}
      <div className="ag-header-actions">
        {/* Connection pill */}
        <div
          className={`ag-status-pill ${anyConnected ? 'connected' : 'disconnected'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setShowApiPanel(!showApiPanel)}
          title="Click to manage LLM API keys"
        >
          <span className="dot">{anyConnected ? '●' : '○'}</span>
          <span>{anyConnected ? `${connectedProviders.length} LLM CONNECTED` : 'NO LLM'}</span>
        </div>

        {/* LLM provider quick selector */}
        <div className="ag-llm-selector" style={{ cursor: 'pointer' }} onClick={() => setShowApiPanel(!showApiPanel)}>
          <span>{activeProvider.icon}</span>
          <span style={{ fontWeight: 700, fontSize: '0.72rem' }}>{activeProvider.label}</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{showApiPanel ? '▲' : '▼'}</span>
        </div>

        <button className="ag-header-toggle-btn" onClick={() => setIsCollapsed(true)}>
          ▲ COLLAPSE
        </button>
      </div>

      {/* LLM API Key Panel — drops below header */}
      {showApiPanel && (
        <div className="ag-api-panel" style={{
          position: 'absolute',
          top: '64px',
          right: '24px',
          width: '380px',
          background: 'rgba(255, 255, 255, 0.97)',
          border: '1px solid rgba(203, 213, 225, 0.9)',
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.12)',
          zIndex: 9999,
          backdropFilter: 'blur(20px)',
          animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Panel header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>🔑 LLM API Keys</div>
            <button onClick={() => setShowApiPanel(false)} style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#64748b'
            }}>✕</button>
          </div>

          {/* Provider tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
            {LLM_PROVIDERS.map((p) => {
              const pState = llmStates[p.id]
              const isActive = selectedProvider === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProvider(p.id)}
                  style={{
                    flex: 1,
                    padding: '5px 4px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    background: isActive ? 'white' : 'transparent',
                    color: isActive ? '#0f172a' : '#64748b',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    position: 'relative',
                  }}
                >
                  <span>{p.icon}</span>
                  <span style={{ fontSize: '0.58rem' }}>{p.id.toUpperCase()}</span>
                  {pState.status === 'connected' && (
                    <span style={{
                      position: 'absolute', top: 3, right: 3,
                      width: 6, height: 6, borderRadius: '50%', background: '#10b981'
                    }} />
                  )}
                  {pState.status === 'error' && (
                    <span style={{
                      position: 'absolute', top: 3, right: 3,
                      width: 6, height: 6, borderRadius: '50%', background: '#ef4444'
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Provider label */}
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', marginBottom: 8 }}>
            {activeProvider.icon} {activeProvider.label}
          </div>

          {/* Key input */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={current.apiKey}
              onChange={(e) => updateState({ apiKey: e.target.value, status: 'idle', errorMsg: '' })}
              placeholder={activeProvider.placeholder}
              onKeyDown={(e) => e.key === 'Enter' && handleTestConnection()}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                border: `1px solid ${
                  current.status === 'connected' ? '#10b981' :
                  current.status === 'error' ? '#ef4444' :
                  'rgba(203, 213, 225, 0.9)'
                }`,
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                outline: 'none',
                background: '#fff',
                color: '#0f172a',
                letterSpacing: showKey ? 0 : '0.1em',
              }}
            />
            <button
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid rgba(203, 213, 225, 0.8)',
                background: '#f8fafc',
                cursor: 'pointer',
                fontSize: '0.85rem',
                color: '#64748b',
              }}
            >
              {showKey ? '🙈' : '👁'}
            </button>
          </div>

          {/* Status message */}
          {current.status === 'connected' && (
            <div style={{
              fontSize: '0.72rem', color: '#047857', fontWeight: 800, marginBottom: 10,
              background: 'rgba(16,185,129,0.1)', borderRadius: 6, padding: '5px 10px'
            }}>
              ✓ Connection verified — {activeProvider.label} is active
            </div>
          )}
          {current.status === 'error' && (
            <div style={{
              fontSize: '0.72rem', color: '#dc2626', fontWeight: 700, marginBottom: 10,
              background: 'rgba(220,38,38,0.08)', borderRadius: 6, padding: '5px 10px'
            }}>
              ✗ {current.errorMsg || 'Connection failed'}
            </div>
          )}

          {/* Test button */}
          <button
            onClick={handleTestConnection}
            disabled={current.status === 'testing' || !current.apiKey.trim()}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              cursor: current.status === 'testing' || !current.apiKey ? 'not-allowed' : 'pointer',
              fontWeight: 900,
              fontSize: '0.78rem',
              letterSpacing: '0.05em',
              color: 'white',
              background: current.status === 'testing'
                ? '#94a3b8'
                : 'linear-gradient(135deg, #2563eb, #0284c7)',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {current.status === 'testing' ? '⏳ TESTING CONNECTION...' : '🔌 TEST & CONNECT'}
          </button>

          <div style={{ fontSize: '0.63rem', color: '#94a3b8', marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>
            Keys are stored in browser memory only and never sent to any server.
          </div>
        </div>
      )}
    </header>
  )
}
