import { useMemo } from 'react'
import { usePlayback } from '../state/usePlayback'
import { METHOD_INFO } from '../types'

/**
 * Deterministic explanation — no LLM, no network.
 * Generates a human-readable explanation from the event's provenance fields.
 */
function explainEvent(
  event: { biological_value: string; event_type: string; frequency: number; pitch: string; paper_rule: string; implementation: string; implementation_source: string; position: number; simultaneous_pitches: { pitch: string; frequency: number }[] } | null,
  method: string,
): string {
  if (!event) return 'Play audio and select an event to see why it sounds the way it does.'

  const methodInfo = METHOD_INFO[method]
  const methodName = methodInfo?.label ?? method

  // Base explanation from the paper rule
  let explanation = event.paper_rule

  // Add implementation detail
  if (event.implementation !== event.paper_rule) {
    explanation += ` The system implements this as: ${event.implementation}.`
  }

  // Add frequency context
  if (event.frequency > 0) {
    explanation += ` The resulting frequency is ${Math.round(event.frequency)} Hz (${event.pitch}).`
  }

  // Chord explanation
  if (event.simultaneous_pitches.length > 0) {
    const pitches = event.simultaneous_pitches.map(p => `${p.pitch} (${Math.round(p.frequency)} Hz)`).join(', ')
    explanation += ` Multiple pitches are played simultaneously: ${pitches}.`
  }

  // Method context
  explanation += ` Using the ${methodName} method (${event.implementation_source}).`

  // Fidelity note
  if (event.implementation_source === 'AUDIGENE_INNOVATION' || event.implementation_source === 'AUDIGENE_INTERPRETATION') {
    explanation += ' Note: This particular mapping extends beyond the original paper.'
  }

  return explanation
}

export default function WhyPanel() {
  const selectedEvent = usePlayback((s) => s.selectedEvent)
  const activeEventId = usePlayback((s) => s.activeEventId)
  const timeline = usePlayback((s) => s.timeline)
  const method = usePlayback((s) => s.method)

  const event = useMemo(() => {
    if (selectedEvent) return selectedEvent
    if (timeline && activeEventId) return timeline.events.find(e => e.event_id === activeEventId) ?? null
    return null
  }, [selectedEvent, activeEventId, timeline])

  const explanation = useMemo(() => explainEvent(event, method), [event, method])

  return (
    <div className="why-panel">
      <h3>Why did I hear that?</h3>
      <p>{explanation}</p>
    </div>
  )
}
