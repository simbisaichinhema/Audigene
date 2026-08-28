"""Tests for bioinformatics.reading_frames module.

Fixtures cover:
- Three reading frame detection
- ATG-based frame identification
- Coding sequence extraction
- Multi-frame analysis
- Edge cases
"""

import pytest
from bioinformatics.reading_frames import (
    detect_reading_frames,
    get_coding_sequence,
    ReadingFrame,
    MultiFrameResult,
)


# ── Fixtures ──────────────────────────────────────────────────────────────

# ATG at position 0 in frame 0
SIMPLE_GENE = "ATGAAATGA"  # ATG | AAA | TGA

# ATG at position 1 in frame 1
FRAME1_GENE = "AATGCCCTAAAG"  # Frame 0: AAT|GCC|CTA|AAG
                                # Frame 1: A|ATG|CCC|TAA|AG

# No ATG anywhere
NO_START = "GCTGCTGCTGCT"

# Multiple ATGs
MULTIPLE_ATGS = "ATGAAATGAAATGA"

# Long sequence with clear ORF
LONG_GENE = "TTTATGAAACCCGGGTTTTAAGGG"  # ...ATG AAA CCC GGG TTT TAA GGG

# Short sequence
SHORT = "ATG"

# Empty
EMPTY = ""


# ── detect_reading_frames tests ──────────────────────────────────────────

class TestDetectReadingFrames:
    def test_returns_three_frames(self):
        result = detect_reading_frames("ATCGATCG")
        assert len(result.frames) == 3

    def test_frame_numbers(self):
        result = detect_reading_frames("ATCGATCG")
        frames = [f.frame for f in result.frames]
        assert frames == [0, 1, 2]

    def test_frame_0_codons(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert rf0.has_start is True
        assert rf0.has_stop is True
        assert rf0.first_start_position == 0
        assert rf0.first_stop_position == 6

    def test_frame_1_detection(self):
        result = detect_reading_frames("AATGCCCTAAAG")
        rf1 = result.frames[1]
        assert rf1.has_start is True
        assert rf1.first_start_position == 1

    def test_no_start_anywhere(self):
        result = detect_reading_frames(NO_START)
        for rf in result.frames:
            assert rf.has_start is False

    def test_frame_with_start(self):
        result = detect_reading_frames("AATGCCCTAAAG")
        assert result.frame_with_start == 1

    def test_frame_with_start_is_0(self):
        result = detect_reading_frames("ATGAAATGA")
        assert result.frame_with_start == 0

    def test_no_frame_with_start(self):
        result = detect_reading_frames(NO_START)
        assert result.frame_with_start is None

    def test_longest_frame(self):
        result = detect_reading_frames(LONG_GENE)
        # Frame 0 has the longest coding region
        assert result.longest_frame == 0

    def test_coding_start(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert rf0.coding_start == 0

    def test_coding_end(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert rf0.coding_end == 6

    def test_coding_length(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert rf0.coding_length == 6

    def test_no_stop_coding_length(self):
        result = detect_reading_frames("ATGAAAGCT")
        rf0 = result.frames[0]
        assert rf0.has_start is True
        assert rf0.has_stop is False
        assert rf0.coding_end is None
        assert rf0.coding_length == 9  # extends to end

    def test_empty_sequence(self):
        result = detect_reading_frames("")
        assert len(result.frames) == 3
        for rf in result.frames:
            assert len(rf.codons) == 0
            assert rf.has_start is False

    def test_short_sequence(self):
        result = detect_reading_frames("AT")
        assert len(result.frames) == 3

    def test_start_codons_list(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert len(rf0.start_codons) == 1
        assert rf0.start_codons[0].is_start is True

    def test_stop_codons_list(self):
        result = detect_reading_frames("ATGAAATGA")
        rf0 = result.frames[0]
        assert len(rf0.stop_codons) == 1
        assert rf0.stop_codons[0].is_stop is True


# ── get_coding_sequence tests ────────────────────────────────────────────

class TestGetCodingSequence:
    def test_simple_gene(self):
        # ATG|AAA|TGA — coding from ATG(0) to TGA(6), exclusive
        cs = get_coding_sequence("ATGAAATGA", frame=0)
        assert cs == "ATGAAATGA"

    def test_no_start(self):
        cs = get_coding_sequence("GCTGCTGCT", frame=0)
        assert cs is None

    def test_no_stop(self):
        cs = get_coding_sequence("ATGAAAGCT", frame=0)
        assert cs == "ATGAAAGCT"

    def test_frame_1(self):
        cs = get_coding_sequence("AATGCCCTAAAG", frame=1)
        assert cs is not None
        assert cs.startswith("ATG")

    def test_empty(self):
        cs = get_coding_sequence("", frame=0)
        assert cs is None
