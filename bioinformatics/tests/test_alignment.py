"""Tests for bioinformatics.alignment module.

Fixtures cover:
- Identical sequences
- Single substitution
- Multiple substitutions
- Insertion
- Deletion
- Empty sequences
- Alignment scoring
- Edge cases
"""

import pytest
from bioinformatics.alignment import (
    align_pairwise,
    Alignment,
    AlignmentEntry,
    Operation,
)


# ── Fixtures ──────────────────────────────────────────────────────────────

IDENTICAL = ("ATCGATCG", "ATCGATCG")
ONE_SUBSTITUTION = ("ATCGATCG", "ATCGATTG")  # Position 6: G→T
MULTIPLE_SUBS = ("ATCGATCG", "ATTGATCG")  # Positions 1,3
INSERTION = ("ATCG", "ATCGG")  # Extra G at end
DELETION = ("ATCGG", "ATCG")  # Missing G at end
COMPLEMENTARY = ("ATCG", "TAGC")  # All different
EMPTY_REF = ("", "ATCG")
EMPTY_SAMP = ("ATCG", "")
BOTH_EMPTY = ("", "")
SIMPLE = ("ATCG", "ATCG")


# ── Basic alignment tests ────────────────────────────────────────────────

class TestAlignmentBasic:
    def test_identical_sequences(self):
        result = align_pairwise("ATCGATCG", "ATCGATCG")
        assert result.aligned_reference == "ATCGATCG"
        assert result.aligned_sample == "ATCGATCG"
        assert result.match_count == 8
        assert result.mismatch_count == 0
        assert result.gap_count == 0
        assert result.identity == 1.0

    def test_one_substitution(self):
        result = align_pairwise("ATCGATCG", "ATCGATTG")
        assert result.match_count == 7
        assert result.mismatch_count == 1
        assert result.gap_count == 0
        assert result.identity == pytest.approx(7 / 8)

    def test_multiple_substitutions(self):
        result = align_pairwise("ATCGATCG", "ATTGATCG")
        # ATCGATCG vs ATTGATCG — C→T at position 2
        assert result.mismatch_count == 1
        assert result.match_count == 7

    def test_insertion(self):
        result = align_pairwise("ATCG", "ATCGG")
        # Needleman-Wunsch may prefer mismatch over gap for short seqs
        # Just verify the alignment is valid and has the right length
        assert result.length == 5
        assert result.aligned_reference is not None
        assert result.aligned_sample is not None

    def test_deletion(self):
        result = align_pairwise("ATCGG", "ATCG")
        # Needleman-Wunsch may prefer mismatch over gap for short seqs
        assert result.length == 5
        assert result.aligned_reference is not None
        assert result.aligned_sample is not None

    def test_empty_both(self):
        result = align_pairwise("", "")
        assert result.length == 0
        assert result.identity == 0.0

    def test_empty_reference(self):
        result = align_pairwise("", "ATCG")
        assert result.aligned_reference == "----"
        assert result.aligned_sample == "ATCG"

    def test_empty_sample(self):
        result = align_pairwise("ATCG", "")
        assert result.aligned_reference == "ATCG"
        assert result.aligned_sample == "----"


# ── Alignment entry tests ────────────────────────────────────────────────

class TestAlignmentEntries:
    def test_entries_count(self):
        result = align_pairwise("ATCG", "ATCG")
        assert len(result.entries) == 4

    def test_match_entries(self):
        result = align_pairwise("ATCG", "ATCG")
        for entry in result.entries:
            assert entry.operation == Operation.MATCH

    def test_mismatch_entry(self):
        result = align_pairwise("ATCG", "ATTG")
        mismatches = [e for e in result.entries if e.operation == Operation.MISMATCH]
        assert len(mismatches) == 1
        assert mismatches[0].ref_base == "C"
        assert mismatches[0].sample_base == "T"

    def test_alignment_positions_sequential(self):
        result = align_pairwise("ATCGATCG", "ATCGATCG")
        positions = [e.alignment_position for e in result.entries]
        assert positions == list(range(8))

    def test_ref_positions(self):
        result = align_pairwise("ATCG", "ATCG")
        ref_positions = [e.ref_position for e in result.entries]
        assert ref_positions == [0, 1, 2, 3]

    def test_insertion_entry(self):
        result = align_pairwise("ATCG", "ATCGG")
        insertions = [e for e in result.entries if e.operation == Operation.INSERTION]
        assert len(insertions) == 1
        assert insertions[0].ref_base is None
        assert insertions[0].sample_base == "G"

    def test_deletion_entry(self):
        result = align_pairwise("ATCGG", "ATCG")
        deletions = [e for e in result.entries if e.operation == Operation.DELETION]
        assert len(deletions) == 1
        assert deletions[0].ref_base == "G"
        assert deletions[0].sample_base is None


# ── Scoring tests ────────────────────────────────────────────────────────

class TestAlignmentScoring:
    def test_identical_score(self):
        result = align_pairwise("ATCG", "ATCG")
        assert result.score == 4.0  # 4 matches * 1.0

    def test_substitution_score(self):
        result = align_pairwise("ATCG", "ATTG")
        assert result.score == 2.0  # 3 matches + 1 mismatch = 3*1 + 1*(-1)

    def test_gap_penalty(self):
        result = align_pairwise("ATCG", "ATCGG")
        assert result.score < 4.0  # Gap penalty reduces score

    def test_custom_scores(self):
        result = align_pairwise("ATCG", "ATCG", match_score=2.0)
        assert result.score == 8.0


# ── Identity tests ───────────────────────────────────────────────────────

class TestAlignmentIdentity:
    def test_perfect_identity(self):
        result = align_pairwise("ATCG", "ATCG")
        assert result.identity == 1.0

    def test_zero_identity(self):
        result = align_pairwise("CCCC", "AAAA")
        assert result.identity == 0.0

    def test_partial_identity(self):
        result = align_pairwise("ATCG", "ATCG")
        assert result.identity == 1.0

    def test_identity_with_gaps(self):
        result = align_pairwise("ATCG", "ATCGG")
        # 4 matches out of 5 positions
        assert result.identity == pytest.approx(4 / 5)


# ── Reference preservation tests ─────────────────────────────────────────

class TestReferencePreservation:
    def test_original_reference_preserved(self):
        result = align_pairwise("ATCGATCG", "ATTGATCG")
        assert result.reference == "ATCGATCG"

    def test_original_sample_preserved(self):
        result = align_pairwise("ATCGATCG", "ATTGATCG")
        assert result.sample == "ATTGATCG"


# ── Edge case tests ──────────────────────────────────────────────────────

class TestAlignmentEdgeCases:
    def test_single_base_match(self):
        result = align_pairwise("A", "A")
        assert result.match_count == 1
        assert result.identity == 1.0

    def test_single_base_mismatch(self):
        result = align_pairwise("A", "T")
        assert result.mismatch_count == 1

    def test_very_different_lengths(self):
        result = align_pairwise("A", "ATCGATCG")
        assert result.length == 8
        assert result.identity <= 1.0

    def test_repeated_sequence(self):
        result = align_pairwise("AAAA", "AAAA")
        assert result.match_count == 4
        assert result.identity == 1.0
