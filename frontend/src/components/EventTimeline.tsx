import { usePlayback } from '../state/usePlayback'

export default function EventTimeline() {
  const activePosition = usePlayback((s) => s.activePosition)
  const setActivePosition = usePlayback((s) => s.setActivePosition)

  const ticks = Array.from({ length: 120 }, (_, i) => {
    const pos = Math.floor((i / 120) * 1842)
    let type = 'normal'
    if (i === 10) type = 'sub' // pos ~143
    else if (i === 20 || i === 31 || i === 118) type = 'ins'
    else if (i === 45 || i === 60 || i === 80) type = 'del'
    else if (i === 105) type = 'codon'
    return { id: i, pos, type }
  })

  return (
    <div className="ag-card ag-event-timeline-card">
      <div className="ag-card-header">
        <div className="ag-card-title">
          <span className="ag-badge badge-blue">8</span>
          <span>EVENT TIMELINE</span>
        </div>
      </div>

      <div className="ag-event-barcode-track">
        {ticks.map((t) => {
          const isActive = Math.abs(t.pos - activePosition) < 15
          return (
            <div
              key={t.id}
              className={`barcode-tick tick-${t.type} ${isActive ? 'active-barcode' : ''}`}
              onClick={() => setActivePosition(t.pos)}
            />
          )
        })}
      </div>
    </div>
  )
}
