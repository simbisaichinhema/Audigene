"""Nucleotide Chroma sonification (Temple 2017).

Each nucleotide is heard individually for 100 milliseconds.

Mapping (from Figure 1):
    A -> C4 (262 Hz)
    C -> E4 (330 Hz)
    G -> G4 (392 Hz)
    T -> C5 (523 Hz)

These form a C major chord (C-E-G-C) using equal temperament.

Source: Temple (2017), BMC Bioinformatics, Methods section.
"""

from __future__ import annotations

from sonification.events import (
    SonificationEvent,
    SonificationTimeline,
    EventType,
    create_event_id,
    create_analysis_id,
)

# ── Paper-defined constants ──────────────────────────────────────────────

# Nucleotide-to-frequency mapping (equal temperament, Hz)
NUCLEOTIDE_FREQUENCY = {
    "A": 262.0,  # C4 (Middle C)
    "C": 330.0,  # E4
    "G": 392.0,  # G4
    "T": 523.0,  # C5 (High C)
}

# Nucleotide-to-pitch-name mapping
NUCLEOTIDE_PITCH = {
    "A": "C4",
    "C": "E4",
    "G": "G4",
    "T": "C5",
}

# Event duration from the paper (100ms)
EVENT_DURATION = 0.1  # seconds

# Default amplitude (not specified in paper — chosen for clarity)
DEFAULT_AMPLITUDE = 0.5

# Instrument (not specified in paper — neutral default)
DEFAULT_INSTRUMENT = "sine"


def generate_nucleotide_chroma_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    duration: float = EVENT_DURATION,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
) -> tuple[SonificationEvent, ...]:
    """Generate Nucleotide Chroma events for a DNA sequence.

    Each nucleotide is mapped to a pitch and played sequentially
    for the specified duration.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier for provenance.
        start_time: Start time in seconds.
        duration: Duration per event in seconds.
        amplitude: Amplitude (0.0-1.0).
        instrument: Timbre identifier.
        frame: Reading frame (for metadata only).

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    events: list[SonificationEvent] = []
    current_time = start_time

    for i, base in enumerate(sequence.upper()):
        if base not in NUCLEOTIDE_FREQUENCY:
            # Skip unknown bases silently
            continue

        freq = NUCLEOTIDE_FREQUENCY[base]
        pitch = NUCLEOTIDE_PITCH[base]

        events.append(
            SonificationEvent(
                event_id=create_event_id(),
                analysis_id=analysis_id,
                sequence_id=sequence_id,
                position=i,
                frame=frame,
                event_type=EventType.NUCLEOTIDE,
                biological_value=base,
                start_time=current_time,
                duration=duration,
                pitch=pitch,
                frequency=freq,
                amplitude=amplitude,
                instrument=instrument,
                profile="paper_2017",
                source_algorithm="nucleotide_chroma",
                source_paper="s12859-017-1632-x.pdf",
                mapping_description=f"{base} -> {pitch} ({freq} Hz)",
            )
        )
        current_time += duration

    return tuple(events)


def generate_nucleotide_chroma_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete Nucleotide Chroma timeline.

    Args:
        sequence: DNA sequence string.
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        **kwargs: Additional arguments passed to generate_nucleotide_chroma_events.

    Returns:
        SonificationTimeline with all events.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    events = generate_nucleotide_chroma_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="paper_2017",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="nucleotide_chroma",
    )
