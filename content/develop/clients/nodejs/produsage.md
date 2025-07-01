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

To set a timeout for a connection, use the `connectTimeout` option:
```typescript
const client = createClient({
  socket: {
    // setting a 10-second timeout  
    connectTimeout: 10000 // in milliseconds
  }
});
client.on('error', error => console.error('Redis client error:', error));
```