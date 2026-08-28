import { usePlayback } from '../state/usePlayback'

export default function StatusPanel() {
  const timeline = usePlayback(s => s.timeline)
  const isPlaying = usePlayback(s => s.isPlaying)

  if (!timeline) return null

  return (
    <div className="card" style={{ marginTop: '1rem' }}>
      <h2>Analysis</h2>
      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace', lineHeight: 1.8 }}>
        <div>Method: <span style={{ color: 'var(--text)' }}>{timeline.method}</span></div>
        <div>Profile: <span style={{ color: 'var(--text)' }}>{timeline.profile}</span></div>
        <div>Sequence: <span style={{ color: 'var(--text)' }}>{timeline.sequence_length} bases</span></div>
        <div>Events: <span style={{ color: 'var(--text)' }}>{timeline.events.length}</span></div>
        <div>Duration: <span style={{ color: 'var(--text)' }}>{timeline.total_duration.toFixed(2)}s</span></div>
        <div>Status: <span style={{ color: isPlaying ? 'var(--success)' : 'var(--text)' }}>
          {isPlaying ? 'Playing' : 'Ready'}
        </span></div>
      </div>
    </div>
  )
}
