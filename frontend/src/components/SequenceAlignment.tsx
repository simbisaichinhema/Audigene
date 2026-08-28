import { useState, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'
import { ACOUSTIC_DNA_PRESETS, DnaPreset, parseFasta } from '../bioinformatics/sequenceUtils'

function AlignmentContent({ fullView = false }: { fullView?: boolean }) {
  const { sequence, comparisonSequence, activePosition, setActivePosition, differences } = usePlayback()

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const diffPosSet = new Set(differences.map((d) => d.position))
  const maxLen = Math.max(sequence.length, comparisonSequence.length)

  // In compact mode show a window; in full mode show everything
  const windowSize = fullView ? maxLen : (isMobile ? 14 : 25)
  const startIdx = fullView ? 0 : Math.max(0, activePosition - (isMobile ? 7 : 10))
  const endIdx = Math.min(maxLen, startIdx + windowSize)

  const seqAWindow = sequence.slice(startIdx, endIdx).split('')
  const seqBWindow = comparisonSequence.slice(startIdx, endIdx).split('')

  const rulerTicks = fullView
    ? [1, Math.round(maxLen * 0.25), Math.round(maxLen * 0.5), Math.round(maxLen * 0.75), maxLen]
    : [1, activePosition, Math.floor(sequence.length * 0.5), sequence.length]

  const uniqueTicks = rulerTicks.filter((v, i, a) => v > 0 && a.indexOf(v) === i).sort((a, b) => a - b)

  return (
    <>
      {/* Position Ruler Bar */}
      <div className="ag-ruler-container" style={fullView ? { marginBottom: 8 } : undefined}>
        {uniqueTicks.map((pos) => (
          <div
            key={pos}
            className={`ag-ruler-tick ${pos === activePosition ? 'active-tick' : ''}`}
            onClick={() => setActivePosition(pos)}
          >
            {pos === activePosition ? (
              <span className="tick-badge-red">{pos}</span>
            ) : (
              <span className="tick-label">{pos.toLocaleString()}</span>
            )}
            <div className="tick-mark" />
          </div>
        ))}
      </div>

      {/* Alignment Rows */}
      <div className="ag-alignment-grid" style={fullView ? { overflowX: 'auto' } : undefined}>
        {/* Row A */}
        <div className="ag-seq-row">
          <div className="seq-label ref-label">
            <span>GENE A</span>
            <span className="sub">(REFERENCE)</span>
          </div>
          <div className="seq-letters" style={fullView ? { flexWrap: 'wrap', gap: 2 } : undefined}>
            {seqAWindow.map((base, i) => {
              const realPos = startIdx + i + 1
              return (
                <span
                  key={i}
                  className={`base-token base-${base} ${realPos === activePosition ? 'pos-143' : ''}`}
                  onClick={() => setActivePosition(realPos)}
                  title={`Position ${realPos}`}
                >
                  {base}
                </span>
              )
            })}
          </div>
        </div>

        {/* Row B */}
        <div className="ag-seq-row">
          <div className="seq-label sample-label">
            <span>GENE B</span>
            <span className="sub">(SAMPLE)</span>
          </div>
          <div className="seq-letters" style={fullView ? { flexWrap: 'wrap', gap: 4 } : undefined}>
            {seqBWindow.map((base, i) => {
              const realPos = startIdx + i + 1
              const isDiff = diffPosSet.has(realPos)
              return (
                <span
                  key={i}
                  className={`base-token base-${base} ${isDiff ? 'mutation-sub' : ''} ${realPos === activePosition ? 'pos-143' : ''}`}
                  onClick={() => setActivePosition(realPos)}
                  title={`Position ${realPos}${isDiff ? ' — MUTATION' : ''}`}
                >
                  {base}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="ag-alignment-legend" style={{ marginTop: 8 }}>
        <div className="legend-group">
          <span className="legend-chip match"><span className="sq" /> Match</span>
          <span className="legend-chip sub"><span className="sq" /> Substitution</span>
          <span className="legend-chip ins"><span className="sq" /> Insertion</span>
          <span className="legend-chip del"><span className="sq" /> Deletion</span>
        </div>
        <div className="legend-bases">
          <span className="base-dot dot-a">● A</span>
          <span className="base-dot dot-t">● T</span>
          <span className="base-dot dot-g">● G</span>
          <span className="base-dot dot-c">● C</span>
        </div>
      </div>
    </>
  )
}

export default function SequenceAlignment() {
  const [modalOpen, setModalOpen] = useState(false)
  const { sequence, comparisonSequence, differences, alignment, loadTimeline, loadComparisonTimeline, method } = usePlayback()

  const handleSelectPreset = (p: DnaPreset) => {
    const refSeq = parseFasta(p.ref).sequence
    const sampleSeq = parseFasta(p.sample).sequence
    loadTimeline(refSeq, method)
    loadComparisonTimeline(sampleSeq)
    // Instantly start audio playback!
    setTimeout(() => {
      usePlayback.getState().play()
    }, 60)
  }

  return (
    <>
      <div className="ag-card ag-alignment-card">
        <div className="ag-card-header">
          <div className="ag-card-title">
            <span className="ag-badge badge-blue">3</span>
            <span>SEQUENCE ALIGNMENT</span>
          </div>
          {/* Expand button */}
          <button
            onClick={() => setModalOpen(true)}
            title="Open full sequence viewer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              color: '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '5px 11px',
              fontSize: '0.65rem',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.03em',
              boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            ⤢ EXPAND VIEW
          </button>
        </div>

        {/* ── Prominent Instant Play Acoustic Preset Bar ── */}
        <div style={{
          marginBottom: 14,
          padding: '10px 12px',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(2,132,199,0.04))',
          borderRadius: 12,
          border: '1.5px solid #bfdbfe',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span>🧬</span> GENOMIC VARIANT PRESETS (TAP TO SONIFY & ANALYZE)
            </span>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#2563eb' }}>
              ⚡ Instant Sonification
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, WebkitOverflowScrolling: 'touch' }}>
            {ACOUSTIC_DNA_PRESETS.map((p) => {
              const pRefSeq = parseFasta(p.ref).sequence
              const isActive = sequence === pRefSeq
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  title={`${p.name} — ${p.gene} | ${p.locus}`}
                  style={{
                    flexShrink: 0,
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: isActive ? '1.5px solid #2563eb' : '1.5px solid #cbd5e1',
                    background: isActive ? 'linear-gradient(135deg, #2563eb, #0284c7)' : '#ffffff',
                    color: isActive ? '#ffffff' : '#0f172a',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    boxShadow: isActive ? '0 3px 10px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                  <span style={{ opacity: isActive ? 0.95 : 0.75, fontSize: '0.58rem', fontWeight: 700 }}>
                    ({p.locus})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <AlignmentContent fullView={false} />
      </div>

      {/* ── FULL SEQUENCE MODAL ─────────────────────────── */}
      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            animation: 'fadeInModal 0.18s ease',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              boxShadow: '0 32px 80px rgba(0,0,0,0.18)',
              width: '90vw',
              maxWidth: 1100,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.7rem', fontWeight: 900,
                }}>3</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#0f172a' }}>FULL SEQUENCE ALIGNMENT</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                    {sequence.length} bp reference · {comparisonSequence.length} bp sample · {differences.length} variant(s) · identity {alignment ? (alignment.identity * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer',
                  fontSize: '1rem', color: '#64748b', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body — scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
              <AlignmentContent fullView={true} />
            </div>

            {/* Modal Footer */}
            <div style={{
              borderTop: '1px solid #e2e8f0', padding: '10px 22px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0, background: '#fafafa',
            }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                Click any base to jump the playhead to that position
              </span>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: '#f1f5f9', border: '1px solid #e2e8f0',
                  borderRadius: 8, padding: '6px 16px',
                  fontSize: '0.7rem', fontWeight: 700,
                  color: '#475569', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
