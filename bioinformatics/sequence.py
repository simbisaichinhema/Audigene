"""DNA sequence validation and FASTA parsing.

Handles:
- Raw DNA sequence validation (A, C, G, T)
- Ambiguous base detection (N, R, Y, etc.)
- Invalid character detection
- FASTA file parsing
- Sequence representation
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# Standard IUPAC DNA bases
VALID_BASES = frozenset({"A", "C", "G", "T"})

# Ambiguous IUPAC codes (valid DNA but not unique)
AMBIGUOUS_BASES = frozenset({"N", "R", "Y", "S", "W", "K", "M", "B", "D", "H", "V"})

# All recognized bases
ALL_KNOWN_BASES = VALID_BASES | AMBIGUOUS_BASES

# FASTA header pattern
FASTA_HEADER_RE = re.compile(r"^>(.+)$")


@dataclass(frozen=True)
class ValidatedSequence:
    """A validated DNA sequence with metadata."""

    id: str
    sequence: str
    length: int
    valid_base_count: int
    ambiguous_count: int
    invalid_count: int
    invalid_chars: frozenset[str]
    is_valid: bool  # True if no invalid characters
    warnings: tuple[str, ...]

    def __post_init__(self) -> None:
        object.__setattr__(self, "length", len(self.sequence))


@dataclass(frozen=True)
class FASTARecord:
    """A single record from a FASTA file."""

    header: str
    sequence: str


@dataclass(frozen=True)
class FASTAResult:
    """Result of parsing a FASTA file/string."""

    records: tuple[FASTARecord, ...]
    total_sequences: int
    total_length: int
    warnings: tuple[str, ...]


def validate_dna(sequence: str, sequence_id: str = "unknown") -> ValidatedSequence:
    """Validate a DNA sequence string.

    Checks for valid IUPAC DNA bases (A, C, G, T), reports ambiguous bases,
    and identifies invalid characters.

    Args:
        sequence: Raw DNA sequence string (case-insensitive).
        sequence_id: Identifier for this sequence.

    Returns:
        ValidatedSequence with validation results.
    """
    if not sequence:
        return ValidatedSequence(
            id=sequence_id,
            sequence="",
            length=0,
            valid_base_count=0,
            ambiguous_count=0,
            invalid_count=0,
            invalid_chars=frozenset(),
            is_valid=True,
            warnings=("Empty sequence.",),
        )

    seq_upper = sequence.upper()
    valid_count = 0
    ambiguous_count = 0
    invalid_chars: set[str] = []

    for base in seq_upper:
        if base in VALID_BASES:
            valid_count += 1
        elif base in AMBIGUOUS_BASES:
            ambiguous_count += 1
        else:
            invalid_chars.append(base)

    invalid_count = len(invalid_chars)
    is_valid = invalid_count == 0

    warnings: list[str] = []
    if ambiguous_count > 0:
        warnings.append(
            f"Sequence contains {ambiguous_count} ambiguous base(s): "
            f"{', '.join(sorted(frozenset(invalid_chars) if invalid_chars else []))}"
        )
    if invalid_count > 0:
        unique_invalid = sorted(frozenset(invalid_chars))
        warnings.append(
            f"Sequence contains {invalid_count} invalid character(s): "
            f"{', '.join(unique_invalid)}"
        )
    if not is_valid:
        warnings.append(
            "Sequence contains invalid characters and may not be suitable for analysis."
        )

    return ValidatedSequence(
        id=sequence_id,
        sequence=seq_upper,
        length=len(seq_upper),
        valid_base_count=valid_count,
        ambiguous_count=ambiguous_count,
        invalid_count=invalid_count,
        invalid_chars=frozenset(invalid_chars),
        is_valid=is_valid,
        warnings=tuple(warnings),
    )


def parse_fasta(text: str) -> FASTAResult:
    """Parse a FASTA-formatted string.

    Supports multi-line sequences and multiple records.

    Args:
        text: FASTA-formatted string.

    Returns:
        FASTAResult with parsed records and metadata.

    Raises:
        ValueError: If input is empty or malformed.
    """
    text = text.strip()
    if not text:
        raise ValueError("Empty FASTA input.")

    records: list[FASTARecord] = []
    current_header: Optional[str] = None
    current_seq_parts: list[str] = []
    warnings: list[str] = []

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        header_match = FASTA_HEADER_RE.match(line)
        if header_match:
            # Save previous record if any
            if current_header is not None:
                seq = "".join(current_seq_parts).upper()
                if not seq:
                    warnings.append(f"Record '{current_header}' has empty sequence.")
                records.append(FASTARecord(header=current_header, sequence=seq))

            current_header = header_match.group(1).strip()
            current_seq_parts = []
        else:
            if current_header is None:
                warnings.append(f"Sequence data before any header: '{line[:50]}...'")
                continue
            current_seq_parts.append(line)

    # Don't forget the last record
    if current_header is not None:
        seq = "".join(current_seq_parts).upper()
        if not seq:
            warnings.append(f"Record '{current_header}' has empty sequence.")
        records.append(FASTARecord(header=current_header, sequence=seq))

    if not records:
        raise ValueError("No valid FASTA records found.")

    total_length = sum(len(r.sequence) for r in records)

    return FASTAResult(
        records=tuple(records),
        total_sequences=len(records),
        total_length=total_length,
        warnings=tuple(warnings),
    )


def parse_fasta_file(filepath: str | Path) -> FASTAResult:
    """Parse a FASTA file from disk.

    Args:
        filepath: Path to FASTA file.

    Returns:
        FASTAResult with parsed records.

    Raises:
        FileNotFoundError: If file does not exist.
        ValueError: If file is empty or malformed.
    """
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"FASTA file not found: {path}")
    if not path.is_file():
        raise ValueError(f"Path is not a file: {path}")

    text = path.read_text(encoding="utf-8")
    return parse_fasta(text)


def sanitize_sequence(sequence: str) -> str:
    """Remove whitespace and convert to uppercase.

    Args:
        sequence: Raw sequence string.

    Returns:
        Cleaned sequence string.
    """
    return re.sub(r"\s+", "", sequence).upper()
