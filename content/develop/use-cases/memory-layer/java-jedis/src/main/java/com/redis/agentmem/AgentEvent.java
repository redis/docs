package com.redis.agentmem;

/**
 * One entry from the per-thread event Stream.
 *
 * <p>{@code eventId} is the {@code XADD}-assigned stream id (e.g.
 * {@code 1715990400123-0}); {@code ts} is the wall-clock time the
 * action happened, stored as a Redis Stream field rather than
 * inferred from the stream id because the demo timestamps the action
 * on the agent side.
 */
public record AgentEvent(
        String eventId,
        String threadId,
        String action,
        String detail,
        double ts) {
}
