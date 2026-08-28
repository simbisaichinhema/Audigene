import { useState, useRef, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'

interface ChatMessage {
  sender: 'user' | 'assistant' | 'system'
  text: string
}

export default function RightSidebarAiAgent() {
  const { sequence, comparisonSequence, differences, alignment, activePosition, llmApiKey, llmProvider, llmConnected } = usePlayback()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: `Hello! I'm your genomic analysis assistant. I have access to both sequences (${0} bp loaded). Ask me about mutations, translation frames, or how AudiGene is sonifying this data.`,
    },
  ])
  const [prompt, setPrompt] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Update greeting once sequences are loaded
  useEffect(() => {
    if (sequence.length > 0) {
      setMessages([{
        sender: 'assistant',
        text: `Hello! I'm your genomic analysis assistant. Both sequences loaded — Gene A: ${sequence.length} bp, Gene B: ${comparisonSequence.length} bp, ${differences.length} variant(s) detected. Ask me anything!`,
      }])
    }
  }, []) // only on mount

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const callLlm = async (userPrompt: string): Promise<string> => {
    if (!llmConnected || !llmApiKey) {
      return `⚠️ No LLM connected. Click the provider pill in the header (top-right) to enter your API key and connect. I can still answer basic questions from the local sequence data:\n\n• Gene A: ${sequence.length} bp | Gene B: ${comparisonSequence.length} bp\n• Variants detected: ${differences.length}\n• Alignment identity: ${alignment ? (alignment.identity * 100).toFixed(1) + '%' : 'N/A'}\n• Active base position: #${activePosition}`
    }

    const sys = `You are a genomic bioinformatics AI assistant embedded in the AudiGene sonification platform.
Current sequence context:
- Reference Sequence (Gene A): ${sequence.slice(0, 200)}${sequence.length > 200 ? '...' : ''}
- Sample Sequence (Gene B): ${comparisonSequence.slice(0, 200)}${comparisonSequence.length > 200 ? '...' : ''}
- Active base position: #${activePosition}
- Detected variants: ${differences.length} (${alignment?.mismatchCount ?? 0} subs, ${alignment?.insertionCount ?? 0} ins, ${alignment?.deletionCount ?? 0} del)
- Alignment identity: ${alignment ? (alignment.identity * 100).toFixed(1) + '%' : 'N/A'}
Respond concisely in 2-4 sentences. Use plain text, no markdown headers.`

    try {
      if (llmProvider === 'google') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${llmApiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `${sys}\n\nUser: ${userPrompt}` }] }] }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
      }
      if (llmProvider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmApiKey}` },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }],
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response.'
      }
      if (llmProvider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${llmApiKey}` },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: sys }, { role: 'user', content: userPrompt }],
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response.'
      }
      // Anthropic / fallback — CORS blocked in browser
      return `Local analysis: At position #${activePosition}, Gene A has base '${sequence[activePosition - 1] || 'N'}' and Gene B has '${comparisonSequence[activePosition - 1] || 'N'}'. Total ${differences.length} mutations. Note: ${llmProvider} requests are blocked by browser CORS — try Google Gemini or OpenRouter.`
    } catch (e: any) {
      return `API error: ${e.message}. Try switching to Google Gemini or OpenRouter in the header panel.`
    }
  }

  const handleSend = async () => {
    const text = prompt.trim()
    if (!text || isSending) return
    setPrompt('')
    setIsSending(true)
    setMessages(prev => [...prev, { sender: 'user', text }])
    setMessages(prev => [...prev, { sender: 'assistant', text: '...' }])

    const reply = await callLlm(text)

    setMessages(prev => {
      const without = prev.filter(m => m.text !== '...')
      return [...without, { sender: 'assistant', text: reply }]
    })
    setIsSending(false)
  }

  const quickPrompts = [
    'What mutations are in these sequences?',
    'What protein does Gene A encode?',
    'Why does this position sound different?',
    'Explain the sonification mapping used',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: llmConnected ? '#f0fdf4' : '#fafafa',
        border: `1px solid ${llmConnected ? '#bbf7d0' : '#e2e8f0'}`,
        borderRadius: 8, padding: '5px 10px',
        fontSize: '0.65rem', fontWeight: 700,
        color: llmConnected ? '#15803d' : '#64748b',
      }}>
        <span>{llmConnected ? '🟢' : '⚪'}</span>
        <span>{llmConnected ? `${llmProvider.toUpperCase()} CONNECTED` : 'NO LLM — connect via header'}</span>
      </div>

      {/* Quick prompt chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {quickPrompts.map(q => (
          <button
            key={q}
            onClick={() => { setPrompt(q); }}
            style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0',
              borderRadius: 12, padding: '3px 8px',
              fontSize: '0.6rem', fontWeight: 600,
              color: '#475569', cursor: 'pointer',
              transition: 'all 0.1s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e2e8f0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f1f5f9')}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '8px 4px',
          minHeight: 180,
          maxHeight: 320,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.sender === 'user' ? '#2563eb' : '#f8fafc',
              color: m.sender === 'user' ? '#ffffff' : '#1e293b',
              border: m.sender === 'user' ? 'none' : '1px solid #e2e8f0',
              borderRadius: m.sender === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              padding: '7px 10px',
              fontSize: '0.68rem',
              lineHeight: 1.5,
              fontWeight: m.sender === 'user' ? 600 : 400,
              opacity: m.text === '...' ? 0.5 : 1,
            }}
          >
            {m.text === '...' ? (
              <span style={{ letterSpacing: 2 }}>● ● ●</span>
            ) : m.text}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <input
          type="text"
          placeholder="Ask about sequences, mutations, sonification..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1,
            padding: '7px 10px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: '0.68rem',
            outline: 'none',
            background: '#ffffff',
            color: '#1e293b',
          }}
        />
        <button
          onClick={handleSend}
          disabled={isSending || !prompt.trim()}
          style={{
            background: isSending ? '#94a3b8' : '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '0 14px',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: isSending ? 'not-allowed' : 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  )
}
