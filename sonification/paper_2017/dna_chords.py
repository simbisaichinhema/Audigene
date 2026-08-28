"""DNA Chords sonification (Temple 2017).

Three consecutive nucleotides are played simultaneously as a chord.
Uses the same pitch mapping as Nucleotide Chroma.

Mapping (same as Nucleotide Chroma):
    A -> C4 (262 Hz)
    C -> E4 (330 Hz)
    G -> G4 (392 Hz)
    T -> C5 (523 Hz)

Each chord = 3 simultaneous pitches, 100ms per chord.

Source: Temple (2017), BMC Bioinformatics, Methods section.
"""

from __future__ import annotations

from sonification.events import (
    SonificationEvent,
    SonificationTimeline,
    SimultaneousPitch,
    EventType,
    create_event_id,
    create_analysis_id,
)
from sonification.paper_2017.nucleotide_chroma import (
    NUCLEOTIDE_FREQUENCY,
    NUCLEOTIDE_PITCH,
    EVENT_DURATION,
    DEFAULT_AMPLITUDE,
    DEFAULT_INSTRUMENT,
)


def generate_dna_chords_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    duration: float = EVENT_DURATION,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
) -> tuple[SonificationEvent, ...]:
    """Generate DNA Chords events for a DNA sequence.

    Groups consecutive nucleotides into triplets and plays each
    triplet simultaneously as a chord.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        duration: Duration per chord in seconds.
        amplitude: Amplitude per note (0.0-1.0).
        instrument: Timbre identifier.
        frame: Reading frame (for metadata).

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()
    events: list[SonificationEvent] = []
    current_time = start_time

    # Process in non-overlapping triplets
    for i in range(0, len(seq) - 2, 3):
        triplet = seq[i : i + 3]

        # Build simultaneous pitches
        pitches: list[SimultaneousPitch] = []
        frequencies: list[float] = []
        pitch_names: list[str] = []
        bio_value_parts: list[str] = []

        for base in triplet:
            if base in NUCLEOTIDE_FREQUENCY:
                freq = NUCLEOTIDE_FREQUENCY[base]
                pitch = NUCLEOTIDE_PITCH[base]
                pitches.append(SimultaneousPitch(pitch=pitch, frequency=freq, amplitude=amplitude))
                frequencies.append(freq)
                pitch_names.append(pitch)
                bio_value_parts.append(base)

        if not pitches:
            continue

        # Use the first nucleotide's pitch as the primary event pitch
        primary_freq = frequencies[0]
        primary_pitch = pitch_names[0]

        events.append(
            SonificationEvent(
                event_id=create_event_id(),
                analysis_id=analysis_id,
                sequence_id=sequence_id,
                position=i,
                frame=frame,
                event_type=EventType.CHORD,
                biological_value="-".join(bio_value_parts),
                start_time=current_time,
                duration=duration,
                pitch=primary_pitch,
                frequency=primary_freq,
                amplitude=amplitude,
                instrument=instrument,
                simultaneous_pitches=tuple(pitches),
                simultaneous_frequencies=tuple(frequencies),
                profile="paper_2017",
                source_algorithm="dna_chords",
                source_paper="s12859-017-1632-x.pdf",
                mapping_description=f"Triplet {''.join(bio_value_parts)} -> chord ({', '.join(pitch_names)})",
            )
        )
        current_time += duration

    return tuple(events)


def generate_dna_chords_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete DNA Chords timeline.

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

    events = generate_dna_chords_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="paper_2017",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="dna_chords",
    )
