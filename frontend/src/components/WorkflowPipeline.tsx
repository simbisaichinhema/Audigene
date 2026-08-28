import { useState, useRef, useEffect } from 'react'
import { usePlayback } from '../state/usePlayback'

interface NodeState {
  id: string
  title: string
  subtitle: string
  type: 'trigger' | 'agent' | 'action'
  color: string
  x: number
  y: number
  w: number
  h: number
  iconType: 'trigger' | 'store' | 'ai' | 'api' | 'bio' | 'timer' | 'audio' | 'dsp' | 'canvas' | 'svg'
}

export default function WorkflowPipeline() {
  const sequence = usePlayback((s) => s.sequence)
  const timeline = usePlayback((s) => s.timeline)
  const alignment = usePlayback((s) => s.alignment)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const activePosition = usePlayback((s) => s.activePosition)

  // Orchestrated Agentic AI Pipeline — Brightened theme & clear Agentic flow
  const [nodesState, setNodesState] = useState<NodeState[]>([
    { id: 'ui-actions', title: 'User Input Agent', subtitle: 'ingest: fasta', type: 'trigger', color: '#2563eb', iconType: 'trigger', x: 30, y: 40, w: 190, h: 85 },
    { id: 'api-gateway', title: 'Security Agent', subtitle: 'auth: bearer key', type: 'trigger', color: '#0284c7', iconType: 'api', x: 30, y: 160, w: 190, h: 85 },
    { id: 'ai-chat', title: 'LLM Reasoning Agent', subtitle: 'gemini / claude', type: 'agent', color: '#8b5cf6', iconType: 'ai', x: 30, y: 275, w: 190, h: 85 },
    
    { id: 'state-store', title: 'Orchestrator Core', subtitle: 'state: zustand', type: 'action', color: '#6366f1', iconType: 'store', x: 275, y: 90, w: 190, h: 85 },
    { id: 'bio-processor', title: 'Genomic Bio Agent', subtitle: 'needleman-wunsch', type: 'action', color: '#10b981', iconType: 'bio', x: 275, y: 220, w: 190, h: 85 },
    
    { id: 'audio-scheduler', title: 'DSP Clock Agent', subtitle: 'loop: raf pulse', type: 'action', color: '#ec4899', iconType: 'timer', x: 520, y: 90, w: 190, h: 85 },
    { id: 'oscillators', title: 'Audio Synth Agent', subtitle: 'chroma sonification', type: 'action', color: '#06b6d4', iconType: 'audio', x: 520, y: 220, w: 190, h: 85 },
    
    { id: 'audio-analyser', title: 'Web Audio Analyser', subtitle: 'fft: 2048 bins', type: 'action', color: '#f59e0b', iconType: 'dsp', x: 760, y: 40, w: 190, h: 85 },
    { id: 'visualizers', title: 'Canvas Render Agent', subtitle: 'waveform 60fps', type: 'action', color: '#3b82f6', iconType: 'canvas', x: 760, y: 160, w: 190, h: 85 },
    { id: 'svg-timeline', title: 'Playhead Agent', subtitle: 'bezier timeline', type: 'action', color: '#d946ef', iconType: 'svg', x: 760, y: 275, w: 190, h: 85 }
  ])

  // Drag State Management
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return
    const node = nodesState.find(n => n.id === nodeId)
    if (!node || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = 980 / rect.width
    const scaleY = 390 / rect.height
    const mouseX = (e.clientX - rect.left) * scaleX
    const mouseY = (e.clientY - rect.top) * scaleY

    setDraggedNodeId(nodeId)
    setDragOffset({ x: mouseX - node.x, y: mouseY - node.y })
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNodeId || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = 980 / rect.width
    const scaleY = 390 / rect.height
    const mouseX = (e.clientX - rect.left) * scaleX
    const mouseY = (e.clientY - rect.top) * scaleY

    const node = nodesState.find(n => n.id === draggedNodeId)
    if (!node) return

    const newX = Math.max(10, Math.min(980 - node.w - 10, mouseX - dragOffset.x))
    const newY = Math.max(10, Math.min(390 - node.h - 10, mouseY - dragOffset.y))

    setNodesState(prev =>
      prev.map(n => (n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n))
    )
  }

  const handleMouseUp = () => {
    setDraggedNodeId(null)
  }

  useEffect(() => {
    if (draggedNodeId) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    } else {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedNodeId, dragOffset])

  const getPort = (nodeId: string, portType: 'in' | 'out' | 'in-top' | 'in-bottom') => {
    const node = nodesState.find(n => n.id === nodeId)
    if (!node) return [0, 0]
    const { x, y, w, h } = node
    switch (portType) {
      case 'in':
        return [x, y + h / 2]
      case 'in-top':
        return [x, y + 25]
      case 'in-bottom':
        return [x, y + h - 25]
      case 'out':
        return [x + w, y + h / 2]
      default:
        return [0, 0]
    }
  }

  const connections = [
    { from: getPort('ui-actions', 'out'), to: getPort('state-store', 'in-top'), active: true },
    { from: getPort('api-gateway', 'out'), to: getPort('state-store', 'in-top'), active: true },
    { from: getPort('ai-chat', 'out'), to: getPort('state-store', 'in-bottom'), active: true },
    { from: getPort('state-store', 'out'), to: getPort('bio-processor', 'in-top'), active: true },
    { from: getPort('state-store', 'out'), to: getPort('audio-scheduler', 'in'), active: true },
    { from: getPort('bio-processor', 'out'), to: getPort('oscillators', 'in-bottom'), active: true },
    { from: getPort('audio-scheduler', 'out'), to: getPort('oscillators', 'in-top'), active: isPlaying },
    { from: getPort('oscillators', 'out'), to: getPort('audio-analyser', 'in'), active: isPlaying },
    { from: getPort('audio-analyser', 'out'), to: getPort('visualizers', 'in'), active: isPlaying },
    { from: getPort('state-store', 'out'), to: getPort('svg-timeline', 'in'), active: true }
  ]

  const renderIconSvg = (iconType: string, color: string) => {
    switch (iconType) {
      case 'trigger':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        )
      case 'ai':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )
      case 'api':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        )
      case 'store':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M21 19c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          </svg>
        )
      case 'bio':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 15c6.667-6 13.333 0 20-6"></path>
            <path d="M2 9c6.667 6 13.333 0 20 6"></path>
          </svg>
        )
      case 'timer':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        )
      case 'audio':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        )
      case 'dsp':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        )
      case 'canvas':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        )
      case 'svg':
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        )
    }
  }

  const getBezierPath = (p1: number[], p2: number[]) => {
    const dx = Math.abs(p2[0] - p1[0])
    const controlOffset = Math.min(100, dx * 0.5)
    return `M ${p1[0]} ${p1[1]} C ${p1[0] + controlOffset} ${p1[1]}, ${p2[0] - controlOffset} ${p2[1]}, ${p2[0]} ${p2[1]}`
  }

  return (
    <div className="ag-card ag-workflow-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="ag-card-header">
        <div className="ag-card-title">
          <span className="ag-badge badge-blue">⚙️</span>
          <span>AGENTIC AI SYSTEM PIPELINE</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6 }}>
            🖱️ CLICK & DRAG AGENTS
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isPlaying ? '#2563eb' : '#64748b' }}>
            ● {isPlaying ? 'ORCHESTRATION ACTIVE' : 'AGENTS STANDBY'}
          </span>
        </div>
      </div>
      <div className="ag-workflow-subtitle" style={{ marginBottom: 4 }}>INTERACTIVE AGENTIC WORKFLOW CANVAS</div>

      {/* Brightened n8n-style Node Map Canvas */}
      <div className="n8n-canvas-container" ref={canvasRef} style={{ position: 'relative' }}>
        <svg width="100%" height="390" viewBox="0 0 980 390" fill="none" className="n8n-svg-canvas">
          <defs>
            <pattern id="n8n-bright-grid" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#cbd5e1" />
            </pattern>
            <linearGradient id="active-wire-bright" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Bright Canvas Background */}
          <rect width="100%" height="100%" fill="#f8fafc" rx="10" />
          <rect width="100%" height="100%" fill="url(#n8n-bright-grid)" rx="10" />

          {/* Connection Cables */}
          {connections.map((c, i) => {
            const path = getBezierPath(c.from, c.to)
            const isActiveWire = c.active && isPlaying
            return (
              <g key={i}>
                <path
                  d={path}
                  stroke="#cbd5e1"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                {isActiveWire && (
                  <path
                    d={path}
                    stroke="url(#active-wire-bright)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="6 6"
                    className="n8n-flowing-cable"
                  />
                )}
                {isActiveWire && (
                  <circle r="4" fill="#2563eb" className="n8n-pulse-particle" style={{
                    offsetPath: `path('${path}')`,
                    animation: `moveParticle ${1.2 + i * 0.15}s linear infinite`
                  }} />
                )}
              </g>
            )
          })}

          {/* Ports Circles */}
          {connections.map((c, i) => (
            <g key={`ports-${i}`}>
              <circle cx={c.from[0]} cy={c.from[1]} r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
              <circle cx={c.to[0]} cy={c.to[1]} r="4.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
            </g>
          ))}

          {/* HTML foreignObject Nodes */}
          {nodesState.map((node) => {
            const isDragging = draggedNodeId === node.id

            return (
              <foreignObject
                key={node.id}
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                style={{ overflow: 'visible' }}
              >
                <div
                  className={`n8n-node-tile bright-tile ${node.type === 'trigger' ? 'is-trigger' : ''} ${isDragging ? 'dragging' : ''}`}
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <div className="n8n-node-icon-box" style={{ background: `${node.color}15`, border: `1px solid ${node.color}35` }}>
                    {renderIconSvg(node.iconType, node.color)}
                  </div>

                  <div className="n8n-node-info">
                    <div className="n8n-node-name">{node.title}</div>
                    <div className="n8n-node-sub">{node.subtitle}</div>
                  </div>
                </div>
              </foreignObject>
            )
          })}
        </svg>
      </div>

      <div className="ag-wf-footer" style={{ marginTop: 0 }}>
        <span>Agentic Orchestrator Engine: Synchronized</span>
        <span className="sep">·</span>
        <span>Low-latency Audio & LLM Agent Threads Active</span>
      </div>

      <style>{`
        .n8n-canvas-container {
          width: 100%;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.03);
          user-select: none;
        }
        .n8n-svg-canvas {
          display: block;
        }
        .n8n-node-tile.bright-tile {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .n8n-node-tile.bright-tile.is-trigger {
          border-top-left-radius: 24px;
          border-bottom-left-radius: 24px;
          padding-left: 8px;
        }
        .n8n-node-tile.bright-tile:hover {
          border-color: #cbd5e1;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.09);
        }
        .n8n-node-tile.bright-tile.dragging {
          transform: scale(1.03);
          box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
          border-color: #2563eb;
          z-index: 999;
        }
        .n8n-node-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .n8n-node-tile.is-trigger .n8n-node-icon-box {
          border-radius: 50%;
        }
        .n8n-node-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .n8n-node-name {
          font-size: 0.72rem;
          font-weight: 800;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .n8n-node-sub {
          font-size: 0.6rem;
          color: #64748b;
          font-family: 'JetBrains Mono', monospace;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .n8n-flowing-cable {
          animation: flowCables 0.8s linear infinite;
        }
        @keyframes flowCables {
          to { stroke-dashoffset: -12; }
        }
        @keyframes moveParticle {
          0% { offset-distance: 0%; }
          100% { offset-distance: 100%; }
        }
      `}</style>
    </div>
  )
}
