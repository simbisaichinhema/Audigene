# AudiGene Architecture

## 1. System Overview

AudiGene is a scientifically grounded biological sequence sonification instrument. It follows a strict data flow:

```
BIOLOGICAL DATA
       ↓
COMPUTATIONAL ANALYSIS
       ↓
STRUCTURED BIOLOGICAL EVENT
       ↓
SONIFICATION RULE APPLICATION
       ↓
AUDIO EVENT TIMELINE
       ↓
AUDIO RENDERING
       ↓
VISUAL SYNCHRONIZATION
       ↓
HUMAN INTERPRETATION
```

Every stage is deterministic (except the LLM agent, which orchestrates but never computes scientific values).

---

## 2. Monorepo Structure

```
audigene/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Route pages
│   │   ├── audio/               # Web Audio API engine
│   │   ├── api/                 # API client
│   │   ├── state/               # State management
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # Python + FastAPI
│   ├── app/
│   │   ├── api/                 # API routes
│   │   ├── models/              # Pydantic models
│   │   ├── schemas/             # Request/response schemas
│   │   ├── services/            # Business logic
│   │   └── main.py              # FastAPI app entry
│   └── tests/                   # Backend tests
│
├── bioinformatics/              # Pure Python, no web deps
│   ├── sequence.py              # Validation, FASTA parsing
│   ├── alignment.py             # Pairwise alignment
│   ├── variants.py              # Difference detection
│   ├── codons.py                # Codon parsing, start/stop
│   ├── reading_frames.py        # Reading frame detection
│   ├── orf.py                   # ORF-like regions
│   └── tests/                   # Bioinformatics tests
│
├── sonification/                # Pure Python, no web deps
│   ├── paper_2017/              # Paper-derived implementations
│   │   ├── nucleotide_chroma.py
│   │   ├── dna_chords.py
│   │   ├── nucleotide_rhythm.py
│   │   ├── dna_walking.py
│   │   ├── codon_walking.py
│   │   ├── reading_frame_chords.py
│   │   └── start_stop.py
│   ├── audigene/                # AudiGene innovations
│   │   └── difference_overlay.py
│   ├── profiles/                # Sonification profile definitions
│   ├── events.py                # Event schema
│   ├── timeline.py              # Timeline generation
│   └── tests/                   # Sonification tests
│
├── agent/                       # LangGraph agent
│   ├── graph.py                 # Agent graph definition
│   ├── state.py                 # Typed state
│   ├── tools.py                 # Deterministic tool wrappers
│   ├── prompts/                 # System prompts
│   └── tests/                   # Agent tests
│
├── data/
│   ├── examples/                # Example sequences
│   └── fixtures/                # Test fixtures
│
├── docs/
│   ├── paper-analysis.md
│   ├── scientific-basis.md
│   ├── paper-to-code.md
│   ├── architecture.md
│   ├── sonification.md
│   └── evaluation.md
│
├── tests/                       # Integration tests
│   └── paper_reproduction/      # Paper reproduction tests
│
├── s12859-017-1632-x.pdf
├── AudiGene_AGENT_BUILD_SPEC.md
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 3. Data Flow

### 3.1 Input Processing

```
User Input (DNA sequence / FASTA)
       ↓
sequence.py: validate()
       ↓
ValidatedSequence { bases: str, length: int, warnings: list }
```

### 3.2 Biological Analysis

```
ValidatedSequence
       ↓
codons.py: parse_codons()
       ↓
reading_frames.py: detect_frames()
       ↓
BiologicalFeatures {
    codons: list[Codon],
    reading_frames: list[ReadingFrame],
    start_codons: list[StartCodon],
    stop_codons: list[StopCodon]
}
```

### 3.3 Sequence Comparison (AudiGene Extension)

```
Reference + Sample
       ↓
alignment.py: align()
       ↓
Alignment { aligned_ref, aligned_sample, score }
       ↓
variants.py: detect_differences()
       ↓
Differences [
    { position, type: SUBSTITUTION|INSERTION|DELETION, ref_base, sample_base }
]
```

### 3.4 Sonification

```
BiologicalFeatures + SonificationProfile
       ↓
paper_2017/nucleotide_chroma.py: generate_events()  [or other method]
       ↓
list[SonificationEvent] {
    position, frame, event_type, biological_value,
    start_time, duration, pitch, frequency, amplitude,
    instrument, source: { algorithm, paper }
}
```

### 3.5 Audio Rendering

```
list[SonificationEvent]
       ↓
timeline.py: build_timeline()
       ↓
Timeline { events: list, total_duration: float }
       ↓
frontend/audio/engine.ts: render()
       ↓
Web Audio API → speakers
```

### 3.6 Visual Synchronization

```
PlaybackEngine.currentTime
       ↓
Cursor at sequence position X
       ↓
Frequency graph highlight
       ↓
Sequence viewer highlight
       ↓
Event explanation panel
```

---

## 4. Core Interfaces

### 4.1 Sonification Event (JSON)

```json
{
    "analysis_id": "analysis-001",
    "sequence_id": "reference",
    "position": 143,
    "frame": 1,
    "event_type": "NUCLEOTIDE",
    "biological_value": "A",
    "profile": "paper_2017_nucleotide_chroma",
    "start_time": 14.3,
    "duration": 0.1,
    "pitch": "C4",
    "frequency": 262.0,
    "amplitude": 0.5,
    "instrument": "sine",
    "source": {
        "algorithm": "nucleotide_chroma",
        "paper": "s12859-017-1632-x.pdf",
        "mapping": "A -> C4 (262 Hz)"
    }
}
```

### 4.2 Biological Event (Internal)

```json
{
    "position": 143,
    "type": "CODON",
    "value": "ATG",
    "frame": 1,
    "is_start": true,
    "is_stop": false,
    "reading_frame_id": "frame_1"
}
```

### 4.3 Difference Event

```json
{
    "position": 143,
    "alignment_position": 143,
    "type": "SUBSTITUTION",
    "reference_base": "T",
    "sample_base": "C",
    "context": "codon_position_2",
    "reading_frame": 1
}
```

---

## 5. Sonification Profile System

Each profile defines a complete mapping from biological events to audio parameters.

### 5.1 Profile Interface

```python
class SonificationProfile:
    name: str
    source: str  # "paper_2017" or "audigene"
    description: str
    
    # Mapping functions
    def map_nucleotide(nucleotide: str, position: int) -> AudioEvent
    def map_codon(codon: str, position: int) -> AudioEvent
    def map_start_codon(codon: str, position: int) -> AudioEvent
    def map_stop_codon(codon: str, position: int) -> AudioEvent
    def map_difference(diff: Difference) -> AudioEvent
    
    # Timing
    event_duration: float  # seconds
    tempo: float  # BPM equivalent
    
    # Audio
    instrument: str
    amplitude: float
```

### 5.2 Available Profiles

| Profile | Source | Methods |
|---------|--------|---------|
| Paper 2017 — Nucleotide Chroma | Paper | Sequential pitch |
| Paper 2017 — DNA Chords | Paper | 3-note chords |
| Paper 2017 — Nucleotide Rhythm | Paper | Rhythmic emphasis |
| Paper 2017 — DNA Walking | Paper | Interval transitions |
| Paper 2017 — Codon Walking | Paper | Frame-aware intervals |
| Paper 2017 — Reading Frame Chords | Paper | Multi-frame chords |
| AudiGene — Difference Overlay | Innovation | Difference encoding |

---

## 6. Audio Engine (Frontend)

### 6.1 Responsibilities

- Receive a Timeline of SonificationEvents
- Create Web Audio API nodes for each event
- Schedule events at correct times
- Support play/pause/stop/seek
- Report current playback time for synchronization

### 6.2 Synchronization Model

```
AudioEngine.currentTime (in seconds)
       ↓
Convert to sequence position using event timeline
       ↓
Emit position update
       ↓
React state update
       ↓
Components re-render at correct position
```

### 6.3 Key Design Decisions

- **No fake audio:** Every event produces an actual sound
- **Deterministic scheduling:** Same events → same audio output
- **Separation from science:** The audio engine does not know about DNA; it only knows about frequencies, durations, and amplitudes
- **Precise timing:** Use Web Audio API's built-in clock for sample-accurate scheduling

---

## 7. Backend API

### 7.1 Core Endpoints

```
POST /api/v1/sequences/validate
    → Validate DNA sequence, return warnings

POST /api/v1/analysis
    → Run full analysis: validate → features → sonification
    → Return analysis ID + events

GET  /api/v1/analysis/{id}
    → Retrieve analysis results

GET  /api/v1/analysis/{id}/events
    → Retrieve sonification event timeline

POST /api/v1/alignment
    → Align two sequences
    → Return alignment + differences

POST /api/v1/agent/run
    → Send request to LLM agent
    → Agent orchestrates tools and returns result
```

### 7.2 Request/Response Schemas

All endpoints use Pydantic models for validation. Responses include provenance metadata.

---

## 8. Agent Architecture

### 8.1 LangGraph State Machine

```
START
  ↓
validate_input          → validate_sequence tool
  ↓
understand_request      → LLM reasoning
  ↓
select_analysis         → LLM decision
  ↓
run_alignment           → align_sequences tool (if needed)
  ↓
run_sequence_analysis   → find_codons, find_reading_frames tools
  ↓
run_feature_analysis    → find_start_stop, find_orfs tools
  ↓
build_sonification_plan → select profile
  ↓
generate_event_timeline → generate_sonification_events tool
  ↓
validate_results        → validate_sonification tool
  ↓
generate_explanation    → LLM explanation
  ↓
RESULT
```

### 8.2 Deterministic Tools

Every tool wraps a pure Python function. The LLM calls tools but never computes biological values directly.

| Tool | Wraps | Output |
|------|-------|--------|
| `validate_sequence` | `bioinformatics/sequence.py` | Validation result |
| `parse_fasta` | `bioinformatics/sequence.py` | Parsed sequences |
| `align_sequences` | `bioinformatics/alignment.py` | Alignment |
| `detect_variants` | `bioinformatics/variants.py` | Differences |
| `find_codons` | `bioinformatics/codons.py` | Codons |
| `find_reading_frames` | `bioinformatics/reading_frames.py` | Frames |
| `find_start_stop` | `bioinformatics/codons.py` | Start/stop codons |
| `generate_sonification_events` | `sonification/timeline.py` | Events |
| `validate_sonification` | `sonification/events.py` | Validation |

### 8.3 LLM Guardrails

The agent:
- NEVER invents biological results
- NEVER fabricates genomic coordinates
- NEVER modifies deterministic tool results
- NEVER claims pathogenicity from sound
- States when evidence is missing
- Distinguishes OBSERVED / COMPUTED / INFERRED / UNKNOWN

---

## 9. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React + TypeScript + Vite | Modern web standards |
| Visualization | D3.js + Canvas | Flexible, performant |
| Audio | Web Audio API + Tone.js | Browser-native, precise timing |
| Backend | Python + FastAPI | Fast, async, Pydantic validation |
| Bioinformatics | Biopython + NumPy | Standard tools, alignment |
| Agent | LangGraph | Stateful agent orchestration |
| LLM | Claude API | Primary model |
| Storage | SQLite | Simple, sufficient for prototype |
| Deployment | Docker + Compose | Reproducible environment |
| Testing | Pytest + Vitest + Playwright | Full stack coverage |

---

## 10. Key Design Principles

1. **Scientific traceability:** Every sound must be traceable to data
2. **Separation of concerns:** Bioinformatics ≠ Sonification ≠ UI ≠ Agent
3. **Paper fidelity first:** Implement paper exactly before adding innovations
4. **Deterministic core:** Same input → same output, always
5. **No fabricated results:** The system never invents biological truth
6. **Explicit adaptation:** When we deviate from the paper, we document why
7. **Incremental phases:** Build and verify each phase before the next
