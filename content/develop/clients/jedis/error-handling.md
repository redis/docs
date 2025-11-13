---
title: Error handling
description: Learn how to handle errors when using Jedis.
linkTitle: Error handling
weight: 50
---

Jedis uses **exceptions** to signal errors. Code examples in the documentation often omit error handling for brevity, but it is essential in production code. This page explains how Jedis's error handling works and how to apply common error handling patterns.

For an overview of error types and handling strategies, see [Error handling]({{< relref "/develop/clients/error-handling" >}}).
See also [Production usage]({{< relref "/develop/clients/jedis/produsage" >}})
for more information on connection management, timeouts, and other aspects of
app reliability.

## Exception hierarchy

Jedis organizes exceptions in a hierarchy rooted at `JedisException`, which extends `RuntimeException`. All Jedis exceptions are unchecked exceptions:

```hierarchy {type="exception"}
"JedisException":
    _meta:
        description: "Base class for all Jedis exceptions"
    "JedisDataException":
        "JedisRedirectionException":
            "JedisMovedDataException":
            "JedisAskDataException":
        "AbortedTransactionException":
        "JedisAccessControlException":
        "JedisNoScriptException":
    "JedisClusterException":
        "JedisClusterOperationException":
        "JedisConnectionException":
        "JedisValidationException":
    "InvalidURIException":
```

### Key exceptions

The following exceptions are the most commonly encountered in Jedis applications.
See [Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

| Exception | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `JedisConnectionException` | Connection lost or closed unexpectedly | ✅ | Retry with backoff or fall back |
| `JedisAccessControlException` | Authentication failure or permission denied | ❌ | Fix credentials or permissions |
| `JedisDataException` | Problem with data being sent or received | ❌ | Fix the data or command |
| `JedisException` | Unexpected errors (catch-all) | ❌ | Log and investigate |

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
Jedis:

### Pattern 1: Fail fast

Catch specific exceptions that represent unrecoverable errors and re-throw them (see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```java
try (Jedis jedis = jedisPool.getResource()) {
    String result = jedis.get(key);
} catch (JedisDataException e) {
    // This indicates a bug in our code
    throw e;
}
```

### Pattern 2: Graceful degradation

Catch specific errors and fall back to an alternative, where possible (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```java
try (Jedis jedis = jedisPool.getResource()) {
    String cachedValue = jedis.get(key);
    if (cachedValue != null) {
        return cachedValue;
    }
} catch (JedisConnectionException e) {
    logger.warn("Cache unavailable, using database");
    return database.get(key);
}

// Fallback to database
return database.get(key);
```

### Pattern 3: Retry with backoff

Retry on temporary errors like connection failures (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```java
int maxRetries = 3;
int retryDelay = 100;

for (int attempt = 0; attempt < maxRetries; attempt++) {
    try (Jedis jedis = jedisPool.getResource()) {
        return jedis.get(key);
    } catch (JedisConnectionException e) {
        if (attempt < maxRetries - 1) {
            try {
                Thread.sleep(retryDelay);
                retryDelay *= 2;  // Exponential backoff
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                throw new RuntimeException(ie);
            }
        } else {
            throw e;
        }
    }
}
```

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```java
try (Jedis jedis = jedisPool.getResource()) {
    jedis.setex(key, 3600, value);
} catch (JedisConnectionException e) {
    logger.warn("Failed to cache " + key + ", continuing without cache");
    // Application continues normally
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Production usage]({{< relref "/develop/clients/jedis/produsage" >}})
