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
description: Connect your Python application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 20
---

## Basic connection

Connect to localhost on port 6379:

```js
const redis = new Redis();
```

You can also specify a full set of connection options:

```js
const redis = new Redis({
  port: 6379,
  host: "127.0.0.1",
  username: "default",
  password: "my-password",
  db: 0,
});
```

Store and retrieve a simple string.

```js
await redis.set('foo', 'bar');
const value = await redis.get('foo');
console.log(value); // >>> bar
```

## Connect to a Redis cluster

To connect to a Redis cluster, use `Redis.Cluster()`, passing an array of
endpoints.

```js
const redis = new Redis.Cluster([
    {
        host: '127.0.0.1',
        port: 6380,
        password: 'my-password',
        username: 'default',
    },
    {
        host: '127.0.0.1',
        port: 6381,
        password: 'my-other-password',
        username: 'default',
    },
    // ...
]);
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security]({{< relref "/operate/oss_and_stack/management/security/" >}}) guidelines.

```js
```
