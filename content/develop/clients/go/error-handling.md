---
title: Error handling
description: Learn how to handle errors when using go-redis
linkTitle: Error handling
scope: implementation
relatedPages:
- /develop/clients/error-handling
- /develop/clients/go/produsage
topics:
- error-handling
- resilience
weight: 50
---

go-redis uses **explicit error returns** following Go's idiomatic error handling pattern. Code examples in the documentation often omit error handling for brevity,
but it is essential in production code.
This page explains how go-redis's error handling works and how to apply
some common error handling patterns. For an overview of error types and handling
strategies, see [Error handling](/content/develop/clients/error-handling.md).
See also [Production usage](/content/develop/clients/go/produsage.md)
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
| `redis.Nil` | Key does not exist | ✅ | Return default value or fetch from source |
| `context.DeadlineExceeded` | Operation timeout | ✅ | Retry with backoff |
| `net.OpError` | Network error | ✅ | Retry with backoff or fall back to alternative |
| `redis.ResponseError` | Redis error response | ❌ | Fix the command or arguments |

See [Categories of errors](/content/develop/clients/error-handling.md#categories-of-errors)
for a more detailed discussion of these errors and their causes.

For the go-redis exception that each common server error raises, see [Redis error messages](/content/develop/reference/errors/_index.md).

### Context deadline errors

Set `ContextTimeoutEnabled: true` in `Options` to make `go-redis` apply the
deadline of your command's context to the socket. In `go-redis` v9.24.0 or
later, a socket timeout that comes from that deadline matches
`context.DeadlineExceeded` with `errors.Is()`. It also still matches
`net.Error` with `Timeout()` returning `true`, and the original network error
stays in the error chain. The message starts with `context deadline exceeded:`.

```go
ctx, cancel := context.WithTimeout(ctx, 200*time.Millisecond)
defer cancel()

err := rdb.Get(ctx, key).Err()
if errors.Is(err, context.DeadlineExceeded) {
    // The context deadline expired, so retrying with the same context can't succeed
}
```

`go-redis` doesn't retry such an error, because the context has already expired.
A `ReadTimeout` or `WriteTimeout` that fires before the context deadline is still
reported as a network timeout error.

### Errors from scanning into a struct

When you read a hash with `HGetAll(...).Scan()` or `HMGet(...).Scan()`, a field
that fails to decode no longer stops the scan. In `go-redis` v9.24.0 or later,
`Scan()` fills every field that it can decode and then returns an error. If
more than one field fails, the error joins the individual errors in key order
for `HGetAll` and in argument order for `HMGet`, so `errors.Is()` and
`errors.As()` match each of them.

```go
type Item struct {
    A int    `redis:"a"`
    B int    `redis:"b"`
    D string `redis:"d"`
}

var item Item
err := rdb.HGetAll(ctx, "item:1").Scan(&item)
// If field "a" holds "x", item.B and item.D are still set and err describes "a".
```

For the built-in types, a field that fails to decode keeps its previous value.
A custom decoder (`ScanRedis`, `UnmarshalText`, or `UnmarshalBinary`) runs on the
existing field and can leave a failed field changed. If you reuse a struct after
an error, expect more of its fields to be set than before this change.

## Applying error handling patterns

The [Error handling](/content/develop/clients/error-handling.md) overview
describes four main patterns. The sections below show how to implement them in
go-redis:

### Pattern 1: Fail fast

Return the error immediately if it represents an unrecoverable situation (see
[Pattern 1: Fail fast](/content/develop/clients/error-handling.md#pattern-1-fail-fast)
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
[Pattern 2: Graceful degradation](/content/develop/clients/error-handling.md#pattern-2-graceful-degradation)
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

Retry on temporary errors such as timeouts (see
[Pattern 3: Retry with backoff](/content/develop/clients/error-handling.md#pattern-3-retry-with-backoff)
for a full description). go-redis has built-in retry logic with
configurable timing and backoffs. See [Retries](/content/develop/clients/go/produsage.md#retries) for more information. Note also that
you can configure timeouts (which are one of the most common causes of
temporary errors) for connections and commands. See [Timeouts](/content/develop/clients/go/produsage.md#timeouts) for more information.

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue](/content/develop/clients/error-handling.md#pattern-4-log-and-continue)
for a full description):

```go
err := rdb.Set(ctx, key, value, 3600*time.Second).Err()
if err != nil {
    if _, ok := err.(net.Error); ok {
        logger.Warnf("Failed to cache %s, continuing without cache", key)
        // Application continues normally
    } else {
        return err
    }
}
```

Note that go-redis also supports [OpenTelemetry](https://opentelemetry.io/)
instrumentation to monitor performance and trace the execution of Redis commands. See [Observability](/content/develop/clients/go/_index.md#observability) for more information.

## See also

- [Error handling](/content/develop/clients/error-handling.md)
- [Production usage](/content/develop/clients/go/produsage.md)
- [Observability](/content/develop/clients/go/_index.md#observability)
