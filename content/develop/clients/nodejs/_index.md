---
aliases: /develop/connect/clients/nodejs
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
description: Connect your Node.js/JavaScript application to a Redis database
linkTitle: node-redis (JavaScript)
title: node-redis guide (JavaScript)
weight: 4
---

[node-redis](https://github.com/redis/node-redis) is the Redis client for Node.js/JavaScript.
The sections below explain how to install `node-redis` and connect your application
to a Redis database.

`node-redis` requires a running [Redis Community Edition]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) server. See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis installation instructions.

You can also access Redis with an object-mapping client interface. See
[RedisOM for Node.js]({{< relref "/integrate/redisom-for-node-js" >}})
for more information.

## Install

To install node-redis, run:

```bash
npm install redis
```

## Connect and test

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

## More information

The [`node-redis` website](https://redis.js.org/) has more examples.
The [Github repository](https://github.com/redis/node-redis) also has useful
information, including a guide to the
[connection configuration options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) you can use.

See also the other pages in this section for more information and examples:
