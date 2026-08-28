# Audio Engine

## Overview

The AudiGene audio engine renders structured `SonificationEvent` timelines as real audio via the Web Audio API. It is a pure rendering layer — it contains **no biological analysis logic**.

```
SonificationTimeline → AudioEngine → Web Audio API → Sound
```

## Architecture

### Module Structure

```
sonification/audio/
├── __init__.py          # Package exports: PlaybackState, EngineCallbacks, AudioEngine
├── state.py             # PlaybackState enum and EngineCallbacks class
├── engine.py            # Core AudioEngine class
├── mock_context.py      # MockAudioContext for testing without a browser
└── mock_timer.py        # MockTimer for tracking setTimeout/rAF calls
```

### Separation of Concerns

| Layer | Responsibility | Contains biology? |
|-------|---------------|-------------------|
| `sonification/paper_2017/` | Generate events from DNA | Yes |
| `sonification/audio/` | Render events as audio | **No** |
| `frontend/demo.html` | UI + client-side rendering | No |

The audio engine never sees DNA bases, codons, or reading frames. It receives events that already contain frequencies, durations, and amplitudes.

## Scheduling

### Look-Ahead Scheduler Pattern

The engine uses a look-ahead scheduler to ensure tight audio timing without drift:

1. A `requestAnimationFrame` loop runs continuously during playback
2. Each iteration schedules events within a 100ms look-ahead window
3. `AudioContext.currentTime` is the single source of truth for timing
4. Events are scheduled slightly ahead to prevent audio glitches

```
Timeline:  |--e0--|--e1--|--e2--|--e3--|--e4--|
                        ^
                  current_time
                  |
                  schedule_until = current + 0.1s
```

### Why Not Individual Timers?

The look-ahead pattern avoids:
- Drift from `setTimeout` imprecision
- CPU overhead of thousands of independent timers
- Jitter from browser main thread contention

One `requestAnimationFrame` loop handles all scheduling.

## Rendering

### Oscillator Creation

For each event, the engine:

1. Creates an `OscillatorNode` with the event's frequency and instrument type
2. Creates a `GainNode` for the amplitude envelope
3. Connects: `Oscillator → Gain → Destination`
4. Schedules `start(time)` and `stop(time + duration)`

### Gain Envelope

A short attack/release envelope prevents clicks without altering scientific timing:

```
gain
  ^
  |     ┌──────────────┐
  |     │              │
  |     │   amplitude  │
  |     │              │
  |─────┘              └─────
  └──────────────────────────→ time
    ↑ 5ms ↑         ↑ 10ms ↑
   attack           release
```

- **Attack**: 5ms linear ramp from 0 → amplitude
- **Hold**: amplitude held for event duration minus attack/release
- **Release**: 10ms linear ramp from amplitude → 0

These are purely cosmetic (AUDIGENE_INNOVATION) and do not alter the scientific duration, frequency, or amplitude.

### Chords

Events with `simultaneous_frequencies` create multiple oscillators that play at the same time. Each frequency gets its own oscillator + gain node. This preserves the chord structure from the sonification layer.

```
Event { simultaneous_frequencies: [262, 330, 392] }
  → Oscillator(262Hz) ─┐
  → Oscillator(330Hz) ──┼→ Gain → Destination
  → Oscillator(392Hz) ─┘
```

## API

### AudioEngine

```python
from sonification.audio import AudioEngine

engine = AudioEngine()

# Load timeline
engine.load_timeline(timeline)           # SonificationTimeline object
engine.load_events(events, duration)     # Raw events + optional duration

# Controls
engine.play()       # Start or resume playback
engine.pause()      # Pause (can resume with play())
engine.stop()       # Stop and reset to start
engine.restart()    # Stop then play from beginning
engine.seek(0.5)    # Seek to 0.5 seconds

# Queries
engine.get_current_time()   # Current position in seconds
engine.get_duration()       # Total timeline duration
engine.get_state()          # PlaybackState enum
engine.get_event_at_time(t) # Event playing at time t

# Callbacks
engine.callbacks.on_play(lambda: ...)
engine.callbacks.on_pause(lambda: ...)
engine.callbacks.on_stop(lambda: ...)
engine.callbacks.on_seek(lambda t: ...)
engine.callbacks.on_complete(lambda: ...)
engine.callbacks.on_event_start(lambda meta: ...)
engine.callbacks.on_event_end(lambda meta: ...)

# Debug
engine.debug = True  # Prints scheduling info to console
```

### PlaybackState

```python
class PlaybackState(Enum):
    IDLE = "idle"       # No playback, position at start
    PLAYING = "playing" # Actively playing
    PAUSED = "paused"   # Paused, can resume
    STOPPED = "stopped" # Stopped (transient, transitions to IDLE)
```

### EngineCallbacks

All callbacks are optional. Multiple callbacks can be registered per event. They fire in registration order.

- `on_play()` — fires when playback starts or resumes
- `on_pause()` — fires when playback pauses
- `on_stop()` — fires when playback stops
- `on_seek(time)` — fires when seeking, receives target time
- `on_complete()` — fires when timeline reaches the end
- `on_event_start(meta)` — fires when an event begins playing
- `on_event_end(meta)` — fires when an event finishes playing

The `meta` dict contains: `event_id`, `position`, `event_type`, `biological_value`, `frequency`, `duration`, `amplitude`, `instrument`, `pitch`.

## Scientific Fidelity

The audio engine **does not**:
- Transform frequencies
- Alter durations
- Modify amplitudes
- Add or remove notes
- Rescale time

Given the same timeline, the engine produces identical scheduling instructions. This is verified by the `test_same_timeline_same_scheduling` test.

### What IS an AudiGene Innovation

The only rendering-level innovations (AUDIGENE_INNOVATION) are:
- **Gain envelope** (5ms attack, 10ms release): prevents audio clicks
- **Instrument selection**: sine/square/sawtooth/triangle (default: sine)
- **Look-ahead scheduler**: timing infrastructure

These are audio engineering decisions that do not affect the scientific content.

## Testing

### MockAudioContext

The `MockAudioContext` provides a deterministic mock of the Web Audio API for testing without a browser. It:

- Tracks time manually (`_advance_time(seconds)`)
- Records all oscillator scheduling operations
- Provides `requestAnimationFrame` and `setTimeout` for the scheduler
- Auto-executes callbacks with delay ≤ 0

### Test Categories

| Category | Tests | What's verified |
|----------|-------|----------------|
| State | 3 | Initial state, enum values, get_state |
| Callbacks | 9 | Registration, firing, multiple callbacks |
| Timeline | 7 | Loading, dict support, invalid types, clearing |
| Playback | 12 | Play, pause, stop, restart, resume, no-op guards |
| Seek | 6 | Position update, clamping, callbacks, while playing |
| CurrentTime | 4 | Zero, seek offset, advancing, paused freeze |
| Duration | 2 | Empty, from timeline |
| EventLookup | 3 | Hit, miss, no events |
| Chords | 4 | Simultaneous frequencies, multiple oscillators |
| Scheduling | 6 | First window, sequential, frequency, type, stop |
| Fidelity | 5 | Frequency/duration/amplitude passthrough, determinism |
| Integration | 4 | All 5 paper methods end-to-end |
| Debug | 2 | Toggle, no effect on scheduling |

**Total: 67 tests**

## Browser Demo

`frontend/demo.html` is a standalone page that:
- Accepts DNA input
- Generates events client-side (ported from Python)
- Renders via Web Audio API
- Provides play/pause/stop/restart/seek controls
- Highlights the current base during playback
- Requires no server — opens directly in a browser

### Running the Demo

```bash
# Option 1: Direct file open
open frontend/demo.html

# Option 2: With the backend server
uvicorn backend.app.main:app --reload
# Then open frontend/demo.html — it works standalone
```

## Known Limitations

1. **No volume control**: amplitude is event-level, not user-adjustable
2. **No tempo control**: event timing is fixed at generation time
3. **No waveform visualization**: only text-based base highlighting
4. **Single sequence**: no multi-track or comparison mode yet
5. **No persistence**: browser state is lost on page refresh
