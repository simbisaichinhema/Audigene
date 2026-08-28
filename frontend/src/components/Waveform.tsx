import { useRef, useEffect, useCallback } from 'react'
import { engine } from '../state/usePlayback'
import { usePlayback } from '../state/usePlayback'

export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const isPlaying = usePlayback((s) => s.isPlaying)
  const currentTime = usePlayback((s) => s.currentTime)
  const duration = usePlayback((s) => s.timeline?.total_duration || 1)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const midY = H / 2

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, W, H)

    // Center line
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(W, midY)
    ctx.stroke()
    ctx.setLineDash([])

    const waveData = engine.getWaveformData()

    if (waveData && waveData.length > 0) {
      // Filled waveform with gradient
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(37, 99, 235, 0.8)')
      grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.8)')
      grad.addColorStop(1, 'rgba(219, 39, 119, 0.8)')

      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()
      const sliceW = W / waveData.length
      for (let i = 0; i < waveData.length; i++) {
        const v = (waveData[i] - 128) / 128.0
        const y = midY + v * (midY - 6)
        if (i === 0) ctx.moveTo(0, y)
        else ctx.lineTo(i * sliceW, y)
      }
      ctx.stroke()

      // Filled area below
      const fillGrad = ctx.createLinearGradient(0, midY - 30, 0, midY + 30)
      fillGrad.addColorStop(0, 'rgba(99, 102, 241, 0.12)')
      fillGrad.addColorStop(1, 'rgba(219, 39, 119, 0.04)')
      ctx.fillStyle = fillGrad
      ctx.beginPath()
      ctx.moveTo(0, midY)
      for (let i = 0; i < waveData.length; i++) {
        const v = (waveData[i] - 128) / 128.0
        const y = midY + v * (midY - 6)
        ctx.lineTo(i * sliceW, y)
      }
      ctx.lineTo(W, midY)
      ctx.closePath()
      ctx.fill()
    } else {
      // Idle static waveform
      const grad = ctx.createLinearGradient(0, 0, W, 0)
      grad.addColorStop(0, 'rgba(37, 99, 235, 0.35)')
      grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.35)')
      grad.addColorStop(1, 'rgba(219, 39, 119, 0.35)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 1.8
      ctx.beginPath()
      for (let x = 0; x < W; x++) {
        const y = midY + Math.sin(x * 0.05) * 18 * Math.sin((x / W) * Math.PI)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    // Playhead
    const playheadX = (currentTime / duration) * W
    if (playheadX > 0) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.moveTo(playheadX, 0)
      ctx.lineTo(playheadX, H)
      ctx.stroke()
      ctx.setLineDash([])
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [currentTime, duration])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth || 500
      canvas.height = 100
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(draw)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, draw])

  return (
    <div className="ag-waveform-container">
      <div className="ag-waveform-body">
        <div className="wf-y-axis">
          <span>+1</span>
          <span>0</span>
          <span>-1</span>
        </div>
        <div className="wf-canvas-wrapper">
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>
      <div className="wf-x-axis">
        <span>0:00</span>
        <span>0:05</span>
        <span>0:10</span>
        <span>0:15</span>
        <span>{Math.floor(duration / 60)}:{String(Math.round(duration % 60)).padStart(2, '0')}</span>
      </div>
    </div>
  )
}
