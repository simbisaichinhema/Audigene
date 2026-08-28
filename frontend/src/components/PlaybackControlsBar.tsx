import { usePlayback } from '../state/usePlayback'

export default function PlaybackControlsBar() {
  const isPlaying = usePlayback((s) => s.isPlaying)
  const play = usePlayback((s) => s.play)
  const pause = usePlayback((s) => s.pause)
  const seek = usePlayback((s) => s.seek)
  const currentTime = usePlayback((s) => s.currentTime)
  const comparisonMode = usePlayback((s) => s.comparisonMode)
  const setComparisonMode = usePlayback((s) => s.setComparisonMode)
  const playbackSpeed = usePlayback((s) => s.playbackSpeed)
  const setPlaybackSpeed = usePlayback((s) => s.setPlaybackSpeed)
  const volume = usePlayback((s) => s.volume)
  const setVolume = usePlayback((s) => s.setVolume)

  const totalDuration = usePlayback((s) => s.timeline?.total_duration ?? 0)

  const handleRewind10 = () => seek(Math.max(0, currentTime - 10))
  const handleForward10 = () => seek(Math.min(totalDuration, currentTime + 10))

  return (
    <div className="ag-card ag-playback-controls-bar">
      {/* COMPARISON MODE */}
      <div className="ag-mode-section">
        <span className="mode-label">COMPARISON MODE</span>
        <div className="mode-buttons">
          <button
            className={`mode-btn mode-gene-a ${comparisonMode === 'gene_a' ? 'active' : ''}`}
            onClick={() => setComparisonMode('gene_a')}
          >
            GENE A
          </button>
          <button
            className={`mode-btn mode-gene-b ${comparisonMode === 'gene_b' ? 'active' : ''}`}
            onClick={() => setComparisonMode('gene_b')}
          >
            GENE B
          </button>
          <button
            className={`mode-btn mode-diff ${comparisonMode === 'differences' ? 'active' : ''}`}
            onClick={() => setComparisonMode('differences')}
          >
            DIFFERENCES
          </button>
          <button
            className={`mode-btn mode-combined ${comparisonMode === 'combined' ? 'active' : ''}`}
            onClick={() => setComparisonMode('combined')}
          >
            COMBINED
          </button>
        </div>
      </div>

      {/* CENTER TRANSPORT CONTROLS */}
      <div className="ag-transport-center">
        <button className="ctrl-btn-sub" onClick={() => seek(0)} title="Skip to Start">
          |◄
        </button>
        <button className="ctrl-btn-sub" onClick={handleRewind10} title="Rewind 10s">
          <span className="icon">⟲</span>
          <span className="val">10</span>
        </button>

        {/* Large Red Play/Pause Button */}
        <button
          className={`big-red-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={isPlaying ? pause : play}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <button className="ctrl-btn-sub" onClick={handleForward10} title="Forward 10s">
          <span className="val">10</span>
          <span className="icon">⟳</span>
        </button>
        <button className="ctrl-btn-sub" onClick={() => seek(totalDuration)} title="Skip to End">
          ►|
        </button>
      </div>

      {/* RIGHT: SPEED & VOLUME */}
      <div className="ag-controls-right">
        {/* Playback Speed */}
        <div className="speed-group">
          <span className="group-label">PLAYBACK SPEED</span>
          <div className="speed-chips">
            {[0.5, 1, 1.5, 2].map((spd) => (
              <button
                key={spd}
                className={`speed-chip ${playbackSpeed === spd ? 'active' : ''}`}
                onClick={() => setPlaybackSpeed(spd)}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume */}
        <div className="volume-group">
          <span className="group-label">VOLUME</span>
          <div className="volume-slider-row">
            <span className="vol-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
            <span className="vol-pct">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
