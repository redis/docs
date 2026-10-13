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

> [!NOTE]
> ioredis supports [connection URLs](/content/develop/clients/connection-urls.md#ioredis-javascript) through the `Redis` constructor.
> A URL can set the host, port, credentials, database, and whether to use TLS,
> so you can use one instead of passing those options separately.

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

## Connect using Smart client handoffs (SCH)

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Smart client handoffs](/content/develop/clients/sch.md)
for more information about SCH.

> [!NOTE]
> Using SCH with `ioredis` requires v6.1.0 or later. SCH is not available for
> [cluster connections](#connect-to-a-redis-cluster), so you can't use it with
> the [OSS Cluster API](/content/operate/rs/databases/configure/oss-cluster-api.md).
> [Sentinel](#connect-to-redis-sentinel), Unix socket, pub/sub subscriber, and
> monitor connections use relaxed timeouts only, and reconnect in the usual way
> instead of using pre-handoffs.

SCH is enabled by default. Use the configuration options shown in the example
below to configure it during the connection:

```js
const redis = new Redis({
  host: "<your-host>",
  port: <your-port>,
  maintNotifications: "auto",
  maintEndpointType: "auto",
  maintRelaxedCommandTimeout: 10000,
  maintRelaxedSocketTimeout: 10000,
  //...
});
```

> [!NOTE]
> SCH requires the [RESP3](/content/develop/reference/protocol-spec.md#resp-versions)
> protocol, which is the default for `ioredis` v6.0.0 and later. SCH is disabled
> if you set `protocol: 2`.

The available options are:

-   `maintNotifications`: (`string`) Whether or not to enable SCH. The options are
    -   `"disabled"`: don't use SCH
    -   `"enabled"`: attempt to activate SCH on the server and abort the connection if it isn't supported
    -   `"auto"`: attempt to activate SCH on the server and fall back to a non-SCH
        connection if it isn't supported. This is the default.
-   `maintEndpointType`: (`MaintEndpointType`) The type of endpoint to use for the connection. The options are:
    -   `"external-ip"`: use the external IP address of the server
    -   `"internal-ip"`: use the internal IP address of the server
    -   `"external-fqdn"`: use the external FQDN of the server
    -   `"internal-fqdn"`: use the internal FQDN of the server
    -   `"auto"`: auto-detect based on connection. This uses an FQDN if TLS is enabled,
        and an IP address otherwise. This is the default.
    -   `"none"`: attempt a graceful reconnect to the current endpoint after a delay.
-   `maintRelaxedCommandTimeout`: (`number`) The command timeout to use while the server is
    performing maintenance. The default is 10000 (10 seconds). If a timeout happens during the maintenance period, the client receives a `CommandTimeoutDuringMaintenanceError` error.
-   `maintRelaxedSocketTimeout`: (`number`) The socket timeout to use while the server is
    performing maintenance. The default is 10000 (10 seconds). If a timeout happens during the maintenance period, the client receives a `SocketTimeoutDuringMaintenanceError` error.

A pre-handoff moves the connection to a new node, which invalidates any keys
you are watching with [`WATCH`](/content/commands/watch.md). If this happens before
you execute the transaction, the client aborts it with a `WatchError` error.
Retry the transaction with a fresh `WATCH` when you receive this error.

> [!NOTE]
>  Redis Cloud supports relaxed timeouts *only* (and not pre-handoffs) for SCH if you are using
> either [AWS PrivateLink](/content/operate/rc/security/aws-privatelink.md) or
> [Google Cloud Private Service Connect](/content/operate/rc/security/private-service-connect.md)
> (see [Smart client handoffs](/content/develop/clients/sch.md#redis-cloud) for more information).
> To use relaxed timeouts with these services, you should set `maintEndpointType: "none"`
> when you connect. All other configurations have full support for both relaxed timeouts and pre-handoffs.
