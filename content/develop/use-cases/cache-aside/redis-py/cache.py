"""
Redis cache-aside helper.

Each cached entity is stored as a Redis hash under ``cache:{prefix}:{id}``
with a TTL that bounds staleness. On a miss, a Lua-backed single-flight
lock funnels concurrent loaders down to one primary read; the others wait
briefly for the cache to populate.
"""

from __future__ import annotations

import secrets
import time
from threading import Lock
from typing import Callable, Optional

import redis


# Acquire a short-lived lock with SET NX PX. Returns 1 on acquire, 0 otherwise.
ACQUIRE_LOCK_SCRIPT = """
if redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2]) then
    return 1
end
return 0
"""

# Release a lock only if we still own it. Prevents releasing a lock that
# expired and was re-acquired by another caller.
RELEASE_LOCK_SCRIPT = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
end
return 0
"""


class RedisCache:
    """Cache-aside helper backed by Redis hashes with TTL and single-flight."""

    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        prefix: str = "cache:product:",
        ttl: int = 30,
        lock_ttl_ms: int = 2000,
        wait_poll_ms: int = 25,
    ) -> None:
        self.redis = redis_client or redis.Redis(
            host="localhost",
            port=6379,
            decode_responses=True,
        )
        self.prefix = prefix
        self.ttl = ttl
        self.lock_ttl_ms = lock_ttl_ms
        self.wait_poll_ms = wait_poll_ms

        self._acquire_lock = self.redis.register_script(ACQUIRE_LOCK_SCRIPT)
        self._release_lock = self.redis.register_script(RELEASE_LOCK_SCRIPT)

        self._stats_lock = Lock()
        self._hits = 0
        self._misses = 0
        self._stampedes_suppressed = 0

    def _cache_key(self, entity_id: str) -> str:
        return f"{self.prefix}{entity_id}"

    def _lock_key(self, entity_id: str) -> str:
        return f"lock:{self.prefix}{entity_id}"

    def get(
        self,
        entity_id: str,
        loader: Callable[[str], Optional[dict[str, str]]],
    ) -> tuple[Optional[dict[str, str]], bool, float]:
        """Return ``(record, hit, redis_latency_ms)`` using cache-aside semantics.

        Tries Redis first. On a miss, acquires a single-flight lock, calls
        ``loader``, writes the result back to Redis with TTL, and releases the
        lock. Concurrent callers that fail to acquire the lock briefly poll
        the cache and return whatever value the lock holder writes.
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

        return self._load_with_single_flight(entity_id, loader), False, redis_latency_ms

    def _load_with_single_flight(
        self,
        entity_id: str,
        loader: Callable[[str], Optional[dict[str, str]]],
    ) -> Optional[dict[str, str]]:
        cache_key = self._cache_key(entity_id)
        lock_key = self._lock_key(entity_id)
        token = secrets.token_hex(8)

        acquired = self._acquire_lock(
            keys=[lock_key],
            args=[token, self.lock_ttl_ms],
        )

        if acquired:
            try:
                record = loader(entity_id)
                if record is None:
                    return None
                pipe = self.redis.pipeline()
                pipe.delete(cache_key)
                pipe.hset(cache_key, mapping=record)
                pipe.expire(cache_key, self.ttl)
                pipe.execute()
                return record
            finally:
                self._release_lock(keys=[lock_key], args=[token])

        # Another caller is loading. Poll briefly for the cache to populate.
        with self._stats_lock:
            self._stampedes_suppressed += 1

        deadline = time.monotonic() + (self.lock_ttl_ms / 1000.0)
        while time.monotonic() < deadline:
            time.sleep(self.wait_poll_ms / 1000.0)
            cached = self.redis.hgetall(cache_key)
            if cached:
                return cached

        # Lock holder did not populate in time — fall through to a direct read.
        return loader(entity_id)

    def invalidate(self, entity_id: str) -> bool:
        """Delete the cached entry for ``entity_id``."""
        return self.redis.delete(self._cache_key(entity_id)) == 1

    def update_field(self, entity_id: str, field: str, value: str) -> bool:
        """Update a single field of a cached entity in place and refresh TTL.

        Only writes if the entity is already cached, so a stale partial
        record is never created.
        """
        cache_key = self._cache_key(entity_id)
        with self.redis.pipeline() as pipe:
            while True:
                try:
                    pipe.watch(cache_key)
                    if not pipe.exists(cache_key):
                        pipe.unwatch()
                        return False
                    pipe.multi()
                    pipe.hset(cache_key, field, value)
                    pipe.expire(cache_key, self.ttl)
                    pipe.execute()
                    return True
                except redis.WatchError:
                    continue

    def ttl_remaining(self, entity_id: str) -> int:
        """Return the remaining TTL on the cache key, or -2/-1 per Redis semantics."""
        return int(self.redis.ttl(self._cache_key(entity_id)))

    def stats(self) -> dict[str, int]:
        with self._stats_lock:
            total = self._hits + self._misses
            hit_rate = round(100.0 * self._hits / total, 1) if total else 0.0
            return {
                "hits": self._hits,
                "misses": self._misses,
                "stampedes_suppressed": self._stampedes_suppressed,
                "hit_rate_pct": hit_rate,
            }

    def reset_stats(self) -> None:
        with self._stats_lock:
            self._hits = 0
            self._misses = 0
            self._stampedes_suppressed = 0
