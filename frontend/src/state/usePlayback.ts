import { create } from 'zustand'
import type { SonificationTimeline, SonificationEvent, AudioPreset, DifferenceInfo, AlignmentInfo } from '../types'
import { AudioEngine } from '../audio/engine'
import {
  generateSonificationTimeline,
  alignAndCompareSequences,
} from '../bioinformatics/sequenceUtils'

export const engine = new AudioEngine()

export type LlmProvider = 'gemini' | 'openrouter' | 'openai' | 'anthropic' | 'google'

export interface LlmCredential {
  apiKey: string
  isConnected: boolean
}

export type ComparisonMode = 'gene_a' | 'gene_b' | 'differences' | 'combined'

interface PlaybackStore {
  timeline: SonificationTimeline | null
  comparisonTimeline: SonificationTimeline | null
  sequence: string
  comparisonSequence: string
  method: string
  isPlaying: boolean
  currentTime: number
  activeEventId: string | null
  selectedEvent: SonificationEvent | null
  audioPreset: AudioPreset
  comparisonMode: ComparisonMode
  error: string | null
  loading: boolean
  activePosition: number
  volume: number
  playbackSpeed: number
  differences: DifferenceInfo[]
  alignment: AlignmentInfo | null
  
  // LLM Config
  llmApiKey: string
  llmProvider: string
  llmConnected: boolean
  llmCredentials: Record<string, LlmCredential>
  setLlmConfig: (provider: string, apiKey: string, connected: boolean) => void
  setLlmCredential: (provider: string, apiKey: string, connected: boolean) => void

  loadTimeline: (sequence: string, method: string) => Promise<void>
  loadComparisonTimeline: (sequence: string) => Promise<void>
  play: () => void
  pause: () => void
  stop: () => void
  restart: () => void
  seek: (time: number) => void
  tick: () => void
  selectEvent: (event: SonificationEvent | null) => void
  setAudioPreset: (preset: AudioPreset) => void
  setComparisonMode: (mode: ComparisonMode) => void
  setActivePosition: (pos: number) => void
  setVolume: (vol: number) => void
  setPlaybackSpeed: (speed: number) => void
  initDefaultState: () => void
}

const DEFAULT_SEQ_A = 'ATGCCGTTAGCTACGTTACTGACCGTTACGTTAGCTACGTTACTGACCGTGTTGACCGTACGTTAGCTACGATCGT'
const DEFAULT_SEQ_B = 'ATGCCGTTAGCTACGTATGTACTGACCGTACGTTAGCTACGATCGTAGCTAAGTTGACCGTACGTTAGCTACGATC'

const initialTimeline = generateSonificationTimeline(DEFAULT_SEQ_A, 'nucleotide_chroma', 'ref_A')
const initialCompTimeline = generateSonificationTimeline(DEFAULT_SEQ_B, 'nucleotide_chroma', 'sample_B')
const initialComparison = alignAndCompareSequences(DEFAULT_SEQ_A, DEFAULT_SEQ_B)

engine.loadTimeline(initialTimeline)
engine.setComparisonTimeline(initialCompTimeline)
engine.setDifferencePositions(initialComparison.differences.map((d) => d.position))

export const usePlayback = create<PlaybackStore>((set, get) => {
  engine.onPlay = () => set({ isPlaying: true })
  engine.onPause = () => set({ isPlaying: false })
  engine.onStop = () => set({ isPlaying: false, currentTime: 0, activeEventId: null })
  engine.onComplete = () => set({ isPlaying: false, activeEventId: null })
  engine.onEventStart = (meta) => set({ activeEventId: meta.event_id as string })

  return {
    timeline: initialTimeline,
    comparisonTimeline: initialCompTimeline,
    sequence: DEFAULT_SEQ_A,
    comparisonSequence: DEFAULT_SEQ_B,
    method: 'nucleotide_chroma',
    isPlaying: false,
    currentTime: 0,
    activeEventId: null,
    selectedEvent: initialTimeline.events[0] || null,
    audioPreset: 'pure',
    comparisonMode: 'differences',
    error: null,
    loading: false,
    activePosition: 1,
    volume: 0.8,
    playbackSpeed: 1.0,
    differences: initialComparison.differences,
    alignment: initialComparison.alignment,
    
    // LLM Defaults
    llmApiKey: '',
    llmProvider: 'anthropic',
    llmConnected: false,
    llmCredentials: {},
    setLlmConfig: (provider, apiKey, connected) => set({ llmProvider: provider, llmApiKey: apiKey, llmConnected: connected }),
    setLlmCredential: (provider, apiKey, connected) => set(state => ({
      llmProvider: provider,
      llmApiKey: apiKey,
      llmConnected: connected,
      llmCredentials: {
        ...state.llmCredentials,
        [provider]: { apiKey, isConnected: connected }
      }
    })),

    initDefaultState: () => {
      const tlA = generateSonificationTimeline(DEFAULT_SEQ_A, 'nucleotide_chroma', 'ref_A')
      const tlB = generateSonificationTimeline(DEFAULT_SEQ_B, 'nucleotide_chroma', 'sample_B')
      const comp = alignAndCompareSequences(DEFAULT_SEQ_A, DEFAULT_SEQ_B)

      engine.loadTimeline(tlA)
      engine.setComparisonTimeline(tlB)
      engine.setDifferencePositions(comp.differences.map((d) => d.position))

      set({
        timeline: tlA,
        comparisonTimeline: tlB,
        sequence: DEFAULT_SEQ_A,
        comparisonSequence: DEFAULT_SEQ_B,
        differences: comp.differences,
        alignment: comp.alignment,
        activePosition: comp.differences[0]?.position || 1,
        selectedEvent: tlA.events[0] || null,
        comparisonMode: 'differences',
        currentTime: 0,
      })
    },

    loadTimeline: async (sequence: string, method: string) => {
      set({ loading: true, error: null })
      const cleanSeq = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
      const timeline = generateSonificationTimeline(cleanSeq, method, 'ref')

      engine.loadTimeline(timeline)
      engine.setPreset(get().audioPreset)

      const { comparisonSequence } = get()
      if (comparisonSequence) {
        const comp = alignAndCompareSequences(cleanSeq, comparisonSequence)
        engine.setDifferencePositions(comp.differences.map((d) => d.position))
        set({
          timeline,
          sequence: cleanSeq,
          method,
          loading: false,
          differences: comp.differences,
          alignment: comp.alignment,
        })
      } else {
        set({ timeline, sequence: cleanSeq, method, loading: false })
      }
    },

    loadComparisonTimeline: async (sequence: string) => {
      const { sequence: refSeq, method } = get()
      const cleanCompSeq = sequence.replace(/[^ATGCatgc]/g, '').toUpperCase()
      const compTl = generateSonificationTimeline(cleanCompSeq, method, 'sample')
      const comp = alignAndCompareSequences(refSeq, cleanCompSeq)

      engine.setComparisonTimeline(compTl)
      engine.setDifferencePositions(comp.differences.map((d) => d.position))

      set({
        comparisonTimeline: compTl,
        comparisonSequence: cleanCompSeq,
        differences: comp.differences,
        alignment: comp.alignment,
      })
    },

    play: () => {
      engine.setPreset(get().audioPreset)
      engine.setComparisonMode(get().comparisonMode)
      engine.setVolume(get().volume)
      engine.setPlaybackSpeed(get().playbackSpeed)
      engine.play()
    },
    pause: () => engine.pause(),
    stop: () => engine.stop(),
    restart: () => {
      engine.setPreset(get().audioPreset)
      engine.setComparisonMode(get().comparisonMode)
      engine.setVolume(get().volume)
      engine.setPlaybackSpeed(get().playbackSpeed)
      engine.restart()
    },
    seek: (time: number) => {
      engine.seek(time)
      const tl = get().timeline
      const seqLen = tl?.sequence_length || 1
      const totalDur = tl?.total_duration || 1
      const pos = Math.max(1, Math.min(seqLen, Math.floor((time / totalDur) * seqLen)))
      const event = tl?.events.find((e) => e.position === pos) || null
      set({ currentTime: time, activePosition: pos, selectedEvent: event })
    },

    tick: () => {
      if (engine.getIsPlaying()) {
        const t = engine.getTime()
        const tl = get().timeline
        const seqLen = tl?.sequence_length || 1
        const totalDur = tl?.total_duration || 1
        const pos = Math.max(1, Math.min(seqLen, Math.floor((t / totalDur) * seqLen)))
        const prev = get().activePosition
        // Only update store when position actually changes — prevents 60fps re-render storms
        if (pos !== prev) {
          set({ currentTime: t, activePosition: pos })
        } else {
          // Still update currentTime for seek bar, but skip if unchanged
          const prevTime = get().currentTime
          if (Math.abs(t - prevTime) > 0.05) {
            set({ currentTime: t })
          }
        }
      }
    },

    selectEvent: (event: SonificationEvent | null) => {
      if (event) {
        set({ selectedEvent: event, activePosition: event.position })
      } else {
        set({ selectedEvent: null })
      }
    },

    setAudioPreset: (preset: AudioPreset) => {
      engine.setPreset(preset)
      set({ audioPreset: preset })
    },

    setComparisonMode: (mode: ComparisonMode) => {
      engine.setComparisonMode(mode)
      set({ comparisonMode: mode })
    },

    setActivePosition: (pos: number) => {
      const tl = get().timeline
      const event = tl?.events.find((e) => e.position === pos) || null
      const totalDur = tl?.total_duration || 1
      const seqLen = tl?.sequence_length || 1
      const time = (pos / seqLen) * totalDur
      set({ activePosition: pos, selectedEvent: event, currentTime: time })
    },

    setVolume: (vol: number) => {
      engine.setVolume(vol)
      set({ volume: vol })
    },
    setPlaybackSpeed: (speed: number) => {
      engine.setPlaybackSpeed(speed)
      set({ playbackSpeed: speed })
    },
  }
})
