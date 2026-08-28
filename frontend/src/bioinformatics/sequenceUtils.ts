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
  gene: string
  organism: string
  locus: string
  mutationType: string
  clinicalSignificance: string
  biologicalFunction: string
  icon: string
  ref: string
  sample: string
}

export const ACOUSTIC_DNA_PRESETS: DnaPreset[] = [
  {
    id: 'hbb_sickle',
    name: 'HBB — Sickle Cell Disease',
    gene: 'HBB (Hemoglobin Subunit Beta)',
    organism: 'Homo sapiens',
    locus: 'Chr 11p15.4',
    mutationType: 'Missense (E6V) — GAG→GTG substitution',
    clinicalSignificance: 'Pathogenic — causes Sickle Cell Anemia (OMIM #603903)',
    biologicalFunction: 'Encodes beta-globin chain of hemoglobin; critical for oxygen transport in erythrocytes. E6V mutation causes hemoglobin polymerization under low O₂.',
    icon: '🩸',
    ref: '>HBB_Reference_HbA | Homo sapiens | Chr11p15.4 | NM_000518.5\nATGGTGCACCTGACTCCTGAGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGTTGGTATCAAGGTTACAAGACAGGTTTAAGGAGACCAATAG',
    sample: '>HBB_Variant_HbS | E6V_Sickle | rs334\nATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGTTGGTATCAAGGTTACAAGACAGGTTTAAGGAGACCAATAG',
  },
  {
    id: 'brca1_exon',
    name: 'BRCA1 — Breast Cancer Susceptibility',
    gene: 'BRCA1 (BRCA1 DNA Repair Associated)',
    organism: 'Homo sapiens',
    locus: 'Chr 17q21.31',
    mutationType: 'Frameshift deletion — 185delAG',
    clinicalSignificance: 'Pathogenic — high-risk hereditary breast/ovarian cancer (OMIM #113705)',
    biologicalFunction: 'Tumor suppressor involved in DNA double-strand break repair via homologous recombination. Loss of function disrupts genomic stability and cell cycle checkpoint control.',
    icon: '🧬',
    ref: '>BRCA1_Exon2_Reference | Homo sapiens | Chr17q21.31 | NM_007294.4\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAGTGCACTTCCTGAAAATCGATATTTTATCTGCTCTTCGCGTTGAAGAAGTACAAAGTGCACTTCCTGAAAATCGATATTTTATCTGCTCTTCGCGTTGAA',
    sample: '>BRCA1_185delAG_Variant | Ashkenazi_founder | rs80357914\nATGGATTTATCTGCTCTTCGCGTTGAAGAAGTACAAAGTGCCTTCCTGAAAATCGATATTTTATCTGCTCTTCGCGTTGAAGAAGTACAAAGTGCACTTCCTGAAAATCGATATTTTATCTGCTCTTCGCGTTGAA',
  },
  {
    id: 'tp53_hotspot',
    name: 'TP53 — Li-Fraumeni Tumor Suppressor',
    gene: 'TP53 (Tumor Protein P53)',
    organism: 'Homo sapiens',
    locus: 'Chr 17p13.1',
    mutationType: 'Missense (R248W) — CGG→TGG substitution',
    clinicalSignificance: 'Pathogenic — Li-Fraumeni Syndrome, somatic driver in >50% of cancers (OMIM #191170)',
    biologicalFunction: 'Master tumor suppressor regulating cell cycle arrest, apoptosis, and DNA repair. R248W is a gain-of-function hotspot mutation in the DNA-binding domain, disrupting transcriptional activation of target genes.',
    icon: '🛡️',
    ref: '>TP53_Exon7_Reference | Homo sapiens | Chr17p13.1 | NM_000546.6\nATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTAC',
    sample: '>TP53_R248W_Variant | Somatic_Hotspot | rs28934578\nATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTATATGCAAGCTTTACGGCCATATGCGCAAGCTTTACGGCCATATGCGCAAGCTTTAC',
  },
  {
    id: 'htt_expansion',
    name: 'HTT — Huntington Disease CAG Repeat',
    gene: 'HTT (Huntingtin)',
    organism: 'Homo sapiens',
    locus: 'Chr 4p16.3',
    mutationType: 'Trinucleotide repeat expansion — CAG ×45 (normal ≤35)',
    clinicalSignificance: 'Pathogenic — Huntington Disease, autosomal dominant neurodegeneration (OMIM #143100)',
    biologicalFunction: 'Encodes huntingtin protein essential for neuronal function and intracellular transport. CAG expansion (>36 repeats) produces polyglutamine tract causing toxic protein aggregation in striatal neurons.',
    icon: '🧠',
    ref: '>HTT_Exon1_Normal | Homo sapiens | Chr4p16.3 | NM_002111.8 | CAG×25\nCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG',
    sample: '>HTT_Exon1_Expanded | Pathogenic | CAG×52\nCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG',
  },
  {
    id: 'egfr_lung',
    name: 'EGFR — Non-Small Cell Lung Cancer',
    gene: 'EGFR (Epidermal Growth Factor Receptor)',
    organism: 'Homo sapiens',
    locus: 'Chr 7p11.2',
    mutationType: 'In-frame deletion — Exon 19 del (ΔE746-A750)',
    clinicalSignificance: 'Oncogenic driver — NSCLC therapeutic target for TKIs (Erlotinib, Gefitinib) (OMIM #131550)',
    biologicalFunction: 'Transmembrane receptor tyrosine kinase driving cell proliferation via RAS-MAPK and PI3K-AKT pathways. Exon 19 deletion constitutively activates kinase domain, promoting uncontrolled epithelial cell growth.',
    icon: '🫁',
    ref: '>EGFR_Exon19_Reference | Homo sapiens | Chr7p11.2 | NM_005228.5\nGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGG',
    sample: '>EGFR_Exon19del_Variant | delE746-A750 | Somatic\nGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGAGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGGGCGCGCGCGCCCGGGCCCGGG',
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
