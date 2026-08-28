import { useMemo, useState } from 'react'
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
  const seek = usePlayback((s) => s.seek)

  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; pos: number; base: string; freq: number } | null>(null)

  const { points, svgPath, areaPath, totalDuration } = useMemo(() => {
    if (!timeline || timeline.events.length === 0) {
      return { points: [], svgPath: '', areaPath: '', totalDuration: 1 }
    }

    const W = 1000
    const H = 170
    const PADDING = { left: 16, right: 16, top: 16, bottom: 16 }
    const plotW = W - PADDING.left - PADDING.right
    const plotH = H - PADDING.top - PADDING.bottom

    const freqs = timeline.events.map((e) => e.frequency)
    const minFreq = Math.min(...freqs)
    const maxFreq = Math.max(...freqs)
    const freqRange = maxFreq - minFreq || 1

    const dur = timeline.total_duration || 1

    const pts = timeline.events.map((ev) => {
      const x = PADDING.left + (ev.start_time / dur) * plotW
      const y = PADDING.top + plotH - ((ev.frequency - minFreq) / freqRange) * plotH
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

    return { points: pts, svgPath: path, areaPath: area, totalDuration: dur }
  }, [timeline])

  const playheadX = totalDuration > 0 ? 16 + (currentTime / totalDuration) * 968 : null
  const yTicks = ['1046 Hz', '784 Hz', '523 Hz', '392 Hz', '262 Hz']

  const handleGraphClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, (clickX - 16) / (rect.width - 32)))
    const targetTime = pct * totalDuration
    seek(targetTime)
  }

  return (
    <div className="ag-card ag-freq-graph-card" style={{ padding: '18px 22px', background: '#ffffff', borderRadius: 16, border: '1px solid #cbd5e1', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
      <div className="ag-card-header" style={{ marginBottom: 12 }}>
        <div className="ag-card-title">
          <span className="ag-badge badge-blue">4</span>
          <span style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>SONIFICATION FREQUENCY GRAPH</span>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, marginLeft: 8 }}>
            (Click graph anywhere to jump playhead)
          </span>
        </div>
        <div className="ag-freq-legend-top" style={{ display: 'flex', gap: 14, fontSize: '0.72rem', fontWeight: 800 }}>
          <span style={{ color: '#047857' }}>● A (262 Hz)</span>
          <span style={{ color: '#b45309' }}>● T (523 Hz)</span>
          <span style={{ color: '#1d4ed8' }}>● G (392 Hz)</span>
          <span style={{ color: '#7e22ce' }}>● C (330 Hz)</span>
        </div>
      </div>

      <div className="ag-freq-chart-container" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {/* Y Axis Labels */}
        <div className="ag-y-axis" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 170, fontSize: '0.68rem', fontWeight: 800, color: '#64748b', minWidth: 50 }}>
          {yTicks.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>

        {/* SVG Plot Pane */}
        <div className="ag-chart-plot" style={{ flex: 1, position: 'relative', borderRadius: 12, background: '#f8fafc', border: '1.5px solid #e2e8f0', overflow: 'visible' }}>
          <svg
            width="100%"
            height="170"
            viewBox="0 0 1000 170"
            preserveAspectRatio="none"
            onClick={handleGraphClick}
            style={{ cursor: 'crosshair', display: 'block' }}
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
              <line key={y} x1="16" y1={y} x2="984" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5 5" />
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
              left: Math.min(850, Math.max(20, hoveredPoint.x)),
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
