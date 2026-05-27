// Package ratelimiter provides a Redis-based token bucket rate limiter.
//
// The token bucket algorithm allows requests at a controlled rate by maintaining
// a bucket of tokens that refills over time. Each request consumes a token, and
// requests are denied when the bucket is empty.
//
// This implementation uses a Lua script executed atomically in Redis to ensure
// correct behavior under concurrent access.
package ratelimiter

import (
	"context"
	"crypto/sha1"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// tokenBucketScript is the canonical Lua script for atomic token bucket operations.
// All language implementations use this exact script for behavioral consistency.
const tokenBucketScript = `
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
`

// TokenBucketConfig holds the configuration for a TokenBucket rate limiter.
type TokenBucketConfig struct {
	// Capacity is the maximum number of tokens in the bucket.
	// Default: 10
	Capacity int

	// RefillRate is the number of tokens added per refill interval.
	// Default: 1
	RefillRate float64

	// RefillInterval is the time between refills.
	// Default: 1 second
	RefillInterval time.Duration

	// Client is the Redis client to use. Required.
	Client *redis.Client
}

// TokenBucket is a Redis-based token bucket rate limiter.
//
// It maintains a fixed capacity of tokens that refill at a constant rate.
// Each request consumes one token. When the bucket is empty, requests are
// denied until tokens refill.
//
// Example:
//
//	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})
//	limiter := ratelimiter.NewTokenBucket(ratelimiter.TokenBucketConfig{
//	    Capacity:       10,
//	    RefillRate:     1,
//	    RefillInterval: time.Second,
//	    Client:         rdb,
//	})
//	allowed, remaining, err := limiter.Allow(ctx, "user:123")
//	if allowed {
//	    fmt.Printf("Request allowed. %.0f tokens remaining.\n", remaining)
//	} else {
//	    fmt.Println("Request denied. Rate limit exceeded.")
//	}
type TokenBucket struct {
	client         *redis.Client
	capacity       int
	refillRate     float64
	refillInterval float64 // in seconds
	scriptSHA      string
	scriptLoaded   bool
}

// NewTokenBucket creates a new TokenBucket rate limiter with the given configuration.
//
// Default values are applied for zero-value fields:
//   - Capacity: 10
//   - RefillRate: 1.0
//   - RefillInterval: 1 second
//
// The Client field is required and must not be nil.
func NewTokenBucket(cfg TokenBucketConfig) *TokenBucket {
	if cfg.Capacity == 0 {
		cfg.Capacity = 10
	}
	if cfg.RefillRate == 0 {
		cfg.RefillRate = 1.0
	}
	if cfg.RefillInterval == 0 {
		cfg.RefillInterval = time.Second
	}

	h := sha1.New()
	h.Write([]byte(tokenBucketScript))
	sha := fmt.Sprintf("%x", h.Sum(nil))

	return &TokenBucket{
		client:         cfg.Client,
		capacity:       cfg.Capacity,
		refillRate:     cfg.RefillRate,
		refillInterval: cfg.RefillInterval.Seconds(),
		scriptSHA:      sha,
	}
}

// ensureScriptLoaded loads the Lua script into Redis if it hasn't been loaded yet.
func (tb *TokenBucket) ensureScriptLoaded(ctx context.Context) {
	if !tb.scriptLoaded {
		sha, err := tb.client.ScriptLoad(ctx, tokenBucketScript).Result()
		if err == nil {
			tb.scriptSHA = sha
			tb.scriptLoaded = true
		}
	}
}

// Allow checks if a request should be allowed for the given key.
//
// It atomically checks and updates the token bucket state in Redis.
// Returns whether the request is allowed, the number of remaining tokens,
// and any error encountered.
//
// Example:
//
//	allowed, remaining, err := limiter.Allow(ctx, "user:123")
//	if err != nil {
//	    log.Printf("Rate limiter error: %v", err)
//	    // Fail open or closed depending on your policy
//	}
func (tb *TokenBucket) Allow(ctx context.Context, key string) (bool, float64, error) {
	tb.ensureScriptLoaded(ctx)

	now := float64(time.Now().UnixMicro()) / 1e6

	args := []interface{}{
		tb.capacity,
		tb.refillRate,
		tb.refillInterval,
		now,
	}

	// Try EVALSHA first (faster if script is cached)
	result, err := tb.client.EvalSha(ctx, tb.scriptSHA, []string{key}, args...).Int64Slice()
	if err != nil {
		// Script not in cache, fall back to EVAL
		result, err = tb.client.Eval(ctx, tokenBucketScript, []string{key}, args...).Int64Slice()
		if err != nil {
			return false, 0, fmt.Errorf("token bucket eval failed: %w", err)
		}
		tb.scriptLoaded = false
	}

	allowed := result[0] == 1
	remaining := float64(result[1])

	return allowed, remaining, nil
}
