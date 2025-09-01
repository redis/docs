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
description: Improve reliability using the failover/failback features of Jedis.
linkTitle: Failover/failback
title: Failover and failback
weight: 50
---

Jedis supports [failover and failback](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
the concepts and describes how to configure Jedis for failover and failback.

## Concepts

You may have several [Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}})
or independent Redis servers that are all suitable to serve your app.
Typically, you would prefer some database endpoints over others for a particular
instance of your app (perhaps the ones that are closest geographically to the app server
to reduce network latency). However, if the best endpoint is not available due
to a failure, it is generally better to switch to another, suboptimal endpoint
than to let the app fail completely.

*Failover* is the technique of actively checking for connection failures or
unacceptably slow connections and
automatically switching to another endpoint when they occur. The
diagram below shows this process:

{{< image filename="images/failover/failover-client-reconnect.svg" alt="Failover and client reconnection" >}}

The complementary technique of *failback* then involves checking the original
endpoint periodically to see if it has recovered, and switching back to it
when it is available again:

{{< image filename="images/failover/failover-client-failback.svg" alt="Failback: client switches back to original server" width="75%" >}}

### Detecting a failed connection

Jedis uses the [resilience4j](https://resilience4j.readme.io/docs/getting-started)
library to detect connection problems using a
[circuit breaker design pattern](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern).

The circuit breaker is a software component that tracks the sequence of recent
Redis connection attempts and commands, recording which ones have succeeded and
which have failed.
(Note that many command failures are caused by transient errors such as timeouts,
so before recording a failure, the first response should usually be just to retry
the command a few times.)

The status of the attempted command calls is kept in a "sliding window", which
is simply a buffer where the least recent item is dropped as each new
one is added.

{{< image filename="images/failover/failover-sliding-window.svg" alt="Sliding window of recent connection attempts" >}}

When the number of failures in the window exceeds a configured
threshold, the circuit breaker declares the server to be unhealthy and triggers
a failover.

### Selecting a failover target

Since you may have multiple Redis servers available to fail over to, Jedis
lets you configure a list of endpoints to try, ordered by priority or
"weight". When a failover is triggered, Jedis selects the highest-weighted
endpoint that is still healthy and uses it for the temporary connection.

### Health checks

Given that the original endpoint had some geographical or other advantage
over the failover target, you will generally want to fail back to it as soon
as it recovers. To detect when this happens, Jedis periodically
runs a "health check" on the server. This can be as simple as
sending a Redis [`ECHO`]({{< relref "/commands/echo" >}}) command and checking
that it gives a response.

You can also configure Jedis to run health checks on the current target
server during periods of inactivity. This can help to detect when the
server has failed and a failover is needed even when your app is not actively
using it.

## Configure Jedis for failover

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, Jedis should fail over to
`redis-west`.

First, create some simple configuration for the client and
[connection pool]({{< relref "/develop/clients/jedis/connect#connect-with-a-connection-pool" >}}),
as you would for a standard connection.

```java
JedisClientConfig config = DefaultJedisClientConfig.builder().user("<username>").password("<password>")
    .socketTimeoutMillis(5000).connectionTimeoutMillis(5000).build();

ConnectionPoolConfig poolConfig = new ConnectionPoolConfig();
poolConfig.setMaxTotal(8);
poolConfig.setMaxIdle(8);
poolConfig.setMinIdle(0);
poolConfig.setBlockWhenExhausted(true);
poolConfig.setMaxWait(Duration.ofSeconds(1));
poolConfig.setTestWhileIdle(true);
poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(1));
```

Supply the weighted list of endpoints as an array of `ClusterConfig`
objects. Use the basic configuration objects created above and
use the `weight` option to order the endpoints, with the highest
weight being tried first.

```java
MultiClusterClientConfig.ClusterConfig[] clusterConfigs = new MultiClusterClientConfig.ClusterConfig[2];

HostAndPort east = new HostAndPort("redis-east.example.com", 14000);
clusterConfigs[0] = ClusterConfig.builder(east, config).connectionPoolConfig(poolConfig).weight(1.0f).build();

HostAndPort west = new HostAndPort("redis-west.example.com", 14000);
clusterConfigs[1] = ClusterConfig.builder(west, config).connectionPoolConfig(poolConfig).weight(0.5f).build();
```

Pass the `clusterConfigs` array when you create the `MultiClusterClientConfig` builder.
The builder lets you add several options to configure the
[circuit breaker](#circuit-breaker-configuration) behavior
and [retries](#retry-configuration) (these are explained in more detail below).

```java
MultiClusterClientConfig.Builder builder = new MultiClusterClientConfig.Builder(clusterConfigs);

builder.circuitBreakerSlidingWindowSize(10); // Sliding window size in number of calls
builder.circuitBreakerSlidingWindowMinCalls(1);
builder.circuitBreakerFailureRateThreshold(50.0f); // percentage of failures to trigger circuit breaker

builder.failbackSupported(true); // Enable failback
builder.failbackCheckInterval(1000); // Check every second the unhealthy cluster to see if it has recovered
builder.gracePeriod(10000); // Keep cluster disabled for 10 seconds after it becomes unhealthy

// Optional: configure retry settings
builder.retryMaxAttempts(3); // Maximum number of retry attempts (including the initial call)
builder.retryWaitDuration(500); // Number of milliseconds to wait between retry attempts
builder.retryWaitDurationExponentialBackoffMultiplier(2); // Exponential backoff factor multiplied against wait duration between retries

// Optional: configure fast failover
builder.fastFailover(true); // Force closing connections to unhealthy cluster on failover
builder.retryOnFailover(false); // Do not retry failed commands during failover
```

Finally, build the `MultiClusterClientConfig` and use it to create a `MultiClusterPooledConnectionProvider`. You can now pass this to
the standard `UnifiedJedis` constructor to establish the client connection
(see [Basic connection]({{< relref "/develop/clients/jedis/connect#basic-connection" >}})
for an example).

```java
MultiClusterPooledConnectionProvider provider = new MultiClusterPooledConnectionProvider(builder.build());

UnifiedJedis jedis = new UnifiedJedis(provider);
```

When you use the `UnifiedJedis` instance, Jedis will handle the connection
management and failover transparently.

### Circuit breaker configuration

The `MultiClusterClientConfig` builder lets you pass several options to configure
the circuit breaker:

| Builder method | Default value | Description|
| --- | --- | --- |
| `circuitBreakerSlidingWindowType()` | `COUNT_BASED` | Type of sliding window. `COUNT_BASED` uses a sliding window based on the number of calls, while `TIME_BASED` uses a sliding window based on time. |
| `circuitBreakerSlidingWindowSize()` | `100` | Size of the sliding window in number of calls or time in seconds, depending on the sliding window type. |
| `circuitBreakerSlidingWindowMinCalls()` | `10` | Minimum number of calls required (per sliding window period) before the circuit breaker will start calculating the error rate or slow call rate. |
| `circuitBreakerFailureRateThreshold()` | `50.0f` | Percentage of failures to trigger the circuit breaker. |
| `circuitBreakerSlowCallRateThreshold()` | `100.0f` | Percentage of slow calls to trigger the circuit breaker. |
| `circuitBreakerSlowCallDurationThreshold()` | `60000` | Duration in milliseconds to consider a call as slow. |
| `circuitBreakerIncludedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures. By default, it includes just `JedisConnectionException`. |
| `circuitBreakerIgnoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for failure rate calculation. |

### Retry configuration

The `MultiClusterClientConfig` builder has the following options to configure retries:

| Builder method | Default value | Description|
| --- | --- | --- |
| `retryMaxAttempts()` | `3` | Maximum number of retry attempts (including the initial call). |
| `retryWaitDuration()` | `500` | Number of milliseconds to wait between retry attempts. |
| `retryWaitDurationExponentialBackoffMultiplier()` | `2` | [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) factor multiplied against wait duration between retries. For example, with a wait duration of 1 second and a multiplier of 2, the retries would occur after 1s, 2s, 4s, 8s, 16s, and so on. |
| `retryIncludedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures to be retried. By default, it includes just `JedisConnectionException`. |
| `retryIgnoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for retry. |

### Health check configuration

The general strategy for health checks is to ask the Redis server for a
response that it could only give if it is healthy. 