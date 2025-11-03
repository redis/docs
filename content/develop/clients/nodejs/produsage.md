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
weight: 5
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

{{< checklist "nodeprodlist" >}}
    {{< checklist-item "#handling-errors" >}}Handling errors{{< /checklist-item >}}
    {{< checklist-item "#handling-reconnections" >}}Handling reconnections{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#command-execution-reliability" >}}Command execution reliability{{< /checklist-item >}}
    {{< checklist-item "#seamless-client-experience" >}}Smart client handoffs{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

### Handling errors

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

### Handling reconnections

When the socket closes unexpectedly (without calling the `quit()` or `disconnect()` methods),
the client can automatically restore the connection.  A simple
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) strategy
for reconnection is enabled by default, but you can replace this with your
own custom strategy. See
[Reconnect after disconnection]({{< relref "/develop/clients/nodejs/connect#reconnect-after-disconnection" >}})
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

You can also set timeouts for individual commands using `AbortController`:

```javascript
import { createClient, commandOptions } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

const ac = new AbortController();
const t = setTimeout(() => ac.abort(), 1000);
try {
  const val = await client.get(commandOptions({ signal: ac.signal }), key);
} finally {
  clearTimeout(t);
}
```

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
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.

See [Smart client handoffs]({{< relref "/develop/clients/sch" >}})
for more information about SCH and
[Connect using Smart client handoffs]({{< relref "/develop/clients/nodejs/connect#connect-using-smart-client-handoffs-sch" >}})
for example code.
