import { useMemo, useState, useRef, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'

const NUCLEOTIDE_COLORS: Record<string, string> = {
  A: '#047857',   // Emerald
  T: '#b45309',   // Amber
  G: '#1d4ed8',   // Blue
  C: '#7e22ce',   // Purple
}

export default function FrequencyGraph() {
  const activePosition = usePlayback((s) => s.activePosition)
  const setActivePosition = usePlayback((s) => s.setActivePosition)
  const timeline = usePlayback((s) => s.timeline)
  const currentTime = usePlayback((s) => s.currentTime)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const seek = usePlayback((s) => s.seek)

  const plotContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; pos: number; base: string; freq: number } | null>(null)

  const { points, svgPath, areaPath, totalDuration, W, PADDING } = useMemo(() => {
    if (!timeline || timeline.events.length === 0) {
      return { points: [], svgPath: '', areaPath: '', totalDuration: 1, W: 1000, PADDING: { left: 24, right: 24, top: 16, bottom: 16 } }
    }

    const eventsCount = timeline.events.length
    // Allocate at least 22px per point so frequency curves are never squashed on mobile screens
    const calculatedW = Math.max(1000, eventsCount * 22)
    const H = 170
    const pad = { left: 24, right: 24, top: 16, bottom: 16 }
    const plotW = calculatedW - pad.left - pad.right
    const plotH = H - pad.top - pad.bottom

    const freqs = timeline.events.map((e) => e.frequency)
    const minFreq = Math.min(...freqs)
    const maxFreq = Math.max(...freqs)
    const freqRange = maxFreq - minFreq || 1

    const dur = timeline.total_duration || 1

    const pts = timeline.events.map((ev) => {
      const x = pad.left + (ev.start_time / dur) * plotW
      const y = pad.top + plotH - ((ev.frequency - minFreq) / freqRange) * plotH
      return { x, y, freq: ev.frequency, pos: ev.position, base: ev.biological_value, startTime: ev.start_time }
    })

    let path = ''
    if (pts.length > 1) {
      path = `M ${pts[0].x},${pts[0].y}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1]
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]

        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = p1.y + (p2.y - p0.y) / 6
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = p2.y - (p3.y - p1.y) / 6

        path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
      }
    }

    const area = pts.length > 1
      ? `M ${pts[0].x},${H} L ${pts[0].x},${pts[0].y} ${path.replace('M ' + pts[0].x + ',' + pts[0].y, '')} L ${pts[pts.length - 1].x},${H} Z`
      : ''

    return { points: pts, svgPath: path, areaPath: area, totalDuration: dur, W: calculatedW, PADDING: pad }
  }, [timeline])

  const plotW = W - PADDING.left - PADDING.right
  const playheadX = totalDuration > 0 ? PADDING.left + (currentTime / totalDuration) * plotW : null
  const yTicks = ['1046 Hz', '784 Hz', '523 Hz', '392 Hz', '262 Hz']

  // Auto-scroll graph viewport to follow playhead on mobile
  useEffect(() => {
    if (isPlaying && plotContainerRef.current && playheadX !== null) {
      const container = plotContainerRef.current
      const containerWidth = container.clientWidth
      const targetScroll = (playheadX / W) * container.scrollWidth - containerWidth / 2
      container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' })
    }
  }, [isPlaying, playheadX, W])

  const handleGraphClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, (clickX - PADDING.left) / (rect.width - PADDING.left - PADDING.right)))
    const targetTime = pct * totalDuration
    seek(targetTime)
  }

  return (
    <div className="ag-card ag-freq-graph-card" style={{ padding: '16px', background: '#ffffff', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      {/* Header */}
      <div className="ag-card-header" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="ag-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ag-badge badge-blue">4</span>
            <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.88rem' }}>SONIFICATION FREQUENCY GRAPH</span>
          </div>
          <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 600 }}>
            (Tap graph to seek)
          </span>
        </div>

        {/* Nucleotide Color Legend Chips */}
        <div className="ag-freq-legend-top" style={{ display: 'flex', gap: 8, fontSize: '0.68rem', fontWeight: 800, flexWrap: 'wrap' }}>
          <span style={{ color: '#047857', background: 'rgba(4,120,87,0.08)', padding: '3px 8px', borderRadius: 6 }}>● A (262 Hz)</span>
          <span style={{ color: '#b45309', background: 'rgba(180,83,9,0.08)', padding: '3px 8px', borderRadius: 6 }}>● T (523 Hz)</span>
          <span style={{ color: '#1d4ed8', background: 'rgba(29,78,216,0.08)', padding: '3px 8px', borderRadius: 6 }}>● G (392 Hz)</span>
          <span style={{ color: '#7e22ce', background: 'rgba(126,34,206,0.08)', padding: '3px 8px', borderRadius: 6 }}>● C (330 Hz)</span>
        </div>
      </div>

      <div className="ag-freq-chart-container" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Pinned Y Axis Labels */}
        <div className="ag-y-axis" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 170, fontSize: '0.62rem', fontWeight: 800, color: '#64748b', minWidth: 44, flexShrink: 0 }}>
          {yTicks.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* Scrollable SVG Plot Pane — guarantees 22px per point so graph never squashes */}
        <div
          ref={plotContainerRef}
          className="ag-chart-plot"
          style={{
            flex: 1,
            position: 'relative',
            borderRadius: 12,
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <svg
            width={W}
            height="170"
            viewBox={`0 0 ${W} 170`}
            onClick={handleGraphClick}
            style={{ cursor: 'crosshair', display: 'block', minWidth: '100%' }}
          >
            <defs>
              <linearGradient id="freq-interactive-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="freq-interactive-line" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {[35, 70, 105, 140].map((y) => (
              <line key={y} x1={PADDING.left} y1={y} x2={W - PADDING.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5 5" />
            ))}

            {/* Fill Area */}
            {areaPath && <path d={areaPath} fill="url(#freq-interactive-area)" />}

            {/* Glowing Line */}
            {svgPath && (
              <path
                d={svgPath}
                fill="none"
                stroke="url(#freq-interactive-line)"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Dots */}
            {points.map((pt, i) => {
              const isActive = pt.pos === activePosition
              const color = NUCLEOTIDE_COLORS[pt.base] || '#2563eb'
              return (
                <g key={i}>
                  <circle
                    cx={pt.x} cy={pt.y}
                    r={isActive ? 8 : 4.5}
                    fill={isActive ? '#ef4444' : color}
                    stroke="#ffffff"
                    strokeWidth={isActive ? 2.5 : 1.5}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActivePosition(pt.pos)
                      seek(pt.startTime)
                    }}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              )
            })}

            {/* Playhead scrub line */}
            {playheadX !== null && (
              <g>
                <line x1={playheadX} y1="0" x2={playheadX} y2="170" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4 3" />
                <circle cx={playheadX} cy={12} r="5" fill="#ef4444" />
              </g>
            )}
          </svg>

          {/* Interactive Tooltip Card on Hover */}
          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              top: hoveredPoint.y - 45,
              left: Math.min(W - 120, Math.max(20, hoveredPoint.x)),
              background: '#0f172a',
              color: '#ffffff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.7rem',
              fontWeight: 800,
              pointerEvents: 'none',
              zIndex: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              display: 'flex', gap: 6, alignItems: 'center'
            }}>
              <span style={{ color: NUCLEOTIDE_COLORS[hoveredPoint.base] || '#38bdf8' }}>
                Base {hoveredPoint.base}
              </span>
              <span>• Pos #{hoveredPoint.pos}</span>
              <span>• {hoveredPoint.freq} Hz</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
