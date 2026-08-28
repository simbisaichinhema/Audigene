import { useState, useEffect, useRef } from 'react'
import { usePlayback } from '../state/usePlayback'
import { calculateGcContent, parseFasta } from '../bioinformatics/sequenceUtils'

const PRESETS = [
  {
    name: 'Hemoglobin — Sickle Cell',
    ref: '>Reference_HbA\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGG',
    sample: '>Sample_HbS\nATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGG',
  },
  {
    name: 'COVID-19 — Omicron vs Delta',
    ref: '>Delta_Spike\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCT',
    sample: '>Omicron_Spike\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTAACAACCAGAACTCAATTACCCCCTGCATACACTAATTCT',
  },
  {
    name: 'BRCA1 — Breast Cancer Frameshift',
    ref: '>BRCA1_Normal\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGCAGAAAATCTTAGAGTGTCCCATCTGTCTGGAGTTGATC',
    sample: '>BRCA1_Mutation\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGTAGAAAATCTTAGAGTGTCCCATCTGTCTGGAGTTGATC',
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function SequenceInputModal({ open, onClose }: Props) {
  const { sequence, comparisonSequence, loadTimeline, loadComparisonTimeline, activePosition } = usePlayback()

  const [refVal, setRefVal] = useState(`>gene_A_ref\n${sequence}`)
  const [sampleVal, setSampleVal] = useState(`>gene_B_sample\n${comparisonSequence}`)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setRefVal(v => v.includes(sequence) ? v : `>gene_A_ref\n${sequence}`)
  }, [sequence])

  useEffect(() => {
    setSampleVal(v => v.includes(comparisonSequence) ? v : `>gene_B_sample\n${comparisonSequence}`)
  }, [comparisonSequence])

  if (!open) return null

  const refSeq = parseFasta(refVal).sequence
  const sampleSeq = parseFasta(sampleVal).sequence

  const handleRefChange = (val: string) => {
    setRefVal(val)
    const { sequence: s } = parseFasta(val)
    if (s) loadTimeline(s, 'nucleotide_chroma')
  }

  const handleSampleChange = (val: string) => {
    setSampleVal(val)
    const { sequence: s } = parseFasta(val)
    if (s) loadComparisonTimeline(s)
  }

  const handleLoadPreset = (i: number) => {
    const p = PRESETS[i]
    setRefVal(p.ref)
    setSampleVal(p.sample)
    loadTimeline(parseFasta(p.ref).sequence, 'nucleotide_chroma')
    loadComparisonTimeline(parseFasta(p.sample).sequence)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || ''
      const records = text.split('>').filter(Boolean)
      if (records.length >= 2) {
        const seqA = `>${records[0]}`
        const seqB = `>${records[1]}`
        setRefVal(seqA)
        setSampleVal(seqB)
        loadTimeline(parseFasta(seqA).sequence, 'nucleotide_chroma')
        loadComparisonTimeline(parseFasta(seqB).sequence)
      } else if (records.length === 1) {
        const seqA = `>${records[0]}`
        setRefVal(seqA)
        loadTimeline(parseFasta(seqA).sequence, 'nucleotide_chroma')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleMutate = () => {
    if (activePosition <= 0 || activePosition > refSeq.length) return
    const bases = ['A', 'T', 'G', 'C']
    const cur = refSeq[activePosition - 1]
    const mut = bases.filter(b => b !== cur)[Math.floor(Math.random() * 3)]
    const newSeq = sampleSeq.substring(0, activePosition - 1) + mut + sampleSeq.substring(activePosition)
    setSampleVal(`>gene_B_mutated\n${newSeq}`)
    loadComparisonTimeline(newSeq)
  }

  const handleClean = () => {
    const ca = refSeq.replace(/[^ATGCatgc]/g, '')
    setRefVal(`>gene_A_ref\n${ca}`)
    loadTimeline(ca, 'nucleotide_chroma')
    const cb = sampleSeq.replace(/[^ATGCatgc]/g, '')
    setSampleVal(`>gene_B_sample\n${cb}`)
    loadComparisonTimeline(cb)
  }

  const taStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    height: 180, padding: '14px 16px',
    fontFamily: 'JetBrains Mono, Fira Code, monospace',
    fontSize: '0.82rem', lineHeight: 1.65,
    color: '#0f172a', fontWeight: 600,
    background: '#ffffff', border: '1.5px solid #cbd5e1',
    borderRadius: 10, resize: 'vertical', outline: 'none',
    transition: 'border-color 0.15s ease',
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'seqModalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".fasta,.fa,.txt"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
      <div style={{
        background: '#ffffff', borderRadius: 20,
        boxShadow: '0 30px 90px rgba(0,0,0,0.18)',
        width: '94vw', maxWidth: 960,
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>

        {/* ── Bright Header ── */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}>🧬</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a', letterSpacing: '-0.01em' }}>
                SEQUENCE INPUT EDITOR
              </div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginTop: 1 }}>
                FASTA format · Real-time alignment · Load from PC or Presets
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1',
              borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
              fontSize: '1rem', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >✕</button>
        </div>

        {/* ── Presets & PC Upload strip ── */}
        <div style={{
          background: '#ffffff', borderBottom: '1px solid #e2e8f0',
          padding: '10px 24px', display: 'flex', gap: 10, alignItems: 'center',
          flexShrink: 0, overflowX: 'auto',
        }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              whiteSpace: 'nowrap', padding: '6px 14px',
              borderRadius: 8, border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              color: '#ffffff', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>📂</span> UPLOAD FROM PC (.FASTA / .TXT)
          </button>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', margin: '0 4px' }}>| PRESETS:</span>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => handleLoadPreset(i)}
              style={{
                whiteSpace: 'nowrap', padding: '5px 12px',
                borderRadius: 20, border: '1px solid #bfdbfe',
                background: '#eff6ff', color: '#2563eb',
                fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb' }}
            >
              🧬 {p.name}
            </button>
          ))}
        </div>

        {/* ── Editor body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Gene A */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
                <span style={{ fontWeight: 900, fontSize: '0.86rem', color: '#0f172a' }}>REFERENCE — GENE A</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>paste, type or upload FASTA</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                <span style={{ color: '#2563eb' }}>{refSeq.length} bp</span>
                <span style={{ color: '#64748b' }}>GC {calculateGcContent(refSeq)}%</span>
                {refSeq.length > 0 && <span style={{ color: '#10b981' }}>✓ Valid</span>}
              </div>
            </div>
            <textarea
              value={refVal}
              onChange={e => handleRefChange(e.target.value)}
              spellCheck={false}
              placeholder={">gene_A_ref\nATGCATGCATGC..."}
              style={taStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Gene B */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
                <span style={{ fontWeight: 900, fontSize: '0.86rem', color: '#0f172a' }}>SAMPLE — GENE B</span>
                <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>paste, type or upload FASTA</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', fontWeight: 700 }}>
                <span style={{ color: '#0284c7' }}>{sampleSeq.length} bp</span>
                <span style={{ color: '#64748b' }}>GC {calculateGcContent(sampleSeq)}%</span>
                {sampleSeq.length > 0 && <span style={{ color: '#10b981' }}>✓ Valid</span>}
              </div>
            </div>
            <textarea
              value={sampleVal}
              onChange={e => handleSampleChange(e.target.value)}
              spellCheck={false}
              placeholder={">gene_B_sample\nATGCATGCATGC..."}
              style={taStyle}
              onFocus={e => e.currentTarget.style.borderColor = '#0284c7'}
              onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
            />
          </div>

          {/* Utility tools */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleMutate}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 9,
                border: '1px solid #bfdbfe', background: '#eff6ff',
                color: '#2563eb', fontSize: '0.75rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb' }}
            >
              💥 INJECT POINT MUTATION at Base #{activePosition}
            </button>
            <button
              onClick={handleClean}
              style={{
                padding: '10px 18px', borderRadius: 9,
                border: '1px solid #e2e8f0', background: '#f8fafc',
                color: '#475569', fontSize: '0.75rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569' }}
            >
              🧹 CLEAN SEQS
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid #e2e8f0', padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
            Changes apply in real-time · Click outside or ✕ to close
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              color: '#fff', border: 'none', borderRadius: 9,
              padding: '9px 22px', fontSize: '0.75rem',
              fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}
          >
            ✓ DONE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes seqModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
