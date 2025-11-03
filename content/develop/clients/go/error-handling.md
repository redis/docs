---
title: Error handling
description: Learn how to handle errors when using go-redis
linkTitle: Error handling
weight: 50
---

go-redis uses **explicit error returns** following Go's idiomatic error handling pattern. Code examples in the documentation often omit error handling for brevity,
but it is essential in production code.
This page explains how go-redis's error handling works and how to apply
some common error handling patterns. For an overview of error types and handling
strategies, see [Error handling]({{< relref "/develop/clients/error-handling" >}}).
See also [Production usage]({{< relref "/develop/clients/go/produsage" >}})
for more information on connection management, timeouts, and other aspects of
app reliability.

## Error handling in Go

In Go, functions return errors as a second return value. You can check for errors explicitly with code like the following:

```go
result, err := rdb.Get(ctx, key).Result()
if err != nil {
    // Handle the error
}
```

Common error types from go-redis include:

| Error | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `redis.Nil` | Key does not exist | Yes | Return default value or fetch from source |
| `context.DeadlineExceeded` | Operation timeout | Yes | Retry with backoff |
| `net.OpError` | Network error | Yes | Retry with backoff or fall back to alternative |
| `redis.ResponseError` | Redis error response | No | Fix the command or arguments |

See [Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
go-redis:

### Pattern 1: Fail fast

Return the error immediately (see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```go
result, err := rdb.Get(ctx, key).Result()
if err != nil {
    // This indicates a problem that should be fixed
    return err
}
```

### Pattern 2: Graceful degradation

Check for specific errors and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```go
result, err := rdb.Get(ctx, key).Result()
if err != nil {
    if err == redis.Nil {
        // Key doesn't exist, try database
        return database.Get(ctx, key)
    }
    if _, ok := err.(net.Error); ok {
        // Network error, use fallback
        logger.Warn("Cache unavailable, using database")
        return database.Get(ctx, key)
    }
    return err
}
return result, nil
```

### Pattern 3: Retry with backoff

Retry on temporary errors (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```go
import "time"

func getWithRetry(ctx context.Context, key string, maxRetries int) (string, error) {
    retryDelay := 100 * time.Millisecond
    
    for attempt := 0; attempt < maxRetries; attempt++ {
        result, err := rdb.Get(ctx, key).Result()
        if err == nil {
            return result, nil
        }
        
        // Check if error is temporary
        if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
            if attempt < maxRetries-1 {
                time.Sleep(retryDelay)
                retryDelay *= 2  // Exponential backoff
                continue
            }
        }
        
        return "", err
    }
    
    return "", fmt.Errorf("max retries exceeded")
}
```

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```go
err := rdb.SetEx(ctx, key, value, 3600*time.Second).Err()
if err != nil {
    if _, ok := err.(net.Error); ok {
        logger.Warnf("Failed to cache %s, continuing without cache", key)
        // Application continues normally
    } else {
        return err
    }
}
```

## Connection pool errors

go-redis manages a connection pool automatically. If the pool is exhausted, operations will timeout. You can configure the pool size to avoid this if
necessary:

```go
rdb := redis.NewClient(&redis.Options{
    Addr:     "localhost:6379",
    PoolSize: 10,  // Number of connections
})
```

## Context-based cancellation

go-redis respects context cancellation. Use context timeouts for error handling:

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

result, err := rdb.Get(ctx, key).Result()
if err == context.DeadlineExceeded {
    logger.Warn("Operation timeout")
    // Handle timeout
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Production usage]({{< relref "/develop/clients/go/produsage" >}})
- [Connection pooling]({{< relref "/develop/clients/pools-and-muxing" >}})

