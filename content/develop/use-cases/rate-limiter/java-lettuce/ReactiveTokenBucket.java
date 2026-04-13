import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

import io.lettuce.core.RedisNoScriptException;
import io.lettuce.core.ScriptOutputType;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import reactor.core.publisher.Mono;

/**
 * Token Bucket Rate Limiter using Lettuce reactive commands.
 */
public class ReactiveTokenBucket {

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
    private final RedisReactiveCommands<String, String> commands;
    private volatile String scriptSha;
    private volatile boolean scriptLoaded;

    /**
     * Creates a new token bucket rate limiter.
     *
     * @param capacity       maximum number of tokens in the bucket
     * @param refillRate     number of tokens added per refill interval
     * @param refillInterval time in seconds between refills
     * @param commands       Lettuce reactive Redis commands
     */
    public ReactiveTokenBucket(int capacity, double refillRate, double refillInterval,
                               RedisReactiveCommands<String, String> commands) {
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
     * @return a Mono that emits the rate limit decision and remaining tokens
     */
    public Mono<RateLimitResult> allow(String key) {
        String[] keys = new String[]{key};
        String[] args = buildArgs();

        return ensureScriptLoaded()
                .then(commands.evalsha(
                        scriptSha,
                        ScriptOutputType.MULTI,
                        keys,
                        args
                ).collectList())
                .map(ReactiveTokenBucket::parseResult)
                .onErrorResume(throwable -> {
                    Throwable cause = unwrap(throwable);
                    if (cause instanceof RedisNoScriptException) {
                        scriptLoaded = false;
                        return commands.eval(
                                TOKEN_BUCKET_SCRIPT,
                                ScriptOutputType.MULTI,
                                keys,
                                args
                        ).collectList().map(ReactiveTokenBucket::parseResult);
                    }
                    return Mono.error(cause);
                });
    }

    /** Ensures the Lua script is loaded into Redis. */
    private Mono<String> ensureScriptLoaded() {
        if (scriptLoaded) {
            return Mono.just(scriptSha);
        }

        return commands.scriptLoad(TOKEN_BUCKET_SCRIPT)
                .doOnNext(sha -> {
                    scriptSha = sha;
                    scriptLoaded = true;
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
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
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
