# Paper Analysis: Temple 2017

**Source:** Temple, M. D. (2017). *An auditory display tool for DNA sequence analysis.* BMC Bioinformatics.

**DOI:** [10.1186/s12859-017-1632-x](https://doi.org/10.1186/s12859-017-1632-x)

---

## 1. Research Problem

DNA sequence data is complex and multidimensional. Visual analysis of long DNA sequences is difficult. The paper asks: **can auditory display (sonification) provide a useful alternative or complementary modality for perceiving DNA sequence patterns?**

The core question driving the work:

> "Will an auditory representation of DNA sequence information be perceived and interpreted by the listener?"

The paper notes that while visual data display is dominant, auditory display has unique advantages: sound events are time-limited and can draw attention immediately, and audio can communicate rapidly changing parameters more effectively than visual plots in some contexts.

---

## 2. Motivation

The authors argue that DNA sequence analysis is "a complicated task that often requires the analysis of patterns and relationships in a multidimensional data set." They cite Mullen (2003) and Flowers & Bhatt (1999) on the difficulty of visual pattern recognition in large data sets, and Mullen (2002) on the fact that "what can be seen in a visual display is determined by the attention of the observer."

Auditory display offers:
- A complementary modality to visual analysis
- Immediate attention to time-limited sound events
- Potential to communicate rapidly changing parameters
- A way to make reading frame and start/stop codon patterns perceivable

The specific biological problem the tool addresses: identifying reading frames, start codons, and stop codons in DNA sequences, and understanding how different reading frames relate to each other simultaneously.

---

## 3. Biological Representation

The paper represents the following biological entities:

| Entity | Representation | Notes |
|--------|---------------|-------|
| Nucleotide | Single character (A, C, G, T) | Primary unit |
| Codon | 3 consecutive nucleotides | Used in codon-level sonification |
| Reading frame | Frame 1, Frame 2, Frame 3 | Simultaneous multi-frame playback |
| Start codon (ATG) | Special auditory marker | Higher pitch treatment |
| Stop codons (TAA, TAG, TGA) | Special auditory marker | Lower pitch treatment |

The paper does NOT represent:
- Amino acids (no translation step)
- ORFs (only start/stop codon identification)
- Sequence features beyond codons
- Gene structure

---

## 4. Sonification Algorithms

The paper describes **exactly five sonification methods**. Start/stop codon treatment is NOT a sixth method — it is a qualitative guideline within Codon Walking (Section 4.5).

### 4.1 Nucleotide Chroma

**What it does:** Each nucleotide is heard individually for a defined time.

**Mapping:**
| Nucleotide | Pitch | Note | Frequency |
|------------|-------|------|-----------|
| A | C4 | Middle C | 262 Hz |
| C | E4 | E | 330 Hz |
| G | G4 | G | 392 Hz |
| T | C5 | High C | 523 Hz |

- Uses equal temperament scale
- A-C-G-T forms a **C major chord**
- Each nucleotide is heard for **100 milliseconds**
- Events are sequential (one nucleotide at a time)
- Pitches are chosen so that C (pyrimidines) and G/T (purines) have different tonal qualities

### 4.2 DNA Chords

**What it does:** Three consecutive nucleotides are heard simultaneously as a chord.

**Mapping:** Same pitch assignments as Nucleotide Chroma (A=262, C=330, G=392, T=523).

- Each group of 3 nucleotides played simultaneously
- Creates a chord from the individual nucleotide pitches
- Time interval: **100ms per chord**
- Progresses through the sequence in non-overlapping triplets

### 4.3 Nucleotide Rhythm

**What it does:** Emphasises every third nucleotide through rhythm.

**Mapping:** Same pitch assignments as Nucleotide Chroma.

- First two nucleotides in each triplet: shorter duration
- Third nucleotide in each triplet: longer duration
- Creates a rhythmic pattern that highlights every 3rd base
- Time per nucleotide varies: short-short-long per triplet
- Used to hear the codon reading frame structure

### 4.4 DNA Walking

**What it does:** Uses musical intervals between consecutive nucleotides rather than absolute pitches.

**Mapping:** Each nucleotide is assigned a musical interval from the previous nucleotide:

| Transition | Interval | Semitones |
|------------|----------|-----------|
| A→A | Unison | 0 |
| A→C | Minor 2nd | 1 |
| A→G | Major 3rd | 4 |
| A→T | Perfect 4th | 5 |
| C→A | Major 6th | 9 |
| C→C | Unison | 0 |
| C→G | Major 3rd | 4 |
| C→T | Perfect 5th | 7 |
| G→A | Minor 6th | 8 |
| G→C | Major 6th | 9 |
| G→G | Unison | 0 |
| G→T | Major 2nd | 2 |
| T→A | Minor 2nd | 1 |
| T→C | Perfect 5th | 7 |
| T→G | Minor 6th | 8 |
| T→T | Unison | 0 |

- Starting note: **C4 (262 Hz)**
- Starting note pitch is arbitrary per the paper
- Intervals encode the **direction** of change in sequence
- Walking up/down the scale conveys nucleotide identity through relative motion

### 4.5 Codon Walking

**What it does:** Similar to DNA Walking but with reading frame awareness.

**Mapping:** Same interval assignments as DNA Walking, with reading frame considerations:

- Uses the **first codon's boundaries** (identified by ATG start codon) to define the reading frame
- Only plays notes for nucleotides **within the reading frame codons**
- Same interval relationships between consecutive nucleotides
- Reading frame determines which nucleotides are included in the walking pattern

**Start/Stop Codon Treatment (part of Codon Walking):**

The paper states within the Codon Walking section:

> "In each of these methods start codons (ATG) are assigned a higher pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."

This is a **qualitative** guideline — the paper does NOT specify:
- How much higher/lower (no interval, semitone count, or octave)
- What base pitch to shift from
- What duration to use for start/stop events

The paper also mentions amino acid→pitch mapping (Table 7) for Codon Walking, mapping codons to amino acids and then to pitches on a C major pentatonic scale. This is not yet implemented in AudiGene.

### 4.6 Reading Frame Amino Acid Chords (Multi-frame)

**What it does:** Plays multiple reading frames simultaneously.

**Mapping:**
- Frame 1: first nucleotide of each codon → single pitch (using Nucleotide Chroma mapping)
- Frame 2: first two nucleotides of the second reading frame → two simultaneous pitches
- Frame 3: all three nucleotides of the third reading frame → three simultaneous pitches

This creates increasingly complex chords as more frames are added, allowing the listener to perceive how different reading frames relate to each other.

---

## 5. Exact Pitch/Frequency Mappings

### 5.1 Nucleotide-to-Pitch (used in Nucleotide Chroma, DNA Chords, Nucleotide Rhythm)

| Nucleotide | Note | Frequency (Hz) | Scale Position |
|------------|------|----------------|----------------|
| A | C4 | 262 | Root |
| C | E4 | 330 | Major 3rd |
| G | G4 | 392 | Perfect 5th |
| T | C5 | 523 | Octave |

These form a **C major arpeggio**: C-E-G-C.

### 5.2 Musical Intervals for DNA Walking / Codon Walking

The paper provides a full 4x4 matrix of transitions. Key intervals:

- **Unison** (0 semitones): same nucleotide repeated
- **Minor 2nd** (1 semitone): small step (A↔T, T↔A)
- **Major 2nd** (2 semitones): G→T
- **Major 3rd** (4 semitones): A→G, C→G
- **Perfect 4th** (5 semitones): A→T
- **Perfect 5th** (7 semitones): C→T, T→C
- **Minor 6th** (8 semitones): G→A, T→G
- **Major 6th** (9 semitones): C→A, G→C

---

## 6. Reading Frames

The paper handles three reading frames as follows:

1. **Frame identification** is done by searching for the **start codon ATG**
2. Once ATG is found, the reading frame boundaries are established from that point
3. Multiple reading frames can be played simultaneously (in the Reading Frame Amino Acid Chords method)
4. Each reading frame uses the same nucleotide-to-pitch mapping
5. The number of simultaneous pitches increases with each additional frame

**Key detail:** The reading frame is defined by the first ATG encountered, not by an arbitrary offset. This is biologically meaningful — ATG initiates translation in biological systems.

---

## 7. Start/Stop Codon Handling

**This is NOT a standalone sonification method.** Start/stop treatment is described within the Codon Walking section (Section 4.5) as a qualitative modifier.

The paper states:

> "In each of these methods start codons (ATG) are assigned a higher pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."

Key characteristics:
- **Qualitative only** — the paper says "higher pitch" and "lower pitch" without specifying exact frequencies, intervals, or octaves
- **Part of Codon Walking** — applied during codon-level sonification
- **Biological signal** — makes start/stop positions perceivable in the auditory stream
- **No exact mapping exists in the paper** — any specific semitone shift is an AudiGene interpretation

**AudiGene interpretation (NOT paper specification):**
- ATG → +12 semitones (one octave up) — our choice
- TAA/TAG/TGA → -12 semitones (one octave down) — our choice
- These are AUDIGENE INTERPRETATIONS, not Temple 2017 exact mappings

---

## 8. Audio Parameters

| Parameter | Value/Range | Notes |
|-----------|-------------|-------|
| Pitch (nucleotide) | 262, 330, 392, 523 Hz | C major chord tones |
| Duration (chroma/chords) | 100 ms per event | Fixed duration |
| Duration (rhythm) | Variable | short-short-long per triplet |
| Interval range | 0-9 semitones | Walking intervals |
| Starting note | C4 (262 Hz) | Arbitrary per paper |
| Tempo | Determined by duration | Not explicitly specified as BPM |
| Scale | Equal temperament | Western musical scale |
| Simultaneous streams | Up to 3 | Three reading frames |
| Audio output | Single channel (mono) | Browser playback |

The paper does NOT specify:
- Exact amplitude/volume per nucleotide
- Specific instrument/timbre choices
- Exact BPM or tempo
- Stereo panning
- ADSR envelope parameters

---

## 9. Intended Analytical Use

The auditory display is intended to help the researcher perceive:

1. **Reading frame structure** — the rhythmic and chordal patterns reveal the 3-base codon structure
2. **Start codons** — marked by higher pitch, signalling frame initiation
3. **Stop codons** — marked by lower pitch, signalling frame termination
4. **Nucleotide composition** — the pitch distribution reflects the base composition
5. **Sequence similarity/difference** — two sequences played in succession or simultaneously reveal similarities and differences through auditory comparison
6. **Multi-frame relationships** — simultaneous playback of multiple frames reveals how different reading frames relate
7. **Patterns that are difficult to perceive visually** — especially temporal patterns and frame-level structure

The paper explicitly states the tool is "designed to convey DNA sequence information through sound" and that the researcher should be able to "hear the start codon, stop codon and the reading frame in a DNA sequence."

---

## 10. Software Implementation (Original)

- **Language:** Perl
- **Audio library:** SDL (Simple DirectMedia Layer) with FMOD support
- **GUI:** Custom GUI with features:
  - Playback controls
  - FASTA file import
  - Animated scrolling sequence display
  - Synchronised graph (in original: Flash-based; referenced as "blue bar graph")
- **Platform:** Desktop application
- **Availability:** Downloadable for Windows, Mac OS, Linux from sourceforge.net/audiomizar

---

## 11. Limitations (Stated by Authors)

1. **Mapping choices are subjective** — "there is no reason why the associations between the nucleotides and the pitches cannot be changed to other musical notes"
2. **Sound representation is arbitrary** — "there is no reason to assume that A should be represented by the sound middle C, rather than by the other sounds"
3. **The auditory representation is a starting point** — other mappings may be equally or more valid
4. **Not validated with users** — the paper presents the tool and its design, but does not include a formal user study measuring whether sonification improves analytical performance
5. **Browser-based implementation not yet available** — original tool is desktop-only
6. **Flash dependency** — the original graph used Flash (now deprecated)

---

## 12. Key Quotes from the Paper

> "An auditory display of DNA sequence information that allows the researcher to hear the start codon, stop codon and the reading frame in a DNA sequence is described."

> "The pitches are chosen so that C (pyrimidines) and G/T (purines) have different tonal qualities."

> "The first note is arbitrary and need not be C."

> "The auditory display of DNA sequence information described here is not intended to replace visual analysis, but rather provide an alternative that may aid analysis."

> "Will an auditory representation of DNA sequence information be perceived and interpreted by the listener? This question was the motivation to develop the software described here."

> "As with the pitches chosen to represent the nucleotides, the intervals chosen to represent the 16 nucleotide changes are arbitrary and can be changed by the user."

---

## 13. References Critical to Understanding the Method

- Mullen W (2002, 2003) — background on auditory display and attention
- Flowers & Bhatt (1999) — attention guidance through visual and auditory cues
- The authors note that their approach is novel: "To our knowledge, no other nucleotide to pitch association has been reported"
