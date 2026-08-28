import { useState, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'
import { calculateGcContent, parseFasta } from '../bioinformatics/sequenceUtils'

const PRESETS = [
  {
    name: 'Hemoglobin Mutant (Sickle Cell)',
    ref: '>Reference_HbA\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGG',
    sample: '>Sample_HbS (GAG -> GTG mutation)\nATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGG',
  },
  {
    name: 'COVID-19 Spike Gene (Omicron vs Delta)',
    ref: '>Delta_Spike_Truncated\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCT',
    sample: '>Omicron_Spike_Truncated\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTAACAACCAGAACTCAATTACCCCCTGCATACACTAATTCT',
  },
  {
    name: 'BRCA1 Breast Cancer Gene Exon Truncation',
    ref: '>BRCA1_Normal\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGCAGAAAATCTTAGAGTGTCCCATCTGTCTGGAGTTGATC',
    sample: '>BRCA1_Mutation_Frameshift\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAATGTCATTAATGCTATGTAGAAAATCTTAGAGTGTCCCATCTGTCTGGAGTTGATC',
  },
]

export default function InputSequences() {
  const { sequence, comparisonSequence, loadTimeline, loadComparisonTimeline, activePosition } = usePlayback()

  const [refVal, setRefVal] = useState(`>gene_A_ref\n${sequence}`)
  const [sampleVal, setSampleVal] = useState(`>gene_B_sample\n${comparisonSequence}`)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setRefVal((v) => (v.includes(sequence) ? v : `>gene_A_ref\n${sequence}`))
  }, [sequence])

  useEffect(() => {
    setSampleVal((v) => (v.includes(comparisonSequence) ? v : `>gene_B_sample\n${comparisonSequence}`))
  }, [comparisonSequence])

  const refSeqClean = parseFasta(refVal).sequence
  const sampleSeqClean = parseFasta(sampleVal).sequence
  const refGc = calculateGcContent(refSeqClean)
  const sampleGc = calculateGcContent(sampleSeqClean)

  const handleRefChange = (val: string) => {
    setRefVal(val)
    const { sequence: seq } = parseFasta(val)
    if (seq) loadTimeline(seq, 'nucleotide_chroma')
  }

  const handleSampleChange = (val: string) => {
    setSampleVal(val)
    const { sequence: seq } = parseFasta(val)
    if (seq) loadComparisonTimeline(seq)
  }

  const handleLoadPreset = (idx: number) => {
    const preset = PRESETS[idx]
    setRefVal(preset.ref)
    setSampleVal(preset.sample)
    loadTimeline(parseFasta(preset.ref).sequence, 'nucleotide_chroma')
    loadComparisonTimeline(parseFasta(preset.sample).sequence)
  }

  const handleMutateAtActive = () => {
    if (activePosition <= 0 || activePosition > refSeqClean.length) return
    const bases = ['A', 'T', 'G', 'C']
    const currentBase = refSeqClean[activePosition - 1]
    const randomBase = bases.filter(b => b !== currentBase)[Math.floor(Math.random() * 3)]
    const newSampleSeq = sampleSeqClean.substring(0, activePosition - 1) + randomBase + sampleSeqClean.substring(activePosition)
    setSampleVal(`>gene_B_mutated\n${newSampleSeq}`)
    loadComparisonTimeline(newSampleSeq)
  }

  const handleClean = () => {
    const cleanA = refSeqClean.replace(/[^ATGCatgc]/g, '')
    setRefVal(`>gene_A_ref\n${cleanA}`)
    loadTimeline(cleanA, 'nucleotide_chroma')
    const cleanB = sampleSeqClean.replace(/[^ATGCatgc]/g, '')
    setSampleVal(`>gene_B_sample\n${cleanB}`)
    loadComparisonTimeline(cleanB)
  }

  return (
    <>
      {/* ── Compact card — just stats + open button ── */}
      <div className="ag-card ag-input-seq-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ag-card-header">
          <div className="ag-card-title">
            <span className="ag-badge badge-blue">1</span>
            <span>INPUT SEQUENCES</span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              color: '#fff', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: '0.68rem', fontWeight: 800,
              cursor: 'pointer', letterSpacing: '0.03em',
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            ✎ EDIT SEQUENCES
          </button>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'GENE A', val: `${refSeqClean.length} bp`, sub: `GC ${refGc}%`, color: '#2563eb' },
            { label: 'GENE B', val: `${sampleSeqClean.length} bp`, sub: `GC ${sampleGc}%`, color: '#0284c7' },
          ].map(p => (
            <div key={p.label} style={{
              flex: 1, background: '#f8fafc', border: `1px solid ${p.color}22`,
              borderLeft: `3px solid ${p.color}`, borderRadius: 8,
              padding: '7px 10px',
            }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.06em' }}>{p.label}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>{p.val}</div>
              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>{p.sub}</div>
            </div>
          ))}
        </div>

        {/* Mini quick tools */}
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={handleMutateAtActive}
            style={{ flex: 1, padding: '6px 8px', borderRadius: 7, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#2563eb', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}>
            💥 MUTATE #{activePosition}
          </button>
          <button onClick={handleClean}
            style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '0.62rem', fontWeight: 800, cursor: 'pointer' }}>
            🧹 CLEAN
          </button>
        </div>
      </div>

      {/* ── Full Sequence Input Modal ── */}
      {modalOpen && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            animation: 'fadeInModal 0.18s ease',
          }}
        >
          <div style={{
            background: '#ffffff', borderRadius: 18,
            boxShadow: '0 40px 100px rgba(0,0,0,0.22)',
            width: '92vw', maxWidth: 900,
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>

            {/* Modal Header */}
            <div style={{
              background: '#1e293b', padding: '16px 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: '1.3rem' }}>🧬</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem', color: '#f8fafc' }}>SEQUENCE INPUT EDITOR</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 500 }}>Enter FASTA format · Changes apply in real-time</div>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
                fontSize: '1rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* Presets bar */}
            <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '10px 22px', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, overflowX: 'auto' }}>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748b', whiteSpace: 'nowrap' }}>LOAD PRESET:</span>
              {PRESETS.map((p, i) => (
                <button key={i} onClick={() => handleLoadPreset(i)} style={{
                  whiteSpace: 'nowrap', padding: '4px 10px',
                  borderRadius: 20, border: '1px solid #bfdbfe',
                  background: '#eff6ff', color: '#2563eb',
                  fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.1s ease',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb' }}
                >
                  🧬 {p.name}
                </button>
              ))}
            </div>

            {/* Editor Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Gene A */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb' }} />
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#0f172a' }}>REFERENCE GENE A</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>FASTA format</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                    <span style={{ color: '#2563eb' }}>{refSeqClean.length} bp</span>
                    <span style={{ color: '#64748b' }}>GC {refGc}%</span>
                    {refSeqClean.length > 0 && <span style={{ color: '#10b981' }}>✓ Valid FASTA</span>}
                  </div>
                </div>
                <textarea
                  value={refVal}
                  onChange={e => handleRefChange(e.target.value)}
                  spellCheck={false}
                  placeholder=">gene_name&#10;ATGCATGCATGC..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: 160, padding: '12px 14px',
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    fontSize: '0.78rem', lineHeight: 1.6,
                    color: '#0f172a', fontWeight: 600,
                    background: '#fafafa', border: '1px solid #e2e8f0',
                    borderRadius: 10, resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#2563eb'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Gene B */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', color: '#0f172a' }}>SAMPLE GENE B</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>FASTA format</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                    <span style={{ color: '#0284c7' }}>{sampleSeqClean.length} bp</span>
                    <span style={{ color: '#64748b' }}>GC {sampleGc}%</span>
                    {sampleSeqClean.length > 0 && <span style={{ color: '#10b981' }}>✓ Valid FASTA</span>}
                  </div>
                </div>
                <textarea
                  value={sampleVal}
                  onChange={e => handleSampleChange(e.target.value)}
                  spellCheck={false}
                  placeholder=">gene_name&#10;ATGCATGCATGC..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    height: 160, padding: '12px 14px',
                    fontFamily: 'JetBrains Mono, Fira Code, monospace',
                    fontSize: '0.78rem', lineHeight: 1.6,
                    color: '#0f172a', fontWeight: 600,
                    background: '#fafafa', border: '1px solid #e2e8f0',
                    borderRadius: 10, resize: 'vertical', outline: 'none',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#0284c7'}
                  onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
              </div>

              {/* Tools row */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleMutateAtActive} style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  border: '1px solid #bfdbfe', background: '#eff6ff',
                  color: '#2563eb', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                }}>
                  💥 INJECT POINT MUTATION at Base #{activePosition}
                </button>
                <button onClick={handleClean} style={{
                  padding: '10px 18px', borderRadius: 8,
                  border: '1px solid #e2e8f0', background: '#f8fafc',
                  color: '#475569', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                }}>
                  🧹 CLEAN
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e2e8f0', padding: '12px 22px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: '#fafafa', flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Changes are applied in real-time as you type · FASTA headers (starting with {'>'}) are parsed automatically</span>
              <button onClick={() => setModalOpen(false)} style={{
                background: 'linear-gradient(135deg, #2563eb, #0284c7)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '8px 20px',
                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
              }}>
                ✓ DONE
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
