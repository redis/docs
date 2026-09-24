package com.redis.agentmem;

/**
 * One turn inside the rolling session window.
 *
 * <p>Stored as part of a JSON array on the
 * {@code agent:session:{threadId}} hash; the embedder helper does not
 * see this directly.
 */
public record SessionTurn(String role, String content, double ts) {
}
