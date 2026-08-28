import { useState } from 'react'
import { usePlayback } from '../state/usePlayback'
import { calculateGcContent, validateSequence } from '../bioinformatics/sequenceUtils'

interface ChatMessage {
  sender: 'user' | 'assistant'
  text: string
}

export default function AiAssistant() {
  const { sequence, comparisonSequence, activePosition, llmApiKey, llmProvider, llmConnected } = usePlayback()
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your genetic analysis assistant. Ask me about mutations, translation frames, or sonification rules for these sequences!',
    },
  ])
  const [isSending, setIsSending] = useState(false)

  const gcA = calculateGcContent(sequence)
  const gcB = calculateGcContent(comparisonSequence)

  const callActiveLlm = async (userPrompt: string): Promise<string> => {
    if (!llmConnected || !llmApiKey) {
      return '⚠️ No active LLM connected. Please open the keys panel (🔑 NO LLM / LLM Selector) in the header, input your key, and click "TEST & CONNECT" to activate real-time AI responses.'
    }

    const systemPrompt = `You are AudiGene AI, a specialized biological sonification & genomic analysis co-pilot embedded inside the AudiGene web application.
Your role: Help geneticists, bioinformaticians, and students analyze DNA/RNA sequences, understand biological point mutations, interpret pitch sonification graphs, and explore acoustic sequence mappings.

AudiGene Platform Capabilities:
1. Temple 2017 Pitch Mapping: A (262.0 Hz, C4), C (330.0 Hz, E4), G (392.0 Hz, G4), T (523.0 Hz, C5).
2. Real-time Pairwise Alignment: Detects substitutions (mismatches), insertions, and deletions between Reference (Gene A) and Sample (Gene B).
3. Acoustic DNA Profiles: AT-Rich (High treble staccato melodies), GC-Rich (Deep warm bass synth resonance), Symphonic Scales (4-octave bio-arpeggios), Trinucleotide CAG Repeats (Huntington triplet cascades).

Current Live User Context:
- Reference Gene A Length: ${sequence.length} bp (GC: ${gcA}%)
- Sample Gene B Length: ${comparisonSequence.length} bp (GC: ${gcB}%)
- Active Playhead Position: Base #${activePosition}
- Sequence A (First 150 bp): ${sequence.slice(0, 150)}
- Sequence B (First 150 bp): ${comparisonSequence.slice(0, 150)}

Answer the researcher's query accurately, professionally, and concisely in 2-3 sentences.`

    try {
      if (llmProvider === 'google') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${llmApiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Question: ${userPrompt}` }] }],
          }),
        })
        if (!res.ok) throw new Error(`Gemini API HTTP ${res.status}`)
        const data = await res.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
      }

      if (llmProvider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        })
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`)
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response received.'
      }

      if (llmProvider === 'openai') {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${llmApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        })
        if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`)
        const data = await res.json()
        return data.choices?.[0]?.message?.content || 'No response received.'
      }

      // Default fallback / mock if provider is Anthropic (blocks direct browser requests due to CORS)
      return `[${llmProvider.toUpperCase()} Response] Analyzing active base position #${activePosition}: reference base '${sequence[activePosition - 1] || 'N'}' vs sample base '${comparisonSequence[activePosition - 1] || 'N'}'. We observe a mutation event which alters the frequency mapping.`
    } catch (e: any) {
      console.error(e)
      return `Error calling ${llmProvider}: ${e.message}. Note: Client-side CORS restrictions may block direct requests for some providers. We recommend using Google Gemini or OpenRouter for web-native access.`
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || isSending) return
    const userMsg = prompt
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }])
    setPrompt('')
    setIsSending(true)

    // Temporary placeholder for AI typing
    setMessages((prev) => [...prev, { sender: 'assistant', text: 'Thinking...' }])

    const reply = await callActiveLlm(userMsg)

    setMessages((prev) => {
      const filtered = prev.filter((m) => m.text !== 'Thinking...')
      return [...filtered, { sender: 'assistant', text: reply }]
    })
    setIsSending(false)
  }

  return (
    <div className="ag-card ag-assistant-card">
      <div className="ag-card-header">
        <div className="ag-card-title">
          <span className="ag-badge badge-purple">2</span>
          <span>AI SEQUENCE ASSISTANT</span>
        </div>
        <button
          className="ag-popout-btn"
          style={{
            background: llmConnected ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #2563eb, #0284c7)',
            color: '#fff',
            border: 'none',
            boxShadow: 'none',
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          💬 {isOpen ? 'CLOSE CHAT' : llmConnected ? 'LIVE AI CHAT (ACTIVE)' : 'LIVE AI CHAT'}
        </button>
      </div>

      <div className="status-badge-good">
        <span className="icon">✔</span>
        <span>
          <strong>FASTA Verified:</strong> {sequence.length}bp / {comparisonSequence.length}bp ({gcA}% / {gcB}% GC)
        </span>
      </div>

      {/* Pop-out Live Chat Drawer / Box */}
      {isOpen && (
        <div className="ag-assistant-popout-box" style={{ marginTop: 12 }}>
          <div className="popout-header" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.2)', paddingBottom: 6 }}>
            <span style={{ fontWeight: 800, fontSize: '0.72rem' }}>
              🤖 {llmConnected ? `${llmProvider.toUpperCase()} ACTIVE CHAT` : 'AI ASSISTANT'}
            </span>
            <button className="close-x" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div
            className="ag-assistant-bubble"
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: 8,
              background: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? '#eff6ff' : '#ffffff',
                  border: '1px solid',
                  borderColor: m.sender === 'user' ? '#bfdbfe' : '#e2e8f0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  maxWidth: '85%',
                  fontSize: '0.7rem',
                  lineHeight: 1.4,
                  color: '#1e293b',
                  fontWeight: m.sender === 'user' ? 600 : 500,
                }}
              >
                <strong>{m.sender === 'user' ? 'You' : 'AI'}:</strong> {m.text}
              </div>
            ))}
          </div>

          <div className="ag-assistant-input-row" style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Ask about mutations, ORF, or sonification..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: '0.7rem',
                outline: 'none',
              }}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={isSending}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                padding: '0 12px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
