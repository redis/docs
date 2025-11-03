---
title: Error handling
description: Learn how to handle errors when using NRedisStack.
linkTitle: Error handling
weight: 60
---

NRedisStack uses **exceptions** to signal errors. Code examples in the documentation often omit error handling for brevity, but it is essential in production code. This page explains how NRedisStack's error handling works and how to apply common error handling patterns.

For an overview of error types and handling strategies, see [Error handling]({{< relref "/develop/clients/error-handling" >}}).
See also [Production usage]({{< relref "/develop/clients/dotnet/produsage" >}})
for more information on connection management, timeouts, and other aspects of
app reliability.

## Exception types

NRedisStack throws exceptions to signal errors. Common exception types include:

| Exception | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `RedisConnectionException` | Connection refused or lost | ✅ | Retry with backoff or fall back |
| `RedisTimeoutException` | Operation exceeded timeout | ✅ | Retry with backoff |
| `RedisCommandException` | Invalid command or arguments | ❌ | Fix the command or arguments |
| `RedisServerException` | Invalid operation on server | ❌ | Fix the operation or data |

See [Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
NRedisStack:

### Pattern 1: Fail fast

Catch specific exceptions that represent unrecoverable errors and re-throw them (see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```csharp
using NRedisStack;
using StackExchange.Redis;

var muxer = ConnectionMultiplexer.Connect("localhost:6379");
var db = muxer.GetDatabase();

try {
    var result = db.StringGet("key");
} catch (RedisCommandException) {
    // This indicates a bug in our code
    throw;
}
```

### Pattern 2: Graceful degradation

Catch specific errors and fall back to an alternative, where possible (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```csharp
try {
    var cachedValue = db.StringGet(key);
    if (cachedValue.HasValue) {
        return cachedValue.ToString();
    }
} catch (RedisConnectionException) {
    logger.LogWarning("Cache unavailable, using database");
    return database.Get(key);
}

// Fallback to database
return database.Get(key);
```

### Pattern 3: Retry with backoff

Retry on temporary errors like timeouts (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```csharp
const int maxRetries = 3;
int retryDelay = 100;

for (int attempt = 0; attempt < maxRetries; attempt++) {
    try {
        return db.StringGet(key).ToString();
    } catch (RedisTimeoutException) {
        if (attempt < maxRetries - 1) {
            Thread.Sleep(retryDelay);
            retryDelay *= 2;  // Exponential backoff
        } else {
            throw;
        }
    }
}
```

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```csharp
try {
    db.StringSet(key, value, TimeSpan.FromSeconds(3600));
} catch (RedisConnectionException) {
    logger.LogWarning($"Failed to cache {key}, continuing without cache");
    // Application continues normally
}
```

## Async error handling

If you're using async methods, error handling works the same way with `async`/`await`:

```csharp
using NRedisStack;
using StackExchange.Redis;

var muxer = ConnectionMultiplexer.Connect("localhost:6379");
var db = muxer.GetDatabase();

async Task<string> GetWithFallbackAsync(string key) {
    try {
        var result = await db.StringGetAsync(key);
        if (result.HasValue) {
            return result.ToString();
        }
    } catch (RedisConnectionException) {
        logger.LogWarning("Cache unavailable");
        return await database.GetAsync(key);
    }
    
    return await database.GetAsync(key);
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Production usage]({{< relref "/develop/clients/dotnet/produsage" >}})
- [Connection pooling]({{< relref "/develop/clients/pools-and-muxing" >}})

