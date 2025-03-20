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

The following sections explain how to handle situations that may occur
in your production environment.

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

If network issues or other problems unexpectedly close the socket, the client will reject all commands already sent, since the server might have already executed them.
The rest of the pending commands will remain queued in memory until a new socket is established.
This behaviour is controlled by the `enableOfflineQueue` option, which is enabled by default.

The client uses `reconnectStrategy` to decide when to attempt to reconnect. 
The default strategy is to calculate the delay before each attempt based on the attempt number `Math.min(retries * 50, 500)`. You can customize this strategy by passing a supported value to `reconnectStrategy` option:


1. Define a callback `(retries: number, cause: Error) => false | number | Error` **(recommended)**
```typescript
const client = createClient({
  socket: {
    reconnectStrategy: function(retries) {
        if (retries > 20) {
            console.log("Too many attempts to reconnect. Redis connection was terminated");
            return new Error("Too many retries.");
        } else {
            return retries * 500;
        }
    }
  }
});
client.on('error', error => console.error('Redis client error:', error));
```
In the provided reconnection strategy callback, the client attempts to reconnect up to 20 times with a delay of `retries * 500` milliseconds between attempts. 
After approximately two minutes, the client logs an error message and terminates the connection if the maximum retry limit is exceeded.


2. Use a numerical value to set a fixed delay in milliseconds.
3. Use `false` to disable reconnection attempts. This option should only be used for testing purposes.

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