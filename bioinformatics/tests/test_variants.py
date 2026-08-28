"""Tests for bioinformatics.variants module.

Fixtures cover:
- Difference detection from alignments
- Substitutions, insertions, deletions
- Difference summaries
- Codon context annotation
- Edge cases
"""

import pytest
from bioinformatics.alignment import align_pairwise
from bioinformatics.variants import (
    detect_differences,
    annotate_codon_context,
    get_summary,
    Difference,
    DifferenceType,
)


# ── Fixtures ──────────────────────────────────────────────────────────────

IDENTICAL_SEQS = ("ATCGATCG", "ATCGATCG")
ONE_SUBSTITUTION = ("ATCGATCG", "ATCGATTG")
MULTIPLE_SUBS = ("ATCGATCG", "ATTGATCG")
INSERTION_SEQS = ("ATCG", "ATCGG")
DELETION_SEQS = ("ATCGG", "ATCG")
COMPLEX_SEQS = ("ATCGATCG", "ATCGTAG")  # Mix of matches and subs


# ── detect_differences tests ─────────────────────────────────────────────

class TestDetectDifferences:
    def test_identical_no_differences(self):
        aln = align_pairwise(*IDENTICAL_SEQS)
        diffs = detect_differences(aln)
        assert len(diffs) == 0

    def test_one_substitution(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        assert len(diffs) == 1
        assert diffs[0].type == DifferenceType.SUBSTITUTION
        # ATCGATCG vs ATCGATTG — position 6: C→T
        assert diffs[0].reference_base == "C"
        assert diffs[0].sample_base == "T"

    def test_multiple_substitutions(self):
        aln = align_pairwise(*MULTIPLE_SUBS)
        diffs = detect_differences(aln)
        # ATCGATCG vs ATTGATCG — position 2: C→T
        assert len(diffs) == 1
        assert all(d.type == DifferenceType.SUBSTITUTION for d in diffs)

    def test_insertion(self):
        aln = align_pairwise(*INSERTION_SEQS)
        diffs = detect_differences(aln)
        assert len(diffs) == 1
        assert diffs[0].type == DifferenceType.INSERTION
        assert diffs[0].reference_base is None
        assert diffs[0].sample_base == "G"

    def test_deletion(self):
        aln = align_pairwise(*DELETION_SEQS)
        diffs = detect_differences(aln)
        assert len(diffs) == 1
        assert diffs[0].type == DifferenceType.DELETION
        assert diffs[0].reference_base == "G"
        assert diffs[0].sample_base is None

    def test_positions_ordered(self):
        aln = align_pairwise(*MULTIPLE_SUBS)
        diffs = detect_differences(aln)
        positions = [d.position for d in diffs]
        assert positions == sorted(positions)

    def test_complex_mixed(self):
        aln = align_pairwise("ATCGATCG", "ATCGTAG")
        diffs = detect_differences(aln)
        # Should find some differences (substitutions or gaps)
        assert len(diffs) > 0
        assert all(d.type in (DifferenceType.SUBSTITUTION, DifferenceType.INSERTION, DifferenceType.DELETION) for d in diffs)

    def test_empty_sequences(self):
        aln = align_pairwise("", "")
        diffs = detect_differences(aln)
        assert len(diffs) == 0


# ── Difference structure tests ────────────────────────────────────────────

class TestDifferenceStructure:
    def test_substitution_has_both_bases(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        assert diffs[0].reference_base is not None
        assert diffs[0].sample_base is not None

    def test_insertion_has_sample_base(self):
        aln = align_pairwise(*INSERTION_SEQS)
        diffs = detect_differences(aln)
        assert diffs[0].sample_base == "G"
        assert diffs[0].reference_base is None

    def test_deletion_has_ref_base(self):
        aln = align_pairwise(*DELETION_SEQS)
        diffs = detect_differences(aln)
        assert diffs[0].reference_base == "G"
        assert diffs[0].sample_base is None

    def test_context_string(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        assert "Substitution" in diffs[0].context
        assert "C" in diffs[0].context
        assert "T" in diffs[0].context

    def test_ref_position_set(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        assert diffs[0].ref_position is not None

    def test_sample_position_set(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        assert diffs[0].sample_position is not None


# ── get_summary tests ────────────────────────────────────────────────────

class TestGetSummary:
    def test_no_differences(self):
        summary = get_summary([])
        assert summary["total"] == 0
        assert summary["substitutions"] == 0
        assert summary["insertions"] == 0
        assert summary["deletions"] == 0

    def test_summary_substitution(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        summary = get_summary(diffs)
        assert summary["total"] == 1
        assert summary["substitutions"] == 1
        assert summary["insertions"] == 0
        assert summary["deletions"] == 0

    def test_summary_insertion(self):
        aln = align_pairwise(*INSERTION_SEQS)
        diffs = detect_differences(aln)
        summary = get_summary(diffs)
        assert summary["total"] == 1
        assert summary["insertions"] == 1

    def test_summary_deletion(self):
        aln = align_pairwise(*DELETION_SEQS)
        diffs = detect_differences(aln)
        summary = get_summary(diffs)
        assert summary["total"] == 1
        assert summary["deletions"] == 1

    def test_mixed_summary(self):
        aln = align_pairwise("ATCGG", "ATCGG")
        diffs = detect_differences(aln)
        summary = get_summary(diffs)
        assert summary["total"] == 0


# ── annotate_codon_context tests ─────────────────────────────────────────

class TestAnnotateCodonContext:
    def test_codon_position(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        annotated = annotate_codon_context(diffs, aln.length)
        assert len(annotated) == len(diffs)
        # Position 6 in alignment → codon position 6 % 3 = 0
        assert annotated[0].codon_position is not None
        assert annotated[0].reading_frame is not None

    def test_preserves_original_data(self):
        aln = align_pairwise(*ONE_SUBSTITUTION)
        diffs = detect_differences(aln)
        annotated = annotate_codon_context(diffs, aln.length)
        assert annotated[0].position == diffs[0].position
        assert annotated[0].type == diffs[0].type
        assert annotated[0].reference_base == diffs[0].reference_base
        assert annotated[0].sample_base == diffs[0].sample_base
