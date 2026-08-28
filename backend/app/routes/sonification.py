"""Sonification API routes.

POST /api/sonification — Generate a timeline of sonification events
from a DNA sequence using a specified method.
"""

from fastapi import APIRouter, HTTPException

from backend.app.schemas.sonification import (
    SonificationRequest,
    SonificationResponse,
    SonificationEvent,
    CompareRequest,
    CompareResponse,
    DifferenceInfo,
)
from sonification.paper_2017.nucleotide_chroma import (
    generate_nucleotide_chroma_timeline,
)
from sonification.paper_2017.dna_walking import generate_dna_walking_timeline
from sonification.paper_2017.dna_chords import generate_dna_chords_timeline
from sonification.paper_2017.nucleotide_rhythm import (
    generate_nucleotide_rhythm_timeline,
)
from sonification.paper_2017.codon_walking import generate_codon_walking_timeline

router = APIRouter(tags=["sonification"])

METHODS = {
    "nucleotide_chroma": generate_nucleotide_chroma_timeline,
    "dna_walking": generate_dna_walking_timeline,
    "dna_chords": generate_dna_chords_timeline,
    "nucleotide_rhythm": generate_nucleotide_rhythm_timeline,
    "codon_walking": generate_codon_walking_timeline,
}


def _event_to_schema(event) -> SonificationEvent:
    """Convert a SonificationEvent dataclass to a Pydantic schema."""
    return SonificationEvent(
        event_id=event.event_id,
        position=event.position,
        frame=event.frame,
        event_type=event.event_type.value
        if hasattr(event.event_type, "value")
        else str(event.event_type),
        biological_value=event.biological_value,
        start_time=event.start_time,
        duration=event.duration,
        pitch=event.pitch,
        frequency=event.frequency,
        amplitude=event.amplitude,
        instrument=event.instrument,
        simultaneous_pitches=[
            {
                "pitch": p.pitch,
                "frequency": p.frequency,
                "amplitude": p.amplitude,
            }
            for p in event.simultaneous_pitches
        ],
        simultaneous_frequencies=list(event.simultaneous_frequencies),
        paper_rule=getattr(event, "paper_rule", ""),
        implementation=getattr(event, "implementation", ""),
        implementation_source=getattr(event, "implementation_source", ""),
    )


@router.post("/sonification", response_model=SonificationResponse)
def generate_sonification(request: SonificationRequest):
    """Generate sonification events for a DNA sequence.

    Accepts a DNA sequence and a method name, returns a structured
    timeline of events ready for audio rendering by the frontend.
    """
    # Validate DNA sequence
    valid_bases = set("ACGTUacgtu")
    cleaned = request.sequence.upper().replace("U", "T")
    invalid = set(cleaned) - set("ACGT")
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid bases in sequence: {', '.join(sorted(invalid))}",
        )

    # Look up method
    method_fn = METHODS.get(request.method)
    if method_fn is None:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown method: {request.method}. Available: {', '.join(sorted(METHODS))}",
        )

    try:
        timeline = method_fn(cleaned)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Sonification failed: {str(e)}",
        )

    return SonificationResponse(
        analysis_id=timeline.analysis_id,
        profile=timeline.profile,
        method=timeline.method,
        sequence_length=timeline.sequence_length,
        total_duration=timeline.total_duration,
        events=[_event_to_schema(ev) for ev in timeline.events],
    )


@router.post("/compare", response_model=CompareResponse)
def compare_sequences(request: CompareRequest):
    """Compare two DNA sequences: align, detect differences, sonify both.

    Returns alignment data, difference list, and sonification timelines
    for both reference and sample sequences.
    """
    from bioinformatics.alignment import align_pairwise
    from bioinformatics.variants import detect_differences

    def clean(seq: str) -> str:
        return seq.upper().replace("U", "T").replace(" ", "").replace("\n", "")

    ref = clean(request.reference)
    sample = clean(request.sample)

    # Validate both
    for name, seq in [("reference", ref), ("sample", sample)]:
        invalid = set(seq) - set("ACGT")
        if invalid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid bases in {name}: {', '.join(sorted(invalid))}",
            )

    # Align
    try:
        alignment = align_pairwise(ref, sample)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alignment failed: {e}")

    # Detect differences
    diffs = detect_differences(alignment)
    diff_infos = []
    for d in diffs:
        type_str = d.type.value if hasattr(d.type, "value") else str(d.type)
        ref_base = d.reference_base or "-"
        sample_base = d.sample_base or "-"
        diff_infos.append(DifferenceInfo(
            position=d.position,
            type=type_str,
            reference_base=ref_base,
            sample_base=sample_base,
            context=f"{ref_base}→{sample_base}" if type_str == "substitution" else type_str,
        ))

    # Sonify both sequences
    method_fn = METHODS.get(request.method)
    if method_fn is None:
        raise HTTPException(status_code=400, detail=f"Unknown method: {request.method}")

    try:
        ref_timeline = method_fn(ref)
        sample_timeline = method_fn(sample)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sonification failed: {e}")

    def to_response(tl):
        return SonificationResponse(
            analysis_id=tl.analysis_id,
            profile=tl.profile,
            method=tl.method,
            sequence_length=tl.sequence_length,
            total_duration=tl.total_duration,
            events=[_event_to_schema(ev) for ev in tl.events],
        )

    return CompareResponse(
        aligned_reference=alignment.aligned_reference,
        aligned_sample=alignment.aligned_sample,
        identity=alignment.identity,
        match_count=alignment.match_count,
        mismatch_count=alignment.mismatch_count,
        insertion_count=alignment.insertion_count,
        deletion_count=alignment.deletion_count,
        alignment_length=alignment.length,
        differences=diff_infos,
        reference_timeline=to_response(ref_timeline),
        sample_timeline=to_response(sample_timeline),
    )
