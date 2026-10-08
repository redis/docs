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

## Connect to Redis Sentinel

To connect through [Redis Sentinel](/content/operate/oss_and_stack/management/sentinel.md),
pass a list of Sentinels in the `sentinels` option and the name of the primary that the
Sentinels monitor in `name`. The client asks the Sentinels for the current primary.

```js
const redis = new Redis({
  sentinels: [
    { host: "localhost", port: 26379 },
    { host: "localhost", port: 26380 },
    { host: "localhost", port: 26381 },
  ],
  name: "mymaster",
});

await redis.set('foo', 'bar');
const value = await redis.get('foo');
console.log(value); // >>> bar
```

The Sentinels and the data nodes have separate credentials. Set `sentinelPassword` (and
`sentinelUsername`, if needed) for the Sentinels, and `username` and `password` for the
primary and replicas:

```js
const redis = new Redis({
  sentinels: [
    { host: "localhost", port: 26379 },
    { host: "localhost", port: 26380 },
    { host: "localhost", port: 26381 },
  ],
  name: "mymaster",
  // Credentials for the Sentinel instances.
  sentinelPassword: "my-sentinel-password",
  // Credentials for the primary and replica data nodes.
  username: "default",
  password: "my-password",
});
```

If the Sentinel password is wrong or missing, the error says that all Sentinels are
unreachable.

By default, ioredis doesn't listen for failover announcements from the Sentinels. After a
failover, the client keeps using the old primary until Sentinel reconfigures it as a
replica and closes the connection. Any writes that the old primary accepts during that time
are lost. Set `failoverDetector: true` to switch to the new primary as soon as the Sentinels
announce it.

To connect to a replica instead of the primary, set `role: "slave"`. The client connects to
one replica, chosen at random. Replication is asynchronous, so a replica can return stale
data.

```js
const replica = new Redis({
  sentinels: [{ host: "localhost", port: 26379 }],
  name: "mymaster",
  role: "slave",
});
```

## Connect to your production Redis with TLS

When you deploy your application, use TLS and follow the [Redis security](/content/operate/oss_and_stack/management/security/_index.md) guidelines.

```js
const redis = new Redis({
  host: "localhost",
  //...
  tls: {
    key: readFileSync('./redis_user_private.key'),
    cert: readFileSync('./redis_user.crt'),
    ca: fs.readFileSync('./redis_ca.pem'),
  },
});
```
