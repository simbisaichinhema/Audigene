import { usePlayback } from '../state/usePlayback'
import { METHOD_INFO } from '../types'

export default function EventInspector() {
  const selectedEvent = usePlayback((s) => s.selectedEvent)
  const activeEventId = usePlayback((s) => s.activeEventId)
  const timeline = usePlayback((s) => s.timeline)

  // Fall back to the active event if nothing is explicitly selected
  const event = selectedEvent ?? (timeline?.events.find(e => e.event_id === activeEventId) ?? null)

  if (!event) {
    return (
      <div className="card">
        <h2>Event Inspector</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: 'var(--space-lg) 0' }}>
          Select an event from the timeline or click during playback.
        </div>
      </div>
    )
  }

  const method = timeline ? METHOD_INFO[timeline.method] : null

  return (
    <div className="card">
      <h2>Event Inspector</h2>
      <div className="inspector">
        <div className="inspector-field">
          <span className="label">Biological Value</span>
          <span className="value" style={{ fontSize: '1rem' }}>{event.biological_value}</span>
        </div>
        <div className="inspector-field">
          <span className="label">Position</span>
          <span className="value">{event.position + 1} / {timeline?.sequence_length ?? '?'}</span>
        </div>
        <div className="inspector-field">
          <span className="label">Event Type</span>
          <span className="value">{event.event_type}</span>
        </div>
        <div className="inspector-field">
          <span className="label">Frequency</span>
          <span className="value">{event.frequency.toFixed(1)} Hz ({event.pitch})</span>
        </div>
        <div className="inspector-field">
          <span className="label">Duration</span>
          <span className="value">{(event.duration * 1000).toFixed(0)} ms</span>
        </div>
        <div className="inspector-field">
          <span className="label">Amplitude</span>
          <span className="value">{(event.amplitude * 100).toFixed(0)}%</span>
        </div>
        {event.simultaneous_pitches.length > 0 && (
          <div className="inspector-field">
            <span className="label">Simultaneous Pitches</span>
            <span className="value">
              {event.simultaneous_pitches.map(sp => `${sp.pitch} (${Math.round(sp.frequency)} Hz)`).join(', ')}
            </span>
          </div>
        )}

        {/* Provenance */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 'var(--space-sm)' }}>
            Provenance
          </div>
          <div className="inspector-field">
            <span className="label">Paper Rule</span>
            <span className="value" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>{event.paper_rule}</span>
          </div>
          <div className="inspector-field">
            <span className="label">Implementation</span>
            <span className="value" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>{event.implementation}</span>
          </div>
          <div className="inspector-field">
            <span className="label">Fidelity</span>
            <span className={`provenance-badge provenance-${event.implementation_source}`}>
              {event.implementation_source}
            </span>
          </div>
          {method && (
            <div className="inspector-field">
              <span className="label">Method</span>
              <span className="value" style={{ fontFamily: 'var(--font-sans)', fontSize: '0.8rem' }}>{method.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
