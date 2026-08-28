"""Tests for bioinformatics.sequence module.

Fixtures cover:
- Valid sequences
- Ambiguous bases
- Invalid characters
- Empty sequences
- FASTA parsing (single and multi-record)
- Edge cases
"""

import pytest
from bioinformatics.sequence import (
    validate_dna,
    parse_fasta,
    parse_fasta_file,
    sanitize_sequence,
    ValidatedSequence,
    FASTAResult,
)


# ── Fixtures ──────────────────────────────────────────────────────────────

VALID_SEQUENCE = "ATGCCGTAAGCTTGCAATGCGTACGT"
VALID_SEQUENCE_UPPER = "ATGCCGTAAGCTTGCAATGCGTACGT"
VALID_SEQUENCE_LOWER = "atgccgtaagcttgcaatgcgtacgt"

SIMPLE_SEQUENCE = "ATCG"
START_STOP_SEQUENCE = "ATGAAATGA"  # ATG ... TGA
AMBIGUOUS_SEQUENCE = "ATNCGNRYSW"  # Contains ambiguous bases
INVALID_SEQUENCE = "ATCGX123Z!"  # Contains invalid characters
MIXED_INVALID = "ATCGXN123"  # Mix of invalid and ambiguous
EMPTY_SEQUENCE = ""
WHITESPACE_SEQUENCE = "A T C\nG\tT A"
FASTA_SINGLE = ">seq1\nATCGATCG\n"
FASTA_MULTI = ">seq1\nATCG\n>seq2\nGCTA\n"
FASTA_MULTI_LINE = ">seq1\nATCG\nATCG\n"
FASTA_NO_HEADER = "ATCGATCG"
FASTA_EMPTY = ""
FASTA_EMPTY_RECORD = ">seq1\n\n>seq2\nATCG\n"


# ── validate_dna tests ────────────────────────────────────────────────────

class TestValidateDNA:
    def test_valid_sequence(self):
        result = validate_dna("ATCG")
        assert result.is_valid is True
        assert result.sequence == "ATCG"
        assert result.length == 4
        assert result.valid_base_count == 4
        assert result.ambiguous_count == 0
        assert result.invalid_count == 0
        assert len(result.warnings) == 0

    def test_valid_long_sequence(self):
        seq = "ATGCCGTAAGCTTGCAATGCGTACGT"
        result = validate_dna(seq)
        assert result.is_valid is True
        assert result.length == len(seq)
        assert result.valid_base_count == len(seq)

    def test_lowercase_converted(self):
        result = validate_dna("atcg")
        assert result.sequence == "ATCG"
        assert result.is_valid is True

    def test_mixed_case(self):
        result = validate_dna("AtCg")
        assert result.sequence == "ATCG"
        assert result.is_valid is True

    def test_ambiguous_bases(self):
        result = validate_dna("ATNCG")
        assert result.is_valid is True  # Ambiguous is valid DNA
        assert result.ambiguous_count == 1
        assert result.valid_base_count == 4
        assert len(result.warnings) == 1
        assert "ambiguous" in result.warnings[0].lower()

    def test_multiple_ambiguous(self):
        result = validate_dna("NRYSW")
        assert result.is_valid is True
        assert result.ambiguous_count == 5
        assert result.valid_base_count == 0

    def test_invalid_characters(self):
        result = validate_dna("ATCGX")
        assert result.is_valid is False
        assert result.invalid_count == 1
        assert result.invalid_chars == frozenset({"X"})

    def test_multiple_invalid(self):
        result = validate_dna("ATCGX123Z!")
        assert result.is_valid is False
        assert result.invalid_count == 6
        assert "X" in result.invalid_chars
        assert "1" in result.invalid_chars
        assert "2" in result.invalid_chars
        assert "3" in result.invalid_chars
        assert "Z" in result.invalid_chars
        assert "!" in result.invalid_chars

    def test_mixed_valid_ambiguous_invalid(self):
        result = validate_dna("ATCGXN")
        assert result.is_valid is False
        assert result.valid_base_count == 4
        assert result.ambiguous_count == 1
        assert result.invalid_count == 1

    def test_empty_sequence(self):
        result = validate_dna("")
        assert result.is_valid is True
        assert result.length == 0
        assert result.valid_base_count == 0
        assert len(result.warnings) == 1
        assert "empty" in result.warnings[0].lower()

    def test_custom_id(self):
        result = validate_dna("ATCG", sequence_id="my_seq")
        assert result.id == "my_seq"

    def test_default_id(self):
        result = validate_dna("ATCG")
        assert result.id == "unknown"

    def test_all_valid_bases(self):
        result = validate_dna("ACGT")
        assert result.is_valid is True
        assert result.valid_base_count == 4

    def test_repeated_bases(self):
        result = validate_dna("AAAACCCCGGGGTTTT")
        assert result.is_valid is True
        assert result.valid_base_count == 16


# ── parse_fasta tests ─────────────────────────────────────────────────────

class TestParseFASTA:
    def test_single_record(self):
        result = parse_fasta(FASTA_SINGLE)
        assert result.total_sequences == 1
        assert result.records[0].header == "seq1"
        assert result.records[0].sequence == "ATCGATCG"

    def test_multi_record(self):
        result = parse_fasta(FASTA_MULTI)
        assert result.total_sequences == 2
        assert result.records[0].header == "seq1"
        assert result.records[0].sequence == "ATCG"
        assert result.records[1].header == "seq2"
        assert result.records[1].sequence == "GCTA"

    def test_multi_line_sequence(self):
        result = parse_fasta(FASTA_MULTI_LINE)
        assert result.total_sequences == 1
        assert result.records[0].sequence == "ATCGATCG"

    def test_total_length(self):
        result = parse_fasta(FASTA_MULTI)
        assert result.total_length == 8

    def test_empty_input_raises(self):
        with pytest.raises(ValueError, match="Empty"):
            parse_fasta("")

    def test_whitespace_only_raises(self):
        with pytest.raises(ValueError, match="Empty"):
            parse_fasta("   \n  \n  ")

    def test_no_header_raises(self):
        with pytest.raises(ValueError, match="No valid FASTA records"):
            parse_fasta(FASTA_NO_HEADER)

    def test_empty_record_warns(self):
        result = parse_fasta(FASTA_EMPTY_RECORD)
        assert result.total_sequences == 2
        assert any("empty" in w.lower() for w in result.warnings)

    def test_header_with_description(self):
        fasta = ">seq1 description here\nATCG\n"
        result = parse_fasta(fasta)
        assert result.records[0].header == "seq1 description here"

    def test_sequence_uppercased(self):
        fasta = ">seq1\natcg\n"
        result = parse_fasta(fasta)
        assert result.records[0].sequence == "ATCG"


# ── sanitize_sequence tests ───────────────────────────────────────────────

class TestSanitizeSequence:
    def test_removes_whitespace(self):
        assert sanitize_sequence("A T C G") == "ATCG"

    def test_removes_newlines(self):
        assert sanitize_sequence("AT\nCG") == "ATCG"

    def test_removes_tabs(self):
        assert sanitize_sequence("AT\tCG") == "ATCG"

    def test_uppercases(self):
        assert sanitize_sequence("atcg") == "ATCG"

    def test_mixed_whitespace(self):
        assert sanitize_sequence("A T\nC\tG") == "ATCG"


# ── File parsing tests ────────────────────────────────────────────────────

class TestParseFASTAFile:
    def test_file_not_found(self):
        with pytest.raises(FileNotFoundError):
            parse_fasta_file("/nonexistent/file.fasta")
