---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in Ruby
linkTitle: Ruby rate limiter
title: Token bucket rate limiter with Redis and Ruby
weight: 7
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in Ruby with the [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the Ruby implementation using the [`redis-rb`]({{< relref "/develop/clients/ruby" >}}) gem.

## How it works

The token bucket algorithm works like a bucket that holds tokens:

1. **Initialization**: The bucket starts with a maximum capacity of tokens
2. **Refill**: Tokens are added to the bucket at a constant rate (for example, 1 token per second)
3. **Consumption**: Each request consumes one token from the bucket
4. **Decision**: If tokens are available, the request is allowed; otherwise, it's denied
5. **Capacity limit**: The bucket never exceeds its maximum capacity

This approach allows for burst traffic (using accumulated tokens) while enforcing an average rate limit over time.

### Why use Redis?

Redis is ideal for distributed rate limiting because:

* **Atomic operations**: Lua scripts execute atomically, preventing race conditions
* **Shared state**: Multiple application servers can share the same rate limit counters
* **High performance**: In-memory operations provide microsecond latency
* **Automatic expiration**: Keys can be set to expire automatically (though not used in this implementation)

## The Lua script

The core of this implementation is a Lua script that runs atomically on the Redis server. This ensures that checking and updating the token bucket happens in a single operation, preventing race conditions in distributed environments.

Here's how the script works:

```lua
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
```

### Script breakdown

1. **State retrieval**: Uses [`HMGET`]({{< relref "/commands/hmget" >}}) to fetch the current token count and last refill time from a hash
2. **Initialization**: On first use, sets tokens to full capacity
3. **Token refill calculation**: Computes how many tokens should be added based on elapsed time
4. **Capacity enforcement**: Uses `math.min()` to ensure tokens never exceed capacity
5. **Token consumption**: Decrements the token count if available
6. **State update**: Uses [`HMSET`]({{< relref "/commands/hmset" >}}) to save the new state
7. **Return value**: Returns both the decision (allowed/denied) and remaining tokens

### Why atomicity matters

Without atomic execution, race conditions could occur:

* **Double spending**: Two requests could read the same token count and both succeed when only one should
* **Lost updates**: Concurrent updates could overwrite each other's changes
* **Inconsistent state**: Token count and refill time could become desynchronized

Using [`EVAL`]({{< relref "/commands/eval" >}}) or [`EVALSHA`]({{< relref "/commands/evalsha" >}}) ensures the entire operation executes atomically, making it safe for distributed systems.

## Installation

Install the `redis` gem:

```bash
gem install redis
```

Or add it to your `Gemfile`:

```ruby
gem 'redis', '~> 5.0'
```

Then run:

```bash
bundle install
```

## Using the Ruby module

The `TokenBucket` class provides a simple interface for rate limiting
([source](token_bucket.rb)):

```ruby
require 'redis'
require_relative 'token_bucket'

# Create a Redis connection
redis = Redis.new(host: 'localhost', port: 6379)

# Create a rate limiter: 10 requests per second
limiter = TokenBucket.new(
  redis: redis,
  capacity: 10,          # Maximum burst size
  refill_rate: 1,        # Add 1 token per interval
  refill_interval: 1.0   # Every 1 second
)

# Check if a request should be allowed
result = limiter.allow('user:123')

if result[:allowed]
  puts "Request allowed. #{result[:remaining]} tokens remaining."
  # Process the request
else
  puts 'Request denied. Rate limit exceeded.'
  # Return 429 Too Many Requests
end
```

Ruby's keyword arguments make the constructor parameters self-documenting, and the `allow` method returns a Hash with `:allowed` and `:remaining` keys.

### Configuration parameters

* **capacity**: Maximum number of tokens in the bucket (controls burst size)
* **refill_rate**: Number of tokens added per refill interval
* **refill_interval**: Time in seconds between refills

For example:
* `capacity: 10, refill_rate: 1, refill_interval: 1.0` allows 10 requests per second with bursts up to 10
* `capacity: 100, refill_rate: 10, refill_interval: 1.0` allows 10 requests per second with bursts up to 100
* `capacity: 60, refill_rate: 1, refill_interval: 60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{user_id}` - Limit each user independently
* **Per IP address**: `ip:{ip_address}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{user_id}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The Ruby implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the module automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script.

```ruby
# The module handles script caching automatically.
# First call loads the script, subsequent calls use EVALSHA.
result1 = limiter.allow('user:123') # Uses EVAL + caches
result2 = limiter.allow('user:123') # Uses EVALSHA (faster)
```

## Running the demo

A demonstration web server is included to show the rate limiter in action
([source](demo_server.rb)):

```bash
# Install dependencies
gem install redis webrick

# Run the demo server
ruby demo_server.rb
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host HOST` and `--redis-port PORT` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers:

```ruby
result = limiter.allow("user:#{user_id}")

# Add standard rate limit headers
response['X-RateLimit-Limit'] = limiter.capacity.to_s
response['X-RateLimit-Remaining'] = result[:remaining].to_i.to_s
response['X-RateLimit-Reset'] = (Time.now.to_i + limiter.refill_interval).to_s

unless result[:allowed]
  response.status = 429 # Too Many Requests
  response['Retry-After'] = limiter.refill_interval.ceil.to_s
end
```

## Customization

### Using with Rack middleware

You can wrap the rate limiter as Rack middleware for easy integration with any Rack-based framework (Rails, Sinatra, Hanami):

```ruby
class RateLimitMiddleware
  def initialize(app, limiter:, key_proc:)
    @app = app
    @limiter = limiter
    @key_proc = key_proc
  end

  def call(env)
    key = @key_proc.call(env)
    result = @limiter.allow(key)

    if result[:allowed]
      status, headers, body = @app.call(env)
      headers['X-RateLimit-Remaining'] = result[:remaining].to_i.to_s
      [status, headers, body]
    else
      [429, { 'Content-Type' => 'application/json', 'Retry-After' => @limiter.refill_interval.ceil.to_s },
       ['{"error":"Rate limit exceeded"}']]
    end
  end
end

# Apply per-IP rate limiting
use RateLimitMiddleware, limiter: limiter, key_proc: ->(env) { "ip:#{env['REMOTE_ADDR']}" }
```

### Error handling

The `allow` method may raise an error if the Redis connection is lost. Wrap calls in a `begin/rescue` block for production use:

```ruby
begin
  result = limiter.allow('user:123')
  # Handle result
rescue Redis::BaseError => e
  puts "Rate limiter error: #{e.message}"
  # Fail open or closed depending on your policy
end
```

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [Ruby client]({{< relref "/develop/clients/ruby" >}}) - Redis Ruby client documentation

