import { usePlayback } from '../state/usePlayback'
import type { ComparisonMode } from '../state/usePlayback'

const MODES: { key: ComparisonMode; label: string; desc: string; color: string }[] = [
  { key: 'gene_a', label: 'Gene A', desc: 'Reference sequence', color: 'var(--primary)' },
  { key: 'gene_b', label: 'Gene B', desc: 'Sample sequence', color: 'var(--cyan)' },
  { key: 'differences', label: 'Differences', desc: 'Divergent positions only', color: 'var(--magenta)' },
  { key: 'combined', label: 'Combined', desc: 'Both sequences layered', color: 'var(--violet)' },
]

export default function ComparisonControls() {
  const timeline = usePlayback((s) => s.timeline)
  const comparisonTimeline = usePlayback((s) => s.comparisonTimeline)
  const comparisonMode = usePlayback((s) => s.comparisonMode)
  const setComparisonMode = usePlayback((s) => s.setComparisonMode)

  if (!timeline) return null

  return (
    <div className="comparison-controls">
      <span className="comparison-label">Audio Source</span>
      <div className="comparison-buttons">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`comparison-btn ${comparisonMode === m.key ? 'active' : ''}`}
            style={{ '--mode-color': m.color } as React.CSSProperties}
            onClick={() => setComparisonMode(m.key)}
            title={m.desc}
            disabled={m.key === 'gene_b' && !comparisonTimeline}
          >
            <span className="mode-dot" style={{ background: m.color }} />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}
