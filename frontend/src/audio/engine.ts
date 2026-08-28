/**
 * AudiGene Audio Engine — Warm Melodic Synthesizer.
 *
 * Provides smooth legato note overlapping with warm low-pass filtering,
 * ambient echo delays, and soft attack envelopes to transform sequence sonification
 * into a soothing, flowing melody.
 */

import type { SonificationEvent, SonificationTimeline, AudioPreset } from '../types'

const LOOK_AHEAD = 0.15 // seconds
const ATTACK_TIME = 0.045 // 45ms soft attack to eliminate click/harsh onset
const LEGATO_OVERLAP_FACTOR = 3.5 // Extended release & note overlapping for flowing melody

export type EventCallback = (meta: Record<string, unknown>) => void
export type VoidCallback = () => void

export class AudioEngine {
  private ctx: AudioContext | null = null
  private timeline: SonificationTimeline | null = null
  private isPlaying = false
  private startTime = 0
  private pauseOffset = 0
  private scheduledUpTo = 0
  private rafId = 0
  private scheduledNodes: AudioNode[] = []

  private masterGain: GainNode | null = null
  private filter: BiquadFilterNode | null = null
  private delayNode: DelayNode | null = null
  private delayFeedback: GainNode | null = null
  private delayFilter: BiquadFilterNode | null = null
  private delayGain: GainNode | null = null
  private compressor: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private analyserDataArray: Uint8Array<ArrayBuffer> | null = null
  private analyserFreqArray: Uint8Array<ArrayBuffer> | null = null

  private playbackSpeed = 1.0
  private preset: AudioPreset = 'pure'
  private comparisonTimeline: SonificationTimeline | null = null
  private comparisonMode: 'gene_a' | 'gene_b' | 'differences' | 'combined' = 'gene_a'
  private differencePositions: Set<number> = new Set()

  onEventStart: EventCallback = () => {}
  onEventEnd: EventCallback = () => {}
  onPlay: VoidCallback = () => {}
  onPause: VoidCallback = () => {}
  onStop: VoidCallback = () => {}
  onComplete: VoidCallback = () => {}

  loadTimeline(timeline: SonificationTimeline) {
    this.stop()
    this.timeline = timeline
    this.comparisonTimeline = null
    this.differencePositions.clear()
  }

  setComparisonTimeline(timeline: SonificationTimeline) {
    this.comparisonTimeline = timeline
  }

  setComparisonMode(mode: 'gene_a' | 'gene_b' | 'differences' | 'combined') {
    this.comparisonMode = mode
  }

  setDifferencePositions(positions: number[]) {
    this.differencePositions = new Set(positions)
  }

  setPreset(preset: AudioPreset) {
    this.preset = preset
  }

  setPlaybackSpeed(speed: number) {
    if (this.isPlaying && this.ctx) {
      // Re-base the timing to the current position before changing speed
      const currentTime = this.getTime()
      this.pauseOffset = currentTime
      this.startTime = this.ctx.currentTime
    }
    this.playbackSpeed = Math.max(0.25, Math.min(4, speed))
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, vol)) * 0.22, this.ctx.currentTime, 0.05)
    }
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.analyserFreqArray) return null
    this.analyser.getByteFrequencyData(this.analyserFreqArray)
    return this.analyserFreqArray
  }

  getWaveformData(): Uint8Array | null {
    if (!this.analyser || !this.analyserDataArray) return null
    this.analyser.getByteTimeDomainData(this.analyserDataArray)
    return this.analyserDataArray
  }

  getActiveTimeline(): SonificationTimeline | null {
    if (this.comparisonMode === 'gene_b' && this.comparisonTimeline) {
      return this.comparisonTimeline
    }
    return this.timeline
  }

  play() {
    const tl = this.getActiveTimeline()
    if (!tl || tl.events.length === 0) return
    if (this.isPlaying) return
    this.ensureCtx()
    this.isPlaying = true
    this.startTime = this.ctx!.currentTime
    this.scheduledUpTo = 0
    this.onPlay()
    this.schedulerLoop()
  }

  pause() {
    if (!this.isPlaying || !this.ctx) return
    this.pauseOffset = this.getTime()
    this.isPlaying = false
    cancelAnimationFrame(this.rafId)
    this.stopNodes()
    this.onPause()
  }

  stop() {
    this.isPlaying = false
    this.pauseOffset = 0
    this.scheduledUpTo = 0
    cancelAnimationFrame(this.rafId)
    this.stopNodes()
    this.onStop()
  }

  restart() {
    this.stop()
    this.play()
  }

  seek(time: number) {
    const tl = this.getActiveTimeline()
    if (!tl) return
    time = Math.max(0, Math.min(time, tl.total_duration))
    const wasPlaying = this.isPlaying
    if (wasPlaying) {
      cancelAnimationFrame(this.rafId)
      this.stopNodes()
    }
    this.pauseOffset = time
    this.scheduledUpTo = 0
    if (wasPlaying && this.ctx) {
      this.startTime = this.ctx.currentTime
      this.isPlaying = true
      this.schedulerLoop()
    }
  }

  getTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pauseOffset
    return this.pauseOffset + (this.ctx.currentTime - this.startTime) * this.playbackSpeed
  }

  getDuration(): number {
    const tl = this.getActiveTimeline()
    return tl?.total_duration ?? 0
  }

  getIsPlaying(): boolean {
    return this.isPlaying
  }

  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()

    if (!this.masterGain && this.ctx) {
      // Soft Warm Lowpass Filter (strips high piercing frequencies)
      this.filter = this.ctx.createBiquadFilter()
      this.filter.type = 'lowpass'
      this.filter.frequency.setValueAtTime(1500, this.ctx.currentTime)
      this.filter.Q.setValueAtTime(0.5, this.ctx.currentTime)

      // Echo / Ambient Delay Effect Node
      this.delayNode = this.ctx.createDelay(1.0)
      this.delayNode.delayTime.setValueAtTime(0.32, this.ctx.currentTime) // 320ms echo delay

      this.delayFeedback = this.ctx.createGain()
      this.delayFeedback.gain.setValueAtTime(0.38, this.ctx.currentTime) // Feedback repeat decay

      this.delayFilter = this.ctx.createBiquadFilter()
      this.delayFilter.type = 'lowpass'
      this.delayFilter.frequency.setValueAtTime(1000, this.ctx.currentTime) // Darkens echoes smoothly over time

      this.delayGain = this.ctx.createGain()
      this.delayGain.gain.setValueAtTime(0.35, this.ctx.currentTime) // Wet delay level

      // Delay feedback loop routing: delayNode -> delayFilter -> delayFeedback -> delayNode
      this.delayNode.connect(this.delayFilter)
      this.delayFilter.connect(this.delayFeedback)
      this.delayFeedback.connect(this.delayNode)
      this.delayNode.connect(this.delayGain)

      // Master Compressor for smooth dynamics & preventing clipping
      this.compressor = this.ctx.createDynamicsCompressor()
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime)
      this.compressor.knee.setValueAtTime(20, this.ctx.currentTime)
      this.compressor.ratio.setValueAtTime(3.0, this.ctx.currentTime)
      this.compressor.attack.setValueAtTime(0.015, this.ctx.currentTime)
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime)

      // Master Gain Node
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime)

      // Analyser Node
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 1024
      this.analyser.smoothingTimeConstant = 0.85

      // Signal Chain:
      // Oscillators -> Filter -> Compressor & Delay
      // Filter -> Compressor (Dry Signal)
      // Filter -> DelayNode -> DelayGain -> Compressor (Wet Echo Signal)
      // Compressor -> MasterGain -> Analyser -> Output
      this.filter.connect(this.compressor)
      this.filter.connect(this.delayNode)
      this.delayGain.connect(this.compressor)

      this.compressor.connect(this.masterGain)
      this.masterGain.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)

      this.analyserDataArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
      this.analyserFreqArray = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
    }
  }

  private stopNodes() {
    for (const node of this.scheduledNodes) {
      try { (node as OscillatorNode).stop() } catch {}
      try { node.disconnect() } catch {}
    }
    this.scheduledNodes = []
  }

  private schedulerLoop = () => {
    if (!this.isPlaying || !this.ctx) return

    const tl = this.getActiveTimeline()
    if (!tl) return

    const currentTime = this.getTime()
    const scheduleUntil = currentTime + LOOK_AHEAD

    for (const ev of tl.events) {
      const evEnd = ev.start_time + ev.duration
      if (
        ev.start_time < scheduleUntil &&
        evEnd > currentTime &&
        ev.start_time >= this.scheduledUpTo
      ) {
        if (this.comparisonMode === 'differences') {
          if (this.differencePositions.has(ev.position)) {
            this.scheduleEvent(ev, true)
          }
        } else {
          const isDiff = this.differencePositions.has(ev.position)
          this.scheduleEvent(ev, isDiff)
        }

        this.scheduledUpTo = ev.start_time
      }
    }

    if (currentTime >= tl.total_duration && tl.total_duration > 0) {
      this.isPlaying = false
      this.pauseOffset = 0
      this.scheduledUpTo = 0
      this.onComplete()
      return
    }

    this.rafId = requestAnimationFrame(this.schedulerLoop)
  }

  private scheduleEvent(ev: SonificationEvent, isDifferential = false) {
    const ctx = this.ctx!
    if (!ctx || !this.filter) return

    const offset = ev.start_time - this.pauseOffset
    const schedTime = this.startTime + offset

    if (schedTime < ctx.currentTime - 0.01) return

    const freq = ev.frequency || 262.0
    if (freq <= 0) return

    // Primary melodic oscillator (soft pure sine tone)
    const osc = ctx.createOscillator()
    // Sub-bass warm oscillator (1 octave down sine)
    const subOsc = ctx.createOscillator()
    // Warm overtone oscillator (soft fifth/octave harmony blend for rich melody)
    const overtoneOsc = ctx.createOscillator()

    const gain = ctx.createGain()

    osc.type = 'sine'
    subOsc.type = 'sine'
    overtoneOsc.type = isDifferential ? 'triangle' : 'sine'

    osc.frequency.setValueAtTime(freq, schedTime)
    subOsc.frequency.setValueAtTime(freq * 0.5, schedTime)
    overtoneOsc.frequency.setValueAtTime(freq * 1.5, schedTime) // Soft perfect 5th overtone

    const targetAmp = isDifferential ? 0.22 : 0.18
    const totalLegatoDuration = ev.duration * LEGATO_OVERLAP_FACTOR
    const stopTime = schedTime + totalLegatoDuration

    // Smooth Legato Envelope:
    // Soft exponential attack -> warm sustain -> gradual trailing decay into subsequent notes
    gain.gain.setValueAtTime(0.0001, schedTime)
    gain.gain.linearRampToValueAtTime(targetAmp, schedTime + ATTACK_TIME)
    gain.gain.setValueAtTime(targetAmp, schedTime + ev.duration * 0.8)
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime)

    osc.connect(gain)
    subOsc.connect(gain)
    overtoneOsc.connect(gain)
    gain.connect(this.filter)

    osc.start(schedTime)
    subOsc.start(schedTime)
    overtoneOsc.start(schedTime)

    osc.stop(stopTime + 0.02)
    subOsc.stop(stopTime + 0.02)
    overtoneOsc.stop(stopTime + 0.02)

    this.scheduledNodes.push(osc, subOsc, overtoneOsc)

    const startDelay = Math.max(0, (schedTime - ctx.currentTime) * 1000)
    setTimeout(() => {
      this.onEventStart({
        event_id: ev.event_id,
        position: ev.position,
        frequency: ev.frequency,
        biological_value: ev.biological_value,
      })
    }, startDelay)
  }
}

