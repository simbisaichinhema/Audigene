import { usePlayback } from '../state/usePlayback'
import { NUCLEOTIDE_MAP } from '../bioinformatics/sequenceUtils'

export default function BottomStatusBar() {
  const { currentTime, activePosition, isPlaying, sequence, comparisonSequence, comparisonMode, differences } = usePlayback()

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = (seconds % 60).toFixed(2)
    return `${m}:${s.padStart(5, '0')}`
  }

  const seqLen = sequence.length || 1
  const refBase = sequence[activePosition - 1] || 'A'
  const sampleBase = comparisonSequence[activePosition - 1] || refBase

  const diff = differences.find((d) => d.position === activePosition)
  const eventDesc = diff ? `${diff.type.toUpperCase()} (${refBase} → ${sampleBase})` : `Match (${refBase})`

  const mapInfo = NUCLEOTIDE_MAP[sampleBase] || { pitch: 'C4', freq: 262.0 }

  return (
    <div className="ag-bottom-status-bar">
      <div className="status-col">
        <span className="col-label">PLAYBACK POSITION</span>
        <span className="col-val">{formatTime(currentTime)}</span>
      </div>

      <div className="status-col">
        <span className="col-label">SEQUENCE POSITION</span>
        <span className="col-val">{activePosition} / {seqLen.toLocaleString()} bp</span>
      </div>

      <div className="status-col">
        <span className="col-label">CURRENT EVENT</span>
        <span className="col-val">{eventDesc}</span>
      </div>

      <div className="status-col">
        <span className="col-label">FREQUENCY</span>
        <span className="col-val">{mapInfo.freq} Hz ({mapInfo.pitch})</span>
      </div>

      <div className="status-col">
        <span className="col-label">ACTIVE LAYER</span>
        <span className="col-val">{comparisonMode.toUpperCase()}</span>
      </div>

      {/* Audio Status */}
      <div className="status-col status-audio">
        <div className="mini-wave-anim">
          <span className="bar b1" />
          <span className="bar b2" />
          <span className="bar b3" />
          <span className="bar b4" />
        </div>
        <div className="col-label">AUDIO STATUS</div>
        <div className="audio-state-pill">
          <span className={`dot ${isPlaying ? 'playing' : ''}`}>●</span>
          <span>{isPlaying ? 'Playing' : 'Paused'}</span>
        </div>
      </div>
    </div>
  )
}
