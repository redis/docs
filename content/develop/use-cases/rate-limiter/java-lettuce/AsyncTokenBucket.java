import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;

import io.lettuce.core.RedisNoScriptException;
import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.async.RedisAsyncCommands;

/**
 * Token Bucket Rate Limiter using Lettuce asynchronous commands.
 */
public class AsyncTokenBucket {

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
    private final RedisAsyncCommands<String, String> commands;
    private volatile String scriptSha;
    private volatile boolean scriptLoaded;

    /**
     * Creates a new token bucket rate limiter.
     *
     * @param capacity       maximum number of tokens in the bucket
     * @param refillRate     number of tokens added per refill interval
     * @param refillInterval time in seconds between refills
     * @param commands       Lettuce asynchronous Redis commands
     */
    public AsyncTokenBucket(int capacity, double refillRate, double refillInterval,
                            RedisAsyncCommands<String, String> commands) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.refillInterval = refillInterval;
        this.commands = commands;
        this.scriptSha = sha1Hex(TOKEN_BUCKET_SCRIPT);
        this.scriptLoaded = false;
    }

    /**
     * Checks if a request should be allowed for the given key.
     *
     * @param key the rate limit key
     * @return a future that resolves to the rate limit decision and remaining tokens
     */
    public CompletableFuture<RateLimitResult> allow(String key) {
        String[] keys = new String[]{key};
        String[] args = buildArgs();
        CompletableFuture<RateLimitResult> result = new CompletableFuture<>();

        ensureScriptLoaded().whenComplete((ignored, loadError) -> {
            if (loadError != null) {
                result.completeExceptionally(unwrap(loadError));
                return;
            }

            commands.<List<?>>evalsha(scriptSha, ScriptOutputType.MULTI, keys, args)
                    .whenComplete((evalResult, evalError) -> {
                        if (evalError == null) {
                            result.complete(parseResult(evalResult));
                            return;
                        }

                        Throwable cause = unwrap(evalError);
                        if (cause instanceof RedisNoScriptException) {
                            scriptLoaded = false;
                            commands.<List<?>>eval(TOKEN_BUCKET_SCRIPT, ScriptOutputType.MULTI, keys, args)
                                    .whenComplete((fallbackResult, fallbackError) -> {
                                        if (fallbackError == null) {
                                            result.complete(parseResult(fallbackResult));
                                        } else {
                                            result.completeExceptionally(unwrap(fallbackError));
                                        }
                                    });
                            return;
                        }

                        result.completeExceptionally(cause);
                    });
        });

        return result;
    }

    /** Ensures the Lua script is loaded into Redis. */
    private CompletableFuture<String> ensureScriptLoaded() {
        if (scriptLoaded) {
            return CompletableFuture.completedFuture(scriptSha);
        }

        return commands.scriptLoad(TOKEN_BUCKET_SCRIPT)
                .toCompletableFuture()
                .thenApply(sha -> {
                    scriptSha = sha;
                    scriptLoaded = true;
                    return sha;
                });
    }

    private String[] buildArgs() {
        return new String[]{
                String.valueOf(capacity),
                String.valueOf(refillRate),
                String.valueOf(refillInterval),
                String.valueOf(System.currentTimeMillis() / 1000.0)
        };
    }

    private static RateLimitResult parseResult(List<?> result) {
        boolean allowed = ((Number) result.get(0)).longValue() == 1L;
        double remaining = ((Number) result.get(1)).doubleValue();
        return new RateLimitResult(allowed, remaining);
    }

    private static Throwable unwrap(Throwable throwable) {
        if (throwable instanceof CompletionException && throwable.getCause() != null) {
            return throwable.getCause();
        }
        return throwable;
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
