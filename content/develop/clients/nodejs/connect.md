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
description: Connect your Node.js application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 2
---

## Basic connection

Connect to localhost on port 6379. 

```js
import { createClient } from 'redis';

const client = createClient();

client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
```

Store and retrieve a simple string.

```js
await client.set('key', 'value');
const value = await client.get('key');
```

Store and retrieve a map.

```js
await client.hSet('user-session:123', {
    name: 'John',
    surname: 'Smith',
    company: 'Redis',
    age: 29
})

let userSession = await client.hGetAll('user-session:123');
console.log(JSON.stringify(userSession, null, 2));
/*
{
  "surname": "Smith",
  "name": "John",
  "company": "Redis",
  "age": "29"
}
 */
```

To connect to a different host or port, use a connection string in the format `redis[s]://[[username][:password]@][host][:port][/db-number]`:

```js
createClient({
  url: 'redis://alice:foobared@awesome.redis.server:6380'
});
```
To check if the client is connected and ready to send commands, use `client.isReady`, which returns a Boolean. `client.isOpen` is also available. This returns `true` when the client's underlying socket is open, and `false` when it isn't (for example, when the client is still connecting or reconnecting after a network error).

## Connect to a Redis cluster

To connect to a Redis cluster, use `createCluster`.

```js
import { createCluster } from 'redis';

const cluster = createCluster({
    rootNodes: [
        {
            url: 'redis://127.0.0.1:16379'
        },
        {
            url: 'redis://127.0.0.1:16380'
        },
        // ...
    ]
});

cluster.on('error', (err) => console.log('Redis Cluster Error', err));

await cluster.connect();

await cluster.set('foo', 'bar');
const value = await cluster.get('foo');
console.log(value); // returns 'bar'

await cluster.close();
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

```js
const client = createClient({
    username: 'default', // use your Redis user. More info https://redis.io/docs/latest/operate/oss_and_stack/management/security/acl/
    password: 'secret', // use your password here
    socket: {
        host: 'my-redis.cloud.redislabs.com',
        port: 6379,
        tls: true,
        key: readFileSync('./redis_user_private.key'),
        cert: readFileSync('./redis_user.crt'),
        ca: [readFileSync('./redis_ca.pem')]
    }
});

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();

await client.set('foo', 'bar');
const value = await client.get('foo');
console.log(value) // returns 'bar'

await client.destroy();
```

You can also use discrete parameters and UNIX sockets. Details can be found in the [client configuration guide](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md).

## Connect using client-side caching

Client-side caching is a technique to reduce network traffic between
the client and server, resulting in better performance. See
[Client-side caching introduction]({{< relref "/develop/clients/client-side-caching" >}})
for more information about how client-side caching works and how to use it effectively.

{{< note >}}Client-side caching requires `node-redis` v5.1.0 or later.
To maximize compatibility with all Redis products, client-side caching
is supported by Redis v7.4 or later.

The [Redis server products]({{< relref "/operate" >}}) support
[opt-in/opt-out]({{< relref "/develop/reference/client-side-caching#opt-in-and-opt-out-caching" >}}) mode
and [broadcasting mode]({{< relref "/develop/reference/client-side-caching#broadcasting-mode" >}})
for CSC, but these modes are not currently implemented by `node-redis`.
{{< /note >}}

To enable client-side caching, specify the
[RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol and configure the cache with the `clientSideCache` parameter
when you connect. If you want `node-redis` to create the cache for you,
then you can pass a simple configuration object in `clientSideCache`, as
shown below:

```js
const client = createClient({
  RESP: 3,
  clientSideCache: {
    ttl: 0,             // Time-to-live in milliseconds (0 = no expiration)
    maxEntries: 0,      // Maximum entries to store (0 = unlimited)
    evictPolicy: "LRU"  // Eviction policy: "LRU" or "FIFO"
  }
});
```

However, you can get more control over the cache very easily by creating
your own cache object and passing that as `clientSideCache` instead:

```js
import { BasicClientSideCache } from 'redis';

const cache = new BasicClientSideCache({
  ttl: 0,
  maxEntries: 0,
  evictPolicy: "LRU"
});

const client = createClient({
  RESP: 3,
  clientSideCache: cache
});
```

The main advantage of using your own cache instance is that you can
use its methods to clear all entries, invalidate individual keys,
and gather useful performance statistics:

```js
// Manually invalidate keys
cache.invalidate(key);

// Clear the entire cache
cache.clear();

// Get cache metrics
// `cache.stats()` returns a `CacheStats` object with comprehensive statistics.
const statistics = cache.stats();

// Key metrics:
const hits = statistics.hitCount;        // Number of cache hits
const misses = statistics.missCount;      // Number of cache misses
const hitRate = statistics.hitRate();     // Cache hit rate (0.0 to 1.0)

// Many other metrics are available on the `statistics` object, e.g.:
// statistics.missRate(), statistics.loadSuccessCount,
// statistics.averageLoadPenalty(), statistics.requestCount()
```

When you have connected, the usual Redis commands will work transparently
with the cache:

```java
client.set("city", "New York");
client.get("city");     // Retrieved from Redis server and cached
client.get("city");     // Retrieved from cache
```

You can see the cache working if you connect to the same Redis database
with [`redis-cli`]({{< relref "/develop/tools/cli" >}}) and run the
[`MONITOR`]({{< relref "/commands/monitor" >}}) command. If you run the
code above but without passing `clientSideCache` during the connection,
you should see the following in the CLI among the output from `MONITOR`:

```
1723109720.268903 [...] "SET" "city" "New York"
1723109720.269681 [...] "GET" "city"
1723109720.270205 [...] "GET" "city"
```

The server responds to both `get("city")` calls.
If you run the code with `clientSideCache` added in again, you will see

```
1723110248.712663 [...] "SET" "city" "New York"
1723110248.713607 [...] "GET" "city"
```

The first `get("city")` call contacted the server, but the second
call was satisfied by the cache.

### Pooled caching

You can also use client-side caching with client pools. Note that the same
cache is shared among all the clients in the same pool. As with the
non-pooled connection, you can let `node-redis` create the cache for you:

```js
const client = createClientPool({RESP: 3}, {
  clientSideCache: {
    ttl: 0,
    maxEntries: 0,
    evictPolicy: "LRU"
  },
  minimum: 5
});
```

If you want to access the cache, provide an instance of
`BasicPooledClientSideCache` instead of `BasicClientSideCache`:

```js
import { BasicPooledClientSideCache } from 'redis';

const cache = new BasicPooledClientSideCache({
  ttl: 0,
  maxEntries: 0,
  evictPolicy: "LRU"
});

const client = createClientPool({RESP: 3}, {
  clientSideCache: cache,
  minimum: 5
});
```

## Reconnect after disconnection

`node-redis` can attempt to reconnect automatically when
the connection to the server is lost. By default, it will retry
the connection using an
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
strategy with some random "jitter" added to avoid multiple
clients retrying in sync with each other.

You can also set the
`socket.reconnectionStrategy` field in the configuration to decide
whether to try to reconnect and how to approach it. Choose one of the following values for
`socket.reconnectionStrategy`:

-   `false`: Don't attempt to reconnect.
-   `number`: Wait for this number of milliseconds and then attempt to reconnect.
-   `<function>`: Use a custom
    function to decide how to handle reconnection.

The custom function has the following signature:

```js
(retries: number, cause: Error) => false | number | Error
```

It is called before each attempt to reconnect, with the `retries`
indicating how many attempts have been made so far. The `cause` parameter is an
[`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
object with information about how the connection was lost. The return value
from the function can be any of the following:

-   `false`: Don't attempt to reconnect.
-   `number`: Wait this number of milliseconds and then try again.
-   `Error`: Same as `false`, but lets you supply extra information about why
    no attempt was made to reconnect.

The example below shows a `reconnectionStrategy` function that implements a
custom exponential backoff strategy:

```js
createClient({
  socket: {
    reconnectStrategy: retries => {
        // Generate a random jitter between 0 – 100 ms:
        const jitter = Math.floor(Math.random() * 100);

        // Delay is an exponential backoff, (2^retries) * 50 ms, with a
        // maximum value of 3000 ms:
        const delay = Math.min(Math.pow(2, retries) * 50, 3000);

        return delay + jitter;
    }
  }
});
```

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs]({{< relref "/develop/clients/sch" >}})
for more information about SCH.

Use the configuration options shown in the example below to enable SCH
during the connection:

```js
const client = createClient({
  RESP: 3,
  maintPushNotifications: 'auto',
  maintRelaxedCommandTimeout: 10000,
  maintRelaxedSocketTimeout: 10000,
  ...
});
```

{{< note >}}SCH requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must set the `RESP:3` option explicitly when you connect.
{{< /note >}}

The available options are:

-   `maintPushNotifications`: (`string`) Whether or not to enable SCH. The options are  
    -   `'disabled'`: don't use SCH
    -   `'enabled'`: attempt to activate SCH on the server and abort the connection if it isn't supported
    -   `'auto'`: attempt to activate SCH on the server and fall back to a non-SCH
        connection if it isn't supported. This is the default.
-   `maintRelaxedCommandTimeout`: (`number`) The command timeout to use while the server is 
    performing maintenance. The default is 10000 (10 seconds). If a timeout happens during the maintenance period, the client receives a `CommandTimeoutDuringMaintenance` error.
-   `maintRelaxedSocketTimeout`: (`number`) The socket timeout to use while the server is 
    performing maintenance. The default is 10000 (10 seconds). If a timeout happens during the maintenance period, the client receives a `SocketTimeoutDuringMaintenance` error.

## Connection events

The client object emits the following
[events](https://developer.mozilla.org/en-US/docs/Web/API/Event) that are
related to connection:

-   `connect`: (No parameters) The client is about to start connecting to the server.
-   `ready`: (No parameters) The client has connected and is ready to use.
-   `end`: (No parameters) The client has been intentionally closed using `client.quit()`.
-   `error`: An error has occurred, which is described by the
    [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
    parameter. This is usually a network issue such as "Socket closed unexpectedly".
-   `reconnecting`: (No parameters) The client is about to try reconnecting after the
    connection was lost due to an error.
-   `sharded-channel-moved`: The cluster slot of a subscribed
    [sharded pub/sub channel]({{< relref "/develop/pubsub#sharded-pubsub" >}})
    has been moved to another shard. Note that when you use a
    [`RedisCluster`](#connect-to-a-redis-cluster) connection, this event is automatically
    handled for you. See
    [`sharded-channel-moved` event](https://github.com/redis/node-redis/blob/master/docs/pub-sub.md#sharded-channel-moved-event) for more information.

Use code like the following to respond to these events:

```js
client.on('error', error => {
    console.error(`Redis client error:`, error);
});
```
