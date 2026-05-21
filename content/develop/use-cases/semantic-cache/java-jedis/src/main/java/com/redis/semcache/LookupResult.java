package com.redis.semcache;

/**
 * Sealed result of a cache lookup. Pattern-matched in the demo
 * server to branch between the hit and miss paths; mirrors the
 * {@code CacheHit | CacheMiss} union the Python and Node ports
 * return.
 */
public sealed interface LookupResult permits CacheHit, CacheMiss {
}
