---
title: Error handling
description: Learn how to handle errors when using node-redis.
linkTitle: Error handling
weight: 6
---

node-redis uses
[**promises**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
for error handling. Most Redis JavaScript examples
throughout the documentation mainly show the "happy path" and omit error
handling for brevity. This page shows how to apply error handling
techniques in node-redis for real world code.
For an overview of some common general error types and strategies for
handling them, see
[Error handling]({{< relref "/develop/clients/error-handling" >}}).
See also [Production usage]({{< relref "/develop/clients/nodejs/produsage" >}})
for more information on connection management, timeouts, and other aspects of
app reliability.


## Common error types

node-redis throws errors as rejected promises. Common error types include:

| Error | When it occurs | Recoverable | Recommended action |
|---|---|---|---|
| `ECONNREFUSED` | Connection refused | ✅ | Retry with backoff or fall back |
| `ETIMEDOUT` | Command timeout | ✅ | Retry with backoff |
| `ECONNRESET` | Connection reset by peer | ✅ | Retry with backoff |
| `EAI_AGAIN` | DNS resolution failure | ✅ | Retry with backoff |
| `ReplyError` (`WRONGTYPE`) | Type mismatch | ❌ | Fix schema or code |
| `ReplyError` (`BUSY`, `TRYAGAIN`, `LOADING`) | Redis busy/loading | ⚠️ | Retry with backoff (bounded) |

See [Categories of errors]({{< relref "/develop/clients/error-handling#categories-of-errors" >}})
for a more detailed discussion of these errors and their causes.

## Async/await in examples

The examples on this page and throughout the node-redis docs use `async/await`
style for clarity.

```javascript
// Using async/await (shown in examples below)
try {
    const result = await client.get(key);
    // Handle success
} catch (error) {
    // Handle error
}
```

Alternatively, you can use promise chains with `.then()` and `.catch()`:

```javascript
// Using promise chains (equivalent approach)
client.get(key)
    .then(result => {
        // Handle success
    })
    .catch(error => {
        // Handle error
    });
```

## Error events

Node-Redis provides [multiple events to handle various scenarios](https://github.com/redis/node-redis?tab=readme-ov-file#events), among which the most critical is the `error` event.

This event is triggered whenever an error occurs within the client.

It is crucial to listen for error events.

If a client does not register at least one error listener and an error occurs, the system will throw that error, potentially causing the Node.js process to exit unexpectedly.
See [the EventEmitter docs](https://nodejs.org/api/events.html#events_error_events) for more details.

```typescript
const client = createClient({
  // ... client options
});
// Always ensure there's a listener for errors in the client to prevent process crashes due to unhandled errors
client.on('error', error => {
    console.error(`Redis client error:`, error);
});
```

## Applying error handling patterns

The [Error handling]({{< relref "/develop/clients/error-handling" >}})
overview describes four common error handling patterns. The sections
below show how to implement these patterns in node-redis:

### Pattern 1: Fail fast

Catch specific errors and re-throw them (see
[Pattern 1: Fail fast]({{< relref "/develop/clients/error-handling#pattern-1-fail-fast" >}})
for a full description).

```javascript
try {
    await client.get(key);
} catch (err) {
    if (err.name === 'ReplyError' && /WRONGTYPE|ERR /.test(err.message)) {
        throw err; // Fix code or data type
    }
    throw err;
}
```

### Pattern 2: Graceful degradation

Catch connection errors and fall back to an alternative (see
[Pattern 2: Graceful degradation]({{< relref "/develop/clients/error-handling#pattern-2-graceful-degradation" >}})
for a full description).

```javascript
try {
    const val = await client.get(key);
    if (val != null) return val;
} catch (err) {
    if (['ECONNREFUSED','ECONNRESET','ETIMEDOUT','EAI_AGAIN'].includes(err.code)) {
        logger.warn('Cache unavailable; falling back to DB');
        return database.get(key);
    }
    throw err;
}
return database.get(key);
```

### Pattern 3: Retry with backoff

Retry on temporary errors like timeouts (see
[Pattern 3: Retry with backoff]({{< relref "/develop/clients/error-handling#pattern-3-retry-with-backoff" >}})
for a full description).

```javascript
async function getWithRetry(key, { attempts = 3, baseDelayMs = 100 } = {}) {
  let delay = baseDelayMs;
  for (let i = 0; i < attempts; i++) {
    try {
      return await client.get(key);
    } catch (err) {
      if (
        i < attempts - 1 &&
        (['ETIMEDOUT','ECONNRESET','EAI_AGAIN'].includes(err.code) ||
         (err.name === 'ReplyError' && /(BUSY|TRYAGAIN|LOADING)/.test(err.message)))
      ) {
        await new Promise(r => setTimeout(r, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}
```

Note that you can also configure node-redis to reconnect to the
server automatically when the connection is lost. See
[Reconnect after disconnection]({{< relref "/develop/clients/nodejs/connect#reconnect-after-disconnection" >}})
for more information.

### Pattern 4: Log and continue

Log non-critical errors and continue (see
[Pattern 4: Log and continue]({{< relref "/develop/clients/error-handling#pattern-4-log-and-continue" >}})
for a full description).

```javascript
try {
    await client.setEx(key, 3600, value);
} catch (err) {
    if (['ECONNREFUSED','ECONNRESET','ETIMEDOUT','EAI_AGAIN'].includes(err.code)) {
        logger.warn(`Failed to cache ${key}, continuing without cache`);
    } else {
        throw err;
    }
}
```

## See also

- [Error handling]({{< relref "/develop/clients/error-handling" >}})
- [Production usage]({{< relref "/develop/clients/nodejs/produsage" >}})
