"""
Redis prefetch-cache helper.

Each cached entity is stored as a Redis hash under ``cache:{prefix}:{id}``
with a long safety-net TTL that bounds memory if the sync pipeline ever
stops, but is not the freshness mechanism. Freshness comes from the
``apply_change`` path, which the sync worker calls every time a primary
mutation arrives.

Reads run ``HGETALL`` against Redis only. A miss is not a fall-back
trigger — the application treats it as an error or a deliberate
``invalidate`` for testing. In production a sustained miss rate means
the prefetch or the sync pipeline is broken, not that the primary should
be re-queried on the request path.
"""

from __future__ import annotations

from threading import Lock
import time
from typing import Iterable, Optional

import redis


class PrefetchCache:
    """Prefetch-cache helper backed by Redis hashes with a safety-net TTL."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        prefix: str = "cache:category:",
        ttl_seconds: int = 3600,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.prefix = prefix
        self.ttl_seconds = ttl_seconds

        self._stats_lock = Lock()
        self._hits = 0
        self._misses = 0
        self._prefetched = 0
        self._sync_events_applied = 0
        self._sync_lag_ms_total = 0.0
        self._sync_lag_samples = 0

    def _cache_key(self, entity_id: str) -> str:
        return f"{self.prefix}{entity_id}"

    def _strip_prefix(self, key: str) -> str:
        return key[len(self.prefix):] if key.startswith(self.prefix) else key

    def bulk_load(self, records: Iterable[dict[str, str]]) -> int:
        """Pipeline ``HSET`` + ``EXPIRE`` for every record. Returns the count loaded.

        The pipeline is non-transactional: it is fast on startup (when
        nothing is reading the cache) and on the live ``/reprefetch``
        path (when the demo pauses the sync worker around the call).
        Calling ``bulk_load`` on a cache that is actively being read
        and written to can briefly expose a key that has been deleted
        but not yet rewritten; pause the writers first or rewrite this
        with ``pipeline(transaction=True)`` if that matters.
        """
        loaded = 0
        pipe = self.redis.pipeline(transaction=False)
        for record in records:
            entity_id = record.get("id")
            if not entity_id:
                continue
            cache_key = self._cache_key(entity_id)
            pipe.delete(cache_key)
            pipe.hset(cache_key, mapping=record)
            pipe.expire(cache_key, self.ttl_seconds)
            loaded += 1
        if loaded:
            pipe.execute()
        with self._stats_lock:
            self._prefetched += loaded
        return loaded

    def get(
        self,
        entity_id: str,
    ) -> tuple[Optional[dict[str, str]], bool, float]:
        """Return ``(record, hit, redis_latency_ms)`` for an ``HGETALL`` against Redis.

        Prefetch-cache reads do not fall back to the primary. A miss is a
        signal that the cache is incomplete, not a trigger to re-query the
        source. The caller decides how to surface it.
        """
        cache_key = self._cache_key(entity_id)

        started = time.perf_counter()
        cached = self.redis.hgetall(cache_key)
        redis_latency_ms = (time.perf_counter() - started) * 1000.0

        if cached:
            with self._stats_lock:
                self._hits += 1
            return cached, True, redis_latency_ms

        with self._stats_lock:
            self._misses += 1
        return None, False, redis_latency_ms

    def apply_change(self, change: dict) -> None:
        """Apply a primary change event to Redis.

        The sync worker calls this for every event the primary emits.
        For an upsert, the helper rewrites the hash and refreshes the
        safety-net TTL. For a delete, it removes the cache key.
        """
        op = change.get("op")
        entity_id = change.get("id")
        if not entity_id:
            return

        cache_key = self._cache_key(entity_id)

        if op == "upsert":
            fields = change.get("fields") or {}
            pipe = self.redis.pipeline(transaction=True)
            pipe.delete(cache_key)
            pipe.hset(cache_key, mapping=fields)
            pipe.expire(cache_key, self.ttl_seconds)
            pipe.execute()
        elif op == "delete":
            self.redis.delete(cache_key)
        else:
            return

        with self._stats_lock:
            self._sync_events_applied += 1
            timestamp_ms = change.get("timestamp_ms")
            if isinstance(timestamp_ms, (int, float)):
                lag_ms = max(0.0, (time.time() * 1000.0) - timestamp_ms)
                self._sync_lag_ms_total += lag_ms
                self._sync_lag_samples += 1

    def invalidate(self, entity_id: str) -> bool:
        """Delete one cache key. Demo-only: simulates a broken sync pipeline."""
        return self.redis.delete(self._cache_key(entity_id)) == 1

    def clear(self) -> int:
        """Delete every key under this cache's prefix and return the count."""
        deleted = 0
        pipe = self.redis.pipeline(transaction=False)
        batch = 0
        for key in self.redis.scan_iter(match=f"{self.prefix}*", count=500):
            pipe.delete(key)
            batch += 1
            if batch >= 500:
                deleted += sum(int(bool(r)) for r in pipe.execute())
                pipe = self.redis.pipeline(transaction=False)
                batch = 0
        if batch:
            deleted += sum(int(bool(r)) for r in pipe.execute())
        return deleted

    def ids(self) -> list[str]:
        """Return every entity id currently in the cache."""
        return sorted(
            self._strip_prefix(key)
            for key in self.redis.scan_iter(match=f"{self.prefix}*", count=500)
        )

    def count(self) -> int:
        return sum(1 for _ in self.redis.scan_iter(match=f"{self.prefix}*", count=500))

    def ttl_remaining(self, entity_id: str) -> int:
        return int(self.redis.ttl(self._cache_key(entity_id)))

    def stats(self) -> dict[str, float]:
        with self._stats_lock:
            total = self._hits + self._misses
            hit_rate = round(100.0 * self._hits / total, 1) if total else 0.0
            avg_lag = (
                round(self._sync_lag_ms_total / self._sync_lag_samples, 2)
                if self._sync_lag_samples
                else 0.0
            )
            return {
                "hits": self._hits,
                "misses": self._misses,
                "hit_rate_pct": hit_rate,
                "prefetched": self._prefetched,
                "sync_events_applied": self._sync_events_applied,
                "sync_lag_ms_avg": avg_lag,
            }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._hits = 0
            self._misses = 0
            self._prefetched = 0
            self._sync_events_applied = 0
            self._sync_lag_ms_total = 0.0
            self._sync_lag_samples = 0
