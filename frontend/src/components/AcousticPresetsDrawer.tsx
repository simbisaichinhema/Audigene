import { usePlayback } from '../state/usePlayback'
import { ACOUSTIC_DNA_PRESETS, DnaPreset, parseFasta } from '../bioinformatics/sequenceUtils'

interface Props {
  open: boolean
  onClose: () => void
}

export default function AcousticPresetsDrawer({ open, onClose }: Props) {
  const { sequence, loadTimeline, loadComparisonTimeline, method, play } = usePlayback()

  if (!open) return null

  const handleSelectPreset = (p: DnaPreset) => {
    const refSeq = parseFasta(p.ref).sequence
    const sampleSeq = parseFasta(p.sample).sequence
    loadTimeline(refSeq, method)
    loadComparisonTimeline(sampleSeq)
    onClose()
    setTimeout(() => {
      usePlayback.getState().play()
    }, 80)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'drawerFade 0.2s ease-out',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: 420,
        height: '100%',
        background: '#ffffff',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'drawerSlide 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🎵</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', letterSpacing: '0.02em' }}>
                ACOUSTIC DNA PRESETS
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                Select a bio-acoustic profile to load & play instantly
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              color: '#fff',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* List of Presets */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ACOUSTIC_DNA_PRESETS.map((p) => {
            const pRefSeq = parseFasta(p.ref).sequence
            const isActive = sequence === pRefSeq
            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #eff6ff, #e0f2fe)' : '#f8fafc',
                  border: isActive ? '2px solid #2563eb' : '1.5px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 14px rgba(37,99,235,0.15)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.2rem' }}>{p.icon}</span>
                    <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a' }}>{p.name}</span>
                  </div>
                  {isActive && (
                    <span style={{
                      background: '#2563eb', color: '#fff', fontSize: '0.58rem',
                      fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                    }}>
                      NOW ACTIVE
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284c7', marginBottom: 4 }}>
                  🔊 {p.acousticProfile}
                </div>

                <div style={{ fontSize: '0.68rem', color: '#475569', lineHeight: 1.4, marginBottom: 10 }}>
                  {p.description}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748b' }}>
                    Length: {pRefSeq.length} bp
                  </span>
                  <button
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #2563eb, #0284c7)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '6px 14px',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>▶</span> LOAD & PLAY INSTANTLY
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style>{`
        @keyframes drawerFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes drawerSlide {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
