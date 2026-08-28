"""Audio engine for AudiGene.

Consumes structured SonificationEvent timelines and produces
real playable audio via the Web Audio API.

The audio engine contains NO biological analysis logic.
It renders events that were already analyzed upstream.
"""

from sonification.audio.state import PlaybackState, EngineCallbacks
from sonification.audio.engine import AudioEngine

__all__ = ["PlaybackState", "EngineCallbacks", "AudioEngine"]
