"""Start/Stop codon marker sonification — AUDIGENE EXTENSION.

** This is NOT a paper-defined method. **

The paper (Temple 2017, page 5) mentions start/stop codons only within
the Codon Walking section: "start codons (ATG) are assigned a higher
pitch and stop codons (TAA, TAG, TGA) are assigned a lower pitch."

The paper does NOT specify:
- How much higher/lower (we chose ±12 semitones = one octave)
- What base pitch to shift from (we chose A→C4 = 262 Hz)
- What duration to use (we chose 300ms)
- Whether this should be a standalone method (we made it composable)

Fidelity: AMBIGUOUS (paper principle) + AUDIGENE (specific values)
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
    EVENT_DURATION,
    DEFAULT_AMPLITUDE,
    DEFAULT_INSTRUMENT,
)
from sonification.paper_2017.dna_walking import semitones_to_frequency, frequency_to_note

# ── AudiGene choices (paper says qualitative "higher"/"lower") ──

# Start codon: one octave higher (+12 semitones)
START_OCTAVE_SHIFT = 12

# Stop codon: one octave lower (-12 semitones)
STOP_OCTAVE_SHIFT = -12

# Start/stop codon durations (longer than regular nucleotides for emphasis)
START_STOP_DURATION = 0.3  # 300ms


def generate_start_stop_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
    include_regular: bool = True,
) -> tuple[SonificationEvent, ...]:
    """Generate start/stop marker events for a DNA sequence.

    Identifies ATG (start) and TAA/TAG/TGA (stop) codons and generates
    special marker events with pitch-shifted tones.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        amplitude: Amplitude (0.0-1.0).
        instrument: Timbre identifier.
        frame: Reading frame to analyse (0, 1, or 2).
        include_regular: If True, include regular nucleotide events
                         between start/stop markers.

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()
    events: list[SonificationEvent] = []
    current_time = start_time
    current_frame = frame

    START_CODON = "ATG"
    STOP_CODONS = {"TAA", "TAG", "TGA"}

    pos = frame
    while pos + 3 <= len(seq):
        codon = seq[pos : pos + 3]

        if codon == START_CODON:
            # Start codon: higher pitch
            base_freq = NUCLEOTIDE_FREQUENCY.get("A", 262.0)
            start_freq = semitones_to_frequency(base_freq, START_OCTAVE_SHIFT)
            pitch = frequency_to_note(start_freq)

            events.append(
                SonificationEvent(
                    event_id=create_event_id(),
                    analysis_id=analysis_id,
                    sequence_id=sequence_id,
                    position=pos,
                    frame=current_frame,
                    event_type=EventType.START_CODON,
                    biological_value=codon,
                    start_time=current_time,
                    duration=START_STOP_DURATION,
                    pitch=pitch,
                    frequency=round(start_freq, 2),
                    amplitude=amplitude,
                    instrument=instrument,
                    profile="audigene",
                    source_algorithm="start_stop",
                    source_paper="s12859-017-1632-x.pdf",
                    mapping_description=f"START {codon} at {pos} -> {pitch} ({round(start_freq, 2)} Hz) [AUDIGENE: +12 semitones]",
                    paper_rule="start codon -> higher pitch",
                    implementation="+12 semitones (one octave up)",
                    implementation_source="AUDIGENE_INTERPRETATION",
                )
            )
            current_time += START_STOP_DURATION

        elif codon in STOP_CODONS:
            # Stop codon: lower pitch
            base_freq = NUCLEOTIDE_FREQUENCY.get("A", 262.0)
            stop_freq = semitones_to_frequency(base_freq, STOP_OCTAVE_SHIFT)
            pitch = frequency_to_note(stop_freq)

            events.append(
                SonificationEvent(
                    event_id=create_event_id(),
                    analysis_id=analysis_id,
                    sequence_id=sequence_id,
                    position=pos,
                    frame=current_frame,
                    event_type=EventType.STOP_CODON,
                    biological_value=codon,
                    start_time=current_time,
                    duration=START_STOP_DURATION,
                    pitch=pitch,
                    frequency=round(stop_freq, 2),
                    amplitude=amplitude,
                    instrument=instrument,
                    profile="audigene",
                    source_algorithm="start_stop",
                    source_paper="s12859-017-1632-x.pdf",
                    mapping_description=f"STOP {codon} at {pos} -> {pitch} ({round(stop_freq, 2)} Hz) [AUDIGENE: -12 semitones]",
                    paper_rule="stop codon -> lower pitch",
                    implementation="-12 semitones (one octave down)",
                    implementation_source="AUDIGENE_INTERPRETATION",
                )
            )
            current_time += START_STOP_DURATION

        elif include_regular:
            # Regular codon: play each nucleotide
            for j in range(3):
                base = seq[pos + j]
                if base in NUCLEOTIDE_FREQUENCY:
                    freq = NUCLEOTIDE_FREQUENCY[base]
                    pitch = NUCLEOTIDE_PITCH[base]
                    events.append(
                        SonificationEvent(
                            event_id=create_event_id(),
                            analysis_id=analysis_id,
                            sequence_id=sequence_id,
                            position=pos + j,
                            frame=current_frame,
                            event_type=EventType.NUCLEOTIDE,
                            biological_value=base,
                            start_time=current_time,
                            duration=EVENT_DURATION,
                            pitch=pitch,
                            frequency=freq,
                            amplitude=amplitude,
                            instrument=instrument,
                            profile="audigene",
                            source_algorithm="start_stop",
                            source_paper="s12859-017-1632-x.pdf",
                            mapping_description=f"{base} -> {pitch} ({freq} Hz)",
                        )
                    )
                    current_time += EVENT_DURATION

        pos += 3

    return tuple(events)


def generate_start_stop_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete start/stop marker timeline."""
    if not analysis_id:
        analysis_id = create_analysis_id()

    events = generate_start_stop_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="audigene",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="start_stop",
    )
