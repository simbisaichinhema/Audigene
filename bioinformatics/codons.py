"""Codon parsing and start/stop codon detection.

Handles:
- Splitting a sequence into codons (triplets)
- Start codon detection (ATG)
- Stop codon detection (TAA, TAG, TGA)
- Codon metadata (position, frame, is_start, is_stop)
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

# Biological constants
START_CODON = "ATG"
STOP_CODONS = frozenset({"TAA", "TAG", "TGA"})
ALL_CODONS = frozenset(
    "".join(a + b + c)
    for a in "ACGT"
    for b in "ACGT"
    for c in "ACGT"
)


class CodonType(Enum):
    """Classification of a codon."""

    START = "start"
    STOP = "stop"
    CODING = "coding"
    INCOMPLETE = "incomplete"  # Less than 3 bases


@dataclass(frozen=True)
class Codon:
    """A parsed codon with metadata."""

    sequence: str  # The 3-letter codon (or partial)
    position: int  # 0-based position in the original sequence
    frame: int  # Reading frame (0, 1, or 2)
    codon_type: CodonType
    is_start: bool
    is_stop: bool
    index: int  # Index of this codon within its frame


def classify_codon(sequence: str) -> CodonType:
    """Classify a codon by type.

    Args:
        sequence: A 3-letter nucleotide string.

    Returns:
        CodonType classification.
    """
    seq_upper = sequence.upper()
    if len(seq_upper) < 3:
        return CodonType.INCOMPLETE
    if seq_upper == START_CODON:
        return CodonType.START
    if seq_upper in STOP_CODONS:
        return CodonType.STOP
    return CodonType.CODING


def parse_codons(
    sequence: str,
    frame: int = 0,
    offset: int = 0,
) -> list[Codon]:
    """Parse a sequence into codons for a given reading frame.

    Args:
        sequence: DNA sequence string (uppercase).
        frame: Reading frame offset (0, 1, or 2). Determines where
               codon boundaries fall relative to the sequence start.
        offset: Additional position offset (e.g., for alignment gaps).

    Returns:
        List of Codon objects.
    """
    if frame not in (0, 1, 2):
        raise ValueError(f"Frame must be 0, 1, or 2, got {frame}")

    seq_upper = sequence.upper()
    codons: list[Codon] = []
    idx = 0

    # Start from the frame offset
    pos = frame
    while pos + 3 <= len(seq_upper):
        codon_seq = seq_upper[pos : pos + 3]
        codon_type = classify_codon(codon_seq)
        codons.append(
            Codon(
                sequence=codon_seq,
                position=pos + offset,
                frame=frame,
                codon_type=codon_type,
                is_start=(codon_type == CodonType.START),
                is_stop=(codon_type == CodonType.STOP),
                index=idx,
            )
        )
        pos += 3
        idx += 1

    # Handle incomplete trailing codon
    if pos < len(seq_upper):
        partial = seq_upper[pos:]
        codons.append(
            Codon(
                sequence=partial,
                position=pos + offset,
                frame=frame,
                codon_type=CodonType.INCOMPLETE,
                is_start=False,
                is_stop=False,
                index=idx,
            )
        )

    return codons


def find_start_codons(sequence: str, frame: int = 0) -> list[Codon]:
    """Find all start codons (ATG) in a sequence for a given frame.

    Args:
        sequence: DNA sequence string.
        frame: Reading frame (0, 1, or 2).

    Returns:
        List of Codon objects where is_start is True.
    """
    codons = parse_codons(sequence, frame=frame)
    return [c for c in codons if c.is_start]


def find_stop_codons(sequence: str, frame: int = 0) -> list[Codon]:
    """Find all stop codons (TAA, TAG, TGA) in a sequence for a given frame.

    Args:
        sequence: DNA sequence string.
        frame: Reading frame (0, 1, or 2).

    Returns:
        List of Codon objects where is_stop is True.
    """
    codons = parse_codons(sequence, frame=frame)
    return [c for c in codons if c.is_stop]


def get_codon_at_position(sequence: str, position: int) -> Optional[Codon]:
    """Get the codon that contains a given position in frame 0.

    Args:
        sequence: DNA sequence string.
        position: 0-based position in the sequence.

    Returns:
        Codon at that position, or None if position is out of range.
    """
    if position < 0 or position >= len(sequence):
        return None

    # Determine which codon this position falls in (frame 0)
    codon_index = position // 3
    codon_start = codon_index * 3
    seq_upper = sequence.upper()
    codon_seq = seq_upper[codon_start : codon_start + 3]
    codon_type = classify_codon(codon_seq)

    return Codon(
        sequence=codon_seq,
        position=codon_start,
        frame=0,
        codon_type=codon_type,
        is_start=(codon_type == CodonType.START),
        is_stop=(codon_type == CodonType.STOP),
        index=codon_index,
    )


def translate_codon(codon_seq: str) -> Optional[str]:
    """Translate a single codon to an amino acid (single-letter code).

    Uses the standard genetic code. Returns None for stop codons
    and incomplete codons.

    Args:
        codon_seq: 3-letter nucleotide string.

    Returns:
        Single-letter amino acid code, or None for stop/incomplete.
    """
    codon = codon_seq.upper()
    if len(codon) < 3:
        return None

    # Standard genetic code
    genetic_code = {
        "TTT": "F", "TTC": "F", "TTA": "L", "TTG": "L",
        "CTT": "L", "CTC": "L", "CTA": "L", "CTG": "L",
        "ATT": "I", "ATC": "I", "ATA": "I", "ATG": "M",
        "GTT": "V", "GTC": "V", "GTA": "V", "GTG": "V",
        "TCT": "S", "TCC": "S", "TCA": "S", "TCG": "S",
        "CCT": "P", "CCC": "P", "CCA": "P", "CCG": "P",
        "ACT": "T", "ACC": "T", "ACA": "T", "ACG": "T",
        "GCT": "A", "GCC": "A", "GCA": "A", "GCG": "A",
        "TAT": "Y", "TAC": "Y", "TAA": "*", "TAG": "*",
        "CAT": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
        "AAT": "N", "AAC": "N", "AAA": "K", "AAG": "K",
        "GAT": "D", "GAC": "D", "GAA": "E", "GAG": "E",
        "TGT": "C", "TGC": "C", "TGA": "*", "TGG": "W",
        "CGT": "R", "CGC": "R", "CGA": "R", "CGG": "R",
        "AGT": "S", "AGC": "S", "AGA": "R", "AGG": "R",
        "GGT": "G", "GGC": "G", "GGA": "G", "GGG": "G",
    }

    aa = genetic_code.get(codon)
    if aa == "*":
        return None  # Stop codon
    return aa
