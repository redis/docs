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
_VECTOR_DIM = 384


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
        self.dim = _VECTOR_DIM

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

    @staticmethod
    def blend(query_vec: np.ndarray, session_vec: np.ndarray | None,
              session_weight: float = 0.3) -> np.ndarray:
        """Mix a query vector with an optional session vector.

        Both inputs are assumed unit-normalised. The result is
        re-normalised so the blended vector stays on the unit sphere
        and cosine scores remain comparable to the un-blended path.
        """
        if session_vec is None or session_weight <= 0:
            return query_vec
        mixed = (1.0 - session_weight) * query_vec + session_weight * session_vec
        norm = float(np.linalg.norm(mixed))
        if norm == 0.0:
            return query_vec
        return (mixed / norm).astype(np.float32, copy=False)
