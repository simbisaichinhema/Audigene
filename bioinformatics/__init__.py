"""AudiGene Bioinformatics Core.

Deterministic biological sequence analysis modules.
No LLM, no web dependencies — pure computational biology.
"""

from bioinformatics.sequence import (
    validate_dna,
    parse_fasta,
    ValidatedSequence,
    FASTAResult,
)
from bioinformatics.codons import (
    parse_codons,
    find_start_codons,
    find_stop_codons,
    Codon,
    START_CODON,
    STOP_CODONS,
)
from bioinformatics.reading_frames import (
    detect_reading_frames,
    ReadingFrame,
)
from bioinformatics.alignment import (
    align_pairwise,
    Alignment,
    AlignmentEntry,
)
from bioinformatics.variants import (
    detect_differences,
    Difference,
    DifferenceType,
)

__all__ = [
    "validate_dna",
    "parse_fasta",
    "ValidatedSequence",
    "FASTAResult",
    "parse_codons",
    "find_start_codons",
    "find_stop_codons",
    "Codon",
    "START_CODON",
    "STOP_CODONS",
    "detect_reading_frames",
    "ReadingFrame",
    "align_pairwise",
    "Alignment",
    "AlignmentEntry",
    "detect_differences",
    "Difference",
    "DifferenceType",
]
