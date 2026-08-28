"""Mock timer for non-browser environments.

Provides mock implementations of setTimeout and requestAnimationFrame
for testing the scheduler in Python without a browser.
"""

from __future__ import annotations

from typing import Callable, Optional


class MockTimer:
    """Tracks setTimeout and requestAnimationFrame calls for testing.

    Does NOT actually execute callbacks. Instead, records them
    so tests can verify scheduling behavior.
    """

    def __init__(self) -> None:
        self._timeouts: list[tuple[float, Callable]] = []
        self._frames: list[Callable] = []
        self._next_id: int = 1
        self._timeout_ids: dict[int, tuple[float, Callable]] = {}

    def set_timeout(self, callback: Callable, delay_ms: float) -> int:
        """Record a setTimeout call."""
        tid = self._next_id
        self._next_id += 1
        self._timeout_ids[tid] = (delay_ms, callback)
        self._timeouts.append((delay_ms, callback))
        return tid

    def request_animation_frame(self, callback: Callable) -> int:
        """Record a requestAnimationFrame call."""
        fid = self._next_id
        self._next_id += 1
        self._frames.append(callback)
        return fid

    def get_timeout_count(self) -> int:
        return len(self._timeouts)

    def get_frame_count(self) -> int:
        return len(self._frames)

    def reset(self) -> None:
        self._timeouts.clear()
        self._frames.clear()
        self._timeout_ids.clear()
