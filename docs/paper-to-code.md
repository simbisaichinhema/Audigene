# Paper-to-Code Matrix

Maps every significant paper feature to AudiGene modules, tests, and status.

**Source:** Temple, M. D. (2017). *An auditory display tool for DNA sequence analysis.* BMC Bioinformatics.

---

## 1. Core Mappings

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| Nucleotide-to-pitch: A=262Hz, C=330Hz, G=392Hz, T=523Hz | Figure 1, Methods | `sonification/paper_2017/nucleotide_chroma.py` | `tests/paper_reproduction/test_nucleotide_chroma.py` | PENDING |
| Equal temperament scale | Methods | `sonification/paper_2017/nucleotide_chroma.py` | `tests/paper_reproduction/test_nucleotide_chroma.py` | PENDING |
| C major chord structure (C-E-G-C) | Figure 1, Methods | `sonification/paper_2017/nucleotide_chroma.py` | `tests/paper_reproduction/test_nucleotide_chroma.py` | PENDING |
| 100ms event duration | Methods | `sonification/paper_2017/nucleotide_chroma.py` | `tests/paper_reproduction/test_nucleotide_chroma.py` | PENDING |
| Sequential playback (one nucleotide at a time) | Methods, Figure 1 | `sonification/paper_2017/nucleotide_chroma.py` | `tests/paper_reproduction/test_nucleotide_chroma.py` | PENDING |

## 2. DNA Chords

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| 3 nucleotides played simultaneously | Methods, Figure 2 | `sonification/paper_2017/dna_chords.py` | `tests/paper_reproduction/test_dna_chords.py` | PENDING |
| Same pitch mapping as Nucleotide Chroma | Methods | `sonification/paper_2017/dna_chords.py` | `tests/paper_reproduction/test_dna_chords.py` | PENDING |
| 100ms per chord | Methods | `sonification/paper_2017/dna_chords.py` | `tests/paper_reproduction/test_dna_chords.py` | PENDING |
| Non-overlapping triplets | Methods | `sonification/paper_2017/dna_chords.py` | `tests/paper_reproduction/test_dna_chords.py` | PENDING |

## 3. Nucleotide Rhythm

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| Short-short-long pattern per triplet | Methods, Figure 3 | `sonification/paper_2017/nucleotide_rhythm.py` | `tests/paper_reproduction/test_nucleotide_rhythm.py` | PENDING |
| Emphasis on every 3rd nucleotide | Methods | `sonification/paper_2017/nucleotide_rhythm.py` | `tests/paper_reproduction/test_nucleotide_rhythm.py` | PENDING |
| Same pitch mapping as Nucleotide Chroma | Methods | `sonification/paper_2017/nucleotide_rhythm.py` | `tests/paper_reproduction/test_nucleotide_rhythm.py` | PENDING |
| Exact durations: AMBIGUOUS | Methods (qualitative only) | `sonification/paper_2017/nucleotide_rhythm.py` | `tests/paper_reproduction/test_nucleotide_rhythm.py` | PENDING — requires AudiGene choice |

## 4. DNA Walking

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| Interval-based transitions | Methods, Figure 4 | `sonification/paper_2017/dna_walking.py` | `tests/paper_reproduction/test_dna_walking.py` | PENDING |
| 4x4 interval matrix (16 transitions) | Methods | `sonification/paper_2017/dna_walking.py` | `tests/paper_reproduction/test_dna_walking.py` | PENDING |
| Starting note: C4 (262 Hz) | Methods | `sonification/paper_2017/dna_walking.py` | `tests/paper_reproduction/test_dna_walking.py` | PENDING |
| Equal temperament intervals | Methods | `sonification/paper_2017/dna_walking.py` | `tests/paper_reproduction/test_dna_walking.py` | PENDING |
| Specific interval assignments | Methods (full matrix) | `sonification/paper_2017/dna_walking.py` | `tests/paper_reproduction/test_dna_walking.py` | PENDING |

## 5. Codon Walking

| Paper Feature | Evidence/Location | AudiGene Module | Test | Fidelity |
|---------------|-------------------|-----------------|------|----------|
| Interval-based with reading frame awareness | Methods | `sonification/paper_2017/codon_walking.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_DERIVED (hybrid) |
| Reading frame defined by ATG start codon | Methods | `sonification/paper_2017/codon_walking.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_EXACT |
| Same interval matrix as DNA Walking | Methods | `sonification/paper_2017/codon_walking.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_EXACT |
| Only plays nucleotides within reading frame codons | Methods | `sonification/paper_2017/codon_walking.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_DERIVED |
| Start codon → higher pitch | Methods (qualitative) | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Stop codon → lower pitch | Methods (qualitative) | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Amino acid → pitch (Table 7) | Methods | NOT YET IMPLEMENTED | — | PAPER_EXACT (unimplemented) |

## 6. Reading Frame Amino Acid Chords

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| Simultaneous multi-frame playback | Methods | `sonification/paper_2017/reading_frame_chords.py` | `tests/paper_reproduction/test_reading_frame_chords.py` | PENDING |
| Frame 1: 1 pitch | Methods | `sonification/paper_2017/reading_frame_chords.py` | `tests/paper_reproduction/test_reading_frame_chords.py` | PENDING |
| Frame 2: 2 pitches added | Methods | `sonification/paper_2017/reading_frame_chords.py` | `tests/paper_reproduction/test_reading_frame_chords.py` | PENDING |
| Frame 3: 3 pitches added | Methods | `sonification/paper_2017/reading_frame_chords.py` | `tests/paper_reproduction/test_reading_frame_chords.py` | PENDING |
| Voicing: AMBIGUOUS | Methods (qualitative only) | `sonification/paper_2017/reading_frame_chords.py` | `tests/paper_reproduction/test_reading_frame_chords.py` | PENDING — requires AudiGene choice |

## 7. Start/Stop Handling (component of Codon Walking)

**NOT a standalone method.** This is a qualitative modifier within Codon Walking (Section 5 above).

| Paper Feature | Evidence/Location | AudiGene Module | Test | Fidelity |
|---------------|-------------------|-----------------|------|----------|
| ATG = start codon marker (higher pitch) | Methods (Codon Walking) | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_QUALITATIVE |
| TAA/TAG/TGA = stop codon markers (lower pitch) | Methods (Codon Walking) | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | PAPER_QUALITATIVE |
| +12 semitone shift for start | Not in paper | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | AUDIGENE_INTERPRETATION |
| -12 semitone shift for stop | Not in paper | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | AUDIGENE_INTERPRETATION |
| 300ms event duration | Not in paper | `sonification/paper_2017/start_stop.py` | `tests/paper_reproduction/test_other_methods.py` | AUDIGENE_INTERPRETATION |

## 8. Biological Analysis

| Paper Feature | Evidence/Location | AudiGene Module | Test | Status |
|---------------|-------------------|-----------------|------|--------|
| Nucleotide validation (A, C, G, T) | Implicit | `bioinformatics/sequence.py` | `tests/test_sequence.py` | PENDING |
| FASTA parsing | Mentioned (import feature) | `bioinformatics/sequence.py` | `tests/test_sequence.py` | PENDING |
| Codon parsing | Methods | `bioinformatics/codons.py` | `tests/test_codons.py` | PENDING |
| Reading frame detection | Methods | `bioinformatics/reading_frames.py` | `tests/test_reading_frames.py` | PENDING |
| Start codon detection (ATG) | Methods | `bioinformatics/codons.py` | `tests/test_codons.py` | PENDING |
| Stop codon detection (TAA, TAG, TGA) | Methods | `bioinformatics/codons.py` | `tests/test_codons.py` | PENDING |

## 9. AudiGene Innovations (Not in Paper)

| Feature | AudiGene Module | Test | Status |
|---------|-----------------|------|--------|
| Sequence alignment | `bioinformatics/alignment.py` | `tests/test_alignment.py` | PENDING |
| Difference detection (sub/ins/del) | `bioinformatics/variants.py` | `tests/test_variants.py` | PENDING |
| Difference overlay sonification | `sonification/audigene/difference_overlay.py` | `tests/test_difference_overlay.py` | PENDING |
| JSON event timeline | `sonification/events.py` + `sonification/timeline.py` | `tests/test_events.py` | PENDING |
| Event explanation ("Why did I hear that?") | `backend/app/services/explanation.py` | `tests/test_explanation.py` | PENDING |
| Provenance tracking | `backend/app/services/provenance.py` | `tests/test_provenance.py` | PENDING |
| LLM agent orchestration | `agent/graph.py` + `agent/tools.py` | `tests/test_agent.py` | PENDING |
| Interactive event navigation | `frontend/src/components/` | `frontend/tests/` | PENDING |
| Multiple sonification profiles | `sonification/profiles/` | `tests/test_profiles.py` | PENDING |
| Frequency/note graph | `frontend/src/components/` | `frontend/tests/` | PENDING |
| Sequence viewer with highlighting | `frontend/src/components/` | `frontend/tests/` | PENDING |
| Playback cursor synchronization | `frontend/src/components/` | `frontend/tests/` | PENDING |

---

## 10. Implementation Priority

### Phase 1: Bioinformatics Core (No AI)
1. `bioinformatics/sequence.py` — validation, FASTA parsing
2. `bioinformatics/codons.py` — codon parsing, start/stop detection
3. `bioinformatics/reading_frames.py` — reading frame detection
4. `bioinformatics/alignment.py` — pairwise alignment
5. `bioinformatics/variants.py` — difference detection

### Phase 2: Paper Sonification (Scientific Fidelity)
Five paper methods + AudiGene start/stop interpretation:
1. `sonification/paper_2017/nucleotide_chroma.py` — PAPER_EXACT
2. `sonification/paper_2017/dna_chords.py` — PAPER_EXACT
3. `sonification/paper_2017/nucleotide_rhythm.py` — PAPER_QUALITATIVE (durations)
4. `sonification/paper_2017/dna_walking.py` — PAPER_EXACT
5. `sonification/paper_2017/codon_walking.py` — PAPER_DERIVED (hybrid)
6. `sonification/paper_2017/reading_frame_chords.py` — PAPER_EXACT
7. `sonification/paper_2017/start_stop.py` — AUDIGENE_INTERPRETATION (component of Codon Walking)

### Phase 3: Event Model + Audio Engine
1. `sonification/events.py` — event schema
2. `sonification/timeline.py` — timeline generation
3. Frontend audio engine (Web Audio API)

### Phase 4: Frontend Visualization
1. Sequence viewer
2. Alignment viewer
3. Frequency/note graph
4. Event timeline
5. Playback controls + synchronization

### Phase 5: AudiGene Extensions
1. Difference overlay sonification
2. Event explanation system
3. Provenance tracking
4. Multiple profiles

### Phase 6: Agent
1. LangGraph agent
2. Deterministic tools
3. Claude integration
4. Structured state

### Phase 7: Evaluation
1. Benchmark sequences
2. Reproducibility tests
3. User evaluation framework

---

## 11. Deviations from Paper

Any deviation from the paper's exact specifications must be documented here.

| Deviation | Paper Spec | AudiGene Choice | Fidelity Label |
|-----------|-----------|-----------------|----------------|
| Audio backend | SDL/FMOD | Web Audio API | AUDIGENE_INNOVATION |
| GUI framework | Perl custom GUI | React/TypeScript | AUDIGENE_INNOVATION |
| Graph technology | Flash | Canvas/D3.js | AUDIGENE_INNOVATION |
| Event duration (rhythm) | Qualitative short-short-long | 75ms / 225ms | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Start/stop pitch | Qualitative higher/lower | ±12 semitones | PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION |
| Multi-frame voicing | Qualitative (1→2→3 pitches) | All pitches from Nucleotide Chroma mapping | PAPER_DERIVED |
| Instrument/timbre | Not specified | Sine wave | AUDIGENE_INNOVATION |
| Amplitude | Not specified | 0.5 | AUDIGENE_INNOVATION |
