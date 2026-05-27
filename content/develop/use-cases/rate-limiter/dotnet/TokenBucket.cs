using System;
using System.Security.Cryptography;
using System.Text;
using StackExchange.Redis;

namespace RateLimiter
{
    /// <summary>
    /// Result of a rate limit check.
    /// </summary>
    /// <param name="Allowed">Whether the request is allowed.</param>
    /// <param name="Remaining">Number of tokens remaining in the bucket.</param>
    public record RateLimitResult(bool Allowed, double Remaining);

    /// <summary>
    /// Token bucket rate limiter using Redis for distributed rate limiting.
    ///
    /// The token bucket maintains a fixed capacity of tokens that refill at a
    /// constant rate. Each request consumes one token. When the bucket is empty,
    /// requests are denied until tokens refill.
    /// </summary>
    /// <example>
    /// <code>
    /// var muxer = ConnectionMultiplexer.Connect("localhost:6379");
    /// var db = muxer.GetDatabase();
    /// var limiter = new TokenBucket(capacity: 10, refillRate: 1, refillInterval: 1.0, db: db);
    /// var result = limiter.Allow("user:123");
    /// if (result.Allowed)
    ///     Console.WriteLine($"Request allowed. {result.Remaining} tokens remaining.");
    /// else
    ///     Console.WriteLine("Request denied. Rate limit exceeded.");
    /// </code>
    /// </example>
    public class TokenBucket
    {
        /// <summary>
        /// Lua script for atomic token bucket operations.
        /// All language implementations use this exact script for behavioral consistency.
        /// </summary>
        private const string TokenBucketScript = @"
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
";

        private readonly int _capacity;
        private readonly double _refillRate;
        private readonly double _refillInterval;
        private readonly IDatabase _db;
        private byte[]? _scriptHash;
        private bool _scriptLoaded;

        /// <summary>
        /// Initializes a new instance of the <see cref="TokenBucket"/> class.
        /// </summary>
        /// <param name="capacity">Maximum number of tokens in the bucket (default: 10).</param>
        /// <param name="refillRate">Number of tokens added per refill interval (default: 1).</param>
        /// <param name="refillInterval">Time in seconds between refills (default: 1.0).</param>
        /// <param name="db">Redis database instance.</param>
        public TokenBucket(
            int capacity = 10,
            double refillRate = 1.0,
            double refillInterval = 1.0,
            IDatabase? db = null)
        {
            _capacity = capacity;
            _refillRate = refillRate;
            _refillInterval = refillInterval;
            _db = db ?? ConnectionMultiplexer.Connect("localhost:6379").GetDatabase();

            // Calculate SHA1 of the script for EVALSHA
            _scriptHash = SHA1.HashData(Encoding.UTF8.GetBytes(TokenBucketScript));
            _scriptLoaded = false;
        }

        /// <summary>
        /// Checks if a request should be allowed for the given key.
        /// </summary>
        /// <param name="key">The rate limit key (e.g., "user:123", "api:endpoint:xyz").</param>
        /// <returns>
        /// A <see cref="RateLimitResult"/> containing whether the request is allowed
        /// and the number of tokens remaining in the bucket.
        /// </returns>
        public RateLimitResult Allow(string key)
        {
            EnsureScriptLoaded();

            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;

            var keys = new RedisKey[] { key };
            var args = new RedisValue[]
            {
                _capacity,
                _refillRate,
                _refillInterval,
                now
            };

            RedisResult result;

            try
            {
                // Try EVALSHA first (faster if script is cached)
                result = _db.ScriptEvaluate(_scriptHash!, keys, args);
            }
            catch (RedisServerException ex) when (ex.Message.StartsWith("NOSCRIPT"))
            {
                // Script not in cache, fall back to EVAL
                result = _db.ScriptEvaluate(TokenBucketScript, keys, args);
                _scriptLoaded = false;
            }

            var results = (RedisResult[])result!;
            var allowed = (long)results[0] == 1;
            var remaining = (double)(long)results[1];

            return new RateLimitResult(allowed, remaining);
        }

        /// <summary>
        /// Ensures the Lua script is loaded into Redis for EVALSHA usage.
        /// </summary>
        private void EnsureScriptLoaded()
        {
            if (!_scriptLoaded)
            {
                try
                {
                    var server = _db.Multiplexer.GetServers()[0];
                    _scriptHash = server.ScriptLoad(TokenBucketScript);
                    _scriptLoaded = true;
                }
                catch (RedisException)
                {
                    // If loading fails, we'll fall back to EVAL
                }
            }
        }
    }
}

