package com.redis.agentmem;

/**
 * Outcome of a {@link LongTermMemory#remember} call.
 *
 * <p>{@code deduped} is {@code true} when the write skipped because a
 * similar memory already existed; {@code id} is then the existing
 * memory's id. {@code existingDistance} is the cosine distance to
 * that nearest memory regardless of which branch was taken — useful
 * for tracing.
 */
public record WriteResult(String id, boolean deduped, Double existingDistance) {
}
