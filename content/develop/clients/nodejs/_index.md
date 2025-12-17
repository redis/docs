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

[`node-redis`](https://github.com/redis/node-redis) is the Redis client for Node.js/JavaScript.
The sections below explain how to install `node-redis` and connect your application
to a Redis database.

{{< note >}}node-redis is the recommended client library for Node.js/JavaScript,
but we also support and document our older JavaScript client
[`ioredis`]({{< relref "/develop/clients/ioredis" >}}). See
[Migrate from ioredis]({{< relref "/develop/clients/nodejs/migration" >}})
if you are interested in converting an existing `ioredis` project to `node-redis`.
{{< /note >}}

`node-redis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

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

{{< clients-example set="landing" step="connect" lang_filter="Node.js" >}}
{{< /clients-example >}}

Store and retrieve a simple string.

{{< clients-example set="landing" step="set_get_string" lang_filter="Node.js" >}}
{{< /clients-example >}}

Store and retrieve a map.

{{< clients-example set="landing" step="set_get_hash" lang_filter="Node.js" >}}
{{< /clients-example >}}

To connect to a different host or port, use a connection string in the format `redis[s]://[[username][:password]@][host][:port][/db-number]`:

```js
createClient({
  url: 'redis://alice:foobared@awesome.redis.server:6380'
});
```
To check if the client is connected and ready to send commands, use `client.isReady`, which returns a Boolean. `client.isOpen` is also available. This returns `true` when the client's underlying socket is open, and `false` when it isn't (for example, when the client is still connecting or reconnecting after a network error).

When you have finished using a connection, close it with `client.quit()`.

{{< clients-example set="landing" step="close" lang_filter="Node.js" >}}
{{< /clients-example >}}

## More information

The [`node-redis` website](https://redis.js.org/) has more examples.
The [Github repository](https://github.com/redis/node-redis) also has useful
information, including a guide to the
[connection configuration options](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md) you can use.

See also the other pages in this section for more information and examples:
