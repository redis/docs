package com.redis.semcache;

/**
 * A cache lookup that did not return a usable response.
 *
 * <p>{@code nearestDistance} is the cosine distance to the closest
 * cached prompt that <em>did</em> match the metadata filters. Both
 * fields are {@code null} when the cache had no entry in scope at
 * all, which is what the demo UI shows as &quot;no candidate&quot;
 * vs. &quot;candidate too far&quot;.
 */
public record CacheMiss(
        Double nearestDistance,
        String nearestId
) implements LookupResult {
}
