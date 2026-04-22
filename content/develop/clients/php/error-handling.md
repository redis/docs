---
title: Error handling
description: Learn how to handle errors when using Predis.
linkTitle: Error handling
scope: implementation
relatedPages:
- /develop/clients/error-handling
topics:
- error-handling
- resilience
weight: 65
---

Predis uses **exceptions** to signal errors. Documentation examples often omit
error handling for brevity, but production code should distinguish between
transient transport errors and server-side command errors. This page explains
how Predis error handling works and how to apply common error handling
patterns.

For an overview of error types and handling strategies, see
[Error handling]({{< relref "/develop/clients/error-handling" >}}).

## Exception hierarchy

Predis groups its exceptions under `PredisException`:

```hierarchy {type="exception"}
"PredisException":
    _meta:
        description: "Base class for Predis exceptions"
    "CommunicationException":
        "ConnectionException":
    "ClientException":
    "ServerException":
    "AbortedMultiExecException":
```

### Key exceptions

The following exceptions are the most commonly encountered in Predis
applications. See
[Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

| Exception | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `Predis\Connection\ConnectionException` | Predis could not connect or lost the connection | ✅ | Retry with backoff or fall back |
| `Predis\CommunicationException` | A transport-level error occurred while reading or writing | ✅ | Retry with backoff and reconnect |
| `Predis\Response\ServerException` | Redis returned an error reply such as `WRONGTYPE` | ❌ | Fix the command, arguments, or data model |
| `Predis\Transaction\AbortedMultiExecException` | A watched transaction was aborted | ✅ | Reload state and retry the transaction |

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}}) overview
describes four main patterns. The sections below show how to implement them in
Predis:

### Pattern 1: Fail fast

Catch specific exceptions that represent unrecoverable errors and re-throw them
(see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description):

```php
use Predis\Response\ServerException;

try {
    return $r->get($key);
} catch (ServerException $e) {
    // This indicates a bug in our code or schema.
    throw $e;
}
```

### Pattern 2: Graceful degradation

Catch connection problems and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description):

```php
use Predis\Connection\ConnectionException;

try {
    $cachedValue = $r->get($key);
    if ($cachedValue !== null) {
        return $cachedValue;
    }
} catch (ConnectionException $e) {
    $logger->warning('Cache unavailable, using database');
}

return $database->get($key);
```

### Pattern 3: Retry with backoff

Retry on temporary communication failures (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description):

```php
use Predis\CommunicationException;

$delayMs = 100;

for ($attempt = 0; $attempt < 3; $attempt++) {
    try {
        return $r->get($key);
    } catch (CommunicationException $e) {
        if ($attempt === 2) {
            throw $e;
        }

        usleep($delayMs * 1000);
        $delayMs *= 2;
    }
}
```

### Pattern 4: Log and continue

Log non-critical failures and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description):

```php
use Predis\CommunicationException;

try {
    $r->setex($key, 3600, $value);
} catch (CommunicationException $e) {
    $logger->warning("Failed to cache {$key}, continuing without cache");
}
```

## Transaction retries

Predis raises `AbortedMultiExecException` when an optimistic-locking
transaction aborts. Handle this the same way as other retryable conflicts:

```php
use Predis\Transaction\AbortedMultiExecException;

for ($attempt = 0; $attempt < 3; $attempt++) {
    try {
        return $r->transaction(['cas' => true, 'watch' => $key], function ($tx) use ($key) {
            $current = $tx->get($key);
            $tx->multi();
            $tx->set($key, strtoupper($current));
        });
    } catch (AbortedMultiExecException $e) {
        if ($attempt === 2) {
            throw $e;
        }
    }
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Pipelines and transactions]({{< relref "/develop/clients/php/transpipe" >}})
