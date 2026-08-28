"""Tests for the AudiGene audio engine.

Tests state management, timeline loading, event scheduling,
callbacks, chords, and scientific fidelity preservation.

Uses MockAudioContext to test without a real browser.

SCHEDULER MODEL:
    The engine's scheduler runs in requestAnimationFrame. In Python tests,
    MockAudioContext provides a requestAnimationFrame that queues callbacks
    without auto-executing them. To drive the scheduler:
        engine.play()           # runs first scheduler iteration synchronously
        ctx._flush_animation_frames()  # runs next queued iteration
        ctx._advance_time(dt)   # advance mock clock between iterations
"""

import pytest
from sonification.audio.state import PlaybackState, EngineCallbacks
from sonification.audio.engine import AudioEngine, event_to_meta
from sonification.audio.mock_context import MockAudioContext
from sonification.events import (
    SonificationEvent,
    SonificationTimeline,
    SimultaneousPitch,
    EventType,
)


# ── Test fixtures ──────────────────────────────────────────────────────

LOOK_AHEAD = 0.1  # Must match engine.LOOK_AHEAD_SECONDS
_event_counter = 0


def make_event(
    position: int = 0,
    frequency: float = 262.0,
    amplitude: float = 0.5,
    duration: float = 0.1,
    start_time: float = 0.0,
    event_type: EventType = EventType.NUCLEOTIDE,
    biological_value: str = "A",
    event_id: str = "",
    instrument: str = "sine",
    simultaneous_pitches: tuple = (),
    simultaneous_frequencies: tuple = (),
) -> SonificationEvent:
    """Create a minimal SonificationEvent for testing."""
    global _event_counter
    if not event_id:
        _event_counter += 1
        event_id = f"test-{_event_counter:04d}"
    return SonificationEvent(
        event_id=event_id,
        analysis_id="test-analysis",
        sequence_id="reference",
        position=position,
        frame=0,
        event_type=event_type,
        biological_value=biological_value,
        start_time=start_time,
        duration=duration,
        pitch="C4",
        frequency=frequency,
        amplitude=amplitude,
        instrument=instrument,
        simultaneous_pitches=simultaneous_pitches,
        simultaneous_frequencies=simultaneous_frequencies,
    )


def make_timeline(events: list[SonificationEvent], total_duration: float = 0.0) -> SonificationTimeline:
    """Create a SonificationTimeline from events."""
    if total_duration == 0 and events:
        last = events[-1]
        total_duration = last.start_time + last.duration
    return SonificationTimeline(
        analysis_id="test-analysis",
        profile="paper_2017",
        events=tuple(events),
        total_duration=total_duration,
        sequence_length=6,
        method="nucleotide_chroma",
    )


def drive_scheduler(engine: AudioEngine, ctx: MockAudioContext, iterations: int = 4) -> None:
    """Drive the scheduler through N iterations by flushing animation frames.

    After engine.play(), the first iteration runs synchronously.
    Each subsequent iteration requires:
      1. Advance mock time so get_current_time() progresses
      2. Flush animation frames to run the queued scheduler loop
      3. Flush timeouts to fire event callbacks with positive delays
    """
    for _ in range(iterations):
        ctx._advance_time(LOOK_AHEAD * 0.9)  # Advance past current events
        ctx._flush_animation_frames()         # Run queued rAF → _scheduler_loop
        ctx._flush_timeouts()                 # Fire event start/end callbacks


# ── PlaybackState tests ────────────────────────────────────────────────

class TestPlaybackState:
    def test_initial_state(self):
        engine = AudioEngine()
        assert engine.state == PlaybackState.IDLE

    def test_state_values(self):
        assert PlaybackState.IDLE.value == "idle"
        assert PlaybackState.PLAYING.value == "playing"
        assert PlaybackState.PAUSED.value == "paused"
        assert PlaybackState.STOPPED.value == "stopped"

    def test_get_state(self):
        engine = AudioEngine()
        assert engine.get_state() == PlaybackState.IDLE


# ── EngineCallbacks tests ──────────────────────────────────────────────

class TestEngineCallbacks:
    def test_register_and_fire(self):
        cb = EngineCallbacks()
        fired = []
        cb.on_play(lambda: fired.append("play"))
        cb.fire_play()
        assert fired == ["play"]

    def test_multiple_callbacks(self):
        cb = EngineCallbacks()
        fired = []
        cb.on_play(lambda: fired.append("a"))
        cb.on_play(lambda: fired.append("b"))
        cb.fire_play()
        assert fired == ["a", "b"]

    def test_pause_callback(self):
        cb = EngineCallbacks()
        fired = []
        cb.on_pause(lambda: fired.append("pause"))
        cb.fire_pause()
        assert fired == ["pause"]

    def test_stop_callback(self):
        cb = EngineCallbacks()
        fired = []
        cb.on_stop(lambda: fired.append("stop"))
        cb.fire_stop()
        assert fired == ["stop"]

    def test_seek_callback(self):
        cb = EngineCallbacks()
        times = []
        cb.on_seek(lambda t: times.append(t))
        cb.fire_seek(1.5)
        assert times == [1.5]

    def test_complete_callback(self):
        cb = EngineCallbacks()
        fired = []
        cb.on_complete(lambda: fired.append("done"))
        cb.fire_complete()
        assert fired == ["done"]

    def test_event_start_callback(self):
        cb = EngineCallbacks()
        metas = []
        cb.on_event_start(lambda m: metas.append(m))
        meta = {"event_id": "e1", "frequency": 262.0}
        cb.fire_event_start(meta)
        assert len(metas) == 1
        assert metas[0]["event_id"] == "e1"

    def test_event_end_callback(self):
        cb = EngineCallbacks()
        metas = []
        cb.on_event_end(lambda m: metas.append(m))
        meta = {"event_id": "e1"}
        cb.fire_event_end(meta)
        assert len(metas) == 1

    def test_no_callbacks_registered(self):
        cb = EngineCallbacks()
        # Should not raise
        cb.fire_play()
        cb.fire_pause()
        cb.fire_stop()
        cb.fire_seek(0.0)
        cb.fire_complete()
        cb.fire_event_start({})
        cb.fire_event_end({})


# ── Timeline loading tests ─────────────────────────────────────────────

class TestTimelineLoading:
    def test_load_timeline(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=i, start_time=i * 0.1) for i in range(4)]
        tl = make_timeline(events)
        engine.load_timeline(tl)
        assert engine.state == PlaybackState.IDLE
        assert len(engine.events) == 4
        assert engine.total_duration == 0.4

    def test_load_events_directly(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, duration=0.1)]
        engine.load_events(events)
        assert len(engine.events) == 1
        assert engine.total_duration == 0.1

    def test_load_events_custom_duration(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, duration=0.1)]
        engine.load_events(events, total_duration=5.0)
        assert engine.total_duration == 5.0

    def test_empty_timeline(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        tl = make_timeline([])
        engine.load_timeline(tl)
        assert len(engine.events) == 0
        assert engine.total_duration == 0.0

    def test_load_dict_timeline(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0)]
        engine.load_timeline({
            "events": events,
            "total_duration": 0.1,
        })
        assert len(engine.events) == 1

    def test_load_invalid_type_raises(self):
        engine = AudioEngine()
        with pytest.raises(ValueError):
            engine.load_timeline("not a timeline")

    def test_load_clears_previous(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events1 = [make_event(position=0, start_time=0.0)]
        events2 = [make_event(position=1, start_time=0.0), make_event(position=2, start_time=0.1)]
        tl1 = make_timeline(events1)
        tl2 = make_timeline(events2)
        engine.load_timeline(tl1)
        assert len(engine.events) == 1
        engine.load_timeline(tl2)
        assert len(engine.events) == 2


# ── Playback control tests ─────────────────────────────────────────────

class TestPlaybackControls:
    def test_play_empty_timeline(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.play()
        assert engine.state == PlaybackState.IDLE

    def test_play_sets_playing(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        assert engine.state == PlaybackState.PLAYING

    def test_play_fires_callback(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        fired = []
        engine.callbacks.on_play(lambda: fired.append(True))
        engine.play()
        assert fired == [True]

    def test_pause_sets_paused(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.pause()
        assert engine.state == PlaybackState.PAUSED

    def test_pause_fires_callback(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        fired = []
        engine.callbacks.on_pause(lambda: fired.append(True))
        engine.pause()
        assert fired == [True]

    def test_pause_when_not_playing(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.pause()  # Should be a no-op
        assert engine.state == PlaybackState.IDLE

    def test_stop_sets_idle(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.stop()
        assert engine.state == PlaybackState.IDLE

    def test_stop_fires_callback(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        fired = []
        engine.callbacks.on_stop(lambda: fired.append(True))
        engine.stop()
        assert fired == [True]

    def test_stop_resets_position(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.stop()
        assert engine.get_current_time() == 0.0

    def test_restart(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.restart()
        assert engine.state == PlaybackState.PLAYING

    def test_play_when_already_playing(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.play()  # Should be a no-op
        assert engine.state == PlaybackState.PLAYING

    def test_resume_from_pause(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.pause()
        engine.play()  # Resume
        assert engine.state == PlaybackState.PLAYING


# ── Seek tests ─────────────────────────────────────────────────────────

class TestSeek:
    def test_seek_updates_position(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=i, start_time=i * 0.1, duration=0.1) for i in range(10)]
        engine.load_timeline(make_timeline(events))
        engine.seek(0.5)
        assert engine.get_current_time() == 0.5

    def test_seek_clamps_to_zero(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.seek(-1.0)
        assert engine.get_current_time() == 0.0

    def test_seek_clamps_to_duration(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, duration=0.1)]
        engine.load_timeline(make_timeline(events))
        engine.seek(100.0)
        assert engine.get_current_time() == 0.1

    def test_seek_fires_callback(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        # Use enough events so total_duration > 0.3
        events = [make_event(position=i, start_time=i * 0.1, duration=0.1) for i in range(5)]
        engine.load_timeline(make_timeline(events))
        times = []
        engine.callbacks.on_seek(lambda t: times.append(t))
        engine.seek(0.3)
        assert times == [0.3]

    def test_seek_while_playing(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=i, start_time=i * 0.1) for i in range(10)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        engine.seek(0.5)
        assert engine.state == PlaybackState.PLAYING

    def test_seek_no_events(self):
        engine = AudioEngine()
        engine.seek(0.5)  # Should be a no-op


# ── Current time tests ─────────────────────────────────────────────────

class TestCurrentTime:
    def test_idle_returns_zero(self):
        engine = AudioEngine()
        assert engine.get_current_time() == 0.0

    def test_idle_returns_seek_offset(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        # Use enough events so total_duration > 0.3
        events = [make_event(position=i, start_time=i * 0.1, duration=0.1) for i in range(5)]
        engine.load_timeline(make_timeline(events))
        engine.seek(0.3)
        assert engine.get_current_time() == 0.3

    def test_playing_advances(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=i, start_time=i * 0.1) for i in range(10)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        ctx._advance_time(0.25)
        current = engine.get_current_time()
        assert 0.2 < current < 0.35  # Allow some tolerance

    def test_paused_freezes(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=i, start_time=i * 0.1) for i in range(10)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        ctx._advance_time(0.1)
        engine.pause()
        paused_time = engine.get_current_time()
        ctx._advance_time(0.5)
        assert engine.get_current_time() == paused_time


# ── Duration tests ─────────────────────────────────────────────────────

class TestDuration:
    def test_duration_zero_when_empty(self):
        engine = AudioEngine()
        assert engine.get_duration() == 0.0

    def test_duration_from_timeline(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, duration=0.5)]
        engine.load_timeline(make_timeline(events, total_duration=0.5))
        assert engine.get_duration() == 0.5


# ── Event lookup tests ─────────────────────────────────────────────────

class TestEventLookup:
    def test_get_event_at_time(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [
            make_event(position=0, start_time=0.0, duration=0.1, event_id="e0"),
            make_event(position=1, start_time=0.1, duration=0.1, event_id="e1"),
            make_event(position=2, start_time=0.2, duration=0.1, event_id="e2"),
        ]
        engine.load_timeline(make_timeline(events))
        e = engine.get_event_at_time(0.05)
        assert e is not None
        assert e.event_id == "e0"

    def test_get_event_at_time_between_events(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [
            make_event(position=0, start_time=0.0, duration=0.05, event_id="e0"),
            make_event(position=1, start_time=0.1, duration=0.05, event_id="e1"),
        ]
        engine.load_timeline(make_timeline(events))
        e = engine.get_event_at_time(0.07)  # Between events
        assert e is None

    def test_get_event_at_time_none(self):
        engine = AudioEngine()
        assert engine.get_event_at_time(0.0) is None


# ── Chord tests ────────────────────────────────────────────────────────

class TestChords:
    def test_chord_event_has_simultaneous_frequencies(self):
        """Verify our test fixture supports simultaneous frequencies."""
        sp1 = SimultaneousPitch(pitch="C4", frequency=262.0, amplitude=0.5)
        sp2 = SimultaneousPitch(pitch="E4", frequency=330.0, amplitude=0.5)
        sp3 = SimultaneousPitch(pitch="G4", frequency=392.0, amplitude=0.5)
        event = make_event(
            frequency=262.0,
            simultaneous_pitches=(sp1, sp2, sp3),
            simultaneous_frequencies=(262.0, 330.0, 392.0),
            event_type=EventType.CHORD,
        )
        assert len(event.simultaneous_frequencies) == 3
        assert event.simultaneous_frequencies == (262.0, 330.0, 392.0)

    def test_engine_loads_chord_events(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        sp1 = SimultaneousPitch(pitch="C4", frequency=262.0, amplitude=0.5)
        sp2 = SimultaneousPitch(pitch="E4", frequency=330.0, amplitude=0.5)
        sp3 = SimultaneousPitch(pitch="G4", frequency=392.0, amplitude=0.5)
        chord_event = make_event(
            frequency=262.0,
            simultaneous_pitches=(sp1, sp2, sp3),
            simultaneous_frequencies=(262.0, 330.0, 392.0),
            event_type=EventType.CHORD,
            start_time=0.0,
            duration=0.1,
        )
        engine.load_events([chord_event])
        assert len(engine.events) == 1
        assert engine.events[0].event_type == EventType.CHORD

    def test_engine_schedules_multiple_oscillators_for_chord(self):
        """When a chord event is scheduled, multiple oscillators are created."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        sp1 = SimultaneousPitch(pitch="C4", frequency=262.0, amplitude=0.5)
        sp2 = SimultaneousPitch(pitch="E4", frequency=330.0, amplitude=0.5)
        sp3 = SimultaneousPitch(pitch="G4", frequency=392.0, amplitude=0.5)
        chord_event = make_event(
            frequency=262.0,
            simultaneous_pitches=(sp1, sp2, sp3),
            simultaneous_frequencies=(262.0, 330.0, 392.0),
            event_type=EventType.CHORD,
            start_time=0.0,
            duration=0.1,
            event_id="chord-1",
        )
        engine.load_events([chord_event])
        engine.play()
        # The scheduler should have created 3 oscillators for 3 frequencies
        assert ctx.get_oscillator_count() == 3

    def test_engine_chord_oscillators_have_correct_frequencies(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        sp1 = SimultaneousPitch(pitch="C4", frequency=262.0, amplitude=0.5)
        sp2 = SimultaneousPitch(pitch="E4", frequency=330.0, amplitude=0.5)
        chord_event = make_event(
            frequency=262.0,
            simultaneous_pitches=(sp1, sp2),
            simultaneous_frequencies=(262.0, 330.0),
            event_type=EventType.CHORD,
            start_time=0.0,
            duration=0.1,
        )
        engine.load_events([chord_event])
        engine.play()
        events = ctx.get_scheduled_events()
        freqs = sorted([e.frequency for e in events])
        assert freqs == [262.0, 330.0]


# ── Scheduling tests ───────────────────────────────────────────────────

class TestScheduling:
    def test_play_schedules_first_window(self):
        """After play(), events in the first look-ahead window are scheduled."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        # Both events at time 0.0 — both within look-ahead window
        events = [
            make_event(position=0, start_time=0.0, frequency=262.0),
            make_event(position=1, start_time=0.0, frequency=330.0),
        ]
        engine.load_timeline(make_timeline(events))
        engine.play()
        assert ctx.get_oscillator_count() == 2

    def test_sequential_events_scheduled_over_time(self):
        """Events at different times are scheduled as scheduler iterates."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [
            make_event(position=0, start_time=0.0, frequency=262.0),
            make_event(position=1, start_time=0.1, frequency=330.0),
            make_event(position=2, start_time=0.2, frequency=392.0),
            make_event(position=3, start_time=0.3, frequency=523.0),
        ]
        engine.load_timeline(make_timeline(events))
        engine.play()
        # First iteration: only event0 (start_time 0.0 < 0.1)
        assert ctx.get_oscillator_count() == 1
        # Drive scheduler forward
        drive_scheduler(engine, ctx, iterations=4)
        # All 4 events should now be scheduled
        assert ctx.get_oscillator_count() == 4

    def test_oscillator_has_correct_frequency(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, frequency=440.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        assert any(e.frequency == 440.0 for e in osc_events)

    def test_oscillator_has_correct_type(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, instrument="square")]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        assert any(e.osc_type == "square" for e in osc_events)

    def test_invalid_instrument_falls_back_to_sine(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, instrument="invalid")]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        assert any(e.osc_type == "sine" for e in osc_events)

    def test_stop_clears_active_nodes(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        # Event is in look-ahead window so oscillator was created
        assert len(engine._active_nodes) > 0
        engine.stop()
        assert len(engine._active_nodes) == 0


# ── Scientific fidelity tests ──────────────────────────────────────────

class TestScientificFidelity:
    """Verify that the audio engine does NOT transform scientific parameters."""

    def test_frequency_passes_through_unmodified(self):
        """262 Hz in → 262 Hz out. No scientific transformation."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, frequency=262.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        assert osc_events[0].frequency == 262.0

    def test_duration_passes_through_unmodified(self):
        """Event duration is used as-is, not transformed."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, duration=0.3)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        assert osc_events[0].stop_time - osc_events[0].start_time == pytest.approx(0.3, abs=0.02)

    def test_amplitude_passes_through_unmodified(self):
        """Event amplitude is used as-is."""
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        events = [make_event(position=0, start_time=0.0, amplitude=0.75)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        osc_events = ctx.get_scheduled_events()
        # The gain node peak amplitude should be 0.75
        assert osc_events[0].amplitude == 0.75

    def test_same_timeline_same_scheduling(self):
        """Proving: same events → same scheduling instructions."""
        ctx1 = MockAudioContext()
        ctx2 = MockAudioContext()
        engine1 = AudioEngine(audio_context=ctx1)
        engine2 = AudioEngine(audio_context=ctx2)
        events = [
            make_event(position=0, start_time=0.0, frequency=262.0, duration=0.1),
            make_event(position=1, start_time=0.0, frequency=330.0, duration=0.1),
            make_event(position=2, start_time=0.0, frequency=392.0, duration=0.1),
        ]
        tl = make_timeline(events)
        engine1.load_timeline(tl)
        engine2.load_timeline(tl)
        engine1.play()
        engine2.play()
        e1 = ctx1.get_scheduled_events()
        e2 = ctx2.get_scheduling_instructions()
        # Same number of oscillators
        assert len(e1) == len(e2)
        # Same frequencies
        for a, b in zip(e1, e2):
            assert a.frequency == b.frequency
            assert a.osc_type == b.osc_type

    def test_event_metadata_preserved(self):
        """event_to_meta preserves all scientific fields."""
        event = make_event(
            position=5,
            frequency=392.0,
            biological_value="G",
            event_type=EventType.NUCLEOTIDE,
        )
        meta = event_to_meta(event)
        assert meta["position"] == 5
        assert meta["frequency"] == 392.0
        assert meta["biological_value"] == "G"
        assert meta["event_type"] == "nucleotide"


# ── Integration tests ──────────────────────────────────────────────────

class TestIntegration:
    def test_full_pipeline_nucleotide_chroma(self):
        """End-to-end: Nucleotide Chroma events → audio scheduling."""
        from sonification.paper_2017.nucleotide_chroma import (
            generate_nucleotide_chroma_timeline,
        )

        tl = generate_nucleotide_chroma_timeline("ACGT")
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.load_timeline(tl)

        assert engine.total_duration == 0.4
        assert len(engine.events) == 4

        engine.play()
        # Drive scheduler to process all events
        drive_scheduler(engine, ctx, iterations=4)
        osc_events = ctx.get_scheduled_events()
        assert len(osc_events) == 4

        # Verify frequencies match the paper's mapping
        freqs = [e.frequency for e in osc_events]
        assert freqs == [262.0, 330.0, 392.0, 523.0]

    def test_full_pipeline_dna_walking(self):
        """End-to-end: DNA Walking events → audio scheduling."""
        from sonification.paper_2017.dna_walking import (
            generate_dna_walking_timeline,
        )

        tl = generate_dna_walking_timeline("ACGT")
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.load_timeline(tl)
        engine.play()
        drive_scheduler(engine, ctx, iterations=4)

        osc_events = ctx.get_scheduled_events()
        assert len(osc_events) == 4
        # First event should be at starting frequency 262 Hz
        assert osc_events[0].frequency == pytest.approx(262.0)

    def test_full_pipeline_dna_chords(self):
        """End-to-end: DNA Chords → multiple oscillators per event."""
        from sonification.paper_2017.dna_chords import (
            generate_dna_chords_timeline,
        )

        tl = generate_dna_chords_timeline("ACGT")
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.load_timeline(tl)
        engine.play()

        osc_events = ctx.get_scheduled_events()
        # "ACGT" → 1 chord (ACG) = 3 simultaneous oscillators
        assert len(osc_events) == 3

    def test_callback_fires_for_each_event(self):
        """Verify onEventStart fires for each scheduled event."""
        from sonification.paper_2017.nucleotide_chroma import (
            generate_nucleotide_chroma_events,
        )

        events = generate_nucleotide_chroma_events("ACGT")
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.load_events(events)

        start_ids = []
        engine.callbacks.on_event_start(lambda m: start_ids.append(m["event_id"]))
        engine.play()
        drive_scheduler(engine, ctx, iterations=4)

        # All 4 events should have been scheduled
        assert len(start_ids) == 4


# ── Debug mode tests ───────────────────────────────────────────────────

class TestDebugMode:
    def test_debug_toggle(self):
        engine = AudioEngine()
        assert engine.debug is False
        engine.debug = True
        assert engine.debug is True

    def test_debug_does_not_affect_scheduling(self):
        ctx = MockAudioContext()
        engine = AudioEngine(audio_context=ctx)
        engine.debug = True
        events = [make_event(position=0, start_time=0.0)]
        engine.load_timeline(make_timeline(events))
        engine.play()
        # Should still schedule correctly
        assert ctx.get_oscillator_count() == 1
