import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import io.lettuce.core.RedisNoScriptException;
import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.sync.RedisCommands;

/**
 * Token Bucket Rate Limiter
 *
 * <p>A Redis-based token bucket rate limiter implementation using Lua scripts
 * for atomic operations with the Lettuce client.</p>
 *
 * <p>The token bucket algorithm allows requests at a controlled rate by maintaining
 * a bucket of tokens that refills over time. Each request consumes a token, and
 * requests are denied when the bucket is empty.</p>
 *
 * <p>Example usage:</p>
 * <pre>{@code
 * RedisClient client = RedisClient.create("redis://localhost:6379");
 * StatefulRedisConnection<String, String> connection = client.connect();
 * RedisCommands<String, String> commands = connection.sync();
 * TokenBucket limiter = new TokenBucket(10, 1.0, 1.0, commands);
 * RateLimitResult result = limiter.allow("user:123");
 * if (result.allowed()) {
 *     System.out.println("Request allowed. " + result.remaining() + " tokens remaining.");
 * } else {
 *     System.out.println("Request denied. Rate limit exceeded.");
 * }
 * }</pre>
 */
public class TokenBucket {

    /**
     * Result of a rate limit check.
     *
     * @param allowed   whether the request is allowed
     * @param remaining number of tokens remaining in the bucket
     */
    public record RateLimitResult(boolean allowed, double remaining) {}

    /** Lua script for atomic token bucket operations. */
    private static final String TOKEN_BUCKET_SCRIPT = """
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local refill_interval = tonumber(ARGV[3])
            local now = tonumber(ARGV[4])

            -- Get current state or initialize
            local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
            local tokens = tonumber(bucket[1])
            local last_refill = tonumber(bucket[2])

            -- Initialize if this is the first request
            if tokens == nil then
                tokens = capacity
                last_refill = now
            end

            -- Calculate token refill
            local time_passed = now - last_refill
            local refills = math.floor(time_passed / refill_interval)

            if refills > 0 then
                tokens = math.min(capacity, tokens + (refills * refill_rate))
                last_refill = last_refill + (refills * refill_interval)
            end

            -- Try to consume a token
            local allowed = 0
            if tokens >= 1 then
                tokens = tokens - 1
                allowed = 1
            end

            -- Update state
            redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)

            -- Return result: allowed (1 or 0) and remaining tokens
            return {allowed, tokens}
            """;

    private final int capacity;
    private final double refillRate;
    private final double refillInterval;
    private final RedisCommands<String, String> commands;
    private String scriptSha;
    private boolean scriptLoaded;

    /**
     * Creates a new token bucket rate limiter.
     *
     * @param capacity       maximum number of tokens in the bucket (default: 10)
     * @param refillRate     number of tokens added per refill interval (default: 1.0)
     * @param refillInterval time in seconds between refills (default: 1.0)
     * @param commands       Lettuce synchronous Redis commands
     */
    public TokenBucket(int capacity, double refillRate, double refillInterval,
                       RedisCommands<String, String> commands) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.refillInterval = refillInterval;
        this.commands = commands;
        this.scriptSha = sha1Hex(TOKEN_BUCKET_SCRIPT);
        this.scriptLoaded = false;
    }

    /**
     * Creates a token bucket with default parameters (capacity=10, refillRate=1.0, refillInterval=1.0).
     *
     * @param commands Lettuce synchronous Redis commands
     */
    public TokenBucket(RedisCommands<String, String> commands) {
        this(10, 1.0, 1.0, commands);
    }

    /**
     * Checks if a request should be allowed for the given key.
     *
     * <p>Each call attempts to consume one token from the bucket identified by
     * the key. If tokens are available the request is allowed; otherwise it is denied.</p>
     *
     * @param key the rate limit key (e.g., "user:123", "api:endpoint:xyz")
     * @return a {@link RateLimitResult} with the allowed status and remaining tokens
     */
    @SuppressWarnings("unchecked")
    public RateLimitResult allow(String key) {
        ensureScriptLoaded();

        double now = System.currentTimeMillis() / 1000.0;
        String[] keys = new String[]{key};
        String[] args = new String[]{
                String.valueOf(capacity),
                String.valueOf(refillRate),
                String.valueOf(refillInterval),
                String.valueOf(now)
        };

        java.util.List<Long> result;
        try {
            // Try EVALSHA first (faster if script is cached)
            result = commands.evalsha(scriptSha, ScriptOutputType.MULTI, keys, args);
        } catch (RedisNoScriptException e) {
            // Script not in cache, fall back to EVAL and reload
            result = commands.eval(TOKEN_BUCKET_SCRIPT, ScriptOutputType.MULTI, keys, args);
            scriptLoaded = false;
        }

        boolean allowed = (Long) result.get(0) == 1L;
        double remaining = ((Long) result.get(1)).doubleValue();
        return new RateLimitResult(allowed, remaining);
    }

    /** Ensures the Lua script is loaded into Redis. */
    private void ensureScriptLoaded() {
        if (!scriptLoaded) {
            scriptSha = commands.scriptLoad(TOKEN_BUCKET_SCRIPT);
            scriptLoaded = true;
        }
    }

    /** Computes the SHA-1 hex digest of the given text. */
    private static String sha1Hex(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(40);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-1 not available", e);
        }
    }
}

