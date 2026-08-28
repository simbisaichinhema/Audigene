import { usePlayback } from '../state/usePlayback'
import type { AudioPreset } from '../types'

const PRESETS: { key: AudioPreset; label: string; desc: string }[] = [
  { key: 'pure', label: 'PURE', desc: 'Clean sine tones' },
  { key: 'glass', label: 'GLASS', desc: 'Harmonic overtone series' },
  { key: 'organic', label: 'ORGANIC', desc: 'Warm filtered waveform' },
  { key: 'pulse', label: 'PULSE', desc: 'Square wave rhythmic' },
]

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s % 1) * 10)
  return `${m}:${sec.toString().padStart(2, '0')}.${ms}`
}

export default function PlaybackControls() {
  const timeline = usePlayback((s) => s.timeline)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const currentTime = usePlayback((s) => s.currentTime)
  const audioPreset = usePlayback((s) => s.audioPreset)
  const play = usePlayback((s) => s.play)
  const pause = usePlayback((s) => s.pause)
  const stop = usePlayback((s) => s.stop)
  const restart = usePlayback((s) => s.restart)
  const seek = usePlayback((s) => s.seek)
  const setAudioPreset = usePlayback((s) => s.setAudioPreset)

  if (!timeline) return null

  const duration = timeline.total_duration
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = (parseFloat(e.target.value) / 100) * duration
    seek(time)
  }

  return (
    <div className="playback-section">
      <div className="card">
        {/* Transport + Seek */}
        <div className="controls-bar">
          <div className="transport-buttons">
            <button className="transport-btn" onClick={restart} title="Restart">
              &#x23EE;
            </button>
            <button
              className={`transport-btn ${isPlaying ? 'active' : ''}`}
              onClick={isPlaying ? pause : play}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? '&#x23F8;' : '&#x25B6;'}
            </button>
            <button className="transport-btn" onClick={stop} title="Stop">
              &#x23F9;
            </button>
          </div>

          <div className="seek-bar-container">
            <div className="seek-bar" style={{ position: 'relative' }}>
              <div className="seek-bar-fill" style={{ width: `${progress}%` }} />
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={handleSeek}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  opacity: 0, cursor: 'pointer',
                }}
              />
            </div>
            <div className="time-display">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Audio Presets */}
          <div className="preset-selector">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                className={`preset-chip ${audioPreset === p.key ? 'active' : ''}`}
                onClick={() => setAudioPreset(p.key)}
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
