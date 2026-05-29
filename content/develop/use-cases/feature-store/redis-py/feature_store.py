"""
Redis online feature store backed by per-entity Hashes.

Each entity (here, a user) lives at a deterministic key such as
``fs:user:{id}``. The hash holds every feature for that entity as one
field per feature — batch-materialized aggregates (refreshed on a daily
cycle) alongside streaming-updated signals (refreshed every few
seconds). One ``HMGET`` returns whichever subset the model needs in
one network round trip.

Two TTL layers solve the *mixed staleness* problem:

* A key-level ``EXPIRE`` aligned with the batch materialization cycle
  causes the whole entity to disappear if its batch refresher fails,
  so inference sees a missing entity (which the model handler can
  detect and fall back on) rather than silently outdated values.
* A per-field ``HEXPIRE`` on each streaming field gives that field its
  own shorter expiry, independent of the rest of the hash. When the
  streaming pipeline stops updating a field, the field self-cleans
  while the rest of the entity stays populated.

``HEXPIRE`` and ``HTTL`` require Redis 7.4 or later. ``redis-py``
exposes them as ``hexpire`` / ``httl`` from version 5.1.

Concurrency is by construction: Redis is single-threaded per shard, so
overlapping ``HSET`` calls from a batch job and a streaming worker on
the same entity hash are applied atomically without locks or version
columns.
"""

from __future__ import annotations

from threading import Lock
from typing import Iterable, Mapping, Optional, Union

import redis


FeatureValue = Union[str, int, float, bool]
FeatureMap = Mapping[str, FeatureValue]


# Default batch feature schema. Daily aggregates computed offline and
# bulk-loaded once per materialization cycle.
DEFAULT_BATCH_FIELDS: tuple[str, ...] = (
    "country_iso",
    "risk_segment",
    "account_age_days",
    "tx_count_7d",
    "avg_amount_30d",
    "chargeback_count_180d",
)

# Default streaming feature schema. Updated by the streaming worker as
# new events arrive, with a per-field TTL so each field self-expires
# when its upstream pipeline stops.
DEFAULT_STREAMING_FIELDS: tuple[str, ...] = (
    "last_login_ts",
    "last_device_id",
    "tx_count_5m",
    "failed_logins_15m",
    "session_country",
)


class RedisFeatureStore:
    """Online feature store helper for one entity type (default: user)."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        key_prefix: str = "fs:user:",
        batch_ttl_seconds: int = 24 * 60 * 60,
        streaming_ttl_seconds: int = 5 * 60,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.key_prefix = key_prefix
        self.batch_ttl_seconds = batch_ttl_seconds
        self.streaming_ttl_seconds = streaming_ttl_seconds

        self._stats_lock = Lock()
        self._batch_writes_total = 0
        self._streaming_writes_total = 0
        self._reads_total = 0
        self._read_fields_total = 0

    # ------------------------------------------------------------------
    # Key helpers
    # ------------------------------------------------------------------

    def key_for(self, entity_id: str) -> str:
        return f"{self.key_prefix}{entity_id}"

    # ------------------------------------------------------------------
    # Batch ingestion (materialization)
    # ------------------------------------------------------------------

    def bulk_load(
        self,
        rows: Mapping[str, FeatureMap],
        ttl_seconds: Optional[int] = None,
    ) -> int:
        """Materialize a batch of entities into Redis.

        ``rows`` is ``{entity_id: {field: value, ...}}``. One ``HSET``
        plus one ``EXPIRE`` per entity, all pipelined into a single
        round trip. The key-level ``EXPIRE`` is what makes the whole
        entity disappear if a future batch run fails — inference reads
        the missing entity rather than silently outdated values.
        """
        ttl = self.batch_ttl_seconds if ttl_seconds is None else ttl_seconds
        pipe = self.redis.pipeline(transaction=False)
        for entity_id, fields in rows.items():
            key = self.key_for(entity_id)
            pipe.hset(key, mapping={k: _encode(v) for k, v in fields.items()})
            pipe.expire(key, ttl)
        pipe.execute()
        with self._stats_lock:
            self._batch_writes_total += len(rows)
        return len(rows)

    def update_batch_feature(
        self,
        entity_id: str,
        field: str,
        value: FeatureValue,
    ) -> None:
        """Update a single batch feature without touching the key TTL.

        Used by the demo's "manually refresh one user" lever; in a real
        pipeline batch updates always flow through ``bulk_load``.
        """
        self.redis.hset(self.key_for(entity_id), field, _encode(value))
        with self._stats_lock:
            self._batch_writes_total += 1

    # ------------------------------------------------------------------
    # Streaming ingestion
    # ------------------------------------------------------------------

    def update_streaming(
        self,
        entity_id: str,
        fields: FeatureMap,
        ttl_seconds: Optional[int] = None,
    ) -> None:
        """Write streaming features with a per-field TTL.

        Each field carries its own ``HEXPIRE`` so it self-expires
        independently of the rest of the hash. If the streaming
        pipeline stops, the streaming fields drop out while the
        batch-materialized fields remain populated under their longer
        key-level ``EXPIRE``.
        """
        if not fields:
            return
        ttl = self.streaming_ttl_seconds if ttl_seconds is None else ttl_seconds
        key = self.key_for(entity_id)
        encoded = {name: _encode(value) for name, value in fields.items()}

        pipe = self.redis.pipeline(transaction=False)
        pipe.hset(key, mapping=encoded)
        pipe.hexpire(key, ttl, *encoded.keys())
        pipe.execute()
        with self._stats_lock:
            self._streaming_writes_total += len(encoded)

    # ------------------------------------------------------------------
    # Inference reads
    # ------------------------------------------------------------------

    def get_features(
        self,
        entity_id: str,
        field_names: Optional[Iterable[str]] = None,
    ) -> dict[str, str]:
        """Retrieve a subset of features for one entity.

        ``HMGET`` returns the requested fields in one round trip. Pass
        ``field_names=None`` to fetch the entire hash with ``HGETALL``
        — useful for debugging but rarely the right call on the
        request path, where the model knows exactly which features it
        consumes.
        """
        key = self.key_for(entity_id)
        if field_names is None:
            data = self.redis.hgetall(key)
            with self._stats_lock:
                self._reads_total += 1
                self._read_fields_total += len(data)
            return data

        names = list(field_names)
        if not names:
            return {}
        values = self.redis.hmget(key, names)
        with self._stats_lock:
            self._reads_total += 1
            self._read_fields_total += sum(1 for v in values if v is not None)
        return {n: v for n, v in zip(names, values) if v is not None}

    def batch_get_features(
        self,
        entity_ids: Iterable[str],
        field_names: Iterable[str],
    ) -> dict[str, dict[str, str]]:
        """Pipeline ``HMGET`` across many entities for batch scoring.

        Hundreds of entities in one round trip. The model can then
        score them all without further network calls.
        """
        ids = list(entity_ids)
        names = list(field_names)
        if not ids or not names:
            return {}

        pipe = self.redis.pipeline(transaction=False)
        for entity_id in ids:
            pipe.hmget(self.key_for(entity_id), names)
        rows = pipe.execute()

        out: dict[str, dict[str, str]] = {}
        seen_fields = 0
        for entity_id, values in zip(ids, rows):
            row = {n: v for n, v in zip(names, values) if v is not None}
            out[entity_id] = row
            seen_fields += len(row)
        with self._stats_lock:
            self._reads_total += len(ids)
            self._read_fields_total += seen_fields
        return out

    # ------------------------------------------------------------------
    # TTL inspection (used by the demo UI)
    # ------------------------------------------------------------------

    def key_ttl_seconds(self, entity_id: str) -> int:
        """Seconds until the entity key expires.

        Returns ``-1`` if no key-level TTL is set, ``-2`` if the key
        doesn't exist.
        """
        return int(self.redis.ttl(self.key_for(entity_id)))

    def field_ttls_seconds(
        self,
        entity_id: str,
        field_names: Iterable[str],
    ) -> dict[str, int]:
        """Per-field TTL via ``HTTL`` (Redis 7.4+).

        Each value mirrors the ``TTL`` convention: positive means
        seconds remaining, ``-1`` means no TTL on the field, ``-2``
        means the field doesn't exist on this hash.
        """
        names = list(field_names)
        if not names:
            return {}
        ttls = self.redis.httl(self.key_for(entity_id), *names)
        return {n: int(t) for n, t in zip(names, ttls)}

    # ------------------------------------------------------------------
    # Demo housekeeping
    # ------------------------------------------------------------------

    def list_entity_ids(self, limit: int = 200) -> list[str]:
        """Enumerate entity IDs by scanning ``key_prefix*``.

        ``SCAN`` is non-blocking; the demo uses it to populate UI
        dropdowns, not as a serving primitive.
        """
        ids: list[str] = []
        prefix_len = len(self.key_prefix)
        for key in self.redis.scan_iter(match=f"{self.key_prefix}*", count=200):
            ids.append(key[prefix_len:])
            if len(ids) >= limit:
                break
        return sorted(ids)

    def count_entities(self) -> int:
        """Count entities currently in the store (via ``SCAN``)."""
        count = 0
        for _ in self.redis.scan_iter(match=f"{self.key_prefix}*", count=500):
            count += 1
        return count

    def delete_entity(self, entity_id: str) -> int:
        return int(self.redis.delete(self.key_for(entity_id)))

    def reset(self) -> int:
        """Drop every entity under ``key_prefix``. Used by the demo reset path.

        Scans in batches and ``DEL``s them in one pipeline per batch,
        so a large demo dataset doesn't load the server with one big
        synchronous delete.
        """
        deleted = 0
        batch: list[str] = []
        for key in self.redis.scan_iter(match=f"{self.key_prefix}*", count=500):
            batch.append(key)
            if len(batch) >= 500:
                deleted += int(self.redis.delete(*batch))
                batch.clear()
        if batch:
            deleted += int(self.redis.delete(*batch))
        return deleted

    def stats(self) -> dict[str, int]:
        with self._stats_lock:
            return {
                "batch_writes_total": self._batch_writes_total,
                "streaming_writes_total": self._streaming_writes_total,
                "reads_total": self._reads_total,
                "read_fields_total": self._read_fields_total,
            }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._batch_writes_total = 0
            self._streaming_writes_total = 0
            self._reads_total = 0
            self._read_fields_total = 0


def _encode(value: FeatureValue) -> str:
    """Encode a feature value as a string for Hash storage.

    Booleans become ``"true"`` / ``"false"`` (not ``"True"`` / ``"False"``)
    so they round-trip cleanly through other clients and ``redis-cli``.
    """
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)
