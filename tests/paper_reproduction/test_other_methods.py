"""Tests for DNA Chords, Nucleotide Rhythm, Codon Walking,
Reading Frame Chords (paper reproduction), and Start/Stop (AUDIGENE).

Fidelity classifications per method:
- DNA Chords: EXACT (triplet grouping + pitch mapping from Table 3)
- Nucleotide Rhythm: EXACT durations (75ms/225ms), AMBIGUOUS T=rest handling
- Codon Walking: frame detection EXENT, interval mechanism AUDIGENE hybrid
- Reading Frame Chords: EXACT (1→2→3 pitch progression)
- Start/Stop: AUDIGENE (paper says "higher/lower pitch", we chose ±12 semitones)
- Timeline Validation: AUDIGENE infrastructure
"""

import pytest
from sonification.paper_2017.dna_chords import (
    generate_dna_chords_events,
    generate_dna_chords_timeline,
)
from sonification.paper_2017.nucleotide_rhythm import (
    generate_nucleotide_rhythm_events,
    generate_nucleotide_rhythm_timeline,
    SHORT_DURATION,
    LONG_DURATION,
)
from sonification.paper_2017.codon_walking import (
    generate_codon_walking_events,
    generate_codon_walking_timeline,
    find_first_atg_frame,
)
from sonification.paper_2017.reading_frame_chords import (
    generate_reading_frame_chords_events,
    generate_reading_frame_chords_timeline,
)
from sonification.paper_2017.start_stop import (
    generate_start_stop_events,
    generate_start_stop_timeline,
    START_OCTAVE_SHIFT,
    STOP_OCTAVE_SHIFT,
    START_STOP_DURATION,
)
from sonification.paper_2017.nucleotide_chroma import generate_nucleotide_chroma_timeline
from sonification.paper_2017.dna_walking import generate_dna_walking_timeline
from sonification.events import EventType, SonificationTimeline
from sonification.timeline import validate_timeline, merge_timelines


# ── DNA Chords tests ─────────────────────────────────────────────────────

class TestDNAChords:
    """Fidelity: EXACT — Triplet grouping + pitch mapping per paper page 6."""
    def test_groups_of_three(self):
        events = generate_dna_chords_events("ATCGATCG")
        # 8 bases -> 2 triplets (6 bases) + 2 leftover
        assert len(events) == 2

    def test_chord_has_simultaneous_pitches(self):
        events = generate_dna_chords_events("ATCG")
        assert len(events) == 1
        chord = events[0]
        assert len(chord.simultaneous_pitches) == 3
        assert len(chord.simultaneous_frequencies) == 3

    def test_chord_frequencies_match_nucleotide_mapping(self):
        events = generate_dna_chords_events("ACG")
        freqs = events[0].simultaneous_frequencies
        assert freqs[0] == pytest.approx(262.0)  # A
        assert freqs[1] == pytest.approx(330.0)  # C
        assert freqs[2] == pytest.approx(392.0)  # G

    def test_event_type_chord(self):
        events = generate_dna_chords_events("ATCG")
        assert events[0].event_type == EventType.CHORD

    def test_empty(self):
        events = generate_dna_chords_events("")
        assert len(events) == 0

    def test_short_sequence(self):
        events = generate_dna_chords_events("AT")
        assert len(events) == 0  # Less than 3 bases

    def test_deterministic(self):
        seq = "ATCGATCGATCG"
        e1 = generate_dna_chords_events(seq)
        e2 = generate_dna_chords_events(seq)
        assert len(e1) == len(e2)


# ── Nucleotide Rhythm tests ─────────────────────────────────────────────

class TestNucleotideRhythm:
    """Fidelity: EXACT for durations (75ms/225ms); AMBIGUOUS for T=rest handling."""
    def test_short_short_long_pattern(self):
        events = generate_nucleotide_rhythm_events("ATCGATCG")
        # Check rhythm pattern
        for i, e in enumerate(events):
            pos_in_triplet = i % 3
            if pos_in_triplet < 2:
                assert e.duration == SHORT_DURATION
            else:
                assert e.duration == LONG_DURATION

    def test_all_bases_present(self):
        events = generate_nucleotide_rhythm_events("ACGT")
        assert len(events) == 4

    def test_custom_durations(self):
        events = generate_nucleotide_rhythm_events(
            "ACGT", short_duration=0.1, long_duration=0.3
        )
        assert events[0].duration == 0.1
        assert events[2].duration == 0.3

    def test_empty(self):
        events = generate_nucleotide_rhythm_events("")
        assert len(events) == 0

    def test_deterministic(self):
        seq = "ATCGATCG"
        e1 = generate_nucleotide_rhythm_events(seq)
        e2 = generate_nucleotide_rhythm_events(seq)
        assert len(e1) == len(e2)
        for a, b in zip(e1, e2):
            assert a.duration == b.duration


# ── Codon Walking tests ─────────────────────────────────────────────────

class TestCodonWalking:
    """Fidelity: frame detection EXACT; interval mechanism AUDIGENE hybrid (not paper's amino acid→pitch)."""
    def test_find_atg_frame_0(self):
        assert find_first_atg_frame("ATGAAATGA") == 0

    def test_find_atg_frame_1(self):
        assert find_first_atg_frame("AATGCCCTAA") == 1

    def test_find_atg_none(self):
        assert find_first_atg_frame("GCTGCTGCT") is None

    def test_events_only_in_frame(self):
        events = generate_codon_walking_events(
            "ATGAAATGA", use_frame_from_atg=True
        )
        # Should only play nucleotides within frame 0 codons
        assert len(events) > 0

    def test_deterministic(self):
        seq = "ATGAAACCCGGGTTTTAA"
        e1 = generate_codon_walking_events(seq)
        e2 = generate_codon_walking_events(seq)
        assert len(e1) == len(e2)


# ── Reading Frame Chords tests ──────────────────────────────────────────

class TestReadingFrameChords:
    """Fidelity: EXACT — 1→2→3 pitch progression per Figure 5."""
    def test_single_frame(self):
        events = generate_reading_frame_chords_events("ATCGATCG", num_frames=1)
        for e in events:
            assert len(e.simultaneous_pitches) == 1

    def test_two_frames(self):
        events = generate_reading_frame_chords_events("ATCGATCG", num_frames=2)
        for e in events:
            # 1 from frame 1 + 2 from frame 2 = 3 pitches
            assert len(e.simultaneous_pitches) == 3

    def test_three_frames(self):
        events = generate_reading_frame_chords_events("ATCGATCGATCG", num_frames=3)
        for e in events:
            # 1 + 2 + 3 = 6 pitches
            assert len(e.simultaneous_pitches) == 6

    def test_empty(self):
        events = generate_reading_frame_chords_events("")
        assert len(events) == 0

    def test_deterministic(self):
        seq = "ATCGATCGATCG"
        e1 = generate_reading_frame_chords_events(seq)
        e2 = generate_reading_frame_chords_events(seq)
        assert len(e1) == len(e2)


# ── Start/Stop tests ────────────────────────────────────────────────────

class TestStartStop:
    """PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION.

    The paper says ATG -> "higher pitch", TAA/TAG/TGA -> "lower pitch".
    We interpret this as +12 / -12 semitones. This is our interpretation,
    NOT a paper-exact specification.
    """
    def test_start_codon_detected(self):
        """PAPER_EXACT: ATG is identified as start codon."""
        events = generate_start_stop_events("ATGAAATGA")
        starts = [e for e in events if e.event_type == EventType.START_CODON]
        assert len(starts) == 1
        assert starts[0].biological_value == "ATG"

    def test_stop_codon_detected(self):
        """PAPER_EXACT: TGA is identified as stop codon."""
        events = generate_start_stop_events("ATGAAATGA")
        stops = [e for e in events if e.event_type == EventType.STOP_CODON]
        assert len(stops) == 1
        assert stops[0].biological_value == "TGA"

    def test_start_higher_frequency(self):
        """PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION: paper says 'higher pitch'."""
        events = generate_start_stop_events("ATG")
        starts = [e for e in events if e.event_type == EventType.START_CODON]
        assert starts[0].frequency > 262.0  # Higher than base A

    def test_stop_lower_frequency(self):
        """PAPER_QUALITATIVE + AUDIGENE_INTERPRETATION: paper says 'lower pitch'."""
        events = generate_start_stop_events("ATGTAA")
        stops = [e for e in events if e.event_type == EventType.STOP_CODON]
        assert stops[0].frequency < 262.0  # Lower than base A

    def test_start_duration(self):
        """AUDIGENE_INTERPRETATION: 300ms is our choice, not paper-specified."""
        events = generate_start_stop_events("ATG")
        starts = [e for e in events if e.event_type == EventType.START_CODON]
        assert starts[0].duration == START_STOP_DURATION

    def test_all_stop_codons(self):
        """PAPER_EXACT: TAA, TAG, TGA are all stop codons."""
        for stop in ["TAA", "TAG", "TGA"]:
            events = generate_start_stop_events(f"ATG{stop}")
            stops = [e for e in events if e.event_type == EventType.STOP_CODON]
            assert len(stops) == 1

    def test_deterministic(self):
        seq = "ATGAAATGA"
        e1 = generate_start_stop_events(seq)
        e2 = generate_start_stop_events(seq)
        assert len(e1) == len(e2)

    def test_start_codon_provenance(self):
        """Provenance must distinguish paper rule from AudiGene interpretation."""
        events = generate_start_stop_events("ATG")
        starts = [e for e in events if e.event_type == EventType.START_CODON]
        assert starts[0].paper_rule == "start codon -> higher pitch"
        assert starts[0].implementation == "+12 semitones (one octave up)"
        assert starts[0].implementation_source == "AUDIGENE_INTERPRETATION"

    def test_stop_codon_provenance(self):
        """Provenance must distinguish paper rule from AudiGene interpretation."""
        events = generate_start_stop_events("ATGTAA")
        stops = [e for e in events if e.event_type == EventType.STOP_CODON]
        assert stops[0].paper_rule == "stop codon -> lower pitch"
        assert stops[0].implementation == "-12 semitones (one octave down)"
        assert stops[0].implementation_source == "AUDIGENE_INTERPRETATION"


# ── Timeline validation tests ───────────────────────────────────────────

class TestTimelineValidation:
    """Fidelity: AUDIGENE infrastructure — not paper-defined."""
    def test_valid_timeline(self):
        tl = generate_nucleotide_chroma_timeline("ACGT")
        errors = validate_timeline(tl)
        assert len(errors) == 0

    def test_all_timelines_valid(self):
        methods = [
            generate_nucleotide_chroma_timeline("ATCGATCG"),
            generate_dna_chords_timeline("ATCGATCG"),
            generate_nucleotide_rhythm_timeline("ATCGATCG"),
            generate_dna_walking_timeline("ATCGATCG"),
        ]
        for tl in methods:
            errors = validate_timeline(tl)
            assert len(errors) == 0, f"{tl.method} has errors: {errors}"

    def test_merge_timelines(self):
        tl1 = generate_nucleotide_chroma_timeline("AC")
        tl2 = generate_nucleotide_chroma_timeline("GT", start_time=0.2)
        merged = merge_timelines(tl1, tl2)
        assert merged.event_count == 4

    def test_filter_by_type(self):
        from sonification.timeline import filter_events
        tl = generate_start_stop_timeline("ATGAAATGA")
        starts = filter_events(tl, event_type=EventType.START_CODON)
        assert all(e.event_type == EventType.START_CODON for e in starts.events)
