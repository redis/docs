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

await cluster.quit();
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

await client.disconnect();
```

You can also use discrete parameters and UNIX sockets. Details can be found in the [client configuration guide](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md).

## Reconnect after disconnection

By default, `node-redis` doesn't attempt to reconnect automatically when
the connection to the server is lost. However, you can set the
`socket.reconnectionStrategy` field in the configuration to decide
whether to try to reconnect and how to approach it. Choose one of the following values for
`socket.reconnectionStrategy`:

-   `false`: (Default) Don't attempt to reconnect.
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
custom [exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
strategy:

```js
createClient({
  socket: {
    reconnectStrategy: retries => {
        // Generate a random jitter between 0 – 200 ms:
        const jitter = Math.floor(Math.random() * 200);

        // Delay is an exponential back off, (times^2) * 50 ms, with a
        // maximum value of 2000 ms:
        const delay = Math.min(Math.pow(2, retries) * 50, 2000);

        return delay + jitter;
    }
  }
});
```

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

Use code like the following to respond to these events:

```js
client.on('error', error => {
    console.error(`Redis client error:`, error);
});
```
