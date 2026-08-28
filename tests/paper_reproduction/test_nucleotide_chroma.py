"""Paper reproduction tests: Nucleotide Chroma (Temple 2017).

Verifies that the nucleotide-to-pitch mapping matches the paper exactly.

Fidelity classification of tested parameters:
- A→C4 (262Hz), C→E4 (330Hz), G→G4 (392Hz), T→C5 (523Hz): EXACT
- C major chord structure: EXACT
- 100ms event duration: EXACT
- Equal temperament: EXACT
- Skip unknown bases: AUDIGENE (paper doesn't specify)
- Default amplitude 0.5: AUDIGENE (paper doesn't specify)
"""

import pytest
from sonification.paper_2017.nucleotide_chroma import (
    generate_nucleotide_chroma_events,
    generate_nucleotide_chroma_timeline,
    NUCLEOTIDE_FREQUENCY,
    NUCLEOTIDE_PITCH,
    EVENT_DURATION,
)
from sonification.events import EventType


# ── Paper-defined constants ──────────────────────────────────────────────

class TestPaperConstants:
    """Fidelity: EXACT — All values from Table 3 and Figure 4."""

    def test_a_is_c4_262hz(self):
        assert NUCLEOTIDE_FREQUENCY["A"] == 262.0
        assert NUCLEOTIDE_PITCH["A"] == "C4"

    def test_c_is_e4_330hz(self):
        assert NUCLEOTIDE_FREQUENCY["C"] == 330.0
        assert NUCLEOTIDE_PITCH["C"] == "E4"

    def test_g_is_g4_392hz(self):
        assert NUCLEOTIDE_FREQUENCY["G"] == 392.0
        assert NUCLEOTIDE_PITCH["G"] == "G4"

    def test_t_is_c5_523hz(self):
        assert NUCLEOTIDE_FREQUENCY["T"] == 523.0
        assert NUCLEOTIDE_PITCH["T"] == "C5"

    def test_all_four_bases_mapped(self):
        assert set(NUCLEOTIDE_FREQUENCY.keys()) == {"A", "C", "G", "T"}
        assert set(NUCLEOTIDE_PITCH.keys()) == {"A", "C", "G", "T"}

    def test_c_major_chord_structure(self):
        """A-C-G-T should form C-E-G-C (C major arpeggio)."""
        assert NUCLEOTIDE_PITCH["A"] == "C4"  # Root
        assert NUCLEOTIDE_PITCH["C"] == "E4"  # Major 3rd
        assert NUCLEOTIDE_PITCH["G"] == "G4"  # Perfect 5th
        assert NUCLEOTIDE_PITCH["T"] == "C5"  # Octave

    def test_event_duration_100ms(self):
        assert EVENT_DURATION == 0.1


# ── Event generation tests ──────────────────────────────────────────────

class TestNucleotideChromaEvents:
    """Fidelity: EXACT for timing/positions; AUDIGENE for skip/determinism behavior."""
    def test_single_base(self):
        events = generate_nucleotide_chroma_events("A")
        assert len(events) == 1
        assert events[0].frequency == 262.0
        assert events[0].pitch == "C4"
        assert events[0].duration == 0.1

    def test_all_bases(self):
        events = generate_nucleotide_chroma_events("ACGT")
        assert len(events) == 4
        freqs = [e.frequency for e in events]
        assert freqs == [262.0, 330.0, 392.0, 523.0]

    def test_event_type(self):
        events = generate_nucleotide_chroma_events("ACGT")
        for e in events:
            assert e.event_type == EventType.NUCLEOTIDE

    def test_sequential_timing(self):
        events = generate_nucleotide_chroma_events("ACGT")
        for i, e in enumerate(events):
            assert e.start_time == pytest.approx(i * 0.1)

    def test_positions_correct(self):
        events = generate_nucleotide_chroma_events("ACGT")
        positions = [e.position for e in events]
        assert positions == [0, 1, 2, 3]

    def test_empty_sequence(self):
        events = generate_nucleotide_chroma_events("")
        assert len(events) == 0

    def test_unknown_bases_skipped(self):
        events = generate_nucleotide_chroma_events("ANCG")
        assert len(events) == 3
        assert all(e.biological_value in "ACGT" for e in events)

    def test_deterministic(self):
        seq = "ATGCCGTAAGCTTGCAATGCGTACGT"
        e1 = generate_nucleotide_chroma_events(seq)
        e2 = generate_nucleotide_chroma_events(seq)
        assert len(e1) == len(e2)
        for a, b in zip(e1, e2):
            assert a.frequency == b.frequency
            assert a.start_time == b.start_time

    def test_custom_start_time(self):
        events = generate_nucleotide_chroma_events("AC", start_time=1.0)
        assert events[0].start_time == 1.0
        assert events[1].start_time == 1.1

    def test_custom_duration(self):
        events = generate_nucleotide_chroma_events("AC", duration=0.2)
        assert events[0].duration == 0.2
        assert events[1].duration == 0.2

    def test_source_algorithm(self):
        events = generate_nucleotide_chroma_events("A")
        assert events[0].source_algorithm == "nucleotide_chroma"
        assert events[0].source_paper == "s12859-017-1632-x.pdf"
        assert events[0].profile == "paper_2017"


# ── Timeline tests ───────────────────────────────────────────────────────

class TestNucleotideChromaTimeline:
    """Fidelity: EXACT — Timeline structure from paper's method."""
    def test_timeline_structure(self):
        tl = generate_nucleotide_chroma_timeline("ACGT")
        assert tl.method == "nucleotide_chroma"
        assert tl.profile == "paper_2017"
        assert tl.sequence_length == 4
        assert tl.event_count == 4

    def test_timeline_total_duration(self):
        tl = generate_nucleotide_chroma_timeline("ACGT")
        assert tl.total_duration == pytest.approx(0.4)

    def test_timeline_deterministic(self):
        seq = "ATGCCGTAAGCTTGCAATGCGTACGT"
        tl1 = generate_nucleotide_chroma_timeline(seq)
        tl2 = generate_nucleotide_chroma_timeline(seq)
        assert tl1.total_duration == tl2.total_duration
        assert tl1.event_count == tl2.event_count
