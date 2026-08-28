import { useState } from 'react'
import { usePlayback, type LlmProvider } from '../state/usePlayback'

const PROVIDER_OPTIONS: { id: LlmProvider; label: string; icon: string; defaultModel: string; hint: string }[] = [
  { id: 'gemini',     label: 'Google Gemini', icon: '✨', defaultModel: 'gemini-1.5-flash', hint: 'Recommended · Direct Browser API' },
  { id: 'openrouter', label: 'OpenRouter',    icon: '🌐', defaultModel: 'anthropic/claude-3.5-sonnet', hint: 'Access Claude, GPT-4, Llama, etc.' },
  { id: 'openai',     label: 'OpenAI GPT-4o', icon: '🟢', defaultModel: 'gpt-4o-mini', hint: 'Requires valid OpenAI API key' },
  { id: 'anthropic',  label: 'Anthropic',     icon: '🟠', defaultModel: 'claude-3-5-sonnet-latest', hint: 'Proxy required (CORS enabled)' },
]

export default function LlmSetupPanel() {
  const { llmCredentials, setLlmCredential } = usePlayback()
  const [selectedProvider, setSelectedProvider] = useState<LlmProvider>('gemini')
  const [keyInput, setKeyInput] = useState(llmCredentials[selectedProvider]?.apiKey || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const currentCred = llmCredentials[selectedProvider]
  const currentOption = PROVIDER_OPTIONS.find(p => p.id === selectedProvider)!

  const handleSelectProvider = (prov: LlmProvider) => {
    setSelectedProvider(prov)
    setKeyInput(llmCredentials[prov]?.apiKey || '')
    setTestResult(null)
  }

  const handleSaveKey = () => {
    setLlmCredential(selectedProvider, keyInput, true)
    setTestResult({ ok: true, msg: `${currentOption.label} API key saved!` })
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)

    if (!keyInput.trim()) {
      setTesting(false)
      setTestResult({ ok: false, msg: 'Please enter an API key first.' })
      return
    }

    try {
      // Test Gemini API key directly
      if (selectedProvider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyInput.trim()}`)
        if (res.ok) {
          setLlmCredential('gemini', keyInput.trim(), true)
          setTestResult({ ok: true, msg: '✓ Connected to Google Gemini API!' })
        } else {
          setTestResult({ ok: false, msg: `Connection failed: ${res.statusText}` })
        }
      } 
      // Test OpenRouter API key
      else if (selectedProvider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${keyInput.trim()}` }
        })
        if (res.ok) {
          setLlmCredential('openrouter', keyInput.trim(), true)
          setTestResult({ ok: true, msg: '✓ Connected to OpenRouter API!' })
        } else {
          setTestResult({ ok: false, msg: 'Invalid OpenRouter API Key' })
        }
      }
      // General Fallback
      else {
        setLlmCredential(selectedProvider, keyInput.trim(), true)
        setTestResult({ ok: true, msg: `Saved ${currentOption.label} credentials!` })
      }
    } catch (err: any) {
      setTestResult({ ok: false, msg: err.message || 'Connection test failed' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="ag-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14 }}>
      <div className="ag-card-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
        <div className="ag-card-title">
          <span style={{ fontSize: '1rem' }}>🤖</span>
          <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#0f172a', letterSpacing: '0.04em' }}>
            AI AGENT & LLM SETUP
          </span>
        </div>
        <span style={{
          fontSize: '0.58rem', fontWeight: 800,
          background: currentCred?.isConnected ? '#dcfce7' : '#f1f5f9',
          color: currentCred?.isConnected ? '#15803d' : '#64748b',
          padding: '2px 8px', borderRadius: 12,
        }}>
          {currentCred?.isConnected ? '● ACTIVE' : '○ DISCONNECTED'}
        </span>
      </div>

      {/* Provider Selector Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {PROVIDER_OPTIONS.map((p) => {
          const isSelected = selectedProvider === p.id
          const isConn = llmCredentials[p.id]?.isConnected
          return (
            <button
              key={p.id}
              onClick={() => handleSelectProvider(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px', borderRadius: 8,
                border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: isSelected ? '#eff6ff' : '#ffffff',
                color: isSelected ? '#2563eb' : '#475569',
                cursor: 'pointer', fontSize: '0.66rem', fontWeight: 800,
                textAlign: 'left', transition: 'all 0.12s ease',
              }}
            >
              <span>{p.icon}</span>
              <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.label}
              </div>
              {isConn && <span style={{ color: '#10b981', fontSize: '0.58rem' }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* API Key Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>
          <span>{currentOption.label} API KEY</span>
          <span style={{ color: '#2563eb' }}>{currentOption.defaultModel}</span>
        </div>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={`Enter your ${currentOption.label} Key...`}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 10px', borderRadius: 8,
            border: '1px solid #cbd5e1', fontSize: '0.72rem',
            fontFamily: 'monospace', outline: 'none', background: '#f8fafc',
          }}
        />
        <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{currentOption.hint}</div>
      </div>

      {/* Test & Save Action Buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleTestConnection}
          disabled={testing}
          style={{
            flex: 1, padding: '7px', borderRadius: 7,
            border: '1px solid #bfdbfe', background: '#eff6ff',
            color: '#2563eb', fontSize: '0.65rem', fontWeight: 800,
            cursor: testing ? 'wait' : 'pointer',
          }}
        >
          {testing ? '⚡ TESTING...' : '⚡ TEST CONNECTION'}
        </button>
        <button
          onClick={handleSaveKey}
          style={{
            padding: '7px 14px', borderRadius: 7,
            border: 'none', background: 'linear-gradient(135deg, #2563eb, #0284c7)',
            color: '#ffffff', fontSize: '0.65rem', fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
          }}
        >
          SAVE
        </button>
      </div>

      {/* Test Result Alert */}
      {testResult && (
        <div style={{
          padding: '6px 10px', borderRadius: 7, fontSize: '0.62rem', fontWeight: 700,
          background: testResult.ok ? '#f0fdf4' : '#fef2f2',
          color: testResult.ok ? '#166534' : '#991b1b',
          border: testResult.ok ? '1px solid #bbf7d0' : '1px solid #fecaca',
        }}>
          {testResult.msg}
        </div>
      )}
    </div>
  )
}
