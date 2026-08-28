import { usePlayback } from '../state/usePlayback'
import type { WorkflowStep } from '../types'

/**
 * Deterministic workflow steps — no LLM, no network.
 * Steps are generated from the actual system events (API call → timeline load → playback).
 */
function getWorkflowSteps(): WorkflowStep[] {
  const { timeline, loading, isPlaying, error, currentTime } = usePlayback.getState()
  const hasTimeline = !!timeline
  const hasEvents = timeline && timeline.events.length > 0

  return [
    {
      id: 'validate',
      label: 'Sequence validation',
      status: hasTimeline || loading ? 'done' : error ? 'error' : 'pending',
    },
    {
      id: 'sonify',
      label: 'Sonification engine',
      status: hasTimeline ? 'done' : loading ? 'active' : 'pending',
      duration: hasTimeline ? timeline!.events.length : undefined,
      detail: hasTimeline ? `${timeline!.events.length} events generated` : undefined,
    },
    {
      id: 'load',
      label: 'Timeline loaded',
      status: hasTimeline ? 'done' : 'pending',
    },
    {
      id: 'play',
      label: 'Audio playback',
      status: isPlaying ? 'active' : hasTimeline ? 'done' : 'pending',
      detail: isPlaying ? `${currentTime.toFixed(1)}s` : hasTimeline ? 'Ready' : undefined,
    },
  ]
}

export default function WorkflowPanel() {
  // Subscribe to relevant state to re-render
  const timeline = usePlayback((s) => s.timeline)
  const loading = usePlayback((s) => s.loading)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const error = usePlayback((s) => s.error)
  const currentTime = usePlayback((s) => s.currentTime)

  const steps = getWorkflowSteps()

  const doneCount = steps.filter(s => s.status === 'done').length

  return (
    <div className="card workflow-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h2>System Workflow</h2>
        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {doneCount}/{steps.length}
        </span>
      </div>
      <div className="workflow-steps">
        {steps.map((step, i) => (
          <div key={step.id} className={`workflow-step ${step.status}`}>
            <span className="icon">
              {step.status === 'done' ? '✓' : step.status === 'active' ? '...' : (i + 1)}
            </span>
            <span>{step.label}</span>
            {step.detail && (
              <span className="duration">{step.detail}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
