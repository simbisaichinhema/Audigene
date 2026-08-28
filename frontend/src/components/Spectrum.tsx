import { useRef, useEffect, useCallback } from 'react'
import { engine } from '../state/usePlayback'
import { usePlayback } from '../state/usePlayback'

export default function Spectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const isPlaying = usePlayback((s) => s.isPlaying)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const centerY = H / 2

    // Dark high-contrast background box for vibrant rainbow neon glow
    ctx.fillStyle = '#0a0d14'
    ctx.fillRect(0, 0, W, H)

    const freqData = engine.getFrequencyData()
    const barCount = 140
    const barW = W / barCount

    // Glowing center zero line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, centerY)
    ctx.lineTo(W, centerY)
    ctx.stroke()

    const time = Date.now() * 0.004

    for (let i = 0; i < barCount; i++) {
      let amp = 0
      if (freqData && freqData.length > 0) {
        const idx = Math.floor((i / barCount) * freqData.length)
        amp = (freqData[idx] / 255)
      } else {
        // Organic resting wave
        amp = (Math.sin(i * 0.12 + time) * 0.2 + 0.15) * (isPlaying ? 1.5 : 0.8)
      }

      const barH = Math.max(4, amp * (H * 0.46))
      const x = i * barW

      // Rainbow HSL Spectrum across width: Blue -> Purple -> Pink -> Red -> Yellow -> Green
      const hue = (i / barCount) * 280 + 190 // 190 (Cyan-Blue) to 470 (Green/Yellow)

      // Top vertical spike line
      const topGrad = ctx.createLinearGradient(0, centerY, 0, centerY - barH)
      topGrad.addColorStop(0, '#ffffff')
      topGrad.addColorStop(0.3, `hsl(${hue}, 100%, 65%)`)
      topGrad.addColorStop(1, `hsl(${hue}, 100%, 45%)`)

      ctx.strokeStyle = topGrad
      ctx.lineWidth = Math.max(1, barW - 0.8)
      ctx.beginPath()
      ctx.moveTo(x + barW / 2, centerY)
      ctx.lineTo(x + barW / 2, centerY - barH)
      ctx.stroke()

      // Mirrored Bottom vertical spike line
      const botGrad = ctx.createLinearGradient(0, centerY, 0, centerY + barH)
      botGrad.addColorStop(0, '#ffffff')
      botGrad.addColorStop(0.3, `hsl(${hue}, 100%, 65%)`)
      botGrad.addColorStop(1, `hsl(${hue}, 100%, 45%)`)

      ctx.strokeStyle = botGrad
      ctx.beginPath()
      ctx.moveTo(x + barW / 2, centerY)
      ctx.lineTo(x + barW / 2, centerY + barH)
      ctx.stroke()
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth || 700
      canvas.height = 150
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, draw])

  return (
    <div className="ag-spectrum-container" style={{ padding: '4px 0' }}>
      <div className="ag-spectrum-body" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="spec-canvas-wrapper" style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid #1e293b', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '150px', display: 'block' }} />
        </div>
      </div>
    </div>
  )
}
