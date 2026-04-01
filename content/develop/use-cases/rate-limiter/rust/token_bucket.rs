//! Token Bucket Rate Limiter
//!
//! A Redis-based token bucket rate limiter implementation using Lua scripts
//! for atomic operations.
//!
//! The token bucket algorithm allows requests at a controlled rate by maintaining
//! a bucket of tokens that refills over time. Each request consumes a token, and
//! requests are denied when the bucket is empty.

use redis::{RedisResult, Script};
use std::time::{SystemTime, UNIX_EPOCH};

/// Lua script for atomic token bucket operations
const TOKEN_BUCKET_SCRIPT: &str = r#"
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
"#;

/// Result of a rate limit check
#[derive(Debug, Clone, PartialEq)]
pub struct RateLimitResult {
    /// Whether the request is allowed
    pub allowed: bool,
    /// Number of tokens remaining in the bucket
    pub remaining: f64,
}

/// Token bucket rate limiter using Redis for distributed rate limiting.
///
/// The token bucket maintains a fixed capacity of tokens that refill at a
/// constant rate. Each request consumes one token. When the bucket is empty,
/// requests are denied until tokens refill.
///
/// # Example
///
/// ```no_run
/// use redis::Client;
/// # use token_bucket::{TokenBucket, RateLimitResult};
///
/// let client = Client::open("redis://localhost:6379")?;
/// let mut con = client.get_connection()?;
///
/// let limiter = TokenBucket::new(10, 1.0, 1.0);
/// let result = limiter.allow(&mut con, "user:123")?;
///
/// if result.allowed {
///     println!("Request allowed. {} tokens remaining.", result.remaining);
/// } else {
///     println!("Request denied. Rate limit exceeded.");
/// }
/// # Ok::<(), redis::RedisError>(())
/// ```
pub struct TokenBucket {
    capacity: i64,
    refill_rate: f64,
    refill_interval: f64,
    script: Script,
}

impl TokenBucket {
    /// Create a new token bucket rate limiter.
    ///
    /// # Arguments
    ///
    /// * `capacity` - Maximum number of tokens in the bucket
    /// * `refill_rate` - Number of tokens added per refill interval
    /// * `refill_interval` - Time in seconds between refills
    ///
    /// # Example
    ///
    /// ```
    /// # use token_bucket::TokenBucket;
    /// let limiter = TokenBucket::new(10, 1.0, 1.0);
    /// ```
    pub fn new(capacity: i64, refill_rate: f64, refill_interval: f64) -> Self {
        Self {
            capacity,
            refill_rate,
            refill_interval,
            script: Script::new(TOKEN_BUCKET_SCRIPT),
        }
    }

    /// Check if a request should be allowed for the given key.
    ///
    /// This method uses EVALSHA with automatic fallback to EVAL if the script
    /// is not cached on the server.
    ///
    /// # Arguments
    ///
    /// * `con` - Redis connection
    /// * `key` - The rate limit key (e.g., "user:123", "api:endpoint:xyz")
    ///
    /// # Returns
    ///
    /// A `RateLimitResult` containing:
    /// - `allowed`: true if the request is allowed, false otherwise
    /// - `remaining`: number of tokens remaining in the bucket
    ///
    /// # Example
    ///
    /// ```no_run
    /// # use redis::Client;
    /// # use token_bucket::{TokenBucket, RateLimitResult};
    /// # let client = Client::open("redis://localhost:6379")?;
    /// # let mut con = client.get_connection()?;
    /// # let limiter = TokenBucket::new(10, 1.0, 1.0);
    /// let result = limiter.allow(&mut con, "user:123")?;
    /// println!("Allowed: {}, Remaining: {}", result.allowed, result.remaining);
    /// # Ok::<(), redis::RedisError>(())
    /// ```
    pub fn allow(
        &self,
        con: &mut dyn redis::ConnectionLike,
        key: &str,
    ) -> RedisResult<RateLimitResult> {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("Time went backwards")
            .as_secs_f64();

        let result: Vec<redis::Value> = self
            .script
            .key(key)
            .arg(self.capacity)
            .arg(self.refill_rate)
            .arg(self.refill_interval)
            .arg(now)
            .invoke(con)?;

        let allowed = match result.first() {
            Some(redis::Value::Int(v)) => *v == 1,
            _ => false,
        };

        let remaining = match result.get(1) {
            Some(redis::Value::Int(v)) => *v as f64,
            Some(redis::Value::Data(v)) => {
                String::from_utf8_lossy(v).parse::<f64>().unwrap_or(0.0)
            }
            _ => 0.0,
        };

        Ok(RateLimitResult { allowed, remaining })
    }
}

