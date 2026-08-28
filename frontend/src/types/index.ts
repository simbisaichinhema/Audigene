export interface SimultaneousPitch {
  pitch: string
  frequency: number
  amplitude: number
}

export interface SonificationEvent {
  event_id: string
  position: number
  frame: number
  event_type: string
  biological_value: string
  start_time: number
  duration: number
  pitch: string
  frequency: number
  amplitude: number
  instrument: string
  simultaneous_pitches: SimultaneousPitch[]
  simultaneous_frequencies: number[]
  paper_rule: string
  implementation: string
  implementation_source: string
}

export interface SonificationTimeline {
  analysis_id: string
  profile: string
  method: string
  sequence_length: number
  total_duration: number
  events: SonificationEvent[]
}

export interface SonificationRequest {
  sequence: string
  method: string
}

export interface CompareRequest {
  reference: string
  sample: string
  method: string
}

export interface CompareResponse {
  aligned_reference: string
  aligned_sample: string
  identity: number
  match_count: number
  mismatch_count: number
  insertion_count: number
  deletion_count: number
  alignment_length: number
  differences: DifferenceInfo[]
  reference_timeline: SonificationTimeline
  sample_timeline: SonificationTimeline
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'stopped'

export type AudioPreset = 'pure' | 'glass' | 'organic' | 'pulse'

export const BASE_COLORS: Record<string, string> = {
  A: 'var(--base-a)',
  C: 'var(--base-c)',
  G: 'var(--base-g)',
  T: 'var(--base-t)',
}

export const BASE_CLASSES: Record<string, string> = {
  A: 'base-A',
  C: 'base-C',
  G: 'base-G',
  T: 'base-T',
}

export interface ValidationInfo {
  isValid: boolean
  length: number
  validBases: number
  ambiguousCount: number
  invalidCount: number
  invalidChars: string[]
  warnings: string[]
  cleanedSequence: string
  originalInput: string
  hasFastaHeader: boolean
  fastaHeader: string
  isProtein: boolean
}

export interface AlignmentInfo {
  alignedReference: string
  alignedSample: string
  identity: number
  matchCount: number
  mismatchCount: number
  insertionCount: number
  deletionCount: number
  length: number
}

export interface DifferenceInfo {
  position: number
  type: 'substitution' | 'insertion' | 'deletion'
  referenceBase: string | null
  sampleBase: string | null
  context: string
}

export interface WorkflowStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'done' | 'error'
  duration?: number
  detail?: string
}

export const METHOD_INFO: Record<string, { label: string; fidelity: string; description: string }> = {
  nucleotide_chroma: {
    label: 'Nucleotide Chroma',
    fidelity: 'PAPER_EXACT',
    description: 'Each nucleotide → fixed pitch (A→C4, C→E4, G→G4, T→C5), 100ms',
  },
  dna_walking: {
    label: 'DNA Walking',
    fidelity: 'PAPER_EXACT',
    description: 'Musical intervals between consecutive nucleotides via 4×4 matrix',
  },
  dna_chords: {
    label: 'DNA Chords',
    fidelity: 'PAPER_EXACT',
    description: 'Groups of 3 nucleotides played simultaneously as chords',
  },
  nucleotide_rhythm: {
    label: 'Nucleotide Rhythm',
    fidelity: 'PAPER_QUALITATIVE',
    description: 'Short-short-long rhythm emphasising every 3rd nucleotide',
  },
  codon_walking: {
    label: 'Codon Walking',
    fidelity: 'PAPER_DERIVED',
    description: 'Interval-based walking within reading frame codon boundaries',
  },
}
