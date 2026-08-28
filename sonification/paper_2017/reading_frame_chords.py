"""Reading Frame Chords sonification (Temple 2017).

Plays multiple reading frames simultaneously.
Each frame adds pitches to create increasingly complex chords.

Frame 1: first nucleotide of each codon -> 1 pitch
Frame 2: first two nucleotides of second frame -> 2 additional pitches
Frame 3: all three nucleotides of third frame -> 3 additional pitches

Uses the same nucleotide-to-pitch mapping as Nucleotide Chroma.

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


def generate_reading_frame_chords_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    duration: float = EVENT_DURATION,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    num_frames: int = 3,
) -> tuple[SonificationEvent, ...]:
    """Generate Reading Frame Chords events for a DNA sequence.

    Plays multiple reading frames simultaneously, creating chords
    with increasing complexity (1 pitch from frame 1, +2 from frame 2,
    +3 from frame 3).

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        duration: Duration per chord in seconds.
        amplitude: Amplitude per note (0.0-1.0).
        instrument: Timbre identifier.
        num_frames: Number of frames to play (1, 2, or 3).

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()
    events: list[SonificationEvent] = []
    current_time = start_time

    # Determine how many codons we can play (limited by shortest frame)
    max_codons = len(seq) // 3

    for codon_idx in range(max_codons):
        all_pitches: list[SimultaneousPitch] = []
        all_frequencies: list[float] = []
        bio_parts: list[str] = []

        # Frame 0 (reading frame 1): first nucleotide of each codon
        if num_frames >= 1:
            pos0 = codon_idx * 3
            if pos0 < len(seq):
                base0 = seq[pos0]
                if base0 in NUCLEOTIDE_FREQUENCY:
                    freq = NUCLEOTIDE_FREQUENCY[base0]
                    pitch = NUCLEOTIDE_PITCH[base0]
                    all_pitches.append(SimultaneousPitch(pitch=pitch, frequency=freq, amplitude=amplitude))
                    all_frequencies.append(freq)
                    bio_parts.append(f"F1:{base0}")

        # Frame 1 (reading frame 2): first two nucleotides of second frame
        if num_frames >= 2:
            for j in range(2):
                pos1 = codon_idx * 3 + j
                if pos1 < len(seq):
                    base1 = seq[pos1]
                    if base1 in NUCLEOTIDE_FREQUENCY:
                        freq = NUCLEOTIDE_FREQUENCY[base1]
                        pitch = NUCLEOTIDE_PITCH[base1]
                        all_pitches.append(SimultaneousPitch(pitch=pitch, frequency=freq, amplitude=amplitude))
                        all_frequencies.append(freq)
                        bio_parts.append(f"F2:{base1}")

        # Frame 2 (reading frame 3): all three nucleotides of third frame
        if num_frames >= 3:
            for j in range(3):
                pos2 = codon_idx * 3 + j
                if pos2 < len(seq):
                    base2 = seq[pos2]
                    if base2 in NUCLEOTIDE_FREQUENCY:
                        freq = NUCLEOTIDE_FREQUENCY[base2]
                        pitch = NUCLEOTIDE_PITCH[base2]
                        all_pitches.append(SimultaneousPitch(pitch=pitch, frequency=freq, amplitude=amplitude))
                        all_frequencies.append(freq)
                        bio_parts.append(f"F3:{base2}")

        if not all_pitches:
            continue

        # Primary event uses the first pitch
        primary = all_pitches[0]

        events.append(
            SonificationEvent(
                event_id=create_event_id(),
                analysis_id=analysis_id,
                sequence_id=sequence_id,
                position=codon_idx * 3,
                frame=0,
                event_type=EventType.CHORD,
                biological_value="|".join(bio_parts),
                start_time=current_time,
                duration=duration,
                pitch=primary.pitch,
                frequency=primary.frequency,
                amplitude=amplitude,
                instrument=instrument,
                simultaneous_pitches=tuple(all_pitches),
                simultaneous_frequencies=tuple(all_frequencies),
                profile="paper_2017",
                source_algorithm="reading_frame_chords",
                source_paper="s12859-017-1632-x.pdf",
                mapping_description=f"Codon {codon_idx} ({num_frames} frames) -> {len(all_pitches)} pitches",
            )
        )
        current_time += duration

    return tuple(events)


def generate_reading_frame_chords_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete Reading Frame Chords timeline."""
    if not analysis_id:
        analysis_id = create_analysis_id()

    events = generate_reading_frame_chords_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="paper_2017",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="reading_frame_chords",
    )
