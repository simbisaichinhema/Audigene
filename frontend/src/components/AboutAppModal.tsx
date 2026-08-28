interface Props {
  open: boolean
  onClose: () => void
}

export default function AboutAppModal({ open, onClose }: Props) {
  if (!open) return null

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(12px, env(safe-area-inset-top, 12px)) 12px max(12px, env(safe-area-inset-bottom, 12px))',
        animation: 'aboutModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        boxShadow: '0 30px 90px rgba(0,0,0,0.22)',
        width: '94vw',
        maxWidth: 680,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          color: '#ffffff',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            }}>🧬</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>
                ABOUT AUDIGENE
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                Genomic Sonification & Agentic Bioinformatics Platform
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.12)', border: 'none',
              borderRadius: 8, width: 34, height: 34, cursor: 'pointer',
              fontSize: '1rem', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Event Celebration Badge */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #e0f2fe)',
            border: '1.5px solid #bfdbfe',
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <span style={{ fontSize: '1.8rem' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#1e3a8a', letterSpacing: '0.02em' }}>
                CREATED FOR AGENTIC DAY CELEBRATION
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 600, marginTop: 2 }}>
                Demonstrating AI-agentic genomic sonification & real-time bioinformatics analysis.
              </div>
            </div>
          </div>

          {/* Credits Section */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 14,
            padding: '18px 20px',
          }}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 900, color: '#2563eb',
              letterSpacing: '0.06em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>🏛️</span> VIGNAN UNIVERSITY — DEPARTMENT OF BIOINFORMATICS
            </div>

            <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#0f172a', marginBottom: 12 }}>
              Project Creators & Research Team
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <div style={{
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>🧬</div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Simbisai Chinhema</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>Dept. of Bioinformatics</div>
              </div>

              <div style={{
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>🔬</div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Craig M Mariwa</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>Dept. of Bioinformatics</div>
              </div>

              <div style={{
                background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
              }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>💻</div>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#0f172a' }}>Mellisa M Mpofu</div>
                <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>Dept. of Bioinformatics</div>
              </div>
            </div>
          </div>

          {/* Scientific Methodology */}
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a', marginBottom: 6 }}>
              📖 Scientific Methodology & Sonification Standard
            </div>
            <div style={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.6 }}>
              AudiGene is an academic-grade bioinformatics web platform designed for visual, acoustic (sonification), and AI-agentic analysis of DNA sequences and genomic variants. Based on peer-reviewed pitch mapping methodologies (<strong>Temple 2017</strong>), AudiGene transforms nucleotide sequences into harmonic audio contours and real-time interactive frequency graphs:
            </div>
            <ul style={{ fontSize: '0.72rem', color: '#334155', lineHeight: 1.6, paddingLeft: 20, marginTop: 8 }}>
              <li><strong>Adenine (A)</strong>: 262.0 Hz (Middle C / C4)</li>
              <li><strong>Cytosine (C)</strong>: 330.0 Hz (E4)</li>
              <li><strong>Guanine (G)</strong>: 392.0 Hz (G4)</li>
              <li><strong>Thymine (T)</strong>: 523.0 Hz (C5)</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0', padding: '14px 24px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8fafc', flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            Vignan University · Department of Bioinformatics © 2026
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #0284c7)',
              color: '#fff', border: 'none', borderRadius: 9,
              padding: '8px 20px', fontSize: '0.75rem',
              fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(37,99,235,0.3)',
            }}
          >
            ✓ CLOSE
          </button>
        </div>
      </div>

      <style>{`
        @keyframes aboutModalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
