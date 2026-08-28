"""Sequence difference detection from alignments.

Detects and classifies:
- Substitutions (mismatches)
- Insertions (gaps in reference)
- Deletions (gaps in sample)

Uses structured Difference model as required by the AudiGene specification.
Does NOT infer pathogenicity or clinical significance.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from bioinformatics.alignment import Alignment, Operation


class DifferenceType(Enum):
    """Type of sequence difference."""

    SUBSTITUTION = "substitution"
    INSERTION = "insertion"
    DELETION = "deletion"


@dataclass(frozen=True)
class Difference:
    """A detected difference between reference and sample.

    This is the structured event model that feeds into sonification.
    Every difference is traceable to specific alignment positions.
    """

    position: int  # Position in the alignment
    type: DifferenceType
    reference_base: Optional[str]  # None for insertions
    sample_base: Optional[str]  # None for deletions
    ref_position: Optional[int]  # Position in original reference
    sample_position: Optional[int]  # Position in original sample
    context: str  # Description of the difference
    codon_position: Optional[int] = None  # Position within codon (0, 1, 2)
    reading_frame: Optional[int] = None  # Which reading frame


def detect_differences(alignment: Alignment) -> list[Difference]:
    """Detect all differences from an alignment.

    Iterates through alignment entries and classifies each as:
    - MATCH: no difference
    - MISMATCH: substitution
    - INSERTION: gap in reference (extra base in sample)
    - DELETION: gap in sample (missing base in sample)

    Args:
        alignment: Alignment result from align_pairwise.

    Returns:
        List of Difference objects, ordered by alignment position.
    """
    differences: list[Difference] = []

    for entry in alignment.entries:
        if entry.operation == Operation.MATCH:
            continue

        if entry.operation == Operation.MISMATCH:
            context = f"Substitution: {entry.ref_base} → {entry.sample_base}"
            differences.append(
                Difference(
                    position=entry.alignment_position,
                    type=DifferenceType.SUBSTITUTION,
                    reference_base=entry.ref_base,
                    sample_base=entry.sample_base,
                    ref_position=entry.ref_position,
                    sample_position=entry.sample_position,
                    context=context,
                )
            )
        elif entry.operation == Operation.INSERTION:
            context = f"Insertion: {entry.sample_base} (not in reference)"
            differences.append(
                Difference(
                    position=entry.alignment_position,
                    type=DifferenceType.INSERTION,
                    reference_base=None,
                    sample_base=entry.sample_base,
                    ref_position=entry.ref_position,
                    sample_position=entry.sample_position,
                    context=context,
                )
            )
        elif entry.operation == Operation.DELETION:
            context = f"Deletion: {entry.ref_base} (missing from sample)"
            differences.append(
                Difference(
                    position=entry.alignment_position,
                    type=DifferenceType.DELETION,
                    reference_base=entry.ref_base,
                    sample_base=None,
                    ref_position=entry.ref_position,
                    sample_position=entry.sample_position,
                    context=context,
                )
            )

    return differences


def annotate_codon_context(
    differences: list[Difference],
    alignment_length: int,
) -> list[Difference]:
    """Annotate differences with codon position and reading frame.

    Determines which codon position (0, 1, 2) each difference falls in
    for reading frame 0, and which reading frame the difference affects.

    This is a simple frame-0 annotation. For frame-aware annotation,
    pass the appropriate frame offset.

    Args:
        differences: List of detected differences.
        alignment_length: Total alignment length.

    Returns:
        New list of Differences with codon_position and reading_frame set.
    """
    annotated: list[Difference] = []

    for diff in differences:
        # Codon position within frame 0
        codon_pos = diff.position % 3
        reading_frame = 0

        annotated.append(
            Difference(
                position=diff.position,
                type=diff.type,
                reference_base=diff.reference_base,
                sample_base=diff.sample_base,
                ref_position=diff.ref_position,
                sample_position=diff.sample_position,
                context=diff.context,
                codon_position=codon_pos,
                reading_frame=reading_frame,
            )
        )

    return annotated


def get_summary(differences: list[Difference]) -> dict:
    """Get a summary of detected differences.

    Args:
        differences: List of detected differences.

    Returns:
        Dictionary with counts by type and total.
    """
    subs = sum(1 for d in differences if d.type == DifferenceType.SUBSTITUTION)
    ins = sum(1 for d in differences if d.type == DifferenceType.INSERTION)
    dels = sum(1 for d in differences if d.type == DifferenceType.DELETION)

    return {
        "total": len(differences),
        "substitutions": subs,
        "insertions": ins,
        "deletions": dels,
    }
