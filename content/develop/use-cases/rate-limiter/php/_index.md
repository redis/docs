---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
description: Implement a token bucket rate limiter using Redis and Lua scripts in PHP
linkTitle: PHP rate limiter
title: Token bucket rate limiter with Redis and PHP
weight: 6
---

This guide shows you how to implement a distributed token bucket rate limiter using Redis and Lua scripts in PHP with the [Predis]({{< relref "/develop/clients/php" >}}) client library.

## Overview

Rate limiting is a critical technique for controlling the rate at which operations are performed. Common use cases include:

* Limiting API requests per user or IP address
* Preventing abuse and protecting against denial-of-service attacks
* Ensuring fair resource allocation across multiple clients
* Throttling background jobs or batch operations

The **token bucket algorithm** is a popular rate limiting approach that allows bursts of traffic while maintaining an average rate limit over time. This guide covers the PHP implementation using the [Predis]({{< relref "/develop/clients/php" >}}) client library, taking advantage of PHP's associative arrays and Composer-based dependency management.

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

Install the Predis client library using Composer:

```bash
composer require predis/predis
```

## Using the PHP class

The `TokenBucket` class provides a simple interface for rate limiting
([source](TokenBucket.php)):

```php
<?php

require __DIR__ . '/vendor/autoload.php';

use Predis\Client;

// Create a Redis connection
$redis = new Client([
    'scheme' => 'tcp',
    'host'   => '127.0.0.1',
    'port'   => 6379,
]);

// Create a rate limiter: 10 requests per second
$limiter = new TokenBucket(
    redisClient: $redis,
    capacity: 10,        // Maximum burst size
    refillRate: 1,       // Add 1 token per interval
    refillInterval: 1.0  // Every 1 second
);

// Check if a request should be allowed
$result = $limiter->allow('user:123');

if ($result['allowed']) {
    echo "Request allowed. {$result['remaining']} tokens remaining.\n";
    // Process the request
} else {
    echo "Request denied. Rate limit exceeded.\n";
    // Return 429 Too Many Requests
}
```

The `allow()` method returns an associative array with two keys: `allowed` (boolean) and `remaining` (number of tokens left in the bucket).

### Configuration parameters

* **capacity**: Maximum number of tokens in the bucket (controls burst size)
* **refillRate**: Number of tokens added per refill interval
* **refillInterval**: Time in seconds between refills

For example:
* `capacity: 10, refillRate: 1, refillInterval: 1.0` allows 10 requests per second with bursts up to 10
* `capacity: 100, refillRate: 10, refillInterval: 1.0` allows 10 requests per second with bursts up to 100
* `capacity: 60, refillRate: 1, refillInterval: 60.0` allows 1 request per minute with bursts up to 60

### Rate limit keys

The `key` parameter identifies what you're rate limiting. Common patterns:

* **Per user**: `user:{userId}` - Limit each user independently
* **Per IP address**: `ip:{ipAddress}` - Limit by client IP
* **Per API endpoint**: `api:{endpoint}:{userId}` - Different limits per endpoint
* **Global**: `global:api` - Single limit shared across all requests

### Script caching with EVALSHA

The PHP implementation uses [`EVALSHA`]({{< relref "/commands/evalsha" >}}) for optimal performance. On first use, the Lua script is loaded into Redis with `SCRIPT LOAD`, and subsequent calls use the cached SHA1 hash. If the script is evicted from the cache, the class automatically falls back to [`EVAL`]({{< relref "/commands/eval" >}}) and reloads the script.

```php
// The class handles script caching automatically.
// First call loads the script, subsequent calls use EVALSHA.
$result1 = $limiter->allow('user:123'); // Uses EVAL + caches
$result2 = $limiter->allow('user:123'); // Uses EVALSHA (faster)
```

## Running the demo

A demonstration web server is included to show the rate limiter in action
([source](demo_server.php)):

```bash
# Install dependencies
composer require predis/predis

# Run the demo server
php demo_server.php
```

The demo provides an interactive web interface where you can:

* Submit requests and see them allowed or denied in real-time
* View the current token count
* Adjust rate limit parameters dynamically
* Test different rate limiting scenarios

The demo assumes Redis is running on `localhost:6379` but you can specify a different host and port using the `--redis-host` and `--redis-port` command-line arguments. Visit `http://localhost:8080` in your browser to try it out.

## Response headers

It's common to include rate limit information in HTTP response headers:

```php
$result = $limiter->allow("user:{$userId}");

// Add standard rate limit headers
header('X-RateLimit-Limit: ' . $limiter->getCapacity());
header('X-RateLimit-Remaining: ' . (int) $result['remaining']);
header('X-RateLimit-Reset: ' . (int) (time() + $limiter->getRefillInterval()));

if (!$result['allowed']) {
    header('Retry-After: ' . (int) $limiter->getRefillInterval());
    http_response_code(429);
    echo json_encode(['error' => 'Too Many Requests']);
    exit;
}
```

## Customization

### Using as PSR-15 middleware

You can wrap the rate limiter as PSR-15 middleware for use with frameworks like Slim or Laravel:

```php
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class RateLimitMiddleware implements MiddlewareInterface
{
    public function __construct(
        private TokenBucket $limiter,
        private \Closure $keyFn,
    ) {}

    public function process(
        ServerRequestInterface $request,
        RequestHandlerInterface $handler,
    ): ResponseInterface {
        $key = ($this->keyFn)($request);
        $result = $this->limiter->allow($key);

        if (!$result['allowed']) {
            $response = new \Slim\Psr7\Response(429);
            $response->getBody()->write(
                json_encode(['error' => 'Rate limit exceeded'])
            );
            return $response->withHeader('Content-Type', 'application/json');
        }

        $response = $handler->handle($request);
        return $response->withHeader(
            'X-RateLimit-Remaining',
            (string) (int) $result['remaining']
        );
    }
}

// Apply per-IP rate limiting
$middleware = new RateLimitMiddleware(
    $limiter,
    fn(ServerRequestInterface $req) => 'ip:' . $req->getServerParams()['REMOTE_ADDR']
);
```

### Error handling

The `allow()` method may throw a `Predis\Connection\ConnectionException` if the Redis connection is lost. Wrap calls in try/catch blocks for production use:

```php
try {
    $result = $limiter->allow('user:123');
    // Handle result
} catch (\Predis\Connection\ConnectionException $e) {
    error_log('Rate limiter error: ' . $e->getMessage());
    // Fail open or closed depending on your policy
}
```

## Learn more

* [EVAL command]({{< relref "/commands/eval" >}}) - Execute Lua scripts
* [EVALSHA command]({{< relref "/commands/evalsha" >}}) - Execute cached Lua scripts
* [Lua scripting]({{< relref "/develop/programmability/eval-intro" >}}) - Introduction to Redis Lua scripting
* [HMGET command]({{< relref "/commands/hmget" >}}) - Get multiple hash fields
* [HMSET command]({{< relref "/commands/hmset" >}}) - Set multiple hash fields
* [PHP client]({{< relref "/develop/clients/php" >}}) - Redis PHP client documentation
