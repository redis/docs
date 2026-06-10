package com.redis.agentmem;

import java.util.List;

/**
 * The full per-thread working-memory state.
 *
 * <p>{@code recentTurns} is bounded by {@code AgentSession.maxTurns()};
 * the hash itself never grows in size or field count as the
 * conversation goes on.
 */
public record SessionState(
        String threadId,
        String user,
        String agent,
        String goal,
        String scratchpad,
        long turnCount,
        double createdTs,
        double lastActiveTs,
        List<SessionTurn> recentTurns,
        long ttlSeconds) {
}
