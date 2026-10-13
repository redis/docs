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
description: Improve reliability using the failover features of node-redis.
linkTitle: Geographic failover
title: Client-side geographic failover
topics:
- failover
- failback
- resilience
- health checks
relatedPages:
- /develop/clients/failover
scope: [client-specific, implementation]
weight: 9
bannerText: This feature is currently in preview and may be subject to change.
---

node-redis supports [Client-side geographic failover](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
how to configure node-redis for failover. For an overview of the concepts,
see the main [Client-side geographic failover](/content/develop/clients/failover.md) page.

Failover is available in node-redis v6.4.0-beta.0 and later. Install the beta release with:

```bash
npm install redis@beta
```

## Failover configuration

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, node-redis should fail over to
`redis-west`.

Supply the weighted endpoints in the `databases` list when you call
`createMultiDbClient()`
(see [Selecting a failover target](/content/develop/clients/failover.md#selecting-a-failover-target) for a full description of how
the weighted list is used).
Use the `weight` option to order the endpoints, with the highest
weight being tried first.

```js
import { createMultiDbClient } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [
    {
      id: 'east',
      options: { url: 'redis://redis-east.example.com:14000' },
      weight: 1
    },
    {
      id: 'west',
      options: { url: 'redis://redis-west.example.com:14000' },
      weight: 0.5
    }
  ]
});

await client.connect();
await client.set('key', 'value'); // Served by 'east' until it fails.
```

`createMultiDbClient()` returns an object with two fields:

- `client` has the same commands as the client that `createClient()` returns, and routes each
  command to the active database. Use it in place of your usual client.
  It also emits the [failover events](#failover-events).
- `controller` lets you inspect and change the set of databases at runtime
  (see [Managing databases at runtime](#managing-databases-at-runtime)).

`connect()` connects to every database and resolves when enough of them pass
an initial health check (see the `initialAvailability` option in
[General failover configuration](#general-failover-configuration)).
If the first call to `connect()` rejects, the client is unusable, so create a new
one to try again.

### Endpoint configuration

Each entry in the `databases` list supports the following options:

| Option | Description |
| --- | --- |
| `options` | The options to pass to the internal client for this endpoint. These are the same options you pass to `createClient()` (see [Connect to the server](/content/develop/clients/nodejs/connect.md)). |
| `id` | Identifier for the endpoint, used in events and in `controller` methods. Default is `db-<n>`, where `<n>` is the position of the endpoint in the list. |
| `weight` | Priority of the endpoint, from `0` to `1`, with higher values being tried first. If two endpoints have the same weight, the one that appears first in the list is preferred. Default is `1`. |
| `poolOptions` | Connection pool options for this endpoint. Only available with `createMultiDbClientPool()` (see [Client types](#client-types)). |

### Client types

node-redis provides a separate factory function for each type of client. All
the endpoints in one failover client must be the same type.

| Function | Endpoint type | `options` field |
| --- | --- | --- |
| `createMultiDbClient()` | Standalone client | Options for `createClient()` |
| `createMultiDbClientPool()` | Client pool | Options for `createClientPool()` |
| `createMultiDbCluster()` | [Redis Cluster](/content/develop/clients/nodejs/connect.md#connect-to-a-redis-cluster) | Options for `createCluster()` |
| `createMultiDbSentinel()` | [Redis Sentinel](/content/develop/clients/nodejs/connect.md#connect-to-redis-sentinel) | Options for `createSentinel()` |

### Timeouts for unresponsive servers

A server that stops responding without closing the connection (for example, after
a network partition) doesn't cause commands to fail. Health checks detect the problem
and fail over, but commands that were already sent to the failed server
wait for a reply until that server responds again.

To make these commands fail instead, set `socket.socketTimeout` in the `options`
for each endpoint. When no data arrives on the connection within the timeout,
pending commands reject with `SocketTimeoutError`. By default, node-redis doesn't
reconnect after a socket timeout, which would keep the endpoint out of the failover
set permanently, so you must also supply a `socket.reconnectStrategy` that reconnects
(see [Reconnect after disconnection](/content/develop/clients/nodejs/connect.md#reconnect-after-disconnection)):

```js
const socket = {
  // Health checks keep the connection active, so set this
  // higher than `healthCheck.interval` (5000 ms by default).
  socketTimeout: 10000,
  reconnectStrategy: retries => Math.min(retries * 50, 2000)
};

const { client, controller } = createMultiDbClient({
  databases: [
    {
      id: 'east',
      options: { url: 'redis://redis-east.example.com:14000', socket },
      weight: 1
    },
    {
      id: 'west',
      options: { url: 'redis://redis-west.example.com:14000', socket },
      weight: 0.5
    }
  ]
});
```

### Circuit breaker configuration

The `failureDetector` option configures the circuit breaker
(see [Detecting connection problems](/content/develop/clients/failover.md#detecting-connection-problems) for more information on how the
circuit breaker works). The circuit breaker triggers a failover when both
`minNumOfFailures` and `failureRateThreshold` are reached within the sliding window:

| Option | Description |
| --- | --- |
| `windowSize` | Duration in milliseconds to keep failures and successes in the sliding window. Default is `2000`. |
| `minNumOfFailures` | Minimum number of failures that must occur to trigger a failover. Set this to `0` to use only the failure rate. Default is `1000`. |
| `failureRateThreshold` | Percentage of failed commands required to trigger a failover. Set this to `0` to use only the number of failures. Default is `10`. |
| `errorFilter` | Function that decides which errors count as failures. Default is `defaultErrorFilter`. |

```js
const { client, controller } = createMultiDbClient({
  databases: [ ... ],
  failureDetector: {
    minNumOfFailures: 500,
    failureRateThreshold: 20,
    windowSize: 5000
  }
});
```

`defaultErrorFilter` counts connection errors, timeouts, and error replies that
report a problem with the server, such as `LOADING`, `BUSY`, `MASTERDOWN`, `CLUSTERDOWN`,
`READONLY`, `NOREPLICAS`, and `MISCONF`. Other error replies, such as `WRONGTYPE` or
`OOM`, are caused by the command rather than the server, so they don't count as failures.
To count extra errors, combine your own test with `defaultErrorFilter`:

```js
import { createMultiDbClient, defaultErrorFilter } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [ ... ],
  failureDetector: {
    errorFilter: err => defaultErrorFilter(err) || err.message.includes('MYERROR')
  }
});
```

### Retries

node-redis doesn't retry commands when a failover happens:

- Commands that are waiting for a reply from the failed server reject with that server's error.
- For standalone and pool endpoints, commands that are queued but not yet sent
  reject with `CommandAbandonedError`. This prevents them from running
  on the failed server when it reconnects later.
- Commands that you issue after the failover go to the new active database.

Handle these errors in your app, and retry the command if it is safe to do so
(see [Retry with backoff](/content/develop/clients/nodejs/error-handling.md#pattern-3-retry-with-backoff)).
The databases replicate asynchronously, so a write that the failed server acknowledged
might not be present on the new active database.

### Failback configuration

Automatic failback is disabled by default. Use the following options to configure it:

| Option | Description |
| --- | --- |
| `autoFallbackInterval` | Time interval in milliseconds between automatic failback attempts. Each attempt switches to a healthy endpoint with a higher weight than the active one, if there is one. Set this to `-1` to disable automatic failback. Default is `-1`. |
| `gracePeriod` | Duration in milliseconds to keep an unhealthy endpoint disabled before checking whether it has recovered. Default is `60000`. |

### General failover configuration

There are also a few other options you can pass to `createMultiDbClient()` to control the failover behavior:

| Option | Description |
| --- | --- |
| `maxFailoverAttempts` | Number of attempts to fail over to a new endpoint before giving up. Default is `10`. |
| `delayBetweenFailoverAttempts` | Time interval in milliseconds between successive failover attempts. Default is `12000`. |
| `initialAvailability` | How many endpoints must pass the initial health check for `connect()` to succeed: `'ALL'`, `'MAJORITY'` (more than half), or `'ONE'`. Default is `'MAJORITY'`. With two endpoints, `'MAJORITY'` means both, so use `'ONE'` if your app should start when one endpoint is down. |
| `failoverStrategy` | Custom strategy object to select the endpoint to fail over to. Default is `WeightBasedStrategy`, which selects the healthy endpoint with the highest weight. |

### Failover events

You may want to take some custom action when a failover occurs. For example, you could log a warning, increment a metric, or externally persist the cluster connection state.

Listen for the `failover` event on the client to detect when the active database changes:

```js
client.on('failover', ({ from, to, reason }) => {
  console.warn(`Failover from ${from} to ${to} (${reason})`);
});
```

The client emits the following events:

| Event | Payload | Emitted when |
| --- | --- | --- |
| `connect` | None | `connect()` starts connecting to the endpoints. |
| `ready` | None | Enough endpoints have passed the initial health check and the client has selected an active database. |
| `end` | None | `close()` or `destroy()` has completed. |
| `failover` | `{ from, to, reason }` | The active database changed. `reason` is one of `failure-detector`, `health-check`, `connection-ended`, `forced`, or `active-removed`. |
| `fallback` | `{ from, to }` | Automatic failback switched to an endpoint with a higher weight. |
| `database-unhealthy` | `{ id, cause }` | An endpoint failed and was disabled. |
| `database-recovered` | `{ id }` | A disabled endpoint passed its health checks again. |
| `all-databases-down` | `{ attempt, maxAttempts }` | A failover attempt found no healthy endpoint (see [Behavior when all endpoints are unhealthy](#behavior-when-all-endpoints-are-unhealthy)). |
| `terminated` | `{ attempts }` | The client used all its failover attempts and stopped. |
| `error` | `Error` | A background task, such as a health check, failed. |
| `member-error` | `{ id, error }` | The internal client for an endpoint reported an error. |
| `member-ready` | `{ id }` | The internal client for an endpoint connected or reconnected. |
| `member-end` | `{ id }` | The internal client for an endpoint stopped trying to reconnect. |

Unlike the client that `createClient()` returns, the failover client doesn't
throw if it emits an `error` event that has no listener.

## Health check configuration

Each health check consists of one or more separate "probes", each of which is a simple
test (such as a [`PING`](/content/commands/ping.md) command) to determine if the
database is available. The results of the separate probes are combined
using a configurable policy to determine if the database is healthy.
node-redis checks every endpoint periodically, including the active one.
A disabled endpoint must pass `numProbes` probes in a row after its `gracePeriod`
to become available again.

The `healthCheck` option accepts the following fields:

| Option | Description |
| --- | --- |
| `interval` | Time interval in milliseconds between successive health checks (each of which may consist of multiple probes). Default is `5000`. |
| `numProbes` | Number of separate probes performed during each health check. Default is `3`. |
| `delayBetweenProbes` | Delay in milliseconds between probes during a health check. Default is `500`. |
| `timeout` | Timeout in milliseconds for each probe. This must be less than `interval`. Default is `3000`. |
| `policy` | Policy for determining database health from the separate probes of a health check: `'ALL'` (all probes must succeed), `'MAJORITY'` (more than half the probes must succeed), or `'ANY'` (at least one probe must succeed). Default is `'ALL'`. |

Use the separate `healthChecks` option to supply a list of health check strategies.
An endpoint is healthy only if all the strategies in the list succeed. The default list
contains just [`DefaultHealthCheck`](#defaulthealthcheck-default).

```js
const { client, controller } = createMultiDbClient({
  databases: [ ... ],
  healthCheck: {
    interval: 2000,
    timeout: 1000,
    numProbes: 2,
    policy: 'MAJORITY'
  }
});
```

Probes use the same connection as your commands. A blocking command such as
[`BLPOP`](/content/commands/blpop.md) with no timeout, or a slow script,
can delay a probe until it times out and trigger a failover from a healthy server.
Run blocking commands on a separate client, or set `healthCheck.timeout`
higher than their longest expected run time.

The sections below explain the available strategies in more detail.

### `DefaultHealthCheck` (default)

The default strategy, `DefaultHealthCheck`, periodically sends a Redis
[`PING`](/content/commands/ping.md) command
and checks that it gives the expected response. Any unexpected response
or error indicates an unhealthy server. Although `DefaultHealthCheck` is
very simple, it is a good basic approach for most Redis deployments.

### `LagAwareHealthCheck` (Redis Software only) {#lag-aware-health-check}

`LagAwareHealthCheck` is designed specifically for
Redis Software [Active-Active](/content/operate/rs/databases/active-active/_index.md)
deployments. It determines the health of the server by using the
[REST API](/content/operate/rs/references/rest-api/_index.md) to check the
synchronization lag between a specific database and the others in the Active-Active
setup. If the lag is within a specified tolerance, the server is considered healthy.

Add a `LagAwareHealthCheck` instance to the `healthChecks` list. The `restEndpoint`
and `bdbUid` options accept either a single value or a function that receives the
endpoint `id`, so you can supply a different value for each endpoint:

```js
import { createMultiDbClient, LagAwareHealthCheck } from 'redis';

const { client, controller } = createMultiDbClient({
  databases: [
    {
      id: 'east',
      options: { url: 'redis://redis-east.example.com:14000' },
      weight: 1
    },
    {
      id: 'west',
      options: { url: 'redis://redis-west.example.com:14000' },
      weight: 0.5
    }
  ],
  healthChecks: [
    new LagAwareHealthCheck({
      restEndpoint: id => id === 'east'
        ? 'https://cluster-east.example.com:9443'
        : 'https://cluster-west.example.com:9443',
      bdbUid: 1,
      credentials: { username: '<username>', password: '<password>' },
      lagTolerance: 5000, // ms
      onProbeError: (err, id) => console.error(`Health check failed for ${id}:`, err)
    })
  ]
});
```

The `LagAwareHealthCheck` constructor accepts the following options:

| Option | Description |
| --- | --- |
| `restEndpoint` | Base URL of the Redis Software cluster's REST API, such as `https://cluster.example.com:9443`. This is the cluster address, not the database endpoint. |
| `bdbUid` | The database's ID in the REST API. |
| `credentials` | Object with `username` and `password` fields for basic authentication. |
| `lagTolerance` | Tolerable synchronization lag between databases in milliseconds. Default is `5000`. |
| `requestTimeout` | REST API request timeout in milliseconds. Default is `3000`. |
| `requestOptions` | Extra options to pass to each `fetch()` request, such as a custom `dispatcher` for TLS settings. |
| `onProbeError` | Function that receives the error and the endpoint `id` when a probe fails. Without it, a misconfigured health check looks the same as an unhealthy database. |

`LagAwareHealthCheck` uses the Node.js built-in `fetch()` function. To trust a custom
certificate authority (CA), either set the `NODE_EXTRA_CA_CERTS` environment variable or pass an
[undici](https://undici.nodejs.org/) `dispatcher` in `requestOptions`.

### Custom health check strategy

You can supply your own custom health check strategy with an object that
has a `probe()` method.
For example, you might use this to integrate with external monitoring tools or
to implement checks that are specific to your application. Add an
instance of your custom class to the `healthChecks` list, as with
[`LagAwareHealthCheck`](#lag-aware-health-check).

`probe()` receives a `target` object with the endpoint's `id` and a `sendCommand()`
method. It must return a promise that resolves to `true` if the endpoint is healthy
or `false` if it isn't. A rejected promise also counts as a failed probe.

The example below
shows a simple custom strategy that sends a Redis [`ECHO`](/content/commands/echo.md)
command and checks for the expected response.

```js
class EchoHealthCheck {
  async probe(target) {
    const reply = await target.sendCommand(['ECHO', 'healthcheck']);
    return reply === 'healthcheck';
  }
}

const { client, controller } = createMultiDbClient({
  databases: [ ... ],
  healthChecks: [new EchoHealthCheck()]
});
```

## Managing databases at runtime

Although you will typically configure all databases during the
initial connection, you can also modify the configuration at runtime.
Use the `controller` object to add and remove database endpoints, and update their weights:

```js
// Get the active database. This returns an object with the
// `id`, `weight`, `circuitState`, and `role` fields.
const active = controller.getActiveDatabase();

// Get all the databases, in configuration order.
const databases = controller.getDatabases();

// Add a database. This runs a health check first and rejects
// if the database is unhealthy, unless you set
// `skipInitialHealthCheck` to `true`.
await controller.addDatabase({
  id: 'south',
  options: { url: 'redis://redis-south.example.com:14000' },
  weight: 0.6
});

// Update the weight of a database.
controller.setWeight('west', 0.9);

// Replace a database with a new configuration.
await controller.replaceDatabase('west', {
  id: 'west-2',
  options: { url: 'redis://redis-west-2.example.com:14000' }
});

// Remove a database from the failover set. If you remove the active
// database, the client fails over to another one first.
await controller.removeDatabase('south');

// Enable automatic failback with a 2-minute interval
// (or pass `false` to disable it).
controller.setAutoFallback(120000);
```

### Manual failover

By default, the client selects the healthy endpoint with the highest weight.
However, you can use `controller.setActiveDatabase()` to select which database to use manually:

```js
// Health-check 'west', then make it the active database.
await controller.setActiveDatabase('west');

// Resume automatic failback.
controller.releasePin();
```

`setActiveDatabase()` runs a health check on the database first and rejects if the
check fails. The client then suspends automatic failback until you call `releasePin()`.
`releasePin()` doesn't switch databases itself: the client stays on the selected
database until automatic failback (if you enabled it) or a failover selects another one.
If the selected database fails, the client fails over automatically and resumes
automatic failback.

If you decide to implement manual failover, you will need a way for external systems to trigger this method in your application. For example, if your application exposes a REST API, you might consider creating a REST endpoint to call `setActiveDatabase()`.

## Pub/Sub and re-subscription

The failover client supports [Pub/Sub](/content/develop/pubsub/_index.md)
messaging with automatic re-subscription during failover.
This means you don't have to detect failovers and re-subscribe manually.
When the active database changes, the client moves all your channel, pattern,
and sharded channel subscriptions to the new active database, and removes them
from the previous one.
This works for all client types except `createMultiDbClientPool()`, which doesn't
support Pub/Sub.

For reliable Pub/Sub delivery during failover, use failover clients
for *both* publishers and subscribers. Use `client.duplicate()` to create a separate
failover client for subscribing. `duplicate()` returns a new `client` and
`controller` pair, which you must connect separately:

```js
const { client: subscriber } = client.duplicate();
await subscriber.connect();

await subscriber.subscribe('news', message => {
  console.log(message);
});

// If a failover happens here, the subscription is automatically
// re-established on the new active database.
await client.publish('news', 'Hello');
```

> [!NOTE]
> Messages published between the failover and the completion of the re-subscription
> are lost. Message loss can also occur if the publisher fails over to the new database
> before the subscriber.

## Transactions and connection state

The connection state for a database doesn't move to the new active database when
a failover happens. This has the following effects:

- **Transactions**: A transaction runs entirely on the database that was active when you
  called `multi()`. If a failover happens before you call `exec()`, `exec()`
  commits nothing and rejects with `WatchError` if you called
  [`WATCH`](/content/commands/watch.md), or `CommandAbandonedError` otherwise.
  Call `multi()` each time you run a transaction, and retry the whole
  `WATCH`/`MULTI`/`EXEC` sequence on `WatchError` (see
  [Watch keys for changes](/content/develop/clients/nodejs/transpipe.md#watch-keys-for-changes)).
- **Scan iterators**: An iterator such as `scanIterator()` reads from the database
  that was active when you created it. After a failover, it rejects with
  `CommandAbandonedError`. Create a new iterator to scan the new active database.
- **`legacy()`**: The callback-based interface that `legacy()` returns always uses
  the database that was active when you created it.
- **Database index**: The [`SELECT`](/content/commands/select.md) command isn't supported.
  Set the `database` option in the `options` for each endpoint instead.
- **`MONITOR`**: The [`MONITOR`](/content/commands/monitor.md) command isn't supported.
  Use a separate client to monitor a specific server.
- **Client-side caching**: Set the `clientSideCache` option in the `options` for each
  endpoint (see
  [Connect using client-side caching](/content/develop/clients/nodejs/connect.md#connect-using-client-side-caching)).
  The `emitInvalidate` option isn't supported.

## Behavior when all endpoints are unhealthy

In the extreme case where no endpoint is healthy, commands reject immediately with a
`TemporarilyUnavailableError`. This indicates that the client is periodically checking
to see if any endpoint becomes healthy again, and emits an `all-databases-down` event
after each unsuccessful attempt. The number of
times it will keep checking is configured by the `maxFailoverAttempts` option and
the delay between attempts is configured by the `delayBetweenFailoverAttempts` option (see [General failover configuration](#general-failover-configuration)). With the default settings, `maxFailoverAttempts` * `delayBetweenFailoverAttempts`
gives a period of 120 seconds to find a healthy endpoint.

If the client exhausts all the available failover attempts before any endpoint becomes
healthy again, it emits a `terminated` event and stops checking. After this, commands reject with
`PermanentlyUnavailableError`. To recover, call `client.connect()` again after a suitable delay:

```js
client.on('terminated', () => {
  setTimeout(() => {
    client.connect().catch(err => console.error('Reconnect failed:', err));
  }, 30000);
});
```

## Troubleshooting

This section lists some common problems and their solutions.

### `connect()` fails when one endpoint is down

With the default `initialAvailability` setting of `'MAJORITY'`, more than half the
endpoints must pass the initial health check, which means both endpoints in a two-endpoint
configuration. Set `initialAvailability` to `'ONE'` to let the client start when only one
endpoint is available (see [General failover configuration](#general-failover-configuration)).

### Excessive or constant health check failures

If all health checks fail, you should first rule out authentication
problems with the Redis server and also make sure there are no persistent
network connectivity problems.

If you are using [`DefaultHealthCheck`](#defaulthealthcheck-default) or a
[custom health check strategy](#custom-health-check-strategy),
check that `healthCheck.timeout` is not too low for your network conditions,
and that no blocking or long-running commands are delaying the probes
(see [Health check configuration](#health-check-configuration)).

For
[`LagAwareHealthCheck`](#lag-aware-health-check), check that `restEndpoint` and `bdbUid`
are set correctly for each endpoint, and use the `onProbeError` option to log the cause
of each failure. Note that health checks might be taking longer to
execute than you anticipated, so make sure your `requestTimeout` setting is not too low.

### No failback after recovery

Automatic failback is disabled by default, so the client stays on the failover target
until it fails. Set the `autoFallbackInterval` option to enable automatic failback
(see [Failback configuration](#failback-configuration)).

If you set `socket.socketTimeout`, check that your `reconnectStrategy` reconnects
after a socket timeout (see
[Timeouts for unresponsive servers](#timeouts-for-unresponsive-servers)). Otherwise,
the endpoint stops reconnecting and never becomes available again.

### Slow failback after recovery

If failback is too slow after a server recovers, you can try
reducing the `autoFallbackInterval` and `healthCheck.interval` periods and also reducing the `gracePeriod`
before failback is attempted (see [Failback configuration](#failback-configuration) and
[Health check configuration](#health-check-configuration)
for more information about these options).
