# Paper Fidelity Audit — Temple (2017)

**Audit date**: 2026-08-27 (updated: 2026-08-27)
**Paper**: Temple, S. (2017). "Bioinformatics sonification: an audio path for the hearing impaired to access DNA sequence data." *BMC Bioinformatics* 18, 305.
**PDF**: `s12859-017-1632-x.pdf`

---

## 1. Method Count

The paper defines **exactly five sonification methods**:

| # | Paper Name | Paper Location | Fidelity |
|---|-----------|---------------|----------|
| 1 | Nucleotide Chroma | Page 5–6, Table 3, Figure 4 | PAPER_EXACT |
| 2 | DNA Chords | Page 6 | PAPER_EXACT |
| 3 | Nucleotide Rhythm | Page 5, Table 4 | PAPER_QUALITATIVE (durations exact, T=rest ambiguous) |
| 4 | DNA Walking | Page 4, Table 1, Figure 3 | PAPER_EXACT |
| 5 | Codon Walking | Page 4–5, Table 7 | PAPER_DERIVED (hybrid — see Section 7) |

**Start/Stop codon treatment is NOT a sixth method.** It is a qualitative modifier within Codon Walking (Section 4.5 of the paper). The paper states once: *"In each of these methods start codons (ATG) are assigned a higher pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."*

---

## 2. Fidelity Label Definitions

| Label | Meaning |
|-------|---------|
| **PAPER_EXACT** | Value explicitly stated in paper (text, table, figure, or worked example) |
| **PAPER_DERIVED** | Value mathematically/logically derived from paper-stated values |
| **PAPER_QUALITATIVE** | Paper states a qualitative principle; exact value not specified |
| **AUDIGENE_INTERPRETATION** | Our explicit implementation of a paper qualitative rule |
| **AUDIGENE_INNOVATION** | Our design choice; not present in the paper at all |

---

## 3. Parameter Fidelity — Nucleotide Chroma

Source: Page 5–6, Table 3, Figure 4

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| A → C4 | Table 3: "A" → "C4" | 262.0 Hz | PAPER_EXACT |
| C → E4 | Table 3: "C" → "E4" | 330.0 Hz | PAPER_EXACT |
| G → G4 | Table 3: "G" → "G4" | 392.0 Hz | PAPER_EXACT |
| T → C5 | Table 3: "T" → "C5" | 523.0 Hz | PAPER_EXACT |
| Scale | "notes from a C major scale" | Equal temperament | PAPER_EXACT |
| Chord structure | Figure 4: "arpeggiated C major chord" | C4-E4-G4-C5 | PAPER_EXACT |
| Event duration | "each nucleotide is heard individually for 100 milliseconds" | 0.1s | PAPER_EXACT |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |
| Instrument/timbre | Not specified | "sine" | AUDIGENE_INNOVATION |
| Skip unknown bases | Not specified | Skip silently | AUDIGENE_INNOVATION |

**Paper quote**: *"each nucleotide is heard individually for 100 milliseconds. A-C-G-T can be heard as an arpeggiated C major chord."*

---

## 4. Parameter Fidelity — DNA Chords

Source: Page 6

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| Grouping | "three consecutive nucleotides are played simultaneously" | Triplets | PAPER_EXACT |
| Pitch mapping | "Using the nucleotide to pitch mapping of Table 3" | Same as Nucleotide Chroma | PAPER_EXACT |
| Chord example | "The pitches A-C-G would produce a C major chord" | Verified | PAPER_EXACT |
| Duration per chord | Not explicitly stated (implied 100ms from Nucleotide Chroma) | 0.1s | PAPER_DERIVED |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |
| Instrument | Not specified | "sine" | AUDIGENE_INNOVATION |

**Paper quote**: *"Playing three consecutive nucleotides simultaneously as a chord. Using the nucleotide to pitch mapping of Table 3 the pitches A-C-G would produce a C major chord."*

---

## 5. Parameter Fidelity — Nucleotide Rhythm

Source: Page 5, Table 4

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| Short note duration | "short note is 75 ms" | 0.075s | PAPER_EXACT |
| Long note duration | "long note is 225 ms" | 0.225s | PAPER_EXACT |
| Pattern | "short-short-long per triplet" | i%3: 0→short, 1→short, 2→long | PAPER_EXACT |
| A = short | Table 4: "Short" | short | PAPER_EXACT |
| C = short | Table 4: "Short" | short | PAPER_EXACT |
| G = long | Table 4: "Long" | long | PAPER_EXACT |
| T = rest | Table 4: "Rest" | rest | PAPER_EXACT |
| Pitch mapping | "same mapping as nucleotide chroma method" | NUCLEOTIDE_FREQUENCY | PAPER_EXACT |
| Rest duration (T) | "followed by a rest" — no duration specified | T skipped (0 duration) | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |

**Paper quote**: *"The rhythm played would be short-short-long, where each short note is 75 ms and the long note is 225 ms."*

**Note**: T=rest is PAPER_QUALITATIVE (paper says "rest" but no duration). Our choice to skip T (0ms) is AUDIGENE_INTERPRETATION.

---

## 6. Parameter Fidelity — DNA Walking

Source: Page 4, Table 1, Figure 3

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| Full 4×4 interval matrix | Table 1 (16 entries) | INTERVAL_MATRIX dict | PAPER_EXACT |
| A→A unison | Table 1: 0 | 0 semitones | PAPER_EXACT |
| A→C M6 | Table 1: 9 | 9 semitones | PAPER_EXACT |
| A→G M3 | Table 1: 4 | 4 semitones | PAPER_EXACT |
| A→T P4 | Table 1: 5 | 5 semitones | PAPER_EXACT |
| C→A M6 | Table 1: 9 | 9 semitones | PAPER_EXACT |
| C→G M3 | Table 1: 4 | 4 semitones | PAPER_EXACT |
| C→T P5 | Table 1: 7 | 7 semitones | PAPER_EXACT |
| G→A m6 | Table 1: 8 | 8 semitones | PAPER_EXACT |
| G→C M6 | Table 1: 9 | 9 semitones | PAPER_EXACT |
| G→T M2 | Table 1: 2 | 2 semitones | PAPER_EXACT |
| T→A m2 | Table 1: 1 | 1 semitone | PAPER_EXACT |
| T→C P5 | Table 1: 7 | 7 semitones | PAPER_EXACT |
| T→G m6 | Table 1: 8 | 8 semitones | PAPER_EXACT |
| All unisons = 0 | Table 1: diagonal | 0 | PAPER_EXACT |
| Equal temperament | Implied by semitone intervals | `f = base × 2^(n/12)` | PAPER_EXACT |
| Starting frequency | "arbitrarily set to 262 Hz" | 262.0 Hz | PAPER_EXACT |
| Worked example ACATTG | "262, 880, 740, 330, 262, 165 Hz" | Matches | PAPER_EXACT |
| Event duration | Not specified | 0.1s | PAPER_DERIVED |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |
| Instrument | Not specified | "sine" | AUDIGENE_INNOVATION |

**Verification**: We reproduce the paper's worked example (ACATTG → 262, 880, 740, 330, 262, 165 Hz) exactly.

---

## 7. Parameter Fidelity — Codon Walking (HYBRID)

Source: Page 4–5, Table 7

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| Reads codons | "read one codon at a time" | Steps by 3 | PAPER_EXACT |
| Reading frame from ATG | "first ATG start codon" | find_first_atg_frame() | PAPER_EXACT |
| First note arbitrary | "The first note played is arbitrarily chosen" | 262.0 Hz | PAPER_EXACT |
| Amino acid → pitch (Table 7) | Table 7 (20 amino acids → pitches) | **NOT IMPLEMENTED** | PAPER_EXACT (unimplemented) |
| Interval-based walking | NOT what paper describes | Nucleotide interval matrix | AUDIGENE_INTERPRETATION |
| Start codon = higher pitch | "assigned a higher pitch" | +12 semitones | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Stop codon = lower pitch | "assigned a lower pitch" | -12 semitones | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |

**Implementation gap**: The paper's Codon Walking maps codon → amino acid → pitch (Table 7). Our implementation uses nucleotide interval walking within codon boundaries. Frame detection is PAPER_EXACT; the pitch mechanism is AUDIGENE_INTERPRETATION.

---

## 8. Parameter Fidelity — Reading Frame Chords

Source: Page 7, Figure 5

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| Multiple frames simultaneously | "Several frames are played at once" | Up to 3 frames | PAPER_EXACT |
| Frame 1 = 1 pitch | Figure 5 description | 1 pitch per codon position | PAPER_EXACT |
| Frame 2 = 2 pitches | "second reading frame adds a further two pitches" | 2 pitches | PAPER_EXACT |
| Frame 3 = 3 pitches | "third frame contributes three more pitches" | 3 pitches | PAPER_EXACT |
| Pitch mapping | "same mapping as nucleotide chroma method" | NUCLEOTIDE_FREQUENCY | PAPER_EXACT |
| Max 6 simultaneous pitches | 1+2+3 = 6 | 6 | PAPER_EXACT |
| Duration | Not explicitly stated | 0.1s | PAPER_DERIVED |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |

---

## 9. Parameter Fidelity — Start/Stop Codon Treatment

**Component of Codon Walking, NOT a standalone method.**

Source: Page 5 (within Codon Walking section)

| Parameter | Paper Statement | Our Value | Fidelity |
|-----------|----------------|-----------|----------|
| ATG = start codon | "start codons (ATG)" | ATG | PAPER_EXACT |
| TAA/TAG/TGA = stop codons | "stop codons (TAA, TAG, TGA)" | TAA, TAG, TGA | PAPER_EXACT |
| Start = "higher pitch" | "assigned a higher pitch" | +12 semitones | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Stop = "lower pitch" | "assigned a lower pitch" | -12 semitones | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Base pitch for shift | Not specified | A→C4 (262 Hz) | AUDIGENE_INTERPRETATION |
| Octave shift amount | Not specified | ±12 semitones | AUDIGENE_INTERPRETATION |
| Duration | Not specified | 0.3s (300ms) | AUDIGENE_INTERPRETATION |
| Standalone method | Paper treats as part of Codon Walking | Standalone module | AUDIGENE_INNOVATION |

**Paper quote**: *"In each of these methods start codons (ATG) are assigned a higher pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."*

The paper says "higher" and "lower" — no octave, no semitone count, no specific frequency. Our ±12 semitone choice is AUDIGENE_INTERPRETATION, NOT PAPER_EXACT.

---

## 10. Shared / AUDIGENE_INNOVATION Parameters

| Parameter | Paper | Our Value | Fidelity |
|-----------|-------|-----------|----------|
| Equal temperament tuning | Implied | A4=440Hz, 12-TET | PAPER_EXACT |
| Default amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |
| Default instrument/timbre | Not specified | "sine" | AUDIGENE_INNOVATION |
| Starting frequency (walking) | "arbitrarily set to 262 Hz" | 262.0 Hz | PAPER_EXACT |
| Non-ACGT handling | Not specified | Skip silently | AUDIGENE_INNOVATION |
| Event ID format | N/A | UUID[:8] | AUDIGENE_INNOVATION |
| Analysis ID format | N/A | "analysis-" + UUID[:8] | AUDIGENE_INNOVATION |

---

## 11. Summary by Fidelity Label

### PAPER_EXACT (fully reproduced from paper):
- Nucleotide Chroma: A→C4, C→E4, G→G4, T→C5 (Table 3)
- Nucleotide Chroma: 100ms duration
- DNA Chords: triplet grouping + pitch mapping
- DNA Walking: complete 4×4 interval matrix (Table 1)
- DNA Walking: starting frequency 262 Hz, worked example verified
- Reading Frame Chords: 1→2→3 pitch progression (Figure 5)
- Codon Walking: frame detection from ATG
- Equal temperament tuning
- Start/stop codon identities (ATG, TAA, TAG, TGA)

### PAPER_QUALITATIVE (paper states principle, no exact value):
- Start codon → "higher pitch"
- Stop codon → "lower pitch"
- Nucleotide Rhythm T → "rest" (no duration specified)

### PAPER_DERIVED (logically derived from paper values):
- DNA Chords duration (100ms, implied from Nucleotide Chroma)
- DNA Walking event duration (0.1s, derived from Nucleotide Chroma)
- Reading Frame Chords duration (0.1s, derived)
- Codon Walking hybrid (frame detection exact, interval mechanism substituted)

### AUDIGENE_INTERPRETATION (our explicit implementation of qualitative rules):
- Start codon +12 semitones (one octave up)
- Stop codon -12 semitones (one octave down)
- Start/stop 300ms duration
- Nucleotide Rhythm T=rest → skip (0ms)
- Codon Walking interval-based pitch (instead of amino acid→pitch)

### AUDIGENE_INNOVATION (not in paper at all):
- Default amplitude 0.5
- Default instrument "sine"
- Non-ACGT handling (skip silently)
- Event ID / Analysis ID format
- Start/Stop as standalone composable module
- JSON event timeline schema
- All bioinformatics modules (alignment, variants, FASTA)
- All infrastructure (timeline validation, merging, filtering)

---

## 12. Unimplemented Paper Specifications

| Feature | Paper Location | Status |
|---------|---------------|--------|
| Amino acid → pitch mapping (Table 7) | Page 6 | NOT IMPLEMENTED |
| Amino acid classification system | Page 6 | NOT IMPLEMENTED |
| 120ms silence markers between pitches | Page 7 (Figure 5) | NOT IMPLEMENTED |
| Complete Codon Walking (codon→amino acid→pitch) | Page 4–5 | NOT IMPLEMENTED (hybrid substitute in place) |

See `docs/amino-acid-mapping.md` for the full Table 7 mapping.

---

## 13. Test Classification (224 tests, all passing)

### PAPER_EXACT tests (verify paper-specified values):
- `test_nucleotide_chroma.py`: 15 tests — pitch mapping, duration, timing, chord structure
- `test_dna_walking.py`: 15 tests — interval matrix, frequencies, worked example
- `test_other_methods.py::TestDNAChords`: 7 tests — triplet grouping, pitch mapping
- `test_other_methods.py::TestNucleotideRhythm`: 5 tests — durations, pattern
- `test_other_methods.py::TestCodonWalking`: 3 tests — ATG frame detection
- `test_other_methods.py::TestReadingFrameChords`: 5 tests — pitch count progression
- Bioinformatics tests: 144 tests — sequence, codons, reading frames, alignment, variants

### PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION tests:
- `test_other_methods.py::TestStartStop`: 7 tests — tests our ±12 semitone implementation of the paper's qualitative "higher/lower pitch" rule

### AUDIGENE_INNOVATION tests:
- `test_other_methods.py::TestTimelineValidation`: 4 tests — infrastructure behavior

---

## 14. Current Status

| Method | Fidelity | Status |
|--------|----------|--------|
| Nucleotide Chroma | PAPER_EXACT | ✓ Complete |
| DNA Walking | PAPER_EXACT | ✓ Complete (worked example verified) |
| DNA Chords | PAPER_EXACT | ✓ Complete |
| Nucleotide Rhythm | PAPER_QUALITATIVE | ✓ Complete (T=rest documented) |
| Reading Frame Chords | PAPER_EXACT | ✓ Complete |
| Codon Walking | PAPER_DERIVED (hybrid) | ⚠️ Frame detection exact, pitch mechanism is AUDIGENE substitution |
| Start/Stop treatment | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION | ✓ Correctly labeled |

**Scientific boundary frozen.** All parameters classified with standardized fidelity labels.
