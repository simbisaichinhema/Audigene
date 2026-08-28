"""Mock AudioContext for testing.

Provides a deterministic mock of the Web Audio API's AudioContext,
OscillatorNode, GainNode, setTimeout, and requestAnimationFrame.
Allows testing audio scheduling logic without requiring a real browser.

The mock tracks all scheduling operations for assertion in tests.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional, Callable


@dataclass
class MockOscillatorEvent:
    """Records a single oscillator scheduling operation."""

    frequency: float
    amplitude: float
    start_time: float
    stop_time: float
    osc_type: str = "sine"


class MockGainNode:
    """Mock GainNode that records ramp/set operations and tracks peak amplitude."""

    def __init__(self) -> None:
        self.value: float = 0.0
        self._peak_amplitude: float = 0.0
        self._ramps: list[tuple[float, float]] = []
        self._connected_to: Optional[MockGainNode] = None

    @property
    def gain(self) -> MockGainNode:
        return self

    def linearRampToValueAtTime(self, value: float, time: float) -> None:
        self.value = value
        if abs(value) > self._peak_amplitude:
            self._peak_amplitude = abs(value)
        self._ramps.append((time, value))

    def setValueAtTime(self, value: float, time: float) -> None:
        self.value = value
        if abs(value) > self._peak_amplitude:
            self._peak_amplitude = abs(value)
        self._ramps.append((time, value))

    def connect(self, node: MockGainNode) -> None:
        self._connected_to = node

    def disconnect(self) -> None:
        self._connected_to = None


class MockOscillatorNode:
    """Mock OscillatorNode that records start/stop times."""

    def __init__(self, osc_type: str = "sine") -> None:
        self.type = osc_type
        self.frequency = MockParam()
        self._started = False
        self._stopped = False
        self._start_time: float = 0.0
        self._stop_time: float = 0.0
        self._connected_to: Optional[MockGainNode] = None
        self._events: list[MockOscillatorEvent] = []

    def connect(self, node: MockGainNode) -> None:
        self._connected_to = node

    def start(self, time: float) -> None:
        self._started = True
        self._start_time = time

    def stop(self, time: float) -> None:
        self._stopped = True
        self._stop_time = time

    def disconnect(self) -> None:
        self._connected_to = None

    def record_event(self) -> MockOscillatorEvent:
        """Create a record of this oscillator's scheduling."""
        amplitude = 0.0
        if self._connected_to and hasattr(self._connected_to, "_peak_amplitude"):
            amplitude = self._connected_to._peak_amplitude
        return MockOscillatorEvent(
            frequency=self.frequency.value,
            amplitude=amplitude,
            start_time=self._start_time,
            stop_time=self._stop_time,
            osc_type=self.type,
        )


class MockParam:
    """Mock AudioParam."""

    def __init__(self, value: float = 0.0) -> None:
        self.value = value


class MockAudioContext:
    """Mock AudioContext for deterministic testing.

    Tracks time manually. Does not produce real audio.
    Provides requestAnimationFrame and setTimeout for the scheduler.

    Usage:
        ctx = MockAudioContext()
        ctx._advance_time(1.0)  # Simulate 1 second passing
        # ... check scheduled oscillators ...
    """

    def __init__(self) -> None:
        self._time: float = 0.0
        self.destination = MockGainNode()
        self._oscillators: list[MockOscillatorNode] = []
        self._timeouts: list[tuple[float, Callable]] = []
        self._animation_frames: list[Callable] = []
        self._next_id: int = 1

    @property
    def currentTime(self) -> float:
        return self._time

    def _advance_time(self, seconds: float) -> None:
        """Advance the mock clock by the given number of seconds."""
        self._time += seconds

    def createOscillator(self) -> MockOscillatorNode:
        osc = MockOscillatorNode()
        self._oscillators.append(osc)
        return osc

    def createGain(self) -> MockGainNode:
        return MockGainNode()

    # -- Timer abstraction (mimics browser APIs for the scheduler) --

    def requestAnimationFrame(self, callback: Callable) -> int:
        """Mock requestAnimationFrame. Callback is queued, not auto-fired."""
        fid = self._next_id
        self._next_id += 1
        self._animation_frames.append(callback)
        return fid

    def cancelAnimationFrame(self, frame_id: int) -> None:
        """Cancel a pending animation frame (no-op in mock)."""
        pass

    def setTimeout(self, callback: Callable, delay_ms: float) -> int:
        """Mock setTimeout. Callbacks with delay <= 0 execute immediately.

        This matches the engine's behavior: in non-browser environments,
        callbacks with no meaningful delay fire synchronously.
        """
        tid = self._next_id
        self._next_id += 1
        if delay_ms <= 0:
            callback(None)
        else:
            self._timeouts.append((delay_ms, callback))
        return tid

    def _flush_animation_frames(self) -> list:
        """Execute all pending animation frame callbacks. Returns results."""
        frames = list(self._animation_frames)
        self._animation_frames.clear()
        results = []
        for cb in frames:
            results.append(cb(None))
        return results

    def _flush_timeouts(self) -> list:
        """Execute all pending timeout callbacks. Returns results."""
        timeouts = list(self._timeouts)
        self._timeouts.clear()
        results = []
        for delay, cb in timeouts:
            results.append(cb(None))
        return results

    # -- Helpers for testing --

    def get_scheduled_events(self) -> list[MockOscillatorEvent]:
        """Get all oscillator events that have been scheduled."""
        return [osc.record_event() for osc in self._oscillators]

    def get_oscillator_count(self) -> int:
        return len(self._oscillators)

    def get_scheduling_instructions(self) -> list[MockOscillatorEvent]:
        """Alias for get_scheduled_events (used in determinism tests)."""
        return self.get_scheduled_events()

    def reset(self) -> None:
        """Clear all scheduled oscillators."""
        self._oscillators.clear()
        self._timeouts.clear()
        self._animation_frames.clear()
