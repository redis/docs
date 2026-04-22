---
title: Error handling
description: Learn how to handle errors when using redis-rb.
linkTitle: Error handling
scope: implementation
relatedPages:
- /develop/clients/error-handling
topics:
- error-handling
- resilience
weight: 65
---

`redis-rb` uses **exceptions** to signal errors. Most documentation examples
focus on the "happy path", but production code should handle connection and
command failures explicitly. This page explains how error handling works in
`redis-rb` and how to apply common error handling patterns.

For an overview of error types and handling strategies, see
[Error handling]({{< relref "/develop/clients/error-handling" >}}).

## Exception hierarchy

`redis-rb` organizes exceptions under `Redis::BaseError`:

```hierarchy {type="exception"}
"Redis::BaseError":
    _meta:
        description: "Base class for redis-rb exceptions"
    "Redis::ProtocolError":
    "Redis::CommandError":
        "Redis::PermissionError":
        "Redis::WrongTypeError":
        "Redis::OutOfMemoryError":
        "Redis::NoScriptError":
    "Redis::BaseConnectionError":
        "Redis::CannotConnectError":
        "Redis::ConnectionError":
        "Redis::TimeoutError":
        "Redis::ReadOnlyError":
```

### Key exceptions

The following exceptions are the most commonly encountered in `redis-rb`
applications. See
[Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

| Exception | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `Redis::CannotConnectError` | A connection could not be established | ✅ | Retry with backoff or fall back |
| `Redis::TimeoutError` | A read or blocking operation timed out | ✅ | Retry with backoff and review timeouts |
| `Redis::CommandError` | Redis returned an error reply such as `ERR` or `WRONGTYPE` | ❌ | Fix the command, arguments, or data model |
| `Redis::ConnectionError` | An established connection was lost | ✅ | Reconnect and retry cautiously |

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
`redis-rb`:

### Pattern 1: Fail fast

Catch specific exceptions that represent unrecoverable errors and re-raise them
(see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```ruby
begin
  redis.get(key)
rescue Redis::CommandError
  # This indicates a bug in our code or schema.
  raise
end
```

### Pattern 2: Graceful degradation

Catch connection failures and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```ruby
begin
  cached_value = redis.get(key)
  return cached_value unless cached_value.nil?
rescue Redis::CannotConnectError, Redis::ConnectionError
  logger.warn("Cache unavailable, using database")
end

database.get(key)
```

### Pattern 3: Retry with backoff

Retry on temporary errors such as timeouts (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```ruby
delay = 0.1

3.times do |attempt|
  begin
    return redis.get(key)
  rescue Redis::CannotConnectError, Redis::ConnectionError, Redis::TimeoutError => e
    raise e if attempt == 2

    sleep(delay)
    delay *= 2
  end
end
```

### Pattern 4: Log and continue

Log non-critical failures and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```ruby
begin
  redis.setex(key, 3600, value)
rescue Redis::CannotConnectError, Redis::ConnectionError, Redis::TimeoutError
  logger.warn("Failed to cache #{key}, continuing without cache")
end
```

## Transaction conflicts

When a watched transaction in `redis-rb` loses an optimistic-locking race,
`multi()` returns `nil` instead of raising an exception. Treat that as a
retryable conflict:

```ruby
result = redis.watch(key) do |client|
  current = client.get(key)

  client.multi do |tx|
    tx.set(key, current.upcase)
  end
end

retry_transaction if result.nil?
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Pipelines and transactions]({{< relref "/develop/clients/ruby/transpipe" >}})
