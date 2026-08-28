import { useState, useCallback } from 'react'
import { usePlayback } from '../state/usePlayback'
import { METHOD_INFO } from '../types'
import type { ValidationInfo } from '../types'

/** Deterministic DNA validation — no LLM, no network. */
function validateInput(raw: string): ValidationInfo {
  const trimmed = raw.trim()
  const hasFastaHeader = trimmed.startsWith('>')
  let fastaHeader = ''
  let sequence = trimmed

  if (hasFastaHeader) {
    const lines = trimmed.split('\n')
    fastaHeader = lines[0].replace(/^>/, '').trim()
    sequence = lines.slice(1).join('').trim()
  }

  const cleaned = sequence.replace(/[\s\r\n]/g, '').toUpperCase()
  const validBases = 'ACGT'
  let validCount = 0
  let ambiguousCount = 0
  let invalidCount = 0
  const invalidChars: string[] = []

  for (const ch of cleaned) {
    if (validBases.includes(ch)) validCount++
    else if ('NRYSWKMBDHV'.includes(ch)) ambiguousCount++
    else {
      invalidCount++
      if (!invalidChars.includes(ch)) invalidChars.push(ch)
    }
  }

  const isProtein = cleaned.length > 0 && /^[MRQHPNSTYAILVDEFWCGK]+$/.test(cleaned)
    && validCount === 0 && ambiguousCount === 0

  const warnings: string[] = []
  if (ambiguousCount > 0) warnings.push(`${ambiguousCount} ambiguous base(s) detected`)
  if (invalidCount > 0) warnings.push(`${invalidCount} invalid character(s): ${invalidChars.join(', ')}`)
  if (isProtein) warnings.push('Input appears to be a protein sequence, not DNA')

  return {
    isValid: invalidCount === 0 && !isProtein && cleaned.length > 0,
    length: cleaned.length,
    validBases: validCount,
    ambiguousCount,
    invalidCount,
    invalidChars,
    warnings,
    cleanedSequence: cleaned,
    originalInput: raw,
    hasFastaHeader,
    fastaHeader,
    isProtein,
  }
}

export default function SequenceInput() {
  const { loadTimeline, loadComparisonTimeline, loading, method, timeline } = usePlayback()
  const [refInput, setRefInput] = useState('ATGCGTACGTAGCTAGCTAGCTAGCTAGCTAG')
  const [sampleInput, setSampleInput] = useState('ATGCGTACGAAGCTAGCAAGCTAGCTAGCTAG')
  const [selectedMethod, setSelectedMethod] = useState(method)
  const [showSample, setShowSample] = useState(false)
  const [refValidation, setRefValidation] = useState<ValidationInfo | null>(null)
  const [sampleValidation, setSampleValidation] = useState<ValidationInfo | null>(null)

  const validate = useCallback(() => {
    setRefValidation(validateInput(refInput))
    if (showSample) setSampleValidation(validateInput(sampleInput))
  }, [refInput, sampleInput, showSample])

  const handleSubmit = () => {
    const ref = validateInput(refInput)
    setRefValidation(ref)
    if (!ref.isValid || ref.length === 0) return

    if (showSample) {
      const seq = validateInput(sampleInput)
      if (!seq.isValid || seq.length === 0) {
        setSampleValidation(seq)
        return
      }
      loadTimeline(ref.cleanedSequence, selectedMethod)
      loadComparisonTimeline(seq.cleanedSequence)
    } else {
      loadTimeline(ref.cleanedSequence, selectedMethod)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(reader.result as string)
    reader.readAsText(file)
  }

  return (
    <div className="input-section">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0 }}>Sequence Input</h2>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input type="file" accept=".fasta,.fa,.txt,.seq" style={{ display: 'none' }}
                onChange={(e) => handleFileUpload(e, setRefInput)} />
              <span className="btn btn-ghost btn-sm">Upload FASTA</span>
            </label>
            <button
              className={`btn btn-sm ${showSample ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowSample(!showSample)}
            >
              {showSample ? 'Hide Sample' : '+ Compare Sequences'}
            </button>
          </div>
        </div>

        <div className={showSample ? 'dual-input' : ''}>
          <div className="input-group">
            <label>
              Reference Sequence
              <span className="tag tag-ref">REF</span>
            </label>
            <textarea
              className="sequence-textarea"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onBlur={validate}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
              placeholder="Paste DNA sequence or FASTA here..."
              spellCheck={false}
            />
          </div>
          {showSample && (
            <div className="input-group">
              <label>
                Sample Sequence
                <span className="tag tag-sample">SAMPLE</span>
              </label>
              <textarea
                className="sequence-textarea"
                value={sampleInput}
                onChange={(e) => setSampleInput(e.target.value)}
                onBlur={validate}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSubmit())}
                placeholder="Paste comparison sequence..."
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Validation Summary */}
        {refValidation && (
          <div className="validation-panel">
            <div className="validation-row">
              <span className="label">Status</span>
              <span className={`validation-status ${refValidation.isValid ? 'valid' : 'error'}`}>
                {refValidation.isValid ? 'Valid DNA' : 'Needs Attention'}
              </span>
            </div>
            <div className="validation-row">
              <span className="label">Length</span>
              <span className="value">{refValidation.length.toLocaleString()} bp</span>
            </div>
            {refValidation.hasFastaHeader && (
              <div className="validation-row">
                <span className="label">FASTA Header</span>
                <span className="value">{refValidation.fastaHeader}</span>
              </div>
            )}
            {refValidation.warnings.length > 0 && (
              <div style={{ marginTop: 'var(--space-sm)', color: 'var(--orange)', fontSize: '0.75rem' }}>
                {refValidation.warnings.map((w, i) => <div key={i}>Warning: {w}</div>)}
              </div>
            )}
          </div>
        )}

        {/* Method Selector */}
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-sm)' }}>
            Sonification Method
          </label>
          <div className="method-selector">
            {Object.entries(METHOD_INFO).map(([key, info]) => (
              <button
                key={key}
                className={`method-chip ${selectedMethod === key ? 'active' : ''}`}
                onClick={() => setSelectedMethod(key)}
              >
                {info.label}
                <span className="fidelity">{info.fidelity}</span>
              </button>
            ))}
          </div>
          {selectedMethod && METHOD_INFO[selectedMethod] && (
            <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {METHOD_INFO[selectedMethod].description}
            </div>
          )}
        </div>

        {/* Action */}
        <div style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !refInput.trim()}>
            {loading ? 'Analysing...' : 'Analyse & Load'}
          </button>
          {timeline && (
            <span style={{ fontSize: '0.8rem', color: 'var(--green)', fontWeight: 600 }}>
              Loaded {timeline.events.length} events
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
