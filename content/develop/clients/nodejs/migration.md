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
description: Learn the differences between `ioredis` and `node-redis`
linkTitle: Migrate from ioredis
title: Migrate from ioredis
weight: 6
---

Redis previously recommended the [`ioredis`](https://github.com/redis/ioredis)
client library for development with [Node.js](https://nodejs.org/en),
but this library is now deprecated in favor of
[`node-redis`]({{< relref "/develop/clients/nodejs" >}}). This guide
outlines the main similarities and differences between the two libraries.
You may find this information useful if you are an `ioredis` user and you want to
start a new Node.js project or migrate an existing `ioredis` project to `node-redis`

## Comparison of `ioredis` and `node-redis`

The table below summarizes how `ioredis` and `node-redis` implement some
key features of Redis. See the following sections for more information about
each feature.

### Connection

| Feature | `ioredis` | `node-redis` |
| :-- | :-- | :-- |
| [Initial connection](#initial-connection) | Happens when you create a client instance | Requires you to call a method on the client instance |
| [Reconnection after a connection is lost](#reconnection) | Automatic by default | Manual by default |
| [Connection events](#connection-events) | Emits `connect`, `ready`, `error`, and `close` events. | Emits `connect`, `ready`, `error`, `end`, and `reconnecting` events. |

### Command handling

| Feature | `ioredis` | `node-redis` |
| :-- | :-- | :-- |
| [Command case](#command-case) | Lowercase only (eg, `hset`) | Uppercase or camel case (eg, `HSET` or `hSet`) |
| [Command argument handling](#command-argument-handling) | Argument objects flattened and items passed directly | Argument objects parsed to generate correct argument list |
| [Asynchronous command result handling](#async-result) | Callbacks and Promises | Promises only |

### Techniques

| Feature | `ioredis` | `node-redis` |
| :-- | :-- | :-- |
| [Pipelining](#pipelining) | Automatic, or with `pipeline()` command | Automatic, or with `multi()` command |
| [Scan iteration](#scan-iteration) | Uses `scanStream()`, etc. | Uses `scanIterator()`, etc |
| [Subscribing to channels](#subscribing-to-channels) | Uses `client.on('message', ...)` event | Uses `subscribe(...)` command |

### Specific commands

| Command | `ioredis` | `node-redis` |
| :-- | :-- | :-- |
| [`SETNX`](#setnx-command) | Supported explicitly | Supported as an option for `SET` |

## Details

The sections below explain the points of comparison between `ioredis` and
`node-redis` in more detail.

### Initial connection

`ioredis` makes the connection to the Redis server when you create an instance
of the client object:

```js
const Redis = require('ioredis');

// Connects to localhost:6379 on instantiation.
const redis = new Redis();
```

`node-redis` requires you to call the `connect()` method on the client object
to make the connection:

```js
import { createClient } from 'redis';

const client = await createClient();
await client.connect(); // Requires explicit connection.
```

### Reconnection after a connection is lost {#reconnection}

`ioredis` automatically attempts to reconnect if the connection
was lost due to an error. By default, `node-redis` doesn't attempt
to reconnect, but you can enable a custom reconnection strategy
when you create the client object. See
[Reconnect after disconnection]({{< relref "/develop/clients/nodejs/connect#reconnect-after-disconnection" >}})
for more information.

### Connection events

The `connect`, `ready`, `error`, and `close` events that `ioredis` emits
are equivalent to the `connect`, `ready`, `error`, and `end` events
in `node-redis`, but `node-redis` also emits a `reconnecting` event.
See []({{< relref "/develop/clients/nodejs/connect#connection-events" >}})
for more information.

### Command case

Command methods in `ioredis` are always lowercase. With `node-redis`, you can
use uppercase or camel case versions of the method names.

```js
// ioredis
redis.hset("key", "field", "value");

// node-redis
redis.HSET("key", "field", "value");

// ...or
redis.hSet("key", "field", "value");
```

### Command argument handling

`ioredis` parses command arguments to strings and then passes them to
the server, in a similar way to [`redis-cli`]({{< relref "/develop/tools/cli" >}}).

```js
// Equivalent to the command line `SET key 100 EX 10`.
redis.set("key", 100, "EX", 10);
```

Arrays passed as arguments are flattened into individual elements and
objects are flattened into sequential key-value pairs:

```js
// These commands are all equivalent.
redis.hset("user" {
    name: "Bob",
    age: 20,
    description: "I am a programmer",
});

redis.hset("user", ["name", "Bob", "age", 20, "description", "I am a programmer"]);

redis.hset("user", "name", "Bob", "age", 20, "description", "I am a programmer");
```

`node-redis` uses predefined formats for command arguments. These include specific
classes for commmand options that generally don't correspond to the syntax
of the CLI command. Internally, `node-redis` constructs the correct command using
the method arguments you pass:

```js
// Equivalent to the command line `SET key 100 EX 10`.
redis.set("bike:5", "bike", {EX: 10});
```

### Asynchronous command result handling {#async-result}

All commands for both `ioredis` and `node-redis` are executed
asynchronously. `ioredis` supports both callbacks and
[`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)
return values to respond to command results:

```js
// Callback
redis.get("mykey", (err, result) => {
  if (err) {
    console.error(err);
  } else {
    console.log(result);
  }
});

// Promise
redis.get("mykey").then(
    (result) => {
        console.log(result);
    },
    (err) => {
        console.error(err);
    }
);
```

`node-redis` supports only `Promise` objects for results, so
you must always use a `then()` handler or the
[`await`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)
operator to receive them.

### Pipelining

Both `ioredis` and `node-redis` will pipeline commands automatically if
they are executed in the same "tick" of the
[event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick#what-is-the-event-loop)
(see
[Pipelines and transactions]({{< relref "/develop/clients/nodejs/transpipe" >}})
for more information).

You can also create a pipeline with explicit commands in both clients.
For `ioredis`, you use the `pipeline()` command with a chain of
commands, ending with `exec()` to run the pipeline:

```js
// ioredis example
redis.pipeline()
    .set("foo", "1")
    .get("foo")
    .set("foo", "2")
    .incr("foo")
    .get("foo")
    .exec(function (err, results) {
      // Handle results or errors.
    });
```

For `node-redis`, the approach is similar, except that you call the `multi()`
command to start the pipeline and `execAsPipeline()` to run it:

```js
redis.multi()
    .set('seat:3', '#3')
    .set('seat:4', '#4')
    .set('seat:5', '#5')
    .execAsPipeline()
    .then((results) => {
        // Handle array of results.
    },
    (err) => {
        // Handle errors.
    });
```

### Scan iteration

`ioredis` supports the `scanStream()` method to create a readable stream
from the set of keys returned by the [`SCAN`]({{< relref "/commands/scan" >}})
command:

```js
const redis = new Redis();
// Create a readable stream (object mode)
const stream = redis.scanStream();
stream.on("data", (resultKeys) => {
  // `resultKeys` is an array of strings representing key names.
  // Note that resultKeys may contain 0 keys, and that it will sometimes
  // contain duplicates due to SCAN's implementation in Redis.
  for (let i = 0; i < resultKeys.length; i++) {
    console.log(resultKeys[i]);
  }
});
stream.on("end", () => {
  console.log("all keys have been visited");
});
```

You can also use the similar `hscanStream()`, `sscanStream()`, and
`zscanStream()` to iterate over the items of a hash, set, or sorted set,
respectively.

`node-redis` handles scan iteration using the `scanIterator()` method
(and the corresponding `hscanIterator()`, `sscanIterator()`, and
`zscanIterator()` methods). These return a collection object for
each page scanned by the cursor (this can be helpful to improve
efficiency using [`MGET`]({{< relref "/commands/mget" >}}) and
other multi-key commands):

```js
for await (const keys of client.scanIterator()) {
  const values = await client.mGet(keys);
}
```

### Subscribing to channels

`ioredis` reports incoming pub/sub messages with a `message`
event on the client object (see
[Publish/subscribe]({{< relref "/develop/interact/pubsub" >}}) for more
information about messages):

```js
client.on('message', (channel, message) => {
   console.log(Received message from ${channel}: ${message});
});
```

With `node-redis`, you use the `subscribe()` command to register the
message callback. Also, when you use a connection to subscribe, the
connection can't issue any other commands, so you must create a
dedicated connection for the subscription. Use the `client.duplicate()`
method to create a new connection with the same settings as the original:

```js
const subscriber = client.duplicate();
await subscriber.connect();

await subscriber.subscribe('channel', (message) => {
   console.log(Received message: ${message});
});
```

### `SETNX` command

`ioredis` implements the  [`SETNX`]({{< relref "/commands/setnx" >}})
command with an explicit method:

```js
client.setnx("bike:1", "bike");
```

`node-redis` doesn't provide a `SETNX` method but implements the same
functionality with the `NX` option to the [`SET`]({{< relref "/commands/set" >}})
command:

```js
await client.set("bike:1", "bike", {'NX': true});
```
