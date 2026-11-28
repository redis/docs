---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Get your Node.js app ready for production
linkTitle: Production usage
title: Production usage
weight: 8
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

```checklist {id="nodeprodlist"}
- [ ] [Handling errors](#handling-errors)
- [ ] [Handling reconnections](#handling-reconnections)
- [ ] [Connection timeouts](#connection-timeouts)
- [ ] [Command execution reliability](#command-execution-reliability)
- [ ] [Smart client handoffs](#seamless-client-experience)
- [ ] [Geographic failover](#geographic-failover)
```

## Recommendations

### Handling errors

Node-Redis provides [multiple events to handle various scenarios](https://github.com/redis/node-redis?tab=readme-ov-file#events), among which the most critical is the `error` event.

This event is triggered whenever an error occurs within the client, and
it is very important to set a handler to listen for it.
See [Error events](/content/develop/clients/nodejs/error-handling.md#error-events)
for more information and an example of setting an error handler.

### Handling reconnections

When the socket closes unexpectedly (without calling the `close()` or `destroy()` methods),
the client can automatically restore the connection.  A simple
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) strategy
for reconnection is enabled by default, but you can replace this with your
own custom strategy. See
[Reconnect after disconnection](/content/develop/clients/nodejs/connect.md#reconnect-after-disconnection)
for more information.

### Timeouts

To set a timeout for a connection, use the `connectTimeout` option
(the default timeout is 5 seconds):

```js
const client = createClient({
  socket: {
    // setting a 10-second timeout  
    connectTimeout: 10000 // in milliseconds
  }
});
client.on('error', error => console.error('Redis client error:', error));
```

You can also cancel individual commands using `AbortController`:

```javascript
import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

const ac = new AbortController();
const t = setTimeout(() => ac.abort(), 1000);
try {
  const val = await client.withCommandOptions({ abortSignal: ac.signal }).get(key);
} finally {
  clearTimeout(t);
}
```

The `timeout` command option sets a time limit for a command in the same way.
It defaults to 5 seconds. Both `timeout` and `abortSignal` apply to
[transactions](/content/develop/clients/nodejs/transpipe.md) and pipelines as a whole.

By default, `timeout` and `abortSignal` apply only while a command waits in the client's
queue, before it is written to the socket. A command that times out or is
aborted at this stage rejects with `TimeoutError` or `AbortError`, and
`node-redis` never sends it. After the client sends a command, it waits for the reply
for as long as the server takes to answer.

#### Reject commands that were already sent

To make `timeout` and `abortSignal` apply until the reply arrives, set the
experimental `rejectInFlight` command option. You can set it for every command
of a client:

```javascript
import { createClient, TimeoutReadError } from 'redis';

const client = createClient({
  commandOptions: { timeout: 1000, rejectInFlight: true }
});
await client.connect();

try {
  await client.get(key);
} catch (err) {
  if (err instanceof TimeoutReadError) {
    // The server received the command and might have run it.
  }
}
```

Or you can set it for a single call with
`client.withCommandOptions({ timeout: 1000, rejectInFlight: true })`.
A command that was already sent rejects with `TimeoutReadError` on a timeout, or with
`AbortReadError` when you abort it. The connection stays open and `node-redis`
drops the reply when it arrives. Retry these commands only if they are safe to repeat.

Blocking commands such as [`BLPOP`](/content/commands/blpop.md) keep only the
queue timeout, because the server continues to block after a client-side timeout.

### Command execution reliability

By default, `node-redis` reconnects automatically when the connection is lost
(but see [Handling reconnections](#handling-reconnections), if you want to
customize this behavior). While the connection is down, any commands that you
execute will be queued and sent to the server when the connection is restored.
This might occasionally cause problems if the connection fails while a
[non-idempotent](https://en.wikipedia.org/wiki/Idempotence) command
is being executed. In this case, the command could change the data on the server
without the client removing it from the queue. When the connection is restored,
the command will be sent again, resulting in incorrect data.

If you need to avoid this situation, set the `disableOfflineQueue` option
to `true` when you create the client. This will cause the client to discard
unexecuted commands rather than queuing them:

```js
const client = createClient({
  disableOfflineQueue: true,
      .
      .
});
```

Use a separate connection with the queue disabled if you want to avoid queuing
only for specific commands.

### Smart client handoffs

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.

See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH and
[Connect using Smart client handoffs](/content/develop/clients/nodejs/connect.md#connect-using-smart-client-handoffs-sch)
for example code.

### Geographic failover

If you have several Redis databases that can serve your app, such as
[Active-Active databases](/content/operate/rs/databases/active-active/_index.md)
in different regions, use client-side geographic failover to switch to another
database automatically when the active one fails.

See [Client-side geographic failover](/content/develop/clients/nodejs/failover.md)
to learn how to configure failover with `node-redis`.
