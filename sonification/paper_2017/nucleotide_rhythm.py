"""Nucleotide Rhythm sonification (Temple 2017).

Emphasises every third nucleotide through rhythm.
First two nucleotides in each triplet: shorter duration.
Third nucleotide in each triplet: longer duration.

Pattern: short-short-long per triplet.

Mapping: Same pitch assignments as Nucleotide Chroma.

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
from sonification.paper_2017.nucleotide_chroma import (
    NUCLEOTIDE_FREQUENCY,
    NUCLEOTIDE_PITCH,
    DEFAULT_AMPLITUDE,
    DEFAULT_INSTRUMENT,
)

# ── Rhythm durations (AudiGene choice — paper says qualitative "short-short-long") ──

# We use a 3:1 ratio: short = 75ms, long = 225ms
# Total per triplet = 375ms (close to 3x100ms = 300ms of the chroma method)
SHORT_DURATION = 0.075  # 75ms
LONG_DURATION = 0.225  # 225ms
TRIPLET_DURATION = SHORT_DURATION * 2 + LONG_DURATION  # 375ms


def generate_nucleotide_rhythm_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
    short_duration: float = SHORT_DURATION,
    long_duration: float = LONG_DURATION,
) -> tuple[SonificationEvent, ...]:
    """Generate Nucleotide Rhythm events for a DNA sequence.

    Groups nucleotides into triplets with a short-short-long rhythm,
    emphasising every 3rd base.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        amplitude: Amplitude (0.0-1.0).
        instrument: Timbre identifier.
        frame: Reading frame (for metadata).
        short_duration: Duration for first two notes in triplet.
        long_duration: Duration for third note in triplet.

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()
    events: list[SonificationEvent] = []
    current_time = start_time

    for i, base in enumerate(seq):
        if base not in NUCLEOTIDE_FREQUENCY:
            continue

        freq = NUCLEOTIDE_FREQUENCY[base]
        pitch = NUCLEOTIDE_PITCH[base]

        # Determine duration based on position within triplet
        pos_in_triplet = i % 3
        if pos_in_triplet < 2:
            duration = short_duration
            rhythm_label = "short"
        else:
            duration = long_duration
            rhythm_label = "long"

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
                source_algorithm="nucleotide_rhythm",
                source_paper="s12859-017-1632-x.pdf",
                mapping_description=f"{base} -> {pitch} ({freq} Hz) [{rhythm_label}]",
            )
        )
        current_time += duration

    return tuple(events)


def generate_nucleotide_rhythm_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete Nucleotide Rhythm timeline.

    Args:
        sequence: DNA sequence string.
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        **kwargs: Additional arguments.

    Returns:
        SonificationTimeline with all events.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    events = generate_nucleotide_rhythm_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="paper_2017",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="nucleotide_rhythm",
    )
