"""Schemas for sonification API requests and responses."""

from pydantic import BaseModel, Field


class SonificationRequest(BaseModel):
    """Request to generate sonification events from a DNA sequence."""

    sequence: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="DNA sequence (A, C, G, T)",
        examples=["ACGTACGT"],
    )
    method: str = Field(
        default="nucleotide_chroma",
        description="Sonification method",
        examples=["nucleotide_chroma"],
    )


class SonificationEvent(BaseModel):
    """A single sonification event ready for audio rendering."""

    event_id: str
    position: int
    frame: int
    event_type: str
    biological_value: str
    start_time: float
    duration: float
    pitch: str
    frequency: float
    amplitude: float
    instrument: str
    simultaneous_pitches: list[dict] = []
    simultaneous_frequencies: list[float] = []
    paper_rule: str = ""
    implementation: str = ""
    implementation_source: str = ""


class SonificationResponse(BaseModel):
    """Response containing a timeline of sonification events."""

    analysis_id: str
    profile: str
    method: str
    sequence_length: int
    total_duration: float
    events: list[SonificationEvent]


class CompareRequest(BaseModel):
    """Request to compare two DNA sequences."""

    reference: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Reference DNA sequence (A, C, G, T)",
    )
    sample: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Sample DNA sequence (A, C, G, T)",
    )
    method: str = Field(
        default="nucleotide_chroma",
        description="Sonification method for both sequences",
    )


class DifferenceInfo(BaseModel):
    """A detected difference between two aligned sequences."""

    position: int
    type: str
    reference_base: str | None = None
    sample_base: str | None = None
    context: str = ""


class CompareResponse(BaseModel):
    """Response containing alignment and difference data."""

    aligned_reference: str
    aligned_sample: str
    identity: float
    match_count: int
    mismatch_count: int
    insertion_count: int
    deletion_count: int
    alignment_length: int
    differences: list[DifferenceInfo]
    reference_timeline: SonificationResponse
    sample_timeline: SonificationResponse
