"""Audio engine state management.

Defines playback states and callback interfaces.
The audio engine state machine is deterministic and testable
without requiring a real AudioContext.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional, Callable, Any


class PlaybackState(Enum):
    """Audio engine playback states."""

    IDLE = "idle"
    PLAYING = "playing"
    PAUSED = "paused"
    STOPPED = "stopped"


class EngineCallbacks:
    """Manages callback registration for audio engine events.

    Callbacks are called in the order they were registered.
    All callbacks are optional.
    """

    def __init__(self) -> None:
        self._on_play: list[Callable[[], None]] = []
        self._on_pause: list[Callable[[], None]] = []
        self._on_stop: list[Callable[[], None]] = []
        self._on_seek: list[Callable[[float], None]] = []
        self._on_complete: list[Callable[[], None]] = []
        self._on_event_start: list[Callable[[dict], None]] = []
        self._on_event_end: list[Callable[[dict], None]] = []

    # -- Registration methods --

    def on_play(self, callback: Callable[[], None]) -> None:
        """Register a callback for play events."""
        self._on_play.append(callback)

    def on_pause(self, callback: Callable[[], None]) -> None:
        """Register a callback for pause events."""
        self._on_pause.append(callback)

    def on_stop(self, callback: Callable[[], None]) -> None:
        """Register a callback for stop events."""
        self._on_stop.append(callback)

    def on_seek(self, callback: Callable[[float], None]) -> None:
        """Register a callback for seek events. Receives the seek time."""
        self._on_seek.append(callback)

    def on_complete(self, callback: Callable[[], None]) -> None:
        """Register a callback for timeline completion."""
        self._on_complete.append(callback)

    def on_event_start(self, callback: Callable[[dict], None]) -> None:
        """Register a callback for event start. Receives event metadata dict."""
        self._on_event_start.append(callback)

    def on_event_end(self, callback: Callable[[dict], None]) -> None:
        """Register a callback for event end. Receives event metadata dict."""
        self._on_event_end.append(callback)

    # -- Fire methods (called by the engine) --

    def fire_play(self) -> None:
        for cb in self._on_play:
            cb()

    def fire_pause(self) -> None:
        for cb in self._on_pause:
            cb()

    def fire_stop(self) -> None:
        for cb in self._on_stop:
            cb()

    def fire_seek(self, time: float) -> None:
        for cb in self._on_seek:
            cb(time)

    def fire_complete(self) -> None:
        for cb in self._on_complete:
            cb()

    def fire_event_start(self, event_meta: dict) -> None:
        for cb in self._on_event_start:
            cb(event_meta)

    def fire_event_end(self, event_meta: dict) -> None:
        for cb in self._on_event_end:
            cb(event_meta)
