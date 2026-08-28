import { useEffect, useRef } from 'react'

/**
 * Single shared requestAnimationFrame loop.
 * Calls callback every frame while active is true.
 * Uses ref-based callback to avoid re-triggering the effect.
 */
export function useAnimationFrame(callback: () => void, active: boolean) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let rafId: number
    const loop = () => {
      cbRef.current()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [active])
}
