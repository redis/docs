"""
Token Bucket Rate Limiter

A Redis-based token bucket rate limiter implementation using Lua scripts
for atomic operations.

The token bucket algorithm allows requests at a controlled rate by maintaining
a bucket of tokens that refills over time. Each request consumes a token, and
requests are denied when the bucket is empty.
"""

import hashlib
import time
from typing import Optional

import redis


# Lua script for atomic token bucket operations
TOKEN_BUCKET_SCRIPT = """
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
"""


class TokenBucket:
    """
    Token bucket rate limiter using Redis for distributed rate limiting.
    
    The token bucket maintains a fixed capacity of tokens that refill at a
    constant rate. Each request consumes one token. When the bucket is empty,
    requests are denied until tokens refill.
    
    Args:
        redis_client: Redis client instance. If None, creates a default client.
        capacity: Maximum number of tokens in the bucket (default: 10)
        refill_rate: Number of tokens added per refill interval (default: 1)
        refill_interval: Time in seconds between refills (default: 1.0)
    
    Example:
        >>> import redis
        >>> r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        >>> limiter = TokenBucket(r, capacity=10, refill_rate=1, refill_interval=1.0)
        >>> allowed, remaining = limiter.allow('user:123')
        >>> if allowed:
        ...     print(f"Request allowed. {remaining} tokens remaining.")
        ... else:
        ...     print("Request denied. Rate limit exceeded.")
    """
    
    def __init__(
        self,
        redis_client: Optional[redis.Redis] = None,
        capacity: int = 10,
        refill_rate: int = 1,
        refill_interval: float = 1.0
    ):
        """Initialize the token bucket rate limiter."""
        self.redis = redis_client or redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        self.capacity = capacity
        self.refill_rate = refill_rate
        self.refill_interval = refill_interval
        
        # Calculate SHA1 of the script for EVALSHA
        self._script_sha = hashlib.sha1(
            TOKEN_BUCKET_SCRIPT.encode('utf-8')
        ).hexdigest()
        self._script_loaded = False
    
    def _ensure_script_loaded(self) -> None:
        """Ensure the Lua script is loaded into Redis."""
        if not self._script_loaded:
            try:
                # Try to load the script
                self._script_sha = self.redis.script_load(TOKEN_BUCKET_SCRIPT)
                self._script_loaded = True
            except redis.RedisError:
                # If loading fails, we'll fall back to EVAL
                pass
    
    def allow(self, key: str) -> tuple[bool, float]:
        """
        Check if a request should be allowed for the given key.
        
        Args:
            key: The rate limit key (e.g., 'user:123', 'api:endpoint:xyz')
        
        Returns:
            A tuple of (allowed, remaining_tokens):
                - allowed: True if the request is allowed, False otherwise
                - remaining_tokens: Number of tokens remaining in the bucket
        
        Example:
            >>> allowed, remaining = limiter.allow('user:123')
            >>> print(f"Allowed: {allowed}, Remaining: {remaining}")
        """
        self._ensure_script_loaded()
        
        now = time.time()
        
        try:
            # Try EVALSHA first (faster if script is cached)
            result = self.redis.evalsha(
                self._script_sha,
                1,
                key,
                self.capacity,
                self.refill_rate,
                self.refill_interval,
                now
            )
        except redis.exceptions.NoScriptError:
            # Script not in cache, use EVAL and reload
            result = self.redis.eval(
                TOKEN_BUCKET_SCRIPT,
                1,
                key,
                self.capacity,
                self.refill_rate,
                self.refill_interval,
                now
            )
            self._script_loaded = False
        
        allowed = bool(result[0])
        remaining = float(result[1])
        
        return allowed, remaining

