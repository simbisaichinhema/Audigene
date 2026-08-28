import { usePlayback } from '../state/usePlayback'

export default function DifferenceMap() {
  const { sequence, differences, activePosition, setActivePosition } = usePlayback()

  const maxLen = sequence.length || 1

  return (
    <div className="ag-card ag-diff-map-card">
      <div className="ag-card-header">
        <div className="ag-card-title">
          <span className="ag-badge badge-blue">4</span>
          <span>DIFFERENCE MAP</span>
        </div>
      </div>

      {/* Map Track Area */}
      <div className="ag-diff-track-area">
        <div className="ag-diff-track-line" />
        <div className="ag-diff-axis-labels">
          <span className="min">1</span>
          <span className="max">{maxLen.toLocaleString()}</span>
        </div>

        {/* Dynamic Event Pins */}
        {differences.map((ev) => {
          const leftPct = (ev.position / maxLen) * 100
          const isActive = activePosition === ev.position
          const icon = ev.type === 'substitution' ? '●' : ev.type === 'insertion' ? '▲' : '▼'
          const color = ev.type === 'substitution' ? '#ec4899' : ev.type === 'insertion' ? '#f59e0b' : '#8b5cf6'

          return (
            <div
              key={ev.position}
              className={`ag-diff-pin pin-${ev.type} ${isActive ? 'active' : ''}`}
              style={{ left: `${leftPct}%` }}
              onClick={() => setActivePosition(ev.position)}
            >
              {isActive ? (
                <div className="pin-callout-red">{ev.position}</div>
              ) : (
                <div className="pin-icon" style={{ color }}>
                  {icon}
                </div>
              )}
              <div className="pin-pos-label">{ev.position}</div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="ag-diff-legend">
        <span className="item"><span className="dot dot-sub" /> Substitution</span>
        <span className="item"><span className="dot dot-ins" /> Insertion</span>
        <span className="item"><span className="dot dot-del" /> Deletion</span>
        <span className="item"><span className="dot dot-codon" /> Codon Event</span>
      </div>
    </div>
  )
}
