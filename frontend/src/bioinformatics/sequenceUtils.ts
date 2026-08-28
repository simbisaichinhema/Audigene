import type { SonificationTimeline, SonificationEvent, DifferenceInfo, AlignmentInfo, ValidationInfo } from '../types'

// ── Nucleotide Pitch Mappings (Temple 2017 paper) ──
export const NUCLEOTIDE_MAP: Record<string, { pitch: string; freq: number }> = {
  A: { pitch: 'C4', freq: 262.0 },
  C: { pitch: 'E4', freq: 330.0 },
  G: { pitch: 'G4', freq: 392.0 },
  T: { pitch: 'C5', freq: 523.0 },
}

export interface DnaPreset {
  id: string
  name: string
  acousticProfile: string
  description: string
  icon: string
  ref: string
  sample: string
}

export const ACOUSTIC_DNA_PRESETS: DnaPreset[] = [
  {
    id: 'hbs',
    name: 'Sickle Cell Mutation',
    acousticProfile: 'Harmonic Point Mutation',
    description: 'Mid-range harmonic chord with a single sharp substitution pitch at Position #17.',
    icon: '🩸',
    ref: '>Reference_HbA\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGTTGGTATCAAGGTTACAAGACAGGTTTAAGGAGACCAATAG',
    sample: '>Sample_HbS\nATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGTTGGTATCAAGGTTACAAGACAGGTTTAAGGAGACCAATAG',
  },
  {
    id: 'at_high',
    name: 'High Pitch Treble (AT-Rich)',
    acousticProfile: 'High Notes & Rapid Staccato',
    description: 'High frequency C5 & C4 notes (523 Hz & 262 Hz) creating bright, sparkling high-pitch melodies.',
    icon: '✨',
    ref: '>AT_Rich_Melodic_High\nATATATATAAAAATTTTATTTTATATATATATAAAAATTTTATTTTATATATATATAAAAATTTTATTTTATATATATATATAAAAATTTTATTTTATATATATATAAAAATTTTATTTTATATATATATAAAAATTTT',
    sample: '>AT_Rich_Variant\nATATATATAAAAATTTTATTTTATATATATATAAAAATTTTATTTTGTATATATATAAAAATTTTATTTTATATATATATATAAAAATTTTATTTTATATATATATAAAAATTTTCTTTTATATATATATAAAAATTTT',
  },
  {
    id: 'gc_low',
    name: 'Deep Bass (GC-Rich Island)',
    acousticProfile: 'Low Bass & Heavy Tones',
    description: 'Low frequency G4 & E4 notes (392 Hz & 330 Hz) producing deep, warm, heavy synth tones.',
    icon: '🎸',
    ref: '>GC_Rich_Low_Bass\nGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGG',
    sample: '>GC_Rich_Variant\nGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGAGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGG',
  },
  {
    id: 'scale',
    name: 'Symphonic Scale (Kinase)',
    acousticProfile: 'Wide Dynamic Range Melody',
    description: 'Sweeping 4-octave bio-scale cycling through low C, mid E/G, and high T notes.',
    icon: '🎼',
    ref: '>Insulin_Kinase_Scale\nATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTAC',
    sample: '>Insulin_Kinase_Variant\nATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTATATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTAC',
  },
  {
    id: 'cag_repeat',
    name: 'Trinucleotide Cascade (CAG)',
    acousticProfile: 'Rhythmic Cadence & Repeats',
    description: 'Hypnotic CAG triplet oscillation highlighting frameshifts and sequence length expansion.',
    icon: '⚡',
    ref: '>Huntington_CAG_Normal\nCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG',
    sample: '>Huntington_CAG_Expanded\nCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG',
  },
]

/** Parse FASTA header and clean sequence to A, T, G, C bases only */
export function parseFasta(rawInput: string): { header: string; sequence: string } {
  const trimmed = rawInput.trim()
  let header = 'sequence'
  let rawSeq = trimmed

  if (trimmed.startsWith('>')) {
    const firstLineEnd = trimmed.indexOf('\n')
    if (firstLineEnd !== -1) {
      header = trimmed.slice(1, firstLineEnd).trim()
      rawSeq = trimmed.slice(firstLineEnd)
    }
  }
  
  // Extract strictly A, T, G, C bases only
  const sequence = rawSeq.replace(/[^ATGCatgc]/g, '').toUpperCase()
  return { header, sequence }
}

/** Calculate GC content percentage */
export function calculateGcContent(sequence: string): number {
  if (!sequence.length) return 0
  const gcCount = (sequence.match(/[GC]/gi) || []).length
  return parseFloat(((gcCount / sequence.length) * 100).toFixed(1))
}

/** Translate DNA sequence to Amino Acids */
export function translateDna(sequence: string): string {
  const codonTable: Record<string, string> = {
    ATA: 'I', ATC: 'I', ATT: 'I', ATG: 'M',
    ACA: 'T', ACC: 'T', ACG: 'T', ACT: 'T',
    AAC: 'N', AAT: 'N', AAA: 'K', AAG: 'K',
    AGC: 'S', AGT: 'S', AGA: 'R', AGG: 'R',
    CTA: 'L', CTC: 'L', CTG: 'L', CTT: 'L',
    CCA: 'P', CCC: 'P', CCG: 'P', CCT: 'P',
    CAC: 'H', CAT: 'H', CAA: 'Q', CAG: 'Q',
    CGA: 'R', CGC: 'R', CGG: 'R', CGT: 'R',
    GTA: 'V', GTC: 'V', GTG: 'V', GTT: 'V',
    GCA: 'A', GCC: 'A', GCG: 'A', GCT: 'A',
    GAC: 'D', GAT: 'D', GAA: 'E', GAG: 'E',
    GGA: 'G', GGC: 'G', GGG: 'G', GGT: 'G',
    TCA: 'S', TCC: 'S', TCG: 'S', TCT: 'S',
    TTC: 'F', TTT: 'F', TTA: 'L', TTG: 'L',
    TAC: 'Y', TAT: 'Y', TAA: '*', TAG: '*',
    TGC: 'C', TGT: 'C', TGA: '*', TGG: 'W',
  }

  let aa = ''
  for (let i = 0; i < sequence.length - 2; i += 3) {
    const codon = sequence.slice(i, i + 3).toUpperCase()
    aa += codonTable[codon] || 'X'
  }
  return aa
}

/** Validate DNA Sequence */
export function validateSequence(rawInput: string): ValidationInfo {
  const { header, sequence } = parseFasta(rawInput)
  let validCount = 0
  let ambiguousCount = 0
  let invalidCount = 0
  const invalidChars: string[] = []

  for (const ch of sequence) {
    if ('ACGT'.includes(ch)) validCount++
    else if ('NRYSWKMBDHV'.includes(ch)) ambiguousCount++
    else {
      invalidCount++
      if (!invalidChars.includes(ch)) invalidChars.push(ch)
    }
  }

  const isProtein = sequence.length > 0 && /^[MRQHPNSTYAILVDEFWCGK]+$/.test(sequence) && validCount === 0

  const warnings: string[] = []
  if (ambiguousCount > 0) warnings.push(`${ambiguousCount} ambiguous base(s) detected`)
  if (invalidCount > 0) warnings.push(`${invalidCount} invalid character(s): ${invalidChars.join(', ')}`)
  if (isProtein) warnings.push('Sequence appears to be protein, not DNA')

  return {
    isValid: invalidCount === 0 && !isProtein && sequence.length > 0,
    length: sequence.length,
    validBases: validCount,
    ambiguousCount,
    invalidCount,
    invalidChars,
    warnings,
    cleanedSequence: sequence,
    originalInput: rawInput,
    hasFastaHeader: rawInput.trim().startsWith('>'),
    fastaHeader: header,
    isProtein,
  }
}

/** Generate dynamic Sonification Timeline for a sequence with calm, readable pacing */
export function generateSonificationTimeline(
  sequence: string,
  method = 'nucleotide_chroma',
  sequenceId = 'reference'
): SonificationTimeline {
  const events: SonificationEvent[] = []
  const durationPerBase = 0.20 // 200ms per base (5 notes/sec) for clear, melodic pacing

  for (let i = 0; i < sequence.length; i++) {
    const base = sequence[i].toUpperCase()
    const mapInfo = NUCLEOTIDE_MAP[base] || { pitch: 'C4', freq: 262.0 }
    const startTime = i * durationPerBase

    events.push({
      event_id: `ev_${sequenceId}_${i + 1}`,
      position: i + 1,
      frame: Math.floor(i / 3),
      event_type: 'nucleotide',
      biological_value: base,
      start_time: startTime,
      duration: durationPerBase,
      pitch: mapInfo.pitch,
      frequency: mapInfo.freq,
      amplitude: 0.5,
      instrument: 'sine',
      simultaneous_pitches: [],
      simultaneous_frequencies: [],
      paper_rule: 'Temple 2017 pitch mapping',
      implementation: 'WebAudio Synth',
      implementation_source: 'PAPER_EXACT',
    })
  }

  return {
    analysis_id: `analysis_${Date.now()}`,
    profile: 'paper_2017',
    method,
    sequence_length: sequence.length,
    total_duration: sequence.length * durationPerBase,
    events,
  }
}

/** Dynamic Pairwise Alignment & Difference Detection */
export function alignAndCompareSequences(refSeq: string, sampleSeq: string): {
  differences: DifferenceInfo[]
  alignment: AlignmentInfo
} {
  const differences: DifferenceInfo[] = []
  const maxLen = Math.max(refSeq.length, sampleSeq.length)
  let matches = 0
  let mismatches = 0
  let insertions = 0
  let deletions = 0

  for (let i = 0; i < maxLen; i++) {
    const r = refSeq[i] || null
    const s = sampleSeq[i] || null

    if (r === s && r !== null) {
      matches++
    } else if (r !== null && s !== null && r !== s) {
      mismatches++
      differences.push({
        position: i + 1,
        type: 'substitution',
        referenceBase: r,
        sampleBase: s,
        context: `${r} → ${s}`,
      })
    } else if (r === null && s !== null) {
      insertions++
      differences.push({
        position: i + 1,
        type: 'insertion',
        referenceBase: null,
        sampleBase: s,
        context: `Ins ${s}`,
      })
    } else if (r !== null && s === null) {
      deletions++
      differences.push({
        position: i + 1,
        type: 'deletion',
        referenceBase: r,
        sampleBase: null,
        context: `Del ${r}`,
      })
    }
  }

  const identity = maxLen > 0 ? parseFloat((matches / maxLen).toFixed(3)) : 1.0

  return {
    differences,
    alignment: {
      alignedReference: refSeq,
      alignedSample: sampleSeq,
      identity,
      matchCount: matches,
      mismatchCount: mismatches,
      insertionCount: insertions,
      deletionCount: deletions,
      length: maxLen,
    },
  }
}
