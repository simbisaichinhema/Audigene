"""Reading frame detection and analysis.

Handles:
- Detection of three reading frames (+1, +2, +3)
- Frame identification from ATG start codons
- Frame boundary determination
- Multi-frame analysis
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from bioinformatics.codons import (
    Codon,
    CodonType,
    START_CODON,
    STOP_CODONS,
    parse_codons,
    find_start_codons,
    find_stop_codons,
)


@dataclass(frozen=True)
class ReadingFrame:
    """A reading frame with its codons and boundaries."""

    frame: int  # 0, 1, or 2
    codons: tuple[Codon, ...]
    start_codons: tuple[Codon, ...]
    stop_codons: tuple[Codon, ...]
    has_start: bool
    has_stop: bool
    first_start_position: Optional[int]  # Position of first ATG, if any
    first_stop_position: Optional[int]  # Position of first stop, if any
    coding_start: Optional[int]  # Position where coding begins (after ATG)
    coding_end: Optional[int]  # Position where coding ends (at stop)
    coding_length: int  # Length of coding region in bases


@dataclass(frozen=True)
class MultiFrameResult:
    """Result of analyzing all three reading frames."""

    sequence: str
    frames: tuple[ReadingFrame, ...]
    longest_frame: int  # Frame number with most codons
    frame_with_start: Optional[int]  # Frame containing first ATG


def detect_reading_frames(sequence: str) -> MultiFrameResult:
    """Detect and analyze all three reading frames.

    In biology, a reading frame is determined by where codon boundaries
    fall. Frame 0 starts at position 0, Frame 1 at position 1,
    Frame 2 at position 2.

    Per the paper (Temple 2017), the reading frame is identified by
    the first ATG start codon. This function analyzes all three frames
    and identifies which contains the first ATG.

    Args:
        sequence: DNA sequence string (uppercase).

    Returns:
        MultiFrameResult with all three frames analyzed.
    """
    frames: list[ReadingFrame] = []

    for frame_num in range(3):
        codons = parse_codons(sequence, frame=frame_num)
        start_c = find_start_codons(sequence, frame=frame_num)
        stop_c = find_stop_codons(sequence, frame=frame_num)

        has_start = len(start_c) > 0
        has_stop = len(stop_c) > 0

        first_start_pos = start_c[0].position if has_start else None
        first_stop_pos = stop_c[0].position if has_stop else None

        # Determine coding region boundaries
        coding_start: Optional[int] = None
        coding_end: Optional[int] = None
        coding_length = 0

        if has_start:
            coding_start = first_start_pos
            if has_stop:
                coding_end = first_stop_pos
                coding_length = coding_end - coding_start
            else:
                # No stop codon — extends to end of sequence
                coding_length = len(sequence) - coding_start

        frames.append(
            ReadingFrame(
                frame=frame_num,
                codons=tuple(codons),
                start_codons=tuple(start_c),
                stop_codons=tuple(stop_c),
                has_start=has_start,
                has_stop=has_stop,
                first_start_position=first_start_pos,
                first_stop_position=first_stop_pos,
                coding_start=coding_start,
                coding_end=coding_end,
                coding_length=coding_length,
            )
        )

    # Find frame with longest coding region
    longest = max(frames, key=lambda f: f.coding_length)

    # Find frame with first ATG (earliest position)
    frames_with_start = [f for f in frames if f.has_start]
    frame_with_start: Optional[int] = None
    if frames_with_start:
        frame_with_start = min(
            frames_with_start, key=lambda f: f.first_start_position
        ).frame

    return MultiFrameResult(
        sequence=sequence,
        frames=tuple(frames),
        longest_frame=longest.frame,
        frame_with_start=frame_with_start,
    )


def get_coding_sequence(sequence: str, frame: int = 0) -> Optional[str]:
    """Extract the coding sequence for a frame (from ATG to stop codon).

    Args:
        sequence: DNA sequence string.
        frame: Reading frame (0, 1, or 2).

    Returns:
        Coding sequence string, or None if no ATG found.
    """
    result = detect_reading_frames(sequence)
    rf = result.frames[frame]

    if not rf.has_start:
        return None

    start = rf.first_start_position
    if start is None:
        return None

    if rf.has_stop and rf.first_stop_position is not None:
        # Include the stop codon (3 bases) in the coding sequence
        end = rf.first_stop_position + 3
    else:
        end = len(sequence)

    return sequence[start:end]
