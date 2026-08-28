import React, { useEffect, useRef } from 'react'
import { engine } from '../state/usePlayback'

export const DynamicMusicBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = 0
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Animated nodes representing orchestrated AI agents
    const agents = Array.from({ length: 18 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2.5 + 2,
      hue: Math.random() > 0.5 ? 217 : 260, // Blue or violet hue
    }))

    const orbs = [
      { x: width * 0.2,  y: height * 0.25, radius: 480, vx: 0.05, vy: 0.04, h: 217 }, // Deep AI Cyan/Blue
      { x: width * 0.8,  y: height * 0.2,  radius: 540, vx: -0.04, vy: 0.05, h: 260 }, // Agentic Purple
      { x: width * 0.5,  y: height * 0.8,  radius: 600, vx: 0.03, vy: -0.04, h: 200 }, // Azure
    ]

    let phase = 0

    const render = () => {
      phase += 0.005

      const freqData = engine.getFrequencyData()
      let bassEnergy = 0
      if (freqData && freqData.length > 0) {
        const bassCount = Math.floor(freqData.length * 0.15)
        let sum = 0
        for (let i = 0; i < bassCount; i++) sum += freqData[i]
        bassEnergy = sum / (bassCount * 255)
      }

      // Base canvas clear
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, width, height)

      // Rich Gradient mesh background symbolizing agentic intelligence
      const bgOverlay = ctx.createLinearGradient(0, 0, width, height)
      bgOverlay.addColorStop(0, 'rgba(239, 246, 255, 0.95)')
      bgOverlay.addColorStop(0.5, 'rgba(245, 243, 255, 0.9)')
      bgOverlay.addColorStop(1, 'rgba(240, 249, 255, 0.95)')
      ctx.fillStyle = bgOverlay
      ctx.fillRect(0, 0, width, height)

      // Soft ambient glowing light orbs
      orbs.forEach((orb, idx) => {
        const breathe = Math.sin(phase * 0.8 + idx * 1.5) * 25 + bassEnergy * 40
        const currentRadius = orb.radius + breathe

        orb.x += orb.vx
        orb.y += orb.vy
        if (orb.x < -200 || orb.x > width + 200) orb.vx *= -1
        if (orb.y < -200 || orb.y > height + 200) orb.vy *= -1

        const alpha = 0.09 + bassEnergy * 0.04
        const radGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, currentRadius)
        radGrad.addColorStop(0, `hsla(${orb.h}, 85%, 65%, ${alpha})`)
        radGrad.addColorStop(0.6, `hsla(${orb.h}, 70%, 75%, ${alpha * 0.3})`)
        radGrad.addColorStop(1, `hsla(${orb.h}, 60%, 85%, 0)`)

        ctx.fillStyle = radGrad
        ctx.beginPath()
        ctx.arc(orb.x, orb.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Network of interconnected agentic AI nodes
      ctx.lineWidth = 1
      for (let i = 0; i < agents.length; i++) {
        const a1 = agents[i]
        a1.x += a1.vx
        a1.y += a1.vy
        if (a1.x < 0 || a1.x > width) a1.vx *= -1
        if (a1.y < 0 || a1.y > height) a1.vy *= -1

        // Connect nearby agent nodes with faint neural strands
        for (let j = i + 1; j < agents.length; j++) {
          const a2 = agents[j]
          const dx = a1.x - a2.x
          const dy = a1.y - a2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180) {
            const lineAlpha = (1 - dist / 180) * 0.12
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`
            ctx.beginPath()
            ctx.moveTo(a1.x, a1.y)
            ctx.lineTo(a2.x, a2.y)
            ctx.stroke()
          }
        }

        // Draw agent node dot
        ctx.fillStyle = `hsla(${a1.hue}, 80%, 60%, 0.3)`
        ctx.beginPath()
        ctx.arc(a1.x, a1.y, a1.radius + bassEnergy * 3, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

export default DynamicMusicBackground
