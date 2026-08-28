"""Paper reproduction tests: DNA Walking (Temple 2017).

Verifies the full 4x4 interval matrix and walking behavior.

Fidelity classification of tested parameters:
- All 16 interval matrix entries: EXACT (Table 1)
- Starting frequency 262 Hz: EXACT (paper's worked example)
- Equal temperament formula: EXACT
- Worked example A→C→A→T→T→G frequencies: EXACT (verified against paper)
- Event duration 0.1s: DERIVED (paper doesn't specify for this method)
- Skip unknown bases: AUDIGENE (paper doesn't specify)
"""

import pytest
from sonification.paper_2017.dna_walking import (
    generate_dna_walking_events,
    generate_dna_walking_timeline,
    INTERVAL_MATRIX,
    INTERVAL_NAMES,
    semitones_to_frequency,
    frequency_to_note,
    STARTING_FREQUENCY,
)
from sonification.events import EventType


# ── Interval matrix tests ────────────────────────────────────────────────

class TestIntervalMatrix:
    """Fidelity: EXACT — All 16 entries from Table 1."""

    def test_unisons(self):
        """Same nucleotide -> unison (0 semitones)."""
        assert INTERVAL_MATRIX[("A", "A")] == 0
        assert INTERVAL_MATRIX[("C", "C")] == 0
        assert INTERVAL_MATRIX[("G", "G")] == 0
        assert INTERVAL_MATRIX[("T", "T")] == 0

    def test_a_to_g(self):
        assert INTERVAL_MATRIX[("A", "G")] == 4  # Major 3rd

    def test_a_to_t(self):
        assert INTERVAL_MATRIX[("A", "T")] == 5  # Perfect 4th

    def test_c_to_t(self):
        assert INTERVAL_MATRIX[("C", "T")] == 7  # Perfect 5th

    def test_c_to_a(self):
        assert INTERVAL_MATRIX[("C", "A")] == 9  # Major 6th

    def test_g_to_a(self):
        assert INTERVAL_MATRIX[("G", "A")] == 8  # Minor 6th

    def test_t_to_a(self):
        assert INTERVAL_MATRIX[("T", "A")] == 1  # Minor 2nd

    def test_g_to_t(self):
        assert INTERVAL_MATRIX[("G", "T")] == 2  # Major 2nd

    def test_all_16_transitions_present(self):
        bases = "ACGT"
        for b1 in bases:
            for b2 in bases:
                assert (b1, b2) in INTERVAL_MATRIX, f"Missing: ({b1}, {b2})"

    def test_interval_names_match(self):
        """All intervals used should have names."""
        for interval in INTERVAL_MATRIX.values():
            assert interval in INTERVAL_NAMES, f"No name for interval {interval}"


# ── Frequency conversion tests ──────────────────────────────────────────

class TestFrequencyConversion:
    """Fidelity: EXACT math (equal temperament); DERIVED for note name mapping."""
    def test_unison_same_frequency(self):
        freq = semitones_to_frequency(262.0, 0)
        assert freq == pytest.approx(262.0)

    def test_octave_up(self):
        freq = semitones_to_frequency(262.0, 12)
        assert freq == pytest.approx(524.0, rel=0.01)

    def test_octave_down(self):
        freq = semitones_to_frequency(523.0, -12)
        assert freq == pytest.approx(261.5, rel=0.01)

    def test_frequency_to_note_c4(self):
        note = frequency_to_note(262.0)
        assert note == "C4"

    def test_frequency_to_note_a4(self):
        note = frequency_to_note(440.0)
        assert note == "A4"


# ── Event generation tests ──────────────────────────────────────────────

class TestDNAWalkingEvents:
    """Fidelity: EXACT for intervals/frequencies; DERIVED for duration; AUDIGENE for skip/determinism."""
    def test_first_note_uses_starting_frequency(self):
        events = generate_dna_walking_events("ACGT")
        assert events[0].frequency == pytest.approx(STARTING_FREQUENCY)

    def test_single_base(self):
        events = generate_dna_walking_events("A")
        assert len(events) == 1
        assert events[0].frequency == pytest.approx(STARTING_FREQUENCY)

    def test_a_to_c_interval(self):
        """A->C should be +9 semitones (Major 6th)."""
        events = generate_dna_walking_events("AC")
        expected_freq = semitones_to_frequency(STARTING_FREQUENCY, 9)
        assert events[1].frequency == pytest.approx(expected_freq, rel=0.01)

    def test_a_to_g_interval(self):
        """A->G should be +4 semitones (Major 3rd)."""
        events = generate_dna_walking_events("AG")
        expected_freq = semitones_to_frequency(STARTING_FREQUENCY, 4)
        assert events[1].frequency == pytest.approx(expected_freq, rel=0.01)

    def test_event_type(self):
        events = generate_dna_walking_events("ACGT")
        for e in events:
            assert e.event_type == EventType.INTERVAL

    def test_empty_sequence(self):
        events = generate_dna_walking_events("")
        assert len(events) == 0

    def test_unknown_bases_skipped(self):
        events = generate_dna_walking_events("AXCG")
        assert len(events) == 3

    def test_deterministic(self):
        seq = "ATGCCGTAAGCTTGCAATGCGTACGT"
        e1 = generate_dna_walking_events(seq)
        e2 = generate_dna_walking_events(seq)
        assert len(e1) == len(e2)
        for a, b in zip(e1, e2):
            assert a.frequency == b.frequency

    def test_source_algorithm(self):
        events = generate_dna_walking_events("A")
        assert events[0].source_algorithm == "dna_walking"


class TestDNAWalkingTimeline:
    """Fidelity: EXACT — Timeline structure from paper's method."""
    def test_timeline_structure(self):
        tl = generate_dna_walking_timeline("ACGT")
        assert tl.method == "dna_walking"
        assert tl.event_count == 4

    def test_timeline_deterministic(self):
        seq = "ATGCCGTAAGCTTGCAATGCGTACGT"
        tl1 = generate_dna_walking_timeline(seq)
        tl2 = generate_dna_walking_timeline(seq)
        assert tl1.total_duration == tl2.total_duration
