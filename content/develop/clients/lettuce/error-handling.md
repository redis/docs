---
title: Error handling
description: Learn how to handle errors when using Lettuce.
linkTitle: Error handling
scope: implementation
relatedPages:
- /develop/clients/error-handling
- /develop/clients/lettuce/produsage
topics:
- error-handling
- resilience
weight: 65
---

Lettuce uses **unchecked exceptions** to signal errors. Documentation examples
often focus on the "happy path", but production code should catch and handle
the exceptions that matter for your workload. This page explains how Lettuce's
error handling works and how to apply common error handling patterns.

For an overview of error types and handling strategies, see
[Error handling]({{< relref "/develop/clients/error-handling" >}}).
See also [Production usage]({{< relref "/develop/clients/lettuce/produsage" >}})
for more information on connection management, timeouts, and other aspects of
app reliability.

## Exception hierarchy

Lettuce organizes its exceptions under `RedisException`, which extends
`RuntimeException`:

```hierarchy {type="exception"}
"RedisException":
    _meta:
        description: "Base class for Lettuce runtime exceptions"
    "RedisConnectionException":
    "RedisCommandTimeoutException":
    "RedisCommandInterruptedException":
    "RedisCommandExecutionException":
        "RedisLoadingException":
    "...":
        _meta:
            ellipsis: true
            description: "Other Lettuce exception types"
```

### Key exceptions

The following exceptions are the most commonly encountered in Lettuce
applications. See
[Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

| Exception | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `RedisConnectionException` | Connection setup failed or the connection was lost | ✅ | Retry with backoff or fall back |
| `RedisCommandTimeoutException` | A command exceeded its timeout | ✅ | Retry with backoff and review timeout settings |
| `RedisCommandExecutionException` | Redis returned an error reply such as `WRONGTYPE` | ❌ | Fix the command, arguments, or data model |
| `RedisCommandInterruptedException` | A waiting thread was interrupted while waiting for a result | ⚠️ | Restore interrupt status and abort cleanly |

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
Lettuce:

### Pattern 1: Fail fast

Catch specific exceptions that represent unrecoverable errors and re-throw them
(see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```java
try {
    return commands.get(key);
} catch (RedisCommandExecutionException e) {
    // This indicates a bug in our code or data model.
    throw e;
}
```

### Pattern 2: Graceful degradation

Catch temporary connectivity failures and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```java
try {
    String cachedValue = commands.get(key);
    if (cachedValue != null) {
        return cachedValue;
    }
} catch (RedisConnectionException e) {
    logger.warn("Cache unavailable, using database");
}

return database.get(key);
```

### Pattern 3: Retry with backoff

Retry on temporary errors such as timeouts or disconnections (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```java
int maxRetries = 3;
long delayMs = 100;

for (int attempt = 0; attempt < maxRetries; attempt++) {
    try {
        return commands.get(key);
    } catch (RedisConnectionException | RedisCommandTimeoutException e) {
        if (attempt == maxRetries - 1) {
            throw e;
        }
        Thread.sleep(delayMs);
        delayMs *= 2;
    }
}

throw new IllegalStateException("unreachable");
```

### Pattern 4: Log and continue

Log non-critical cache failures and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```java
try {
    commands.setex(key, 3600, value);
} catch (RedisConnectionException | RedisCommandTimeoutException e) {
    logger.warn("Failed to cache {}, continuing without cache", key, e);
}
```

## Async and reactive error handling

Lettuce's async and reactive APIs report the same underlying exceptions, but
they usually surface them through `CompletionStage` failures or stream errors
instead of direct `throw` statements:

```java
async.get(key).whenComplete((value, error) -> {
    if (error == null) {
        use(value);
        return;
    }

    Throwable cause = error.getCause() != null ? error.getCause() : error;
    if (cause instanceof RedisConnectionException) {
        logger.warn("Cache unavailable");
        return;
    }

    throw new RuntimeException(cause);
});
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Production usage]({{< relref "/develop/clients/lettuce/produsage" >}})
