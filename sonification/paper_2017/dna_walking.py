"""DNA Walking sonification (Temple 2017).

Uses musical intervals between consecutive nucleotides rather than
absolute pitches. Each nucleotide transition is mapped to a specific
interval from the paper's full 4x4 matrix.

Starting note: C4 (262 Hz). First note is arbitrary per the paper.

Interval matrix (from Methods section):
    From\To  A       C       G       T
    A        0(s)    9(M6)   4(M3)   5(P4)
    C        9(M6)   0(s)    4(M3)   7(P5)
    G        8(m6)   9(M6)   0(s)    2(M2)
    T        1(m2)   7(P5)   8(m6)   0(s)

s = unison, m2 = minor 2nd, M2 = major 2nd, M3 = major 3rd,
P4 = perfect 4th, P5 = perfect 5th, m6 = minor 6th, M6 = major 6th

Source: Temple (2017), BMC Bioinformatics, Methods section.
"""

from __future__ import annotations

import math

from sonification.events import (
    SonificationEvent,
    SonificationTimeline,
    EventType,
    create_event_id,
    create_analysis_id,
)
from sonification.paper_2017.nucleotide_chroma import (
    DEFAULT_AMPLITUDE,
    DEFAULT_INSTRUMENT,
    EVENT_DURATION,
)

# ── Paper-defined interval matrix (semitones) ───────────────────────────

# Maps (from_nucleotide, to_nucleotide) -> interval in semitones
INTERVAL_MATRIX: dict[tuple[str, str], int] = {
    ("A", "A"): 0,   # Unison
    ("A", "C"): 9,   # Major 6th
    ("A", "G"): 4,   # Major 3rd
    ("A", "T"): 5,   # Perfect 4th
    ("C", "A"): 9,   # Major 6th
    ("C", "C"): 0,   # Unison
    ("C", "G"): 4,   # Major 3rd
    ("C", "T"): 7,   # Perfect 5th
    ("G", "A"): 8,   # Minor 6th
    ("G", "C"): 9,   # Major 6th
    ("G", "G"): 0,   # Unison
    ("G", "T"): 2,   # Major 2nd
    ("T", "A"): 1,   # Minor 2nd
    ("T", "C"): 7,   # Perfect 5th
    ("T", "G"): 8,   # Minor 6th
    ("T", "T"): 0,   # Unison
}

# Interval name mapping for descriptions
INTERVAL_NAMES = {
    0: "unison",
    1: "minor 2nd",
    2: "major 2nd",
    4: "major 3rd",
    5: "perfect 4th",
    7: "perfect 5th",
    8: "minor 6th",
    9: "major 6th",
}

# Starting note frequency (C4 = 262 Hz, arbitrary per paper)
STARTING_FREQUENCY = 262.0


def semitones_to_frequency(base_freq: float, semitones: int) -> float:
    """Convert a frequency + semitone offset to a new frequency.

    Uses equal temperament: f = base * 2^(semitones/12)

    Args:
        base_freq: Base frequency in Hz.
        semitones: Number of semitones up (positive) or down (negative).

    Returns:
        New frequency in Hz.
    """
    return base_freq * (2.0 ** (semitones / 12.0))


def frequency_to_note(freq: float) -> str:
    """Convert a frequency to the nearest note name.

    Uses A4 = 440 Hz as reference.

    Args:
        freq: Frequency in Hz.

    Returns:
        Note name (e.g., "C4", "E4").
    """
    if freq <= 0:
        return "A0"

    # A4 = 440 Hz
    note_names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

    # Calculate semitones from A4
    semitones_from_a4 = 12 * math.log2(freq / 440.0)
    midi_note = int(round(semitones_from_a4)) + 69  # A4 = MIDI 69

    octave = (midi_note // 12) - 1
    note_index = midi_note % 12

    return f"{note_names[note_index]}{octave}"


def generate_dna_walking_events(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    start_time: float = 0.0,
    duration: float = EVENT_DURATION,
    amplitude: float = DEFAULT_AMPLITUDE,
    instrument: str = DEFAULT_INSTRUMENT,
    frame: int = 0,
    starting_frequency: float = STARTING_FREQUENCY,
) -> tuple[SonificationEvent, ...]:
    """Generate DNA Walking events for a DNA sequence.

    Each nucleotide is assigned a pitch based on the interval from
    the previous nucleotide, using the paper's interval matrix.

    Args:
        sequence: DNA sequence string (uppercase).
        sequence_id: Identifier for this sequence.
        analysis_id: Analysis identifier.
        start_time: Start time in seconds.
        duration: Duration per event in seconds.
        amplitude: Amplitude (0.0-1.0).
        instrument: Timbre identifier.
        frame: Reading frame (for metadata).
        starting_frequency: Starting frequency in Hz.

    Returns:
        Tuple of SonificationEvent objects.
    """
    if not analysis_id:
        analysis_id = create_analysis_id()

    seq = sequence.upper()
    events: list[SonificationEvent] = []
    current_time = start_time
    current_freq = starting_frequency

    for i, base in enumerate(seq):
        if base not in "ACGT":
            continue

        if i == 0:
            # First note uses starting frequency
            interval = 0
            interval_name = "start"
        else:
            prev_base = seq[i - 1] if seq[i - 1] in "ACGT" else None
            if prev_base and (prev_base, base) in INTERVAL_MATRIX:
                interval = INTERVAL_MATRIX[(prev_base, base)]
                interval_name = INTERVAL_NAMES.get(interval, f"{interval} semitones")
                current_freq = semitones_to_frequency(current_freq, interval)
            else:
                interval = 0
                interval_name = "reset"

        pitch = frequency_to_note(current_freq)

        events.append(
            SonificationEvent(
                event_id=create_event_id(),
                analysis_id=analysis_id,
                sequence_id=sequence_id,
                position=i,
                frame=frame,
                event_type=EventType.INTERVAL,
                biological_value=base,
                start_time=current_time,
                duration=duration,
                pitch=pitch,
                frequency=round(current_freq, 2),
                amplitude=amplitude,
                instrument=instrument,
                profile="paper_2017",
                source_algorithm="dna_walking",
                source_paper="s12859-017-1632-x.pdf",
                mapping_description=f"{base} -> {pitch} ({round(current_freq, 2)} Hz) [{interval_name}]",
            )
        )
        current_time += duration

    return tuple(events)


def generate_dna_walking_timeline(
    sequence: str,
    sequence_id: str = "reference",
    analysis_id: str = "",
    **kwargs,
) -> SonificationTimeline:
    """Generate a complete DNA Walking timeline.

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

    events = generate_dna_walking_events(
        sequence, sequence_id=sequence_id, analysis_id=analysis_id, **kwargs
    )

    total_duration = events[-1].start_time + events[-1].duration if events else 0.0

    return SonificationTimeline(
        analysis_id=analysis_id,
        profile="paper_2017",
        events=events,
        total_duration=total_duration,
        sequence_length=len(sequence),
        method="dna_walking",
    )
