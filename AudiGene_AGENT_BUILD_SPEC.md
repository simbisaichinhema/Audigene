# AudiGene — AI Coding Agent Build Specification

## Mission

Build **AudiGene**, a research-grade prototype for **interactive biological sequence sonification**.

AudiGene is NOT a generic DNA-to-music generator.

The core objective is:

> **Compare biological sequences, identify biological sequence structure/events, encode those events into an interpretable auditory representation, and synchronise sound with a visual genomic display.**

The foundational scientific reference supplied for this project is:

> Temple, M. D. (2017). *An auditory display tool for DNA sequence analysis*. BMC Bioinformatics.

The coding agent MUST read the supplied paper before implementing the sonification algorithms. Clearly distinguish:
- **Paper-derived implementation**
- **AudiGene adaptation**
- **New AudiGene functionality**

Never silently present an adaptation as if it were part of the original paper.

---

# 1. Non-negotiable engineering principles

## 1.1 Build a real application

Do NOT produce:
- a single HTML file as the final architecture
- an LLM that directly interprets raw DNA and invents biology
- arbitrary “mutation = high pitch” logic presented as biological truth
- fake API calls
- placeholder buttons
- simulated analysis presented as real analysis
- fabricated variant annotations
- invented scientific claims

Every major feature must actually execute.

## 1.2 Deterministic biology, agentic orchestration

The LLM/agent is responsible for:
- understanding the user's analytical request
- selecting appropriate tools
- deciding the order of operations
- summarising deterministic outputs
- explaining why an auditory event occurred
- maintaining analysis state

The LLM is NOT responsible for:
- manually aligning sequences
- calculating variants by itself
- deciding pathogenicity from sound
- inventing genomic coordinates
- fabricating annotations
- replacing established bioinformatics algorithms

Every biological result shown to the user must originate from deterministic computation or an explicitly identified external source.

## 1.3 Reproducibility

Given the same:
- input sequences
- alignment configuration
- analysis parameters
- sonification profile
- software version

AudiGene should produce the same structured analysis and sonification event timeline.

Record provenance wherever practical.

---

# 2. Target architecture

Use a monorepo with clear separation of concerns.

```text
audigene/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── audio/
│   │   ├── api/
│   │   ├── state/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── tests/
│
├── bioinformatics/
│   ├── sequence.py
│   ├── alignment.py
│   ├── variants.py
│   ├── orf.py
│   ├── codons.py
│   └── tests/
│
├── sonification/
│   ├── profiles/
│   ├── nucleotide.py
│   ├── codon.py
│   ├── reading_frames.py
│   ├── events.py
│   ├── timeline.py
│   └── tests/
│
├── agent/
│   ├── graph.py
│   ├── state.py
│   ├── tools.py
│   ├── prompts/
│   └── tests/
│
├── data/
│   ├── examples/
│   └── fixtures/
│
├── docs/
│   ├── architecture.md
│   ├── sonification.md
│   ├── scientific-basis.md
│   └── evaluation.md
│
├── paper/
│   └── temple_2017.pdf
│
├── tests/
├── docker-compose.yml
├── README.md
└── .env.example
```

Adapt the exact structure if needed, but preserve separation between frontend, API, bioinformatics, sonification and agent logic.

---

# 3. Technology stack

## Frontend
- React
- TypeScript
- Vite
- D3.js where appropriate
- HTML Canvas for sequence/frequency rendering
- Web Audio API or Tone.js for browser audio

## Backend
- Python
- FastAPI
- Pydantic

## Bioinformatics
Start with:
- Biopython
- NumPy
- SciPy where genuinely useful

Do not add dependencies merely for appearance.

## Agent
- LangGraph

Build **one AudiGene agent** with deterministic tools. Do not create multiple autonomous agents unless a concrete requirement emerges.

## LLM
Use a provider abstraction.

Initial provider:
- Claude API

Optional local provider:
- Ollama

The application must not be tightly coupled to one model provider.

## Storage
Start with:
- SQLite

Design models so migration to PostgreSQL is straightforward.

## Deployment
- Docker
- Docker Compose

The initial target should be runnable locally with a documented command such as:

```bash
docker compose up
```

---

# 4. First task: study the paper

Before implementing sonification:

1. Read `paper/temple_2017.pdf`.
2. Extract:
   - motivation
   - terminology
   - sonification algorithms
   - mapping strategies
   - reading-frame approach
   - start/stop handling
   - examples
   - limitations
   - stated use cases
3. Create:

```text
docs/scientific-basis.md
```

That document MUST separate:

### A. Directly supported by the paper
Only claims clearly supported by the source.

### B. AudiGene adaptations
Changes made for the modern prototype.

### C. AudiGene innovations
New functionality not claimed as part of the original paper.

If the paper does not support a detail, say so.

---

# 5. Core scientific concept

Treat sonification as an **analytical display**, not entertainment.

The central question is:

> “What am I hearing, and what genomic data caused that sound?”

Every significant auditory event should be traceable through:

```text
sequence
→ position
→ biological feature/event
→ sonification rule
→ audio event
```

---

# 6. Biological input

Support:

```text
REFERENCE
SAMPLE
```

Accept:
- raw DNA sequence
- FASTA

Initial alphabet:
```text
A C G T
```

Handle invalid/ambiguous characters explicitly.

Show:
- sequence length
- validation status
- warnings
- ambiguous/invalid base count

Never silently corrupt input.

---

# 7. Alignment

Do NOT make strong positional claims by simply comparing character `i` with character `i`.

Use an alignment layer:

```text
Reference
    ↓
Sample
    ↓
Alignment
    ↓
Aligned reference
    ↓
Aligned sample
    ↓
Differences
```

Represent gaps explicitly.

The first implementation may use pairwise alignment, but the alignment layer must be replaceable.

---

# 8. Difference model

Create a structured model supporting at least:

- substitution
- insertion
- deletion

Conceptual representation:

```json
{
  "position": 143,
  "reference_base": "T",
  "sample_base": "C",
  "type": "substitution",
  "alignment_position": 143
}
```

Do not infer pathogenicity.

Do not call something “important” without independent evidence.

---

# 9. Biological feature analysis

Implement deterministic analysis for:
- codons
- reading frames
- start codons
- stop codons
- ORF-like regions

Where the paper provides an algorithm, follow it for the paper-derived profile.

Where it does not, document the AudiGene rule explicitly.

---

# 10. Sonification engine

Create a dedicated sonification engine that converts structured biological events into a deterministic timeline.

Conceptual event:

```json
{
  "analysis_id": "example-001",
  "position": 143,
  "time": 12.43,
  "duration": 0.28,
  "event_type": "SUBSTITUTION",
  "frequency": 523.25,
  "amplitude": 0.7,
  "instrument": "piano",
  "source": {
    "sequence": "reference",
    "frame": 1,
    "codon": "ATG"
  }
}
```

The exact schema can evolve, but it must be:
- serialisable
- deterministic
- versionable
- explainable

---

# 11. Sonification profiles

Do not hard-code one mapping.

Create explicit profiles.

Potential architecture:

```text
NucleotideProfile
CodonProfile
AminoAcidProfile
ReadingFrameProfile
ThreeFrameProfile
DifferenceOverlayProfile
```

Only label a profile as paper-derived if the paper actually supports it.

Each profile should define:
- input biological object
- pitch mapping
- duration
- instrument/timbre
- amplitude
- event handling
- start/stop behaviour

---

# 12. Reading-frame sonification

Support three reading frames where appropriate.

Conceptually:

```text
FRAME 1
ATG | CCG | TAA | GCT | ...

FRAME 2
A | TGC | CGT | AAG | ...

FRAME 3
AT | GCC | GTA | AGC | ...
```

Each frame must remain distinguishable in the auditory representation.

Do not simply play three identical streams simultaneously.

Use distinguishable timbral/instrumental characteristics.

Start/stop events must be visible and audible according to the selected profile.

---

# 13. Start/stop events

Treat start and stop codons as special biological events.

At minimum make:

```text
START
STOP
```

identifiable visually and acoustically.

Possible behaviours:
- distinct auditory event
- activation/deactivation of a reading-frame stream

The exact behaviour must be documented and tied to the selected sonification profile.

---

# 14. Difference sonification

Do NOT define:

```text
mutation = high pitch
```

as a universal biological rule.

Instead implement a transparent **difference overlay**:

```text
baseline sequence sonification
            +
difference event layer
            =
AudiGene analytical sonification
```

A difference may alter:
- transient
- pitch offset
- amplitude
- timbre
- rhythm

But every change must be explainable.

Example:

```text
SUBSTITUTION
Reference: T
Sample: C
Position: 143
```

The UI should expose this while the event is playing.

---

# 15. Frequency graph

The graph is a visual companion to the audio.

Requirements:
- x-axis = sequence/alignment position
- y-axis = encoded frequency
- differences highlighted
- start/stop events marked
- current playback cursor
- hover/click interaction
- cursor synchronised with audio

Explicitly label frequency as an **encoding**, not biological severity.

---

# 16. Sequence viewer

Display:

```text
REFERENCE
ATGCCGTA...

SAMPLE
ATGCCGCA...
```

Highlight:
- matches
- substitutions
- insertions
- deletions
- start codons
- stop codons
- current playback position

Clicking an event should jump playback to that event.

---

# 17. Audio player

Required:
- Play
- Pause
- Stop
- Restart
- timeline scrub

During playback:

```text
audio cursor
      ↓
sequence position
      ↓
frequency graph
      ↓
event explanation
```

must remain synchronised.

---

# 18. Agent architecture

Implement one stateful AudiGene agent.

Conceptual graph:

```text
START
  ↓
validate_input
  ↓
understand_request
  ↓
select_analysis
  ↓
run_alignment
  ↓
run_sequence_analysis
  ↓
run_feature_analysis
  ↓
build_sonification_plan
  ↓
generate_event_timeline
  ↓
validate_results
  ↓
generate_explanation
  ↓
RESULT
```

Not every node needs to execute for every request.

The agent chooses based on the user's request.

---

# 19. Agent tools

Expose deterministic tools such as:

```text
validate_sequence
parse_fasta
align_sequences
detect_variants
find_orfs
translate_codons
find_start_stop
generate_sonification_events
validate_sonification_timeline
summarize_analysis
```

Tool outputs must be structured.

The agent must not parse prose to recover scientific numbers when structured data can be supplied.

---

# 20. Agent state

Maintain typed state containing concepts such as:

```python
{
    "user_request": "...",
    "reference_sequence": "...",
    "sample_sequence": "...",
    "alignment": {...},
    "variants": [...],
    "features": [...],
    "sonification_profile": "...",
    "audio_events": [...],
    "provenance": [...],
    "explanation": "..."
}
```

---

# 21. LLM guardrails

The agent MUST:

1. Never invent a biological result.
2. Never claim a variant is pathogenic because it sounds strong.
3. Never fabricate external evidence.
4. Never modify deterministic tool results.
5. State when evidence is missing.
6. Distinguish:
   - observed
   - computed
   - inferred
   - unknown
7. Explain sonification as representation, not biological truth.

---

# 22. Provenance

Every result should have a trace.

Example:

```text
User input
    ↓
FASTA parser
    ↓
Alignment algorithm + configuration
    ↓
Difference detector
    ↓
ORF analyzer
    ↓
Sonification profile
    ↓
Audio event #17
```

The UI should eventually answer:

> “Why did this sound happen?”

with the computational chain.

---

# 23. API design

Potential endpoints:

```text
POST /api/v1/sequences/validate
POST /api/v1/analysis
POST /api/v1/alignment
POST /api/v1/sonification
GET  /api/v1/analysis/{id}
GET  /api/v1/analysis/{id}/events
POST /api/v1/agent/run
```

Keep APIs minimal and coherent.

Use Pydantic schemas for request/response validation.

---

# 24. Frontend state

Track:
- current analysis
- playback time
- current genomic position
- selected event
- sequence data
- alignment
- frequency data
- agent explanation

Do not re-render an entire large sequence on every audio tick.

---

# 25. Error handling

Handle:
- empty sequences
- invalid FASTA
- invalid nucleotides
- ambiguous bases
- alignment failures
- API failures
- LLM failures
- audio context/permission issues
- unsupported browser behaviour
- malformed tool output

Show actionable user-facing errors.

Do not expose raw stack traces.

---

# 26. Testing

## Bioinformatics tests

Fixtures for:
- identical sequences
- one substitution
- multiple substitutions
- insertion
- deletion
- start codon
- stop codon
- multiple reading frames
- empty input
- ambiguous bases

## Sonification tests

Verify:
```text
same input + same profile
→ same event timeline
```

Verify:
```text
different biological event
→ corresponding event difference
```

Verify:
- monotonically increasing event times
- valid durations
- no impossible values

## Agent tests

Mock deterministic tools and verify:
- correct tool selection
- correct tool ordering
- tool failure handling
- no invented outputs
- structured final response

## Frontend tests

Verify:
- sequence loading
- analysis
- event selection
- Play
- Pause
- Stop
- cursor synchronisation

Use Playwright for end-to-end testing.

---

# 27. Evaluation

The project must eventually test whether users can understand the sonification.

Possible experiments:

### A. Event detection
Can users identify when a sequence difference occurs?

### B. Event localisation
Can users identify approximately where it occurred?

### C. Comparison
Can users distinguish sequences with different divergence patterns?

### D. Multimodal benefit
Compare:
```text
visual only
audio only
visual + audio
```

Measure:
- accuracy
- response time
- workload
- confidence

Document in:

```text
docs/evaluation.md
```

---

# 28. MVP acceptance criteria

The first complete version is finished only when:

### Input
User can provide two DNA sequences.

### Analysis
System validates and aligns them.

### Differences
System identifies substitutions/insertions/deletions appropriate to the implemented alignment.

### Biological features
System can identify the codon/reading-frame/start-stop structures required by the selected sonification profile.

### Sonification
System generates a deterministic event timeline.

### Audio
User can actually hear the representation.

### Visualisation
User can see:
- sequence
- alignment
- differences
- frequency representation
- playback cursor

### Synchronisation
Clicking an event moves playback to the corresponding position.

### Explanation
Agent can explain:
> “You are hearing X because the analysis detected Y at position Z.”

### Provenance
System can expose the computational path producing the event.

### Reproducibility
Same input + same configuration produces the same analysis.

---

# 29. Development order

DO NOT implement everything simultaneously.

## Phase 0 — Scientific grounding
- Read the paper
- Extract algorithms
- Create `scientific-basis.md`
- Mark reproduction vs adaptation vs innovation

STOP and verify before proceeding.

## Phase 1 — Bioinformatics core
Implement:
```text
FASTA
validation
alignment
difference detection
codons
reading frames
start/stop
```

No AI yet.

## Phase 2 — Sonification engine
Implement:
```text
events
profiles
timelines
audio mapping
```

Test independently.

## Phase 3 — Frontend
Build:
```text
sequence viewer
alignment viewer
frequency graph
event timeline
audio controls
```

Connect to real backend data.

## Phase 4 — Agent
Add:
```text
LangGraph
tool calling
structured state
LLM explanation
```

The agent orchestrates existing working tools.

## Phase 5 — Provenance
Add:
```text
analysis IDs
tool execution records
profile version
software version
```

## Phase 6 — Evaluation
Create:
```text
benchmark sequences
user tasks
metrics
evaluation documentation
```

---

# 30. What NOT to build yet

Do not spend time on:
- authentication
- payments
- social features
- Kubernetes
- mobile apps
- elaborate dashboards
- cloud infrastructure
- multi-agent complexity
- huge genome-scale processing
- clinical decision support

The first goal is a scientifically defensible working prototype.

---

# 31. Coding-agent operating rules

The coding agent MUST:

1. Read existing files before modifying them.
2. Never overwrite working functionality without inspecting dependencies.
3. Make small, testable changes.
4. Run tests after meaningful changes.
5. Update documentation when architecture changes.
6. Never fabricate test results.
7. Never claim implementation is complete without actually running it.
8. Prefer simple architecture.
9. Keep scientific logic separate from UI logic.
10. Keep agent logic separate from deterministic bioinformatics.
11. Keep sonification mappings versioned.
12. Explain deviations from the paper.
13. Preserve scientific provenance.
14. Ask for human confirmation before making a scientifically consequential design choice unsupported by the paper or specification.

---

# 32. Final product philosophy

AudiGene should feel like a **scientific instrument**, not a music toy.

The intended chain is:

```text
BIOLOGICAL DATA
       ↓
COMPUTATIONAL ANALYSIS
       ↓
STRUCTURED EVENT
       ↓
AUDITABLE SONIFICATION
       ↓
HUMAN INTERPRETATION
```

The central promise is:

> **Every important sound should be traceable to data.**

If a researcher asks:

> “Why did I hear that?”

AudiGene must be able to answer.

---

# 33. Agent execution instruction

Start by inspecting the repository and the supplied paper.

Do NOT immediately generate the entire application.

First produce:

1. `docs/scientific-basis.md`
2. `docs/architecture.md`
3. a concise implementation plan
4. a dependency list
5. the proposed data schemas
6. the proposed agent state
7. the proposed sonification profiles

Then implement **Phase 1 only**.

Run tests.

Report exactly:
- what was implemented
- what was tested
- test results
- known limitations
- what should happen next

Do not claim success for features that have not been executed and tested.

After Phase 1 is verified, continue to Phase 2.

The final system must be functional, reproducible, explainable, and scientifically honest.
