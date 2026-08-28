"""Pairwise sequence alignment.

Implements Needleman-Wunsch global alignment for DNA sequences.
This is the alignment layer required by the AudiGene specification
to avoid naive position-by-position comparison.

The alignment layer is designed to be replaceable — a more sophisticated
aligner (e.g., BLAST, minimap2) can be substituted later.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

import numpy as np


class Operation(Enum):
    """Alignment operation at each position."""

    MATCH = "match"
    MISMATCH = "mismatch"
    INSERTION = "insertion"  # Gap in reference
    DELETION = "deletion"  # Gap in sample


@dataclass(frozen=True)
class AlignmentEntry:
    """A single position in the alignment."""

    ref_base: Optional[str]  # None if insertion (gap in reference)
    sample_base: Optional[str]  # None if deletion (gap in sample)
    ref_position: Optional[int]  # Position in original reference
    sample_position: Optional[int]  # Position in original sample
    operation: Operation
    alignment_position: int  # Position in the alignment


@dataclass(frozen=True)
class Alignment:
    """A complete pairwise alignment result."""

    reference: str  # Original reference sequence
    sample: str  # Original sample sequence
    aligned_reference: str  # Reference with gaps
    aligned_sample: str  # Sample with gaps
    entries: tuple[AlignmentEntry, ...]
    score: float
    match_count: int
    mismatch_count: int
    insertion_count: int  # Gaps in reference
    deletion_count: int  # Gaps in sample
    gap_count: int
    length: int  # Alignment length (including gaps)
    identity: float  # Fraction of matched positions


def align_pairwise(
    reference: str,
    sample: str,
    match_score: float = 1.0,
    mismatch_score: float = -1.0,
    gap_penalty: float = -2.0,
) -> Alignment:
    """Perform Needleman-Wunsch global pairwise alignment.

    Args:
        reference: Reference DNA sequence.
        sample: Sample DNA sequence.
        match_score: Score for a matching pair.
        mismatch_score: Score for a mismatching pair.
        gap_penalty: Penalty for a gap (should be negative).

    Returns:
        Alignment with aligned sequences and structured entries.
    """
    ref = reference.upper()
    samp = sample.upper()
    n = len(ref)
    m = len(samp)

    # Handle empty sequences
    if n == 0 and m == 0:
        return Alignment(
            reference=ref,
            sample=samp,
            aligned_reference="",
            aligned_sample="",
            entries=(),
            score=0.0,
            match_count=0,
            mismatch_count=0,
            insertion_count=0,
            deletion_count=0,
            gap_count=0,
            length=0,
            identity=0.0,
        )

    if n == 0:
        return Alignment(
            reference=ref,
            sample=samp,
            aligned_reference="-" * m,
            aligned_sample=samp,
            entries=tuple(
                AlignmentEntry(
                    ref_base=None,
                    sample_base=samp[i],
                    ref_position=None,
                    sample_position=i,
                    operation=Operation.INSERTION,
                    alignment_position=i,
                )
                for i in range(m)
            ),
            score=gap_penalty * m,
            match_count=0,
            mismatch_count=0,
            insertion_count=m,
            deletion_count=0,
            gap_count=m,
            length=m,
            identity=0.0,
        )

    if m == 0:
        return Alignment(
            reference=ref,
            sample=samp,
            aligned_reference=ref,
            aligned_sample="-" * n,
            entries=tuple(
                AlignmentEntry(
                    ref_base=ref[i],
                    sample_base=None,
                    ref_position=i,
                    sample_position=None,
                    operation=Operation.DELETION,
                    alignment_position=i,
                )
                for i in range(n)
            ),
            score=gap_penalty * n,
            match_count=0,
            mismatch_count=0,
            insertion_count=0,
            deletion_count=n,
            gap_count=n,
            length=n,
            identity=0.0,
        )

    # Build scoring matrix
    score_matrix = np.zeros((n + 1, m + 1), dtype=np.float64)
    trace_matrix = np.zeros((n + 1, m + 1), dtype=np.int32)
    # 0 = diagonal (match/mismatch), 1 = up (deletion), 2 = left (insertion)

    # Initialize first row and column
    for i in range(1, n + 1):
        score_matrix[i, 0] = gap_penalty * i
        trace_matrix[i, 0] = 1  # up
    for j in range(1, m + 1):
        score_matrix[0, j] = gap_penalty * j
        trace_matrix[0, j] = 2  # left

    # Fill matrix
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            # Diagonal: match or mismatch
            if ref[i - 1] == samp[j - 1]:
                diag_score = score_matrix[i - 1, j - 1] + match_score
            else:
                diag_score = score_matrix[i - 1, j - 1] + mismatch_score

            # Up: gap in sample (deletion)
            up_score = score_matrix[i - 1, j] + gap_penalty

            # Left: gap in reference (insertion)
            left_score = score_matrix[i, j - 1] + gap_penalty

            # Choose best
            if diag_score >= up_score and diag_score >= left_score:
                score_matrix[i, j] = diag_score
                trace_matrix[i, j] = 0  # diagonal
            elif up_score >= left_score:
                score_matrix[i, j] = up_score
                trace_matrix[i, j] = 1  # up
            else:
                score_matrix[i, j] = left_score
                trace_matrix[i, j] = 2  # left

    # Traceback
    aligned_ref_parts: list[str] = []
    aligned_samp_parts: list[str] = []
    entries: list[AlignmentEntry] = []
    i, j = n, m
    alignment_pos = 0

    while i > 0 or j > 0:
        if i > 0 and j > 0 and trace_matrix[i, j] == 0:
            # Diagonal
            if ref[i - 1] == samp[j - 1]:
                op = Operation.MATCH
            else:
                op = Operation.MISMATCH
            aligned_ref_parts.append(ref[i - 1])
            aligned_samp_parts.append(samp[j - 1])
            entries.append(
                AlignmentEntry(
                    ref_base=ref[i - 1],
                    sample_base=samp[j - 1],
                    ref_position=i - 1,
                    sample_position=j - 1,
                    operation=op,
                    alignment_position=alignment_pos,
                )
            )
            i -= 1
            j -= 1
        elif i > 0 and (j == 0 or trace_matrix[i, j] == 1):
            # Up: gap in sample (deletion from reference perspective)
            aligned_ref_parts.append(ref[i - 1])
            aligned_samp_parts.append("-")
            entries.append(
                AlignmentEntry(
                    ref_base=ref[i - 1],
                    sample_base=None,
                    ref_position=i - 1,
                    sample_position=None,
                    operation=Operation.DELETION,
                    alignment_position=alignment_pos,
                )
            )
            i -= 1
        else:
            # Left: gap in reference (insertion from reference perspective)
            aligned_ref_parts.append("-")
            aligned_samp_parts.append(samp[j - 1])
            entries.append(
                AlignmentEntry(
                    ref_base=None,
                    sample_base=samp[j - 1],
                    ref_position=None,
                    sample_position=j - 1,
                    operation=Operation.INSERTION,
                    alignment_position=alignment_pos,
                )
            )
            j -= 1
        alignment_pos += 1

    # Reverse (we traced back from end to start)
    aligned_ref_parts.reverse()
    aligned_samp_parts.reverse()
    entries.reverse()

    # Re-index alignment positions
    entries = [
        AlignmentEntry(
            ref_base=e.ref_base,
            sample_base=e.sample_base,
            ref_position=e.ref_position,
            sample_position=e.sample_position,
            operation=e.operation,
            alignment_position=idx,
        )
        for idx, e in enumerate(entries)
    ]

    aligned_ref = "".join(aligned_ref_parts)
    aligned_samp = "".join(aligned_samp_parts)

    # Count operations
    match_count = sum(1 for e in entries if e.operation == Operation.MATCH)
    mismatch_count = sum(1 for e in entries if e.operation == Operation.MISMATCH)
    insertion_count = sum(1 for e in entries if e.operation == Operation.INSERTION)
    deletion_count = sum(1 for e in entries if e.operation == Operation.DELETION)
    gap_count = insertion_count + deletion_count
    length = len(entries)

    identity = match_count / length if length > 0 else 0.0

    return Alignment(
        reference=ref,
        sample=samp,
        aligned_reference=aligned_ref,
        aligned_sample=aligned_samp,
        entries=tuple(entries),
        score=score_matrix[n, m],
        match_count=match_count,
        mismatch_count=mismatch_count,
        insertion_count=insertion_count,
        deletion_count=deletion_count,
        gap_count=gap_count,
        length=length,
        identity=identity,
    )
