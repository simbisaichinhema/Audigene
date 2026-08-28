import { useRef, useEffect, useMemo } from 'react'
import { usePlayback } from '../state/usePlayback'

const CHUNK = 60 // bases per line

export default function SequenceViewer() {
  const timeline = usePlayback((s) => s.timeline)
  const currentTime = usePlayback((s) => s.currentTime)
  const activeEventId = usePlayback((s) => s.activeEventId)
  const containerRef = useRef<HTMLDivElement>(null)

  // Find which position is active based on event
  const activePosition = useMemo(() => {
    if (!timeline || !activeEventId) return -1
    const ev = timeline.events.find((e) => e.event_id === activeEventId)
    return ev ? ev.position : -1
  }, [timeline, activeEventId])

  // Auto-scroll to keep active base visible
  useEffect(() => {
    if (activePosition < 0 || !containerRef.current) return
    const lineIdx = Math.floor(activePosition / CHUNK)
    const el = containerRef.current.querySelector(`[data-line="${lineIdx}"]`)
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activePosition])

  if (!timeline) return null

  // Use the original sequence from the timeline; reconstruct from events if empty
  // The timeline stores sequence_length, but the actual bases come from the original input.
  // We'll extract unique positions from events to reconstruct a reasonable display.
  const seqLen = timeline.sequence_length

  // Build lines — if we have the original sequence, use it; otherwise show positions
  const seq = (usePlayback.getState().sequence || '').replace(/[\s\n]/g, '')

  // Base class lookup
  const baseClass = (b: string) => {
    if ('ACGT'.includes(b)) return `base-${b}`
    return ''
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h2>Sequence</h2>
        <span className="tag tag-ref" style={{ fontSize: '0.7rem' }}>
          {timeline.method.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="sequence-display" ref={containerRef}>
        {seqLen > 0 && seq.length > 0 ? (
          Array.from({ length: Math.ceil(seq.length / CHUNK) }, (_, lineIdx) => {
            const start = lineIdx * CHUNK
            const lineBases = seq.slice(start, start + CHUNK)
            return (
              <div key={lineIdx} data-line={lineIdx} style={{ display: 'flex', gap: 0 }}>
                <span style={{
                  width: '3.5em',
                  flexShrink: 0,
                  color: 'var(--text-muted)',
                  fontSize: '0.7rem',
                  userSelect: 'none',
                  textAlign: 'right',
                  paddingRight: '0.75em',
                }}>
                  {(start + 1).toString()}
                </span>
                {lineBases.split('').map((base, i) => {
                  const pos = start + i
                  const isActive = pos === activePosition
                  return (
                    <span
                      key={pos}
                      className={`base ${baseClass(base)} ${isActive ? 'base-active' : ''}`}
                      title={`Position ${pos + 1}: ${base}`}
                    >
                      {base}
                    </span>
                  )
                })}
              </div>
            )
          })
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: 'var(--space-md)' }}>
            No sequence loaded
          </div>
        )}
      </div>
    </div>
  )
}
