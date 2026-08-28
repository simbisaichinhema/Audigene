"""Timeline generation and management.

Provides utilities for building, validating, and merging
sonification timelines from multiple sources or methods.
"""

from __future__ import annotations

from typing import Optional

from sonification.events import (
    SonificationEvent,
    SonificationTimeline,
    EventType,
    create_analysis_id,
)


def validate_timeline(timeline: SonificationTimeline) -> list[str]:
    """Validate a sonification timeline.

    Checks:
    - Events are in chronological order
    - No negative start times
    - No zero or negative durations
    - No overlapping events (within the same sequence)
    - Frequencies are positive
    - Amplitudes are in [0, 1]

    Args:
        timeline: The timeline to validate.

    Returns:
        List of validation error messages. Empty if valid.
    """
    errors: list[str] = []

    if not timeline.events:
        return errors

    prev_end = 0.0
    for i, event in enumerate(timeline.events):
        # Check chronological order
        if event.start_time < prev_end:
            errors.append(
                f"Event {i} (position {event.position}) overlaps with previous event."
            )

        # Check non-negative start time
        if event.start_time < 0:
            errors.append(
                f"Event {i} has negative start_time: {event.start_time}"
            )

        # Check positive duration
        if event.duration <= 0:
            errors.append(
                f"Event {i} has non-positive duration: {event.duration}"
            )

        # Check positive frequency
        if event.frequency <= 0:
            errors.append(
                f"Event {i} has non-positive frequency: {event.frequency}"
            )

        # Check amplitude range
        if not (0.0 <= event.amplitude <= 1.0):
            errors.append(
                f"Event {i} has amplitude out of range: {event.amplitude}"
            )

        prev_end = event.start_time + event.duration

    return errors


def merge_timelines(*timelines: SonificationTimeline) -> SonificationTimeline:
    """Merge multiple timelines into one, interleaving events by start_time.

    Args:
        *timelines: Timelines to merge.

    Returns:
        A new timeline with all events sorted by start_time.

    Raises:
        ValueError: If no timelines are provided.
    """
    if not timelines:
        raise ValueError("At least one timeline required.")

    all_events: list[SonificationEvent] = []
    for tl in timelines:
        all_events.extend(tl.events)

    all_events.sort(key=lambda e: e.start_time)

    total_duration = max(
        (e.start_time + e.duration for e in all_events), default=0.0
    )

    return SonificationTimeline(
        analysis_id=create_analysis_id(),
        profile="merged",
        events=tuple(all_events),
        total_duration=total_duration,
        sequence_length=timelines[0].sequence_length if timelines else 0,
        method="merged",
    )


def filter_events(
    timeline: SonificationTimeline,
    event_type: Optional[EventType] = None,
    frame: Optional[int] = None,
    position_range: Optional[tuple[int, int]] = None,
) -> SonificationTimeline:
    """Filter events in a timeline by type, frame, or position range.

    Args:
        timeline: The source timeline.
        event_type: Filter by event type.
        frame: Filter by reading frame.
        position_range: Filter by (start_pos, end_pos) inclusive.

    Returns:
        New timeline with filtered events.
    """
    events = timeline.events

    if event_type is not None:
        events = tuple(e for e in events if e.event_type == event_type)

    if frame is not None:
        events = tuple(e for e in events if e.frame == frame)

    if position_range is not None:
        start, end = position_range
        events = tuple(e for e in events if start <= e.position <= end)

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=timeline.analysis_id,
        profile=timeline.profile,
        events=events,
        total_duration=total_duration,
        sequence_length=timeline.sequence_length,
        method=timeline.method,
    )
