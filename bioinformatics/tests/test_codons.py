"""Tests for bioinformatics.codons module.

Fixtures cover:
- Codon parsing in all three frames
- Start codon detection (ATG)
- Stop codon detection (TAA, TAG, TGA)
- Codon classification
- Amino acid translation
- Edge cases
"""

import pytest
from bioinformatics.codons import (
    parse_codons,
    find_start_codons,
    find_stop_codons,
    classify_codon,
    get_codon_at_position,
    translate_codon,
    Codon,
    CodonType,
    START_CODON,
    STOP_CODONS,
)


# ── Fixtures ──────────────────────────────────────────────────────────────

SIMPLE_SEQ = "ATGAAATGA"  # ATG | AAA | TGA — start, coding, stop
FRAME_0_SEQ = "ATGCCCTAA"  # ATG | CCC | TAA
FRAME_1_SEQ = "AATGCCCTAAAG"  # Frame 1: ATG | CCC | TAA
FRAME_2_SEQ = "AATGCCCTAAAG"  # Frame 2: ATG | CCC | TAA (shifted)
NO_START_SEQ = "GCTGCTGCT"  # No ATG
NO_STOP_SEQ = "ATGAAAGCT"  # ATG but no stop
BOTH_START_STOP = "ATGAAATGA"  # ATG ... TGA
MULTIPLE_STARTS = "ATGAAATGATGA"  # Two ATGs
SHORT_SEQ = "AT"
EMPTY_SEQ = ""


# ── classify_codon tests ─────────────────────────────────────────────────

class TestClassifyCodon:
    def test_start_codon(self):
        assert classify_codon("ATG") == CodonType.START

    def test_stop_codon_taa(self):
        assert classify_codon("TAA") == CodonType.STOP

    def test_stop_codon_tag(self):
        assert classify_codon("TAG") == CodonType.STOP

    def test_stop_codon_tga(self):
        assert classify_codon("TGA") == CodonType.STOP

    def test_coding_codon(self):
        assert classify_codon("GCT") == CodonType.CODING
        assert classify_codon("AAA") == CodonType.CODING

    def test_incomplete_codon(self):
        assert classify_codon("AT") == CodonType.INCOMPLETE
        assert classify_codon("A") == CodonType.INCOMPLETE

    def test_lowercase_start(self):
        assert classify_codon("atg") == CodonType.START

    def test_lowercase_stop(self):
        assert classify_codon("taa") == CodonType.STOP


# ── parse_codons tests ───────────────────────────────────────────────────

class TestParseCodons:
    def test_frame_0(self):
        codons = parse_codons("ATGAAATGA", frame=0)
        assert len(codons) == 3
        assert codons[0].sequence == "ATG"
        assert codons[0].is_start is True
        assert codons[1].sequence == "AAA"
        assert codons[1].is_stop is False
        assert codons[2].sequence == "TGA"
        assert codons[2].is_stop is True

    def test_frame_1(self):
        codons = parse_codons("AATGCCCTAAAG", frame=1)
        # Frame 1: A|ATG|CCC|TAA|AG — positions 1-3, 4-6, 7-9
        assert codons[0].sequence == "ATG"
        assert codons[0].position == 1
        assert codons[0].frame == 1

    def test_frame_2(self):
        codons = parse_codons("XAATGCCCTAA", frame=2)
        # Frame 2: XA|ATG|CCC|TAA
        assert codons[0].sequence == "ATG"
        assert codons[0].position == 2

    def test_codon_positions(self):
        codons = parse_codons("ATGCCCTAA", frame=0)
        assert codons[0].position == 0
        assert codons[1].position == 3
        assert codons[2].position == 6

    def test_codon_indices(self):
        codons = parse_codons("ATGCCCTAA", frame=0)
        assert codons[0].index == 0
        assert codons[1].index == 1
        assert codons[2].index == 2

    def test_incomplete_trailing(self):
        codons = parse_codons("ATCGAT", frame=0)
        # "ATCGAT" = "ATC" + "GAT" — both are complete codons
        assert len(codons) == 2
        assert codons[0].sequence == "ATC"
        assert codons[1].sequence == "GAT"

    def test_incomplete_trailing_actual(self):
        codons = parse_codons("ATCG", frame=0)
        # "ATCG" = "ATC" (complete) + "G" (incomplete)
        assert len(codons) == 2
        assert codons[0].sequence == "ATC"
        assert codons[0].codon_type == CodonType.CODING
        assert codons[1].sequence == "G"
        assert codons[1].codon_type == CodonType.INCOMPLETE

    def test_empty_sequence(self):
        codons = parse_codons("", frame=0)
        assert len(codons) == 0

    def test_short_sequence(self):
        codons = parse_codons("AT", frame=0)
        assert len(codons) == 1
        assert codons[0].codon_type == CodonType.INCOMPLETE

    def test_invalid_frame_raises(self):
        with pytest.raises(ValueError, match="Frame must be"):
            parse_codons("ATCG", frame=3)

    def test_with_offset(self):
        codons = parse_codons("ATCG", frame=0, offset=10)
        assert codons[0].position == 10

    def test_all_frames_different(self):
        seq = "ATGCCCTAA"
        c0 = parse_codons(seq, frame=0)
        c1 = parse_codons(seq, frame=1)
        c2 = parse_codons(seq, frame=2)
        # Different frames should produce different codon boundaries
        assert c0[0].sequence != c1[0].sequence or c0[0].position != c1[0].position


# ── find_start_codons tests ──────────────────────────────────────────────

class TestFindStartCodons:
    def test_single_start(self):
        starts = find_start_codons("ATGAAATGA", frame=0)
        assert len(starts) == 1
        assert starts[0].position == 0

    def test_multiple_starts(self):
        starts = find_start_codons("ATGGCTATGGCTATG", frame=0)
        # ATG|GCT|ATG|GCT|ATG — ATGs at positions 0, 6, 12
        assert len(starts) == 3
        assert starts[0].position == 0
        assert starts[1].position == 6
        assert starts[2].position == 12

    def test_no_start(self):
        starts = find_start_codons("GCTGCTGCT", frame=0)
        assert len(starts) == 0

    def test_start_in_frame_1(self):
        starts = find_start_codons("AATGCCCTAA", frame=1)
        assert len(starts) == 1
        assert starts[0].sequence == "ATG"

    def test_empty_sequence(self):
        starts = find_start_codons("", frame=0)
        assert len(starts) == 0


# ── find_stop_codons tests ───────────────────────────────────────────────

class TestFindStopCodons:
    def test_single_stop_taa(self):
        stops = find_stop_codons("ATGAAATGA", frame=0)
        assert len(stops) == 1
        assert stops[0].sequence == "TGA"

    def test_stop_tag(self):
        stops = find_stop_codons("ATGAAATAG", frame=0)
        assert len(stops) == 1
        assert stops[0].sequence == "TAG"

    def test_stop_tga(self):
        stops = find_stop_codons("ATGAAATGA", frame=0)
        assert len(stops) == 1
        assert stops[0].sequence == "TGA"

    def test_no_stop(self):
        stops = find_stop_codons("ATGAAAGCT", frame=0)
        assert len(stops) == 0

    def test_multiple_stops(self):
        stops = find_stop_codons("ATGTAATAG", frame=0)
        assert len(stops) == 2


# ── get_codon_at_position tests ──────────────────────────────────────────

class TestGetCodonAtPosition:
    def test_first_codon(self):
        codon = get_codon_at_position("ATGCCCTAA", 0)
        assert codon is not None
        assert codon.sequence == "ATG"
        assert codon.is_start is True

    def test_middle_position(self):
        codon = get_codon_at_position("ATGCCCTAA", 4)
        assert codon is not None
        assert codon.sequence == "CCC"

    def test_last_codon(self):
        codon = get_codon_at_position("ATGCCCTAA", 7)
        assert codon is not None
        assert codon.sequence == "TAA"
        assert codon.is_stop is True

    def test_out_of_range(self):
        codon = get_codon_at_position("ATCG", 10)
        assert codon is None

    def test_negative_position(self):
        codon = get_codon_at_position("ATCG", -1)
        assert codon is None


# ── translate_codon tests ────────────────────────────────────────────────

class TestTranslateCodon:
    def test_start_codon(self):
        assert translate_codon("ATG") == "M"

    def test_stop_taa(self):
        assert translate_codon("TAA") is None

    def test_stop_tag(self):
        assert translate_codon("TAG") is None

    def test_stop_tga(self):
        assert translate_codon("TGA") is None

    def test_some_codons(self):
        assert translate_codon("GCT") == "A"
        assert translate_codon("AAA") == "K"
        assert translate_codon("TGG") == "W"

    def test_incomplete(self):
        assert translate_codon("AT") is None

    def test_lowercase(self):
        assert translate_codon("atg") == "M"
