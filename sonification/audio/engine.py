"""Core audio engine.

Consumes structured SonificationEvent timelines and produces real audio
via the Web Audio API. Contains NO biological analysis logic.

Architecture:
    SonificationTimeline → AudioEngine → Web Audio API → Sound

The engine uses a look-ahead scheduler pattern:
- A requestAnimationFrame loop runs continuously during playback
- Events are scheduled slightly ahead of current time (look-ahead window)
- This ensures tight timing without drift or jitter
- AudioContext.currentTime is the single source of truth

Scientific fidelity:
    The engine renders frequency/duration/amplitude values exactly as
    received from the sonification layer. It does NOT transform,
    reinterpret, or override any scientific parameters.
"""

from __future__ import annotations

from typing import Optional, Any

from sonification.audio.state import PlaybackState, EngineCallbacks


# -- Default rendering parameters (AUDIGENE_INNOVATION) --

DEFAULT_ATTACK_MS = 5       # Attack ramp duration in milliseconds
DEFAULT_RELEASE_MS = 10     # Release ramp duration in milliseconds
LOOK_AHEAD_SECONDS = 0.1    # How far ahead to schedule events
SCHEDULE_INTERVAL_MS = 25   # How often the scheduler loop runs


def event_to_meta(event: Any) -> dict:
    """Extract playback-relevant metadata from a SonificationEvent.

    This is the ONLY place where SonificationEvent fields are mapped
    to audio engine metadata. The renderer never touches biological fields.
    """
    return {
        "event_id": event.event_id,
        "sequence_id": event.sequence_id,
        "position": event.position,
        "frame": event.frame,
        "event_type": event.event_type.value if hasattr(event.event_type, "value") else str(event.event_type),
        "biological_value": event.biological_value,
        "start_time": event.start_time,
        "duration": event.duration,
        "frequency": event.frequency,
        "amplitude": event.amplitude,
        "instrument": event.instrument,
        "pitch": event.pitch,
        "profile": event.profile,
        "implementation_source": getattr(event, "implementation_source", ""),
    }


class AudioEngine:
    """Audio engine that renders SonificationEvent timelines.

    Usage:
        engine = AudioEngine()
        engine.load_timeline(timeline)
        engine.play()
        # ... engine fires callbacks as events play ...
        engine.stop()

    The engine is deterministic: given the same timeline, it produces
    the same scheduling instructions. No biological analysis occurs here.
    """

    def __init__(self, audio_context: Optional[Any] = None) -> None:
        """Initialize the audio engine.

        Args:
            audio_context: Optional pre-existing AudioContext. If None,
                one will be created on first play(). Useful for testing
                and for pages that already have an AudioContext.
        """
        self._audio_context = audio_context
        self._state = PlaybackState.IDLE
        self._callbacks = EngineCallbacks()

        # Timeline state
        self._events: list[Any] = []
        self._total_duration: float = 0.0

        # Playback state
        self._playback_start_context_time: float = 0.0
        self._playback_offset: float = 0.0  # Offset into timeline (for seek)
        self._scheduled_up_to: float = 0.0  # How far we've scheduled
        self._scheduler_id: Optional[Any] = None  # Animation frame ID
        self._active_nodes: list[Any] = []  # Currently playing audio nodes
        self._completed_events: set[str] = set()  # Events already fired onEventEnd

        # Debug mode
        self._debug: bool = False

    # -- Properties --

    @property
    def state(self) -> PlaybackState:
        return self._state

    @property
    def callbacks(self) -> EngineCallbacks:
        return self._callbacks

    @property
    def events(self) -> list[Any]:
        return list(self._events)

    @property
    def total_duration(self) -> float:
        return self._total_duration

    @property
    def debug(self) -> bool:
        return self._debug

    @debug.setter
    def debug(self, value: bool) -> None:
        self._debug = value

    # -- Timeline loading --

    def load_timeline(self, timeline: Any) -> None:
        """Load a SonificationTimeline for playback.

        Args:
            timeline: A SonificationTimeline object (or compatible dict/object
                with events, total_duration attributes).

        Raises:
            ValueError: If timeline has no events.
        """
        self.stop()

        if hasattr(timeline, "events"):
            self._events = list(timeline.events)
            self._total_duration = timeline.total_duration
        elif isinstance(timeline, dict):
            self._events = timeline.get("events", [])
            self._total_duration = timeline.get("total_duration", 0.0)
        else:
            raise ValueError(f"Unsupported timeline type: {type(timeline)}")

        self._state = PlaybackState.IDLE
        self._playback_offset = 0.0
        self._scheduled_up_to = 0.0
        self._completed_events.clear()

    def load_events(self, events: list[Any], total_duration: float = 0.0) -> None:
        """Load raw events directly (without a timeline wrapper).

        Args:
            events: List of SonificationEvent objects.
            total_duration: Total duration in seconds. If 0, computed from events.
        """
        self.stop()
        self._events = list(events)
        if total_duration > 0:
            self._total_duration = total_duration
        elif events:
            last = events[-1]
            self._total_duration = last.start_time + last.duration
        else:
            self._total_duration = 0.0
        self._state = PlaybackState.IDLE
        self._playback_offset = 0.0
        self._scheduled_up_to = 0.0
        self._completed_events.clear()

    # -- Playback controls --

    def play(self) -> None:
        """Start or resume playback.

        Creates AudioContext if needed. Schedules events from current position.
        """
        if not self._events:
            return

        if self._state == PlaybackState.PLAYING:
            return

        self._ensure_audio_context()

        now = self._audio_context.currentTime

        if self._state == PlaybackState.PAUSED:
            # Resume: calculate where we were
            elapsed = now - self._playback_start_context_time
            self._playback_offset += elapsed
            self._playback_start_context_time = now
        else:
            # Fresh start or restart
            self._playback_start_context_time = now
            # Keep existing _playback_offset (for seek-then-play)

        self._state = PlaybackState.PLAYING
        self._callbacks.fire_play()
        self._start_scheduler()

    def pause(self) -> None:
        """Pause playback. Can be resumed with play()."""
        if self._state != PlaybackState.PLAYING:
            return

        self._stop_scheduler()
        self._stop_all_nodes()

        # Calculate offset
        now = self._audio_context.currentTime
        elapsed = now - self._playback_start_context_time
        self._playback_offset += elapsed

        self._state = PlaybackState.PAUSED
        self._callbacks.fire_pause()

    def stop(self) -> None:
        """Stop playback completely. Resets position to start."""
        if self._state == PlaybackState.IDLE and not self._active_nodes:
            return

        self._stop_scheduler()
        self._stop_all_nodes()

        self._state = PlaybackState.STOPPED
        self._playback_offset = 0.0
        self._scheduled_up_to = 0.0
        self._completed_events.clear()
        self._callbacks.fire_stop()

        # Transition to IDLE after a tick so callbacks can observe STOPPED
        self._state = PlaybackState.IDLE

    def restart(self) -> None:
        """Stop and start from the beginning."""
        self.stop()
        self._playback_offset = 0.0
        self.play()

    def seek(self, time: float) -> None:
        """Seek to a specific time in the timeline.

        Args:
            time: Time in seconds to seek to. Clamped to [0, total_duration].

        Raises:
            ValueError: If no timeline is loaded.
        """
        if not self._events:
            return

        time = max(0.0, min(time, self._total_duration))

        was_playing = self._state == PlaybackState.PLAYING

        if was_playing:
            self._stop_scheduler()
            self._stop_all_nodes()

        self._playback_offset = time
        if self._audio_context:
            self._playback_start_context_time = self._audio_context.currentTime
        self._scheduled_up_to = time
        self._completed_events.clear()

        self._callbacks.fire_seek(time)

        if was_playing:
            self._state = PlaybackState.PLAYING
            self._start_scheduler()

    # -- Query methods --

    def get_current_time(self) -> float:
        """Get current playback position in timeline seconds."""
        if self._state != PlaybackState.PLAYING:
            return self._playback_offset

        if not self._audio_context:
            return self._playback_offset

        elapsed = self._audio_context.currentTime - self._playback_start_context_time
        return self._playback_offset + elapsed

    def get_duration(self) -> float:
        """Get total timeline duration in seconds."""
        return self._total_duration

    def get_state(self) -> PlaybackState:
        """Get current playback state."""
        return self._state

    def get_event_at_time(self, time: float) -> Optional[Any]:
        """Find the event playing at a given time."""
        for event in self._events:
            if event.start_time <= time < event.start_time + event.duration:
                return event
        return None

    # -- Private: Audio context management --

    def _ensure_audio_context(self) -> None:
        """Create AudioContext if not already available."""
        if self._audio_context is not None:
            return

        try:
            # Browser environment
            import js  # type: ignore
            self._audio_context = js.AudioContext.new()
        except (ImportError, AttributeError):
            try:
                # Fallback for environments with webaudio
                import webbrowser  # noqa: F401
            except Exception:
                raise RuntimeError(
                    "No AudioContext available. This engine requires "
                    "a browser environment with Web Audio API support."
                )

    # -- Private: Scheduler --

    def _start_scheduler(self) -> None:
        """Start the look-ahead scheduler loop."""
        self._scheduler_loop()

    def _stop_scheduler(self) -> None:
        """Stop the scheduler loop."""
        if self._scheduler_id is not None:
            try:
                if self._audio_context and hasattr(self._audio_context, "cancelAnimationFrame"):
                    self._audio_context.cancelAnimationFrame(self._scheduler_id)
            except Exception:
                pass
            self._scheduler_id = None

    def _scheduler_loop(self) -> None:
        """One iteration of the scheduler loop.

        Schedules events that fall within the look-ahead window.
        Uses requestAnimationFrame for browser-compatible timing.
        """
        if self._state != PlaybackState.PLAYING:
            return

        current_time = self.get_current_time()
        schedule_until = current_time + LOOK_AHEAD_SECONDS

        # Schedule events in the look-ahead window
        for event in self._events:
            event_end = event.start_time + event.duration
            if event.start_time < schedule_until and event_end > current_time:
                if event.event_id not in self._completed_events:
                    self._schedule_event(event)

        # Check for timeline completion
        if current_time >= self._total_duration and self._total_duration > 0:
            self._stop_scheduler()
            self._state = PlaybackState.IDLE
            self._callbacks.fire_complete()
            return

        # Schedule next iteration via the audio context's rAF
        if self._audio_context and hasattr(self._audio_context, "requestAnimationFrame"):
            self._scheduler_id = self._audio_context.requestAnimationFrame(
                lambda _: self._scheduler_loop()
            )

    # -- Private: Event rendering --

    def _schedule_event(self, event: Any) -> None:
        """Schedule a single event for audio rendering.

        Calculates the correct start time relative to the audio context,
        creates oscillator nodes, and connects them to the destination.
        """
        if not self._audio_context:
            return

        ctx = self._audio_context

        # Calculate when to start this event relative to audio context time
        offset_in_timeline = event.start_time - self._playback_offset
        if offset_in_timeline < 0:
            # Event is before current position — skip it
            return

        start_context_time = (
            self._playback_start_context_time + offset_in_timeline
        )

        # Don't schedule in the past
        if start_context_time < ctx.currentTime - 0.01:
            return

        duration = event.duration
        amplitude = event.amplitude
        instrument = getattr(event, "instrument", "sine")

        # Build list of frequencies to render
        frequencies = [event.frequency]
        amplitudes = [amplitude]
        if hasattr(event, "simultaneous_frequencies") and event.simultaneous_frequencies:
            frequencies = list(event.simultaneous_frequencies)
            if hasattr(event, "simultaneous_pitches") and event.simultaneous_pitches:
                amplitudes = [p.amplitude for p in event.simultaneous_pitches]
            else:
                amplitudes = [amplitude] * len(frequencies)

        # Create and connect oscillators for each frequency
        nodes = []
        for freq, amp in zip(frequencies, amplitudes):
            if freq <= 0:
                continue
            node = self._create_oscillator(ctx, instrument, freq, amp,
                                           start_context_time, duration)
            if node is not None:
                nodes.append(node)

        if nodes:
            self._active_nodes.extend(nodes)

        # Schedule event_start callback
        meta = event_to_meta(event)
        fire_time = max(0, (start_context_time - ctx.currentTime) * 1000)
        if hasattr(ctx, "setTimeout"):
            ctx.setTimeout(lambda _: self._callbacks.fire_event_start(meta), fire_time)
        else:
            self._callbacks.fire_event_start(meta)

        # Schedule event_end callback
        end_meta = meta.copy()
        end_time_ms = max(0, (start_context_time + duration - ctx.currentTime) * 1000)
        self._completed_events.add(event.event_id)
        if hasattr(ctx, "setTimeout"):
            ctx.setTimeout(lambda _: self._callbacks.fire_event_end(end_meta), end_time_ms)
        else:
            self._callbacks.fire_event_end(end_meta)

        if self._debug:
            print(
                f"[AudioEngine] event={event.event_id} "
                f"pos={event.position} type={meta['event_type']} "
                f"freq={event.frequency}Hz dur={duration}s "
                f"scheduled={start_context_time:.3f}"
            )

    def _create_oscillator(
        self,
        ctx: Any,
        instrument: str,
        frequency: float,
        amplitude: float,
        start_time: float,
        duration: float,
    ) -> Optional[Any]:
        """Create a single oscillator with gain envelope.

        Envelope (AUDIGENE_INNOVATION, does not alter scientific timing):
            t=0:           gain=0
            t=attack_ms:   gain=amplitude  (linear ramp)
            t=dur-release: gain=amplitude  (hold)
            t=dur:         gain=0          (linear ramp)

        The event's duration remains authoritative. The envelope
        attack/release are purely cosmetic to avoid clicks.
        """
        try:
            attack = DEFAULT_ATTACK_MS / 1000.0
            release = DEFAULT_RELEASE_MS / 1000.0
            hold_end = start_time + duration - release
            if hold_end < start_time + attack:
                hold_end = start_time + attack

            # Create oscillator
            osc_type = instrument if instrument in (
                "sine", "square", "sawtooth", "triangle"
            ) else "sine"
            osc = ctx.createOscillator()
            osc.type = osc_type
            osc.frequency.value = frequency

            # Create gain node for envelope
            gain = ctx.createGain()
            gain.gain.value = 0.0

            # Attack
            gain.gain.linearRampToValueAtTime(amplitude, start_time + attack)
            # Hold
            gain.gain.setValueAtTime(amplitude, hold_end)
            # Release
            gain.gain.linearRampToValueAtTime(0.0, start_time + duration)

            # Connect: oscillator → gain → destination
            osc.connect(gain)
            gain.connect(ctx.destination)

            # Schedule
            osc.start(start_time)
            osc.stop(start_time + duration + 0.001)  # Small buffer past release

            return osc

        except (AttributeError, TypeError):
            # Non-browser environment: return None
            return None

    def _stop_all_nodes(self) -> None:
        """Stop and disconnect all active audio nodes."""
        for node in self._active_nodes:
            try:
                node.stop()
            except Exception:
                pass
            try:
                node.disconnect()
            except Exception:
                pass
        self._active_nodes.clear()
