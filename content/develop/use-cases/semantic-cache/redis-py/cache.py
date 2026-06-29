"""
Redis semantic-cache helper backed by Redis Search.

Each cache entry lives as a Hash document at ``cache:<id>``. The hash
stores the user's prompt and the corresponding LLM response alongside
the raw float32 bytes of the prompt's 384-dimensional embedding and a
small set of metadata fields — tenant, locale, model version, and a
safety flag.

A single Redis Search index covers the embedding plus every metadata
field, so one ``FT.SEARCH`` call does an approximate-nearest-neighbour
lookup against the cached prompts with a TAG pre-filter applied in the
same pass — no cross-store joins, no extra round trips, and tenant
isolation is enforced *inside* the query rather than after the fact in
application code.

The lookup is thresholded: ``FT.SEARCH`` always returns the closest
cached prompt, but the cache only serves it as a hit when the cosine
distance is at or below ``distance_threshold``. Anything further away
is treated as a miss; the caller is expected to run the underlying LLM
and write the new prompt, response, and embedding back with ``put``.

Each cache entry is written with ``EXPIRE``, so stale answers age out
without manual cleanup; setting an eviction policy on the database
(``allkeys-lfu`` is the common choice) caps memory under pressure.
This helper expects a ``redis.Redis`` client constructed with
``decode_responses=False`` because the embedding field is binary;
mixing UTF-8 decoding into a binary path corrupts vectors. Text
fields are decoded explicitly where needed.
"""

from __future__ import annotations

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


@dataclass
class CacheHit:
    """A cache lookup that returned a cached response.

    ``distance`` is the cosine distance ``FT.SEARCH`` reported for the
    nearest cached prompt (0 = identical, 2 = opposite). It is always
    at or below the threshold the lookup was run with.
    """

    id: str
    prompt: str
    response: str
    tenant: str
    locale: str
    model_version: str
    distance: float
    ttl_seconds: int
    hit_count: int

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "prompt": self.prompt,
            "response": self.response,
            "tenant": self.tenant,
            "locale": self.locale,
            "model_version": self.model_version,
            "distance": round(self.distance, 4),
            "ttl_seconds": self.ttl_seconds,
            "hit_count": self.hit_count,
        }


@dataclass
class CacheMiss:
    """A cache lookup that did not return a usable response.

    ``nearest_distance`` is the cosine distance to the closest cached
    prompt that *did* match the metadata filters. It is ``None`` if the
    cache had no entry in scope at all, which is what the demo UI
    shows as "no candidate" vs. "candidate too far".
    """

    nearest_distance: Optional[float]
    nearest_id: Optional[str]

    def to_dict(self) -> dict:
        return {
            "nearest_distance":
                round(self.nearest_distance, 4)
                if self.nearest_distance is not None else None,
            "nearest_id": self.nearest_id,
        }


class RedisSemanticCache:
    """Index, look up, and write a semantic cache of LLM responses."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        index_name: str = "semcache:idx",
        key_prefix: str = "cache:",
        vector_dim: int = VECTOR_DIM_DEFAULT,
        distance_threshold: float = 0.5,
        default_ttl_seconds: int = 3600,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=False,
        )
        self.index_name = index_name
        self.key_prefix = key_prefix
        self.vector_dim = vector_dim
        self.distance_threshold = distance_threshold
        self.default_ttl_seconds = default_ttl_seconds

    # ------------------------------------------------------------------
    # Keys
    # ------------------------------------------------------------------

    def entry_key(self, entry_id: str) -> str:
        return f"{self.key_prefix}{entry_id}"

    # ------------------------------------------------------------------
    # Index management
    # ------------------------------------------------------------------

    def create_index(self) -> None:
        """Create the Redis Search index if it doesn't already exist.

        One index covers the embedding plus every metadata field, so a
        single ``FT.SEARCH`` can pre-filter by tenant / locale / model
        and then KNN-rank the matching documents in one pass. The
        ``prompt`` and ``response`` fields are stored as TEXT so the
        admin tooling can grep the cache by content, but the cache
        lookup itself is vector-only.
        """
        schema = (
            TextField("prompt"),
            TextField("response"),
            TagField("tenant"),
            TagField("locale"),
            TagField("model_version"),
            TagField("safety"),
            NumericField("created_ts", sortable=True),
            NumericField("hit_count", sortable=True),
            VectorField(
                "embedding",
                "HNSW",
                {
                    "TYPE": "FLOAT32",
                    "DIM": self.vector_dim,
                    "DISTANCE_METRIC": "COSINE",
                },
            ),
        )
        definition = IndexDefinition(
            prefix=[self.key_prefix], index_type=IndexType.HASH,
        )
        try:
            self.redis.ft(self.index_name).create_index(
                fields=schema, definition=definition,
            )
        except redis.ResponseError as exc:
            if "Index already exists" not in str(exc):
                raise

    def drop_index(self, delete_documents: bool = False) -> None:
        """Drop the search index. Optionally also delete cached entries."""
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
    # Lookup
    # ------------------------------------------------------------------

    def lookup(
        self,
        query_vec: np.ndarray,
        tenant: str | None = None,
        locale: str | None = None,
        model_version: str | None = None,
        safety: str | None = "ok",
        distance_threshold: float | None = None,
    ) -> CacheHit | CacheMiss:
        """Find the nearest in-scope cached prompt and decide hit / miss.

        ``FT.SEARCH`` returns the single nearest entry that satisfies
        the TAG pre-filters. The lookup is a hit only if the reported
        cosine distance is at or below ``distance_threshold`` (or the
        instance default). Anything further away is a miss with the
        candidate distance attached so the caller can log it.

        On a hit, the entry's ``hit_count`` is incremented atomically
        with ``HINCRBY`` so the demo UI can show which entries are
        load-bearing. The TTL is refreshed on every hit so frequently
        used answers don't age out under cold tail entries.
        """
        threshold = (
            distance_threshold if distance_threshold is not None
            else self.distance_threshold
        )

        # Match the shape check that ``put`` performs. A wrong-dim
        # vector would otherwise hit Redis as a malformed FT.SEARCH
        # parameter and surface as a server-side parse error instead
        # of a clear caller-side ValueError.
        if query_vec.shape != (self.vector_dim,):
            raise ValueError(
                f"query_vec has shape {query_vec.shape}; "
                f"index expects ({self.vector_dim},)"
            )

        filter_clause = self._build_filter_clause(
            tenant=tenant,
            locale=locale,
            model_version=model_version,
            safety=safety,
        )
        knn_query = f"{filter_clause}=>[KNN 1 @embedding $vec AS distance]"
        q = (
            Query(knn_query)
            .sort_by("distance")
            .return_fields(
                "prompt", "response", "tenant", "locale",
                "model_version", "hit_count", "distance",
            )
            .paging(0, 1)
            .dialect(2)
        )
        result = self.redis.ft(self.index_name).search(
            q, query_params={"vec": query_vec.astype(np.float32).tobytes()},
        )

        if not result.docs:
            return CacheMiss(nearest_distance=None, nearest_id=None)

        doc = result.docs[0]
        raw_key = _decode(getattr(doc, "id", ""))
        entry_id = (
            raw_key[len(self.key_prefix):] if raw_key.startswith(self.key_prefix)
            else raw_key
        )
        distance = float(_decode(getattr(doc, "distance", "0")) or 0)

        if distance > threshold:
            return CacheMiss(nearest_distance=distance, nearest_id=entry_id)

        # The hash may have expired between FT.SEARCH returning the
        # row and us getting here — the search index lags expirations
        # by its periodic scan. If we just blindly ``HINCRBY``-ed,
        # Redis would helpfully recreate the hash with only
        # ``hit_count`` set and the search index would then log it as
        # an indexing failure (no embedding, no metadata). EXISTS
        # narrows that race to the pipeline round-trip; a strictly
        # race-free version would wrap the bump in a Lua script that
        # checks existence and acts in one server-side step.
        entry_key = self.entry_key(entry_id)
        if not self.redis.exists(entry_key):
            return CacheMiss(nearest_distance=distance, nearest_id=entry_id)

        # MULTI/EXEC the three writes so they apply as a unit on the
        # server — a partial failure between HINCRBY and EXPIRE would
        # otherwise leave the entry without a refreshed TTL.
        pipe = self.redis.pipeline(transaction=True)
        pipe.hincrby(entry_key, "hit_count", 1)
        pipe.expire(entry_key, self.default_ttl_seconds)
        pipe.ttl(entry_key)
        new_hit_count, _expired, ttl = pipe.execute()

        return CacheHit(
            id=entry_id,
            prompt=_decode(getattr(doc, "prompt", "")),
            response=_decode(getattr(doc, "response", "")),
            tenant=_decode(getattr(doc, "tenant", "")),
            locale=_decode(getattr(doc, "locale", "")),
            model_version=_decode(getattr(doc, "model_version", "")),
            distance=distance,
            ttl_seconds=int(ttl) if ttl and ttl > 0 else self.default_ttl_seconds,
            hit_count=int(new_hit_count),
        )

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def put(
        self,
        prompt: str,
        response: str,
        embedding: np.ndarray,
        tenant: str = "default",
        locale: str = "en",
        model_version: str = "gpt-4.5-2026",
        safety: str = "ok",
        ttl_seconds: int | None = None,
        entry_id: str | None = None,
    ) -> str:
        """Write a new cache entry and return its id.

        The embedding is stored as raw little-endian float32 bytes —
        the encoding Redis Search expects from a FLOAT32 vector field.
        ``EXPIRE`` on the key gives every entry a bounded lifetime;
        combine with an ``allkeys-lfu`` eviction policy on the database
        to cap memory under pressure too.
        """
        if embedding.shape != (self.vector_dim,):
            raise ValueError(
                f"embedding has shape {embedding.shape}; "
                f"index expects ({self.vector_dim},)"
            )
        if embedding.dtype != np.float32:
            embedding = embedding.astype(np.float32, copy=False)

        entry_id = entry_id or uuid.uuid4().hex[:12]
        key = self.entry_key(entry_id)
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl_seconds

        mapping = {
            "prompt": prompt,
            "response": response,
            "tenant": tenant,
            "locale": locale,
            "model_version": model_version,
            "safety": safety,
            "created_ts": str(time.time()),
            "hit_count": "0",
            "embedding": embedding.tobytes(),
        }
        # MULTI/EXEC so HSET and EXPIRE either both apply or neither
        # does. Without the transaction wrapper a connection drop
        # between the two writes could leave the entry without a TTL
        # and the cache would then keep an answer past its intended
        # lifetime (or forever, on a database with no eviction policy).
        pipe = self.redis.pipeline(transaction=True)
        pipe.hset(key, mapping=mapping)
        pipe.expire(key, ttl)
        pipe.execute()
        return entry_id

    # ------------------------------------------------------------------
    # Filter clause
    # ------------------------------------------------------------------

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
        tenant: str | None,
        locale: str | None,
        model_version: str | None,
        safety: str | None,
    ) -> str:
        clauses: list[str] = []
        if tenant:
            clauses.append(f"@tenant:{{{cls._escape_tag_value(tenant)}}}")
        if locale:
            clauses.append(f"@locale:{{{cls._escape_tag_value(locale)}}}")
        if model_version:
            clauses.append(
                f"@model_version:{{{cls._escape_tag_value(model_version)}}}"
            )
        if safety:
            clauses.append(f"@safety:{{{cls._escape_tag_value(safety)}}}")
        return "(" + " ".join(clauses) + ")" if clauses else "(*)"

    # ------------------------------------------------------------------
    # Inspection / admin
    # ------------------------------------------------------------------

    def index_info(self) -> dict:
        """Subset of ``FT.INFO`` useful for the demo UI."""
        try:
            info = self.redis.ft(self.index_name).info()
        except redis.ResponseError:
            return {"num_docs": 0, "indexing_failures": 0,
                    "vector_index_size_mb": 0.0}
        return {
            "num_docs": int(info.get("num_docs", 0)),
            "indexing_failures":
                int(info.get("hash_indexing_failures", 0)),
            "vector_index_size_mb": _safe_mb(info),
        }

    def list_entries(self, limit: int = 100) -> list[dict]:
        """Return every cached entry (no embedding) for the admin UI."""
        q = (
            Query("*")
            .return_fields(
                "prompt", "response", "tenant", "locale",
                "model_version", "safety", "created_ts", "hit_count",
            )
            .paging(0, limit)
            .sort_by("created_ts", asc=False)
        )
        result = self.redis.ft(self.index_name).search(q)
        out: list[dict] = []
        for doc in result.docs:
            raw_key = _decode(getattr(doc, "id", ""))
            entry_id = (
                raw_key[len(self.key_prefix):]
                if raw_key.startswith(self.key_prefix) else raw_key
            )
            ttl = self.redis.ttl(self.entry_key(entry_id))
            out.append({
                "id": entry_id,
                "prompt": _decode(getattr(doc, "prompt", "")),
                "response": _decode(getattr(doc, "response", "")),
                "tenant": _decode(getattr(doc, "tenant", "")),
                "locale": _decode(getattr(doc, "locale", "")),
                "model_version": _decode(getattr(doc, "model_version", "")),
                "safety": _decode(getattr(doc, "safety", "")),
                "hit_count":
                    int(_decode(getattr(doc, "hit_count", "0")) or 0),
                "ttl_seconds": int(ttl) if ttl and ttl > 0 else 0,
                "created_ts":
                    float(_decode(getattr(doc, "created_ts", "0")) or 0),
            })
        return out

    def delete_entry(self, entry_id: str) -> bool:
        """Drop a single entry. Returns ``True`` if the key existed."""
        return bool(self.redis.delete(self.entry_key(entry_id)))

    def clear(self) -> int:
        """Drop the index and every cached entry.

        Returns the number of entries that were removed. Used by the
        demo's "reset" button — in production the equivalent is just
        ``FLUSHDB`` on a dedicated cache database, or letting TTLs
        expire naturally.
        """
        before = self.index_info()["num_docs"]
        self.drop_index(delete_documents=True)
        self.create_index()
        return before


def _decode(value) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def _safe_mb(info: dict) -> float:
    try:
        return float(info.get("vector_index_sz_mb", 0.0) or 0.0)
    except (TypeError, ValueError):
        return 0.0
