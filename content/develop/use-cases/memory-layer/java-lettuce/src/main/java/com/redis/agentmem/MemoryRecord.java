package com.redis.agentmem;

/**
 * A single long-term memory document.
 *
 * <p>{@code distance} is set only when the record comes back from a
 * KNN query; {@code ttlSeconds} is {@code null} for memories with no
 * TTL (e.g. {@code kind=semantic} under the default tier map).
 */
public record MemoryRecord(
        String id,
        String user,
        String namespace,
        String kind,
        String sourceThread,
        String text,
        double createdTs,
        long hitCount,
        Double distance,
        Long ttlSeconds) {
}
