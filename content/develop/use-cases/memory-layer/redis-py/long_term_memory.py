"""
Long-term memory store for an agent, backed by Redis JSON and Search.

Each memory lives as one JSON document at ``agent:mem:<id>``. The
document holds the memory text, its embedding vector, and a small
metadata block — user, namespace, kind, source thread, timestamps —
that lets the recall query scope results without falling back to
application-side filtering.

A single Redis Search index covers the embedding plus every metadata
field, so one ``FT.SEARCH`` call performs approximate-nearest-
neighbour over the in-scope subset and returns the top-k memories
ranked by cosine distance. The same KNN check runs at *write* time
to deduplicate near-identical memories before they enter the store,
which keeps the index from filling with paraphrases of the same fact
as the agent reasons over similar topics across sessions.

Memories carry one of two kinds:

* ``episodic`` — "what happened" snapshots from a specific thread,
  written with a medium TTL so old session detail decays naturally.
* ``semantic`` — distilled facts and preferences the agent should
  carry forward indefinitely. Written with no TTL by default.

This split is enforced as a TAG on the index, so the recall query
can ask for one kind or both with a filter — no separate keyspaces.

The Redis client used here is constructed with
``decode_responses=False``. JSON.GET responses are JSON bytes which
this module decodes explicitly; the vector parameter to FT.SEARCH is
binary float32 regardless of how the document stores the embedding.
"""

from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass
from typing import Optional

import numpy as np
import redis
from redis.commands.search.field import (
    NumericField,
    TagField,
    TextField,
    VectorField,
)
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query


VECTOR_DIM_DEFAULT = 384

# How close (cosine distance) a candidate must be to an existing
# memory to count as a duplicate at write time. Smaller = stricter.
# 0.20 is calibrated to the ``all-MiniLM-L6-v2`` embedding model used
# in the demo, where a paraphrase of an existing memory lands in the
# 0.10 – 0.20 range and a distinct memory lands above 0.50.
DEFAULT_DEDUP_THRESHOLD = 0.20

# How close (cosine distance) a candidate must be to count as a
# relevant recall result. Larger than the dedup threshold so the
# agent gets a wider net at read time than at write time.
DEFAULT_RECALL_THRESHOLD = 0.55

# TTL tiers, in seconds. ``None`` means "no TTL" — the memory
# persists until explicitly deleted or evicted under memory pressure.
TTL_BY_KIND: dict[str, Optional[int]] = {
    "episodic": 7 * 24 * 3600,
    "semantic": None,
}


@dataclass
class MemoryRecord:
    """A single memory document returned from the store."""

    id: str
    user: str
    namespace: str
    kind: str
    source_thread: str
    text: str
    created_ts: float
    hit_count: int
    distance: Optional[float] = None
    ttl_seconds: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user": self.user,
            "namespace": self.namespace,
            "kind": self.kind,
            "source_thread": self.source_thread,
            "text": self.text,
            "created_ts": self.created_ts,
            "hit_count": self.hit_count,
            "distance":
                round(self.distance, 4) if self.distance is not None else None,
            "ttl_seconds": self.ttl_seconds,
        }


@dataclass
class WriteResult:
    """Outcome of a ``remember`` call.

    ``deduped`` is ``True`` when the write skipped because a similar
    memory already existed; ``id`` is then the existing memory's id.
    ``existing_distance`` is the cosine distance to that nearest
    memory regardless of which branch was taken — useful for tracing.
    """

    id: str
    deduped: bool
    existing_distance: Optional[float]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "deduped": self.deduped,
            "existing_distance":
                round(self.existing_distance, 4)
                if self.existing_distance is not None else None,
        }


class LongTermMemory:
    """Index, dedupe, recall, and bound long-term agent memories."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        index_name: str = "agentmem:idx",
        key_prefix: str = "agent:mem:",
        vector_dim: int = VECTOR_DIM_DEFAULT,
        dedup_threshold: float = DEFAULT_DEDUP_THRESHOLD,
        recall_threshold: float = DEFAULT_RECALL_THRESHOLD,
        ttl_by_kind: Optional[dict[str, Optional[int]]] = None,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost", port=6379, decode_responses=False,
        )
        self.index_name = index_name
        self.key_prefix = key_prefix
        self.vector_dim = vector_dim
        self.dedup_threshold = dedup_threshold
        self.recall_threshold = recall_threshold
        self.ttl_by_kind = ttl_by_kind or dict(TTL_BY_KIND)

    # ------------------------------------------------------------------
    # Keys and index
    # ------------------------------------------------------------------

    def memory_key(self, memory_id: str) -> str:
        return f"{self.key_prefix}{memory_id}"

    def create_index(self) -> None:
        """Create the Redis Search index if it doesn't already exist.

        The index is declared on the JSON document type, with a
        ``$.embedding`` path holding the vector and tag fields for
        ``user``, ``namespace``, ``kind``, and ``source_thread``. One
        ``FT.SEARCH`` can therefore pre-filter by any combination of
        those tags and KNN-rank the matching memories in one pass.
        """
        schema = (
            TextField("$.text", as_name="text"),
            TagField("$.user", as_name="user"),
            TagField("$.namespace", as_name="namespace"),
            TagField("$.kind", as_name="kind"),
            TagField("$.source_thread", as_name="source_thread"),
            NumericField("$.created_ts", as_name="created_ts", sortable=True),
            NumericField("$.hit_count", as_name="hit_count", sortable=True),
            VectorField(
                "$.embedding",
                "HNSW",
                {
                    "TYPE": "FLOAT32",
                    "DIM": self.vector_dim,
                    "DISTANCE_METRIC": "COSINE",
                },
                as_name="embedding",
            ),
        )
        definition = IndexDefinition(
            prefix=[self.key_prefix], index_type=IndexType.JSON,
        )
        try:
            self.redis.ft(self.index_name).create_index(
                fields=schema, definition=definition,
            )
        except redis.ResponseError as exc:
            if "Index already exists" not in str(exc):
                raise

    def drop_index(self, delete_documents: bool = False) -> None:
        """Drop the search index. Optionally also delete the JSON docs."""
        try:
            self.redis.ft(self.index_name).dropindex(
                delete_documents=delete_documents,
            )
        except redis.ResponseError as exc:
            message = str(exc).lower()
            if "no such index" not in message \
                    and "unknown index name" not in message:
                raise

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def remember(
        self,
        text: str,
        embedding: np.ndarray,
        user: str = "default",
        namespace: str = "default",
        kind: str = "episodic",
        source_thread: str = "",
        ttl_seconds: int | None | object = ...,
    ) -> WriteResult:
        """Write a new memory, deduplicating against existing entries.

        Runs one in-scope KNN(1) against the index first. If the
        nearest existing memory is within ``dedup_threshold``, the
        new memory is skipped (its content is already represented)
        and the existing memory's ``hit_count`` is bumped. Otherwise
        a fresh JSON document is written under a new id with a TTL
        derived from the memory's ``kind``.
        """
        if embedding.shape != (self.vector_dim,):
            raise ValueError(
                f"embedding has shape {embedding.shape}; "
                f"index expects ({self.vector_dim},)"
            )
        if embedding.dtype != np.float32:
            embedding = embedding.astype(np.float32, copy=False)

        nearest = self._nearest(
            embedding, user=user, namespace=namespace, kind=kind, k=1,
        )
        nearest_distance = nearest[0].distance if nearest else None
        if nearest and nearest[0].distance is not None \
                and nearest[0].distance <= self.dedup_threshold:
            # Duplicate. Bump the hit count on the existing memory so
            # the admin UI can show how often it's been re-derived.
            self._bump_hit_count(nearest[0].id)
            return WriteResult(
                id=nearest[0].id,
                deduped=True,
                existing_distance=nearest_distance,
            )

        memory_id = uuid.uuid4().hex[:12]
        key = self.memory_key(memory_id)
        now = time.time()
        doc = {
            "id": memory_id,
            "user": user,
            "namespace": namespace,
            "kind": kind,
            "source_thread": source_thread,
            "text": text,
            "embedding": embedding.tolist(),
            "created_ts": now,
            "hit_count": 0,
        }
        ttl = self._resolve_ttl(kind, ttl_seconds)

        # MULTI/EXEC so the document and its TTL apply together.
        pipe = self.redis.pipeline(transaction=True)
        pipe.json().set(key, "$", doc)
        if ttl is not None:
            pipe.expire(key, ttl)
        pipe.execute()
        return WriteResult(
            id=memory_id,
            deduped=False,
            existing_distance=nearest_distance,
        )

    # ------------------------------------------------------------------
    # Recall
    # ------------------------------------------------------------------

    def recall(
        self,
        query_embedding: np.ndarray,
        user: str = "default",
        namespace: str | None = "default",
        kind: str | None = None,
        k: int = 5,
        distance_threshold: float | None = None,
    ) -> list[MemoryRecord]:
        """Return the top-k in-scope memories ranked by similarity.

        Memories beyond ``distance_threshold`` (or the instance
        default) are dropped — the index always returns *something*
        for KNN, so a recall result on an unrelated query would
        otherwise be a confidently-wrong false positive.
        """
        threshold = (
            distance_threshold if distance_threshold is not None
            else self.recall_threshold
        )
        candidates = self._nearest(
            query_embedding,
            user=user, namespace=namespace, kind=kind, k=k,
        )
        return [c for c in candidates
                if c.distance is not None and c.distance <= threshold]

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _nearest(
        self,
        embedding: np.ndarray,
        user: str | None,
        namespace: str | None,
        kind: str | None,
        k: int,
    ) -> list[MemoryRecord]:
        if embedding.shape != (self.vector_dim,):
            raise ValueError(
                f"embedding has shape {embedding.shape}; "
                f"index expects ({self.vector_dim},)"
            )
        filter_clause = self._build_filter_clause(
            user=user, namespace=namespace, kind=kind,
        )
        knn_query = (
            f"{filter_clause}=>[KNN {k} @embedding $vec AS distance]"
        )
        q = (
            Query(knn_query)
            .sort_by("distance")
            .return_fields(
                "user", "namespace", "kind", "source_thread",
                "text", "created_ts", "hit_count", "distance",
            )
            .paging(0, k)
            .dialect(2)
        )
        result = self.redis.ft(self.index_name).search(
            q,
            query_params={
                "vec": embedding.astype(np.float32).tobytes(),
            },
        )
        out: list[MemoryRecord] = []
        for doc in result.docs:
            # ``doc.id`` is the full Redis key (e.g. ``agent:mem:abc123``).
            # Strip the prefix so the MemoryRecord exposes only the
            # opaque id the UI and ``delete_memory`` work with.
            memory_id = self._strip_prefix(_d(getattr(doc, "id", "")))
            ttl = self.redis.ttl(self.memory_key(memory_id))
            out.append(MemoryRecord(
                id=memory_id,
                user=_d(getattr(doc, "user", "")),
                namespace=_d(getattr(doc, "namespace", "")),
                kind=_d(getattr(doc, "kind", "")),
                source_thread=_d(getattr(doc, "source_thread", "")),
                text=_d(getattr(doc, "text", "")),
                created_ts=float(_d(getattr(doc, "created_ts", "0")) or 0),
                hit_count=int(_d(getattr(doc, "hit_count", "0")) or 0),
                distance=float(_d(getattr(doc, "distance", "0")) or 0),
                ttl_seconds=int(ttl) if ttl and ttl > 0 else None,
            ))
        return out

    def _bump_hit_count(self, memory_id: str) -> None:
        key = self.memory_key(memory_id)
        try:
            self.redis.json().numincrby(key, "$.hit_count", 1)
        except redis.ResponseError:
            # The doc may have expired between recall and bump — fine,
            # we just lose the hit count update.
            pass

    def _resolve_ttl(self, kind: str, override: object) -> int | None:
        if override is ...:
            return self.ttl_by_kind.get(kind)
        return override  # type: ignore[return-value]

    def _strip_prefix(self, raw_key: str) -> str:
        if raw_key.startswith(self.key_prefix):
            return raw_key[len(self.key_prefix):]
        return raw_key

    # Characters Redis Search treats as syntax inside a TAG value; any
    # of them in a user-supplied filter must be backslash-escaped or
    # the surrounding ``{...}`` block won't parse correctly.
    _TAG_SPECIAL = set("\\,.<>{}[]\"':;!@#$%^&*()-+=~| ")

    @classmethod
    def _escape_tag_value(cls, value: str) -> str:
        return "".join(
            "\\" + ch if ch in cls._TAG_SPECIAL else ch for ch in value
        )

    @classmethod
    def _build_filter_clause(
        cls,
        *,
        user: str | None,
        namespace: str | None,
        kind: str | None,
    ) -> str:
        clauses: list[str] = []
        if user:
            clauses.append(f"@user:{{{cls._escape_tag_value(user)}}}")
        if namespace:
            clauses.append(f"@namespace:{{{cls._escape_tag_value(namespace)}}}")
        if kind:
            clauses.append(f"@kind:{{{cls._escape_tag_value(kind)}}}")
        return "(" + " ".join(clauses) + ")" if clauses else "(*)"

    # ------------------------------------------------------------------
    # Admin / inspection
    # ------------------------------------------------------------------

    def index_info(self) -> dict:
        try:
            info = self.redis.ft(self.index_name).info()
        except redis.ResponseError:
            return {"num_docs": 0, "indexing_failures": 0}
        return {
            "num_docs": int(info.get("num_docs", 0)),
            "indexing_failures": int(info.get("hash_indexing_failures", 0)),
        }

    def list_memories(
        self,
        user: str | None = None,
        namespace: str | None = None,
        kind: str | None = None,
        limit: int = 100,
    ) -> list[MemoryRecord]:
        """Return memories matching the filters, newest first."""
        filter_clause = self._build_filter_clause(
            user=user, namespace=namespace, kind=kind,
        )
        q = (
            Query(filter_clause)
            .return_fields(
                "user", "namespace", "kind", "source_thread",
                "text", "created_ts", "hit_count",
            )
            .paging(0, limit)
            .sort_by("created_ts", asc=False)
            .dialect(2)
        )
        result = self.redis.ft(self.index_name).search(q)
        out: list[MemoryRecord] = []
        for doc in result.docs:
            memory_id = self._strip_prefix(_d(getattr(doc, "id", "")))
            ttl = self.redis.ttl(self.memory_key(memory_id))
            out.append(MemoryRecord(
                id=memory_id,
                user=_d(getattr(doc, "user", "")),
                namespace=_d(getattr(doc, "namespace", "")),
                kind=_d(getattr(doc, "kind", "")),
                source_thread=_d(getattr(doc, "source_thread", "")),
                text=_d(getattr(doc, "text", "")),
                created_ts=float(_d(getattr(doc, "created_ts", "0")) or 0),
                hit_count=int(_d(getattr(doc, "hit_count", "0")) or 0),
                ttl_seconds=int(ttl) if ttl and ttl > 0 else None,
            ))
        return out

    def delete_memory(self, memory_id: str) -> bool:
        return bool(self.redis.delete(self.memory_key(memory_id)))

    def clear(self) -> int:
        """Drop the index and every memory document.

        Returns the count of documents that were removed. In
        production the equivalent is ``FLUSHDB`` on a dedicated
        memory database, or letting TTLs and eviction expire entries
        naturally.
        """
        before = self.index_info()["num_docs"]
        self.drop_index(delete_documents=True)
        self.create_index()
        return before


def _d(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value
