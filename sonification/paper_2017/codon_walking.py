"""Codon Walking sonification — HYBRID (partially paper-derived).

** The paper's Codon Walking method (Temple 2017, page 4–5) works as: **
1. Read sequence one codon at a time
2. Translate codon to amino acid (Table 2)
3. Map amino acid to pitch using Table 7 (20 amino acids → C major pentatonic)
4. Start codons → higher pitch, Stop codons → lower pitch
5. Equal temperament, first note frequency arbitrary

** Our implementation does NOT do this. ** Instead:
1. Detects reading frame from first ATG (EXACT per paper)
2. Reads nucleotides within codon boundaries (EXACT per paper)
3. Applies the NUCLEOTIDE interval matrix (from DNA Walking) to
   consecutive nucleotides — this is NOT what the paper does

This is a hybrid: frame detection from Codon Walking + interval
mechanism from DNA Walking. The paper's amino acid → pitch mapping
(Table 7) is not implemented.

Fidelity:
- Frame detection from ATG: EXACT
- Interval-based walking within codons: AUDIGENE substitution
- Amino acid → pitch mapping: NOT IMPLEMENTED (see docs/amino-acid-mapping.md)

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
from sonification.paper_2017.dna_walking import (
    INTERVAL_MATRIX,
    INTERVAL_NAMES,
    STARTING_FREQUENCY,
    semitones_to_frequency,
    frequency_to_note,
)
from sonification.paper_2017.nucleotide_chroma import (
    DEFAULT_AMPLITUDE,
    DEFAULT_INSTRUMENT,
    EVENT_DURATION,
)


def find_first_atg_frame(sequence: str) -> int | None:
    """Find the reading frame of the first ATG start codon.

    Args:
        sequence: DNA sequence string (uppercase).

    Returns:
        Frame number (0, 1, or 2) containing the first ATG,
        or None if no ATG found.
    """
    seq = sequence.upper()
    for frame in range(3):
        for pos in range(frame, len(seq) - 2, 3):
            if seq[pos : pos + 3] == "ATG":
                return frame
    return None


def generate_codon_walking_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    duration: float = EVENT_DURATION,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
    starting_frequency: float = STARTING_FREQUENCY,
    use_frame_from_atg: bool = True,
) -> tuple[SonificationEvent, ...]:
    """Generate Codon Walking events for a DNA sequence.

    Identifies the reading frame from the first ATG, then applies
    interval-based walking to nucleotides within that frame's codons.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        duration: Duration per event in seconds.
        amplitude: Amplitude (0.0-1.0).
        instrument: Timbre identifier.
        frame: Default reading frame (used if use_frame_from_atg is False).
        starting_frequency: Starting frequency in Hz.
        use_frame_from_atg: If True, detect frame from first ATG.

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()

    # Determine the reading frame
    if use_frame_from_atg:
        detected_frame = find_first_atg_frame(seq)
        if detected_frame is not None:
            frame = detected_frame

    events: list[SonificationEvent] = []
    current_time = start_time
    current_freq = starting_frequency
    prev_base = None

    # Only play nucleotides that fall within codon boundaries of the frame
    for pos in range(frame, len(seq), 3):
        # Process each nucleotide in the codon
        codon_bases = []
        for j in range(3):
            if pos + j < len(seq):
                codon_bases.append((pos + j, seq[pos + j]))

        for base_pos, base in codon_bases:
            if base not in "ACGT":
                prev_base = None
                continue

            if prev_base is not None and (prev_base, base) in INTERVAL_MATRIX:
                interval = INTERVAL_MATRIX[(prev_base, base)]
                interval_name = INTERVAL_NAMES.get(interval, f"{interval} semitones")
                current_freq = semitones_to_frequency(current_freq, interval)
            else:
                interval = 0
                interval_name = "start"

            prev_base = base
            pitch = frequency_to_note(current_freq)

            events.append(
                SonificationEvent(
                    event_id=create_event_id(),
                    analysis_id=analysis_id,
                    sequence_id=sequence_id,
                    position=base_pos,
                    frame=frame,
                    event_type=EventType.INTERVAL,
                    biological_value=base,
                    start_time=current_time,
                    duration=duration,
                    pitch=pitch,
                    frequency=round(current_freq, 2),
                    amplitude=amplitude,
                    instrument=instrument,
                    profile="audigene_hybrid",
                    source_algorithm="codon_walking",
                    source_paper="s12859-017-1632-x.pdf",
                    mapping_description=f"{base} (frame {frame}) -> {pitch} ({round(current_freq, 2)} Hz) [{interval_name}]",
                )
            )
            current_time += duration

    return tuple(events)


def generate_codon_walking_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete Codon Walking timeline."""
    if not analysis_id:
        analysis_id = create_analysis_id()

    events = generate_codon_walking_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="audigene_hybrid",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="codon_walking",
    )
