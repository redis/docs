package com.redis.semcache;

/**
 * A cache lookup that returned a cached response.
 *
 * <p>{@code distance} is the cosine distance {@code FT.SEARCH}
 * reported for the nearest cached prompt (0 = identical, 2 =
 * opposite). It is always at or below the threshold the lookup was
 * run with.
 */
public record CacheHit(
        String id,
        String prompt,
        String response,
        String tenant,
        String locale,
        String modelVersion,
        double distance,
        long ttlSeconds,
        long hitCount
) implements LookupResult {
}
