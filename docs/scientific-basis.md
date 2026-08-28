# Scientific Basis: AudiGene

This document separates what is **directly supported by the paper** from **AudiGene adaptations** and **AudiGene innovations**.

**Source paper:** Temple, M. D. (2017). *An auditory display tool for DNA sequence analysis.* BMC Bioinformatics.

---

## A. Directly Supported by the Paper

These features are explicitly described, implemented, or stated as part of the original work.

### A1. Nucleotide-to-Pitch Mapping

The paper defines a specific mapping from each nucleotide to a musical pitch using equal temperament:

| Nucleotide | Note | Frequency |
|------------|------|-----------|
| A | C4 | 262 Hz |
| C | E4 | 330 Hz |
| G | G4 | 392 Hz |
| T | C5 | 523 Hz |

These form a C major chord (C-E-G-C). The paper states this mapping is arbitrary but uses it consistently across multiple sonification methods.

**Evidence:** Figure 1 in the paper.

### A2. Five Sonification Methods

The paper describes exactly five methods:

1. **Nucleotide Chroma** — sequential playback, 100ms per nucleotide
2. **DNA Chords** — 3 nucleotides played simultaneously as a chord, 100ms per chord
3. **Nucleotide Rhythm** — sequential playback with rhythmic emphasis on every 3rd nucleotide
4. **DNA Walking** — interval-based transitions between nucleotides
5. **Codon Walking** — interval-based with reading frame awareness

**Evidence:** Methods section, Figures 1-4.

### A3. Reading Frame Handling

Reading frames are defined by the **start codon ATG**. The sonification tool identifies the start codon and uses it to establish reading frame boundaries. Multiple reading frames can be played simultaneously.

**Evidence:** Abstract, Methods section.

### A4. Start/Stop Codon Treatment (within Codon Walking)

The paper describes start/stop codon treatment as part of the Codon Walking method, NOT as a standalone method:

> "In each of these methods start codons (ATG) are assigned a higher pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."

**Classification: PAPER_QUALITATIVE** — the paper states a qualitative principle ("higher pitch", "lower pitch") but does NOT specify exact frequencies, intervals, or octaves.

**Evidence:** Methods section, Codon Walking subsection (page 5).

### A6. DNA Walking Intervals

The paper provides a complete 4x4 matrix of musical intervals between all 16 possible nucleotide transitions. Intervals range from unison (0 semitones) to major 6th (9 semitones).

**Evidence:** Methods section.

### A7. Reading Frame Amino Acid Chords (Multi-frame)

Simultaneous playback of multiple reading frames, with increasing chord complexity:
- Frame 1: 1 pitch
- Frame 2: 2 pitches added
- Frame 3: 3 pitches added

**Evidence:** Methods section.

### A8. Biological Purpose

The sonification is designed to help researchers perceive:
- Reading frame structure
- Start codon positions
- Stop codon positions
- Nucleotide composition patterns

**Evidence:** Abstract, Discussion.

### A9. Equal Temperament Scale

All pitch calculations use the equal temperament scale. The paper specifies this explicitly.

**Evidence:** Methods section.

### A10. 100ms Event Duration

In Nucleotide Chroma and DNA Chords, each event is heard for 100 milliseconds.

**Evidence:** Methods section.

### A11. Five Sonification Methods (not six)

The paper describes exactly five methods:
1. Nucleotide Chroma
2. DNA Chords
3. Nucleotide Rhythm
4. DNA Walking
5. Codon Walking (includes start/stop treatment)

**Start/Stop is NOT a sixth method.** It is a qualitative modifier within Codon Walking.

---

## B. AudiGene Adaptations

These are engineering changes needed to implement the paper's concepts in a modern web application. They do not change the scientific mapping.

### B1. Browser Audio Instead of SDL/FMOD

The original tool uses SDL with FMOD for audio output. AudiGene will use the **Web Audio API** (or Tone.js) in the browser. This is a platform adaptation, not a scientific change.

**Rationale:** Modern web deployment requires browser-native audio.

### B2. React/TypeScript Frontend Instead of Custom Perl GUI

The original tool has a custom Perl GUI. AudiGene will use React + TypeScript + Vite. This is a UI framework adaptation.

**Rationale:** Modern web application standards.

### B3. Canvas/D3.js Frequency Graph Instead of Flash

The original tool uses a Flash-based graph. AudiGene will use HTML Canvas or D3.js. Flash is deprecated.

**Rationale:** Flash is no longer supported in any modern browser.

### B4. REST API Backend Instead of Desktop Application

The original tool runs as a desktop application. AudiGene will expose a FastAPI REST backend. This enables client-server architecture for web deployment.

**Rationale:** Web application architecture requires API-based communication.

### B5. JSON Event Timeline

The original tool generates audio directly. AudiGene will create an intermediate JSON event representation between biological analysis and audio rendering. This is an engineering separation of concerns.

**Rationale:** Enables traceability, debugging, and re-rendering.

### B6. Structured Difference Model

The original tool does not compare sequences. AudiGene will add a structured difference model (substitution/insertion/deletion) for sequence comparison. This is an engineering requirement for the comparison feature.

**Rationale:** The comparison feature requires a structured difference representation.

### B7. FASTA Input Support

The original tool has a FASTA import. AudiGene will implement FASTA parsing using Biopython. This is a format adaptation.

**Rationale:** FASTA is a standard bioinformatics format.

### B8. Pairwise Alignment

The original tool does not perform sequence alignment. AudiGene will add pairwise alignment for sequence comparison. This is an engineering addition for the comparison feature.

**Rationale:** Comparing two sequences requires alignment.

---

## C. AudiGene Interpretations

These are explicit AudiGene choices made to implement the paper's qualitative guidelines with specific audio parameters. They are NOT paper specifications.

### C1. Start Codon Pitch Shift

**Paper rule (PAPER_QUALITATIVE):** "start codons (ATG) are assigned a higher pitch"
**AudiGene interpretation:** +12 semitones (one octave above the nucleotide's base pitch)
**Classification:** AUDIGENE_INTERPRETATION

The paper does not specify how much higher. We chose one octave (+12 semitones) for clear auditory distinction. This is a reasonable but arbitrary choice.

### C2. Stop Codon Pitch Shift

**Paper rule (PAPER_QUALITATIVE):** "stop codons (TAA, TAG, TGA) are assigned a lower pitch"
**AudiGene interpretation:** -12 semitones (one octave below the nucleotide's base pitch)
**Classification:** AUDIGENE_INTERPRETATION

The paper does not specify how much lower. We chose one octave (-12 semitones) for clear auditory distinction. This is a reasonable but arbitrary choice.

### C3. Start/Stop Event Duration

**Paper rule:** Not specified
**AudiGene interpretation:** 300ms (three times the standard 100ms nucleotide duration)
**Classification:** AUDIGENE_INNOVATION

---

## D. AudiGene Innovations

These are new features that go beyond the original paper. They are NOT claimed as part of the original work.

### C1. Sequence Comparison (Reference vs Sample)

The ability to load a reference and sample sequence, align them, and detect differences. This is not part of the original paper.

**Rationale:** Extends sonification from single-sequence exploration to comparative genomics.

### C2. Difference Overlay Sonification

An additional sonification layer that encodes sequence differences (substitutions, insertions, deletions) on top of the baseline paper-derived sonification. The exact AudiGene mapping for this layer will be:

- **Substitution:** pitch offset + timbre change (e.g., detuned or brightened)
- **Insertion:** additional transient note + amplitude increase
- **Deletion:** silence gap + amplitude decrease

This is explicitly an AudiGene innovation and must be clearly marked as such.

### C3. Frequency/Note Graph with Playback Cursor

A synchronized visual graph showing the frequency encoding over sequence position, with a playback cursor. The original tool has a Flash-based graph, but AudiGene's interactive synchronized graph is a new implementation.

### C4. Event Explanation System ("Why did I hear that?")

The ability to click an event and receive a structured explanation of why that sound occurred, tracing back through the analysis chain. The original tool does not have this feature.

### C5. Provenance Tracking

Recording the full computational chain from input → analysis → sonification → audio event. The original tool does not track provenance.

### C6. LLM Agent Orchestration

Using an LLM (Claude) to understand user requests, select tools, and explain results. This is entirely an AudiGene innovation.

### C7. Interactive Event Selection and Navigation

Clicking on a sonification event to jump playback to that position, with synchronized visual and audio state. The original tool has basic playback controls but not interactive event-driven navigation.

### C8. Multiple Sonification Profiles

The ability to switch between different sonification profiles (paper-derived and AudiGene-derived) at runtime. The original tool has a fixed set of methods but not a pluggable profile system.

### C9. Sequence Viewer with Highlighting

An interactive sequence viewer showing aligned sequences with color-coded matches, substitutions, insertions, and deletions. The original tool has a scrolling text display but not a color-coded alignment viewer.

### C10. Evaluation Framework

A structured framework for evaluating whether sonification helps users detect biological events. The paper does not include a user evaluation study.

### C11. Docker Deployment

Containerized deployment via Docker. The original tool is a downloadable desktop application.

### C12. Automated Reproducibility Testing

Tests that verify the same input produces the same sonification events. The paper does not describe automated testing.

---

## E. Unresolved Questions / Ambiguities

These aspects of the paper are unclear or unspecified:

### E1. Exact Duration for Rhythm Method

The paper describes "short-short-long" rhythm but does not specify exact durations (e.g., 60ms-60ms-180ms or other values). We will need to choose values and document them.

### E2. Pitch Values for Start/Stop Markers

The paper states start codons get "higher pitch" and stop codons get "lower pitch" but does not specify exact frequency values. We will need to define these and document them as AudiGene choices.

### E3. DNA Walking Starting Note

The paper states "The first note is arbitrary and need not be C" but uses C4 (262 Hz) as the default. AudiGene will use C4 as the default starting note.

### E4. Multi-frame Chord Voicing

The paper describes playing multiple frames simultaneously but does not specify exact voicing (which pitch from each frame is used). We will need to define this.

### E5. Amplitude/Volume

The paper does not specify amplitude values for any sonification method. We will use consistent default values.

### E6. Instrument/Timbre

The paper does not specify instrument or timbre choices. We will use a neutral default (e.g., sine wave or simple oscillator) for paper reproduction mode.

---

## F. Summary Table

| Feature | Paper Support | Fidelity Label |
|---------|--------------|----------------|
| Nucleotide-to-pitch (C major) | Explicit (Table 3, Figure 1) | PAPER_EXACT |
| 100ms event duration (Chords/Chroma) | Explicit | PAPER_EXACT |
| 5 sonification methods | Explicit | PAPER_EXACT |
| Reading frame via ATG | Explicit | PAPER_EXACT |
| DNA Walking intervals (4×4 matrix) | Explicit (Table 1) | PAPER_EXACT |
| Multi-frame chords (1→2→3) | Explicit (Figure 5) | PAPER_EXACT |
| Equal temperament | Explicit | PAPER_EXACT |
| Start codon = higher pitch | Explicit (qualitative) | PAPER_QUALITATIVE |
| Stop codon = lower pitch | Explicit (qualitative) | PAPER_QUALITATIVE |
| Nucleotide Rhythm durations | Qualitative (short-short-long) | PAPER_QUALITATIVE |
| Start codon +12 semitones | Not in paper | AUDIGENE_INTERPRETATION |
| Stop codon -12 semitones | Not in paper | AUDIGENE_INTERPRETATION |
| Start/stop 300ms duration | Not in paper | AUDIGENE_INTERPRETATION |
| Browser audio (Web Audio API) | Not in paper | AUDIGENE_INNOVATION |
| React/TypeScript frontend | Not in paper | AUDIGENE_INNOVATION |
| Canvas/D3.js graph | Not in paper (Flash used) | AUDIGENE_INNOVATION |
| REST API backend | Not in paper | AUDIGENE_INNOVATION |
| JSON event timeline | Not in paper | AUDIGENE_INNOVATION |
| Pairwise alignment | Not in paper | AUDIGENE_INNOVATION |
| Sequence comparison | Not in paper | AUDIGENE_INNOVATION |
| Difference overlay | Not in paper | AUDIGENE_INNOVATION |
| Event explanation | Not in paper | AUDIGENE_INNOVATION |
| Provenance tracking | Not in paper | AUDIGENE_INNOVATION |
| LLM agent | Not in paper | AUDIGENE_INNOVATION |
| Interactive navigation | Not in paper | AUDIGENE_INNOVATION |
| Multiple profiles | Not in paper | AUDIGENE_INNOVATION |
| Evaluation framework | Not in paper | AUDIGENE_INNOVATION |
