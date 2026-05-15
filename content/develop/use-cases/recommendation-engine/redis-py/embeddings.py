"""
Local text-embedding helper backed by sentence-transformers.

This is a thin wrapper around the ``sentence-transformers`` model
``all-MiniLM-L6-v2``: a 384-dimensional encoder that runs on CPU,
needs no API key, and has a small footprint (~80 MB). On the first
call the model is downloaded into the local Hugging Face cache; every
later call runs locally.

Vectors are L2-normalised on output so a Redis Search index declared
with ``DISTANCE_METRIC COSINE`` returns scores that are already
directly comparable across items.
"""

from __future__ import annotations

from typing import Iterable

import numpy as np

# Importing sentence-transformers is the heavy part — defer until the
# embedder is actually constructed so importing this module is cheap.
_DEFAULT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class LocalEmbedder:
    """Encode short strings into normalised float32 vectors.

    A single instance loads the model once and reuses it for every
    call. The demo server keeps one ``LocalEmbedder`` around for the
    lifetime of the process.
    """

    def __init__(self, model_name: str = _DEFAULT_MODEL) -> None:
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name
        self.model = SentenceTransformer(model_name)
        # Read the dimensionality from the loaded model so a different
        # model (e.g. ``bge-small-en-v1.5`` at 384 vs. ``bge-base-en``
        # at 768) lines up with the Redis Search vector field without
        # a separate constant to keep in sync.
        self.dim = int(self.model.get_sentence_embedding_dimension())

    def encode_one(self, text: str) -> np.ndarray:
        """Encode a single string. Returns a 1-D ``float32`` array."""
        return self.encode_many([text])[0]

    def encode_many(self, texts: Iterable[str]) -> np.ndarray:
        """Encode a batch. Returns an ``(N, dim) float32`` array."""
        batch = list(texts)
        vectors = self.model.encode(
            batch,
            batch_size=32,
            normalize_embeddings=True,
            convert_to_numpy=True,
        )
        return vectors.astype(np.float32, copy=False)

    @staticmethod
    def to_bytes(vector: np.ndarray) -> bytes:
        """Pack a 1-D vector into the bytes Redis Search expects."""
        if vector.dtype != np.float32:
            vector = vector.astype(np.float32, copy=False)
        return vector.tobytes()
