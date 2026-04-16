<?php

/**
 * Token Bucket Rate Limiter
 *
 * A Redis-based token bucket rate limiter implementation using Lua scripts
 * for atomic operations.
 *
 * The token bucket algorithm allows requests at a controlled rate by maintaining
 * a bucket of tokens that refills over time. Each request consumes a token, and
 * requests are denied when the bucket is empty.
 *
 * Requires: predis/predis
 */

use Predis\Client as PredisClient;

/**
 * Token bucket rate limiter using Redis for distributed rate limiting.
 *
 * The token bucket maintains a fixed capacity of tokens that refill at a
 * constant rate. Each request consumes one token. When the bucket is empty,
 * requests are denied until tokens refill.
 *
 * Example:
 *     $redis = new Predis\Client(['host' => '127.0.0.1', 'port' => 6379]);
 *     $limiter = new TokenBucket(10, 1, 1.0, $redis);
 *     $result = $limiter->allow('user:123');
 *     if ($result['allowed']) {
 *         echo "Request allowed. {$result['remaining']} tokens remaining.";
 *     } else {
 *         echo "Request denied. Rate limit exceeded.";
 *     }
 */
class TokenBucket
{
    /** @var string Lua script for atomic token bucket operations */
    private const LUA_SCRIPT = <<<'LUA'
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
LUA;

    /** @var PredisClient */
    private $redis;

    /** @var int */
    private $capacity;

    /** @var float */
    private $refillRate;

    /** @var float */
    private $refillInterval;

    /** @var string */
    private $scriptSha;

    /** @var bool */
    private $scriptLoaded = false;

    /**
     * Initialize the token bucket rate limiter.
     *
     * @param int          $capacity       Maximum number of tokens in the bucket (default: 10)
     * @param float        $refillRate     Number of tokens added per refill interval (default: 1.0)
     * @param float        $refillInterval Time in seconds between refills (default: 1.0)
     * @param PredisClient|null $redis     Predis client instance. If null, creates a default client.
     */
    public function __construct(
        int $capacity = 10,
        float $refillRate = 1.0,
        float $refillInterval = 1.0,
        ?PredisClient $redis = null
    ) {
        $this->capacity = $capacity;
        $this->refillRate = $refillRate;
        $this->refillInterval = $refillInterval;
        $this->redis = $redis ?? new PredisClient([
            'host' => '127.0.0.1',
            'port' => 6379,
        ]);
        $this->scriptSha = sha1(self::LUA_SCRIPT);
    }

    /**
     * Ensure the Lua script is loaded into Redis.
     *
     * @return void
     */
    private function ensureScriptLoaded(): void
    {
        if (!$this->scriptLoaded) {
            try {
                $this->scriptSha = $this->redis->script('LOAD', self::LUA_SCRIPT);
                $this->scriptLoaded = true;
            } catch (\Exception $e) {
                // If loading fails, we'll fall back to EVAL
            }
        }
    }

    /**
     * Check if a request should be allowed for the given key.
     *
     * @param string $key The rate limit key (e.g., 'user:123', 'api:endpoint:xyz')
     *
     * @return array{allowed: bool, remaining: float} An associative array with:
     *     - 'allowed': true if the request is allowed, false otherwise
     *     - 'remaining': number of tokens remaining in the bucket
     *
     * Example:
     *     $result = $limiter->allow('user:123');
     *     echo "Allowed: " . ($result['allowed'] ? 'yes' : 'no');
     *     echo "Remaining: {$result['remaining']}";
     */
    public function allow(string $key): array
    {
        $this->ensureScriptLoaded();

        $now = microtime(true);
        $args = [
            $this->capacity,
            $this->refillRate,
            $this->refillInterval,
            $now,
        ];

        try {
            // Try EVALSHA first (faster if script is cached)
            $result = $this->redis->evalsha($this->scriptSha, 1, $key, ...$args);
        } catch (\Exception $e) {
            // Script not in cache, use EVAL and reload
            $result = $this->redis->eval(self::LUA_SCRIPT, 1, $key, ...$args);
            $this->scriptLoaded = false;
        }

        return [
            'allowed' => (bool) $result[0],
            'remaining' => (float) $result[1],
        ];
    }
}

