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
draft: true
---

Jedis supports [failover and failback](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
the concepts and describes how to configure Jedis for failover and failback.

## Concepts

You may have several [Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}})
or independent Redis servers that are all suitable to serve your app.
Typically, you would prefer to use some database endpoints over others for a particular
instance of your app (perhaps the ones that are closest geographically to the app server
to reduce network latency). However, if the best endpoint is not available due
to a failure, it is generally better to switch to another, suboptimal endpoint
than to let the app fail completely.

*Failover* is the technique of actively checking for connection failures or
unacceptably slow connections and automatically switching to the best available endpoint 
when they occur. This requires you to specify a list of endpoints to try, ordered by priority. The diagram below shows this process:

{{< image filename="images/failover/failover-client-reconnect.svg" alt="Failover and client reconnection" >}}

The complementary technique of *failback* then involves periodically checking the health
of all endpoints that have failed. If any endpoints recover, the failback mechanism
automatically switches the connection to the one with the highest priority. 
This could potentially be repeated until the optimal endpoint is available again.

{{< image filename="images/failover/failover-client-failback.svg" alt="Failback: client switches back to original server" width="75%" >}}

### Detecting connection problems

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
one is added. The buffer can be configured to have a fixed number of items or to
be based on a time window.

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
as it recovers. In the meantime, another server might recover that is
still better than the current failover target, so it might be worth
failing back to that server even if it is not optimal.

Jedis periodically runs a "health check" on each server to see if it has recovered.
The health check can be as simple as
sending a Redis [`ECHO`]({{< relref "/commands/echo" >}}) command and ensuring
that it gives the expected response.

You can also configure Jedis to run health checks on the current target
server during periods of inactivity, even if no failover has occurred. This can
help to detect problems even if your app is not actively using the server.

## Failover configuration

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
clusterConfigs[0] = ClusterConfig.builder(east, config)
    .connectionPoolConfig(poolConfig)
    .weight(1.0f)
    .build();

HostAndPort west = new HostAndPort("redis-west.example.com", 14000);
clusterConfigs[1] = ClusterConfig.builder(west, config)
    .connectionPoolConfig(poolConfig)
    .weight(0.5f)
    .build();
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
| `circuitBreakerSlidingWindowSize()` | `100` | Size of the sliding window (this is the number of calls for a `COUNT_BASED` window or time in seconds, for a `TIME_BASED` window). |
| `circuitBreakerSlidingWindowMinCalls()` | `10` | Minimum number of calls required (per sliding window period) before the circuit breaker will start calculating the error rate or slow call rate. |
| `circuitBreakerFailureRateThreshold()` | `50.0f` | Percentage of failures to trigger the circuit breaker. |
| `circuitBreakerSlowCallRateThreshold()` | `100.0f` | Percentage of slow calls to trigger the circuit breaker. |
| `circuitBreakerSlowCallDurationThreshold()` | `60000` | Duration in milliseconds after which a call is considered slow. |
| `circuitBreakerIncludedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures. By default, it includes just `JedisConnectionException`. |
| `circuitBreakerIgnoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for failure rate calculation. |

### Retry configuration

The `MultiClusterClientConfig` builder has the following options to configure retries:

| Builder method | Default value | Description|
| --- | --- | --- |
| `retryMaxAttempts()` | `3` | Maximum number of retry attempts (including the initial call). |
| `retryWaitDuration()` | `500` | Initial number of milliseconds to wait between retry attempts. |
| `retryWaitDurationExponentialBackoffMultiplier()` | `2` | [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) factor multiplied by the wait duration between retries. For example, with a wait duration of 1 second and a multiplier of 2, the retries would occur after 1s, 2s, 4s, 8s, 16s, and so on. |
| `retryIncludedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures to be retried. By default, it includes just `JedisConnectionException`. |
| `retryIgnoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for retry. |

### Failover callbacks

You may want to take some custom action when a failover occurs.
For example, you could log a warning, increment a metric, 
or externally persist the cluster connection state.

You can provide a custom failover action using a class that
implements `java.util.function.Consumer`. Place
the custom action in the `accept()` method, as shown in the example below.

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.function.Consumer;

public class FailoverReporter implements Consumer<ClusterSwitchEventArgs> {

    @Override
    public void accept(ClusterSwitchEventArgs e) {
        Logger logger = LoggerFactory.getLogger(FailoverReporter.class);
        logger.warn("Jedis failover to cluster: " + e.getClusterName() + " due to " + e.getReason());
    }
}
```

Then, pass an instance of your class to your `MultiPooledConnectionProvider`
to enable the action (see [Failover configuration](#failover-configuration)
above for an example of creating the `MultiPooledConnectionProvider`).

```java
FailoverReporter reporter = new FailoverReporter();
provider.setClusterSwitchListener(reporter);
```

The `accept()` method is now called whenever a failover occurs.

## Health check configuration

There are several strategies available for health checks that you can configure using the
`MultiClusterClientConfig` builder. The sections below explain these strategies
in more detail.

### `EchoStrategy` (default)

The default strategy, `EchoStrategy`, periodically sends a Redis
[`ECHO`]({{< relref "/commands/echo" >}}) command
and checks that it gives the expected response. Any unexpected response
or exception indicates an unhealthy server. Although `EchoStrategy` is
very simple, it is a good basic approach for most Redis deployments.

### `LagAwareStrategy` (preview)

`LagAwareStrategy` (currently in preview) is designed specifically for
Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active" >}})
deployments. It uses the Redis Enterprise REST API to check database availability
and can also optionally check replication lag.

`LagAwareStrategy` determines the health of the server using the
[REST API]({{< relref "/operate/rs/references/rest-api" >}}). The example
below shows how to configure `LagAwareStrategy` and activate it using
the `healthCheckStrategySupplier()` method of the `MultiClusterClientConfig.ClusterConfig`
builder.

```java
BiFunction<HostAndPort, Supplier<RedisCredentials>, MultiClusterClientConfig.StrategySupplier> healthCheckStrategySupplier =
(HostAndPort clusterHostPort, Supplier<RedisCredentials> credentialsSupplier) -> {
  LagAwareStrategy.Config lagConfig = LagAwareStrategy.Config.builder(clusterHostPort, credentialsSupplier)
      .interval(5000)                         // Check every 5 seconds
      .timeout(3000)                          // 3 second timeout
      .extendedCheckEnabled(true)             // Check replication lag
      .build();

  return (hostAndPort, jedisClientConfig) -> new LagAwareStrategy(lagConfig);
};

// Configure REST API endpoint and credentials
Endpoint restEndpoint = new HostAndPort("redis-enterprise-cluster-fqdn", 9443);
Supplier<RedisCredentials> credentialsSupplier = () -> 
    new DefaultRedisCredentials("rest-api-user", "pwd");

MultiClusterClientConfig.StrategySupplier lagawareStrategySupplier = healthCheckStrategySupplier.apply(
    restEndpoint, credentialsSupplier);

MultiClusterClientConfig.ClusterConfig clusterConfig =
    MultiClusterClientConfig.ClusterConfig.builder(hostAndPort, clientConfig)
        .healthCheckStrategySupplier(lagawareStrategySupplier)
        .build();
```

### Custom health check strategy

You can supply your own custom health check strategy by
implementing the `HealthCheckStrategy` interface. For example, you might
use this to integrate with external monitoring tools or to implement
checks that are specific to your application. The example below
shows a simple custom strategy. Pass your custom strategy implementation to the `MultiClusterClientConfig.ClusterConfig`
builder with the `healthCheckStrategySupplier()` method.

```java
MultiClusterClientConfig.StrategySupplier pingStrategy = (hostAndPort, jedisClientConfig) -> {
    return new HealthCheckStrategy() {
        @Override
        public int getInterval() {
            return 1000; // Check every second
        }

        @Override
        public int getTimeout() {
            return 500; // 500ms timeout
        }

        @Override
        public int minConsecutiveSuccessCount() {
            return 1; // Single success required
        }

        @Override
        public HealthStatus doHealthCheck(Endpoint endpoint) {
            try (UnifiedJedis jedis = new UnifiedJedis(hostAndPort, jedisClientConfig)) {
                String result = jedis.ping();
                return "PONG".equals(result) ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
            } catch (Exception e) {
                return HealthStatus.UNHEALTHY;
            }
        }

        @Override
        public void close() {
            // Cleanup resources if needed
        }
    };
};

MultiClusterClientConfig.ClusterConfig clusterConfig =
    MultiClusterClientConfig.ClusterConfig.builder(hostAndPort, clientConfig)
        .healthCheckStrategySupplier(pingStrategy)
        .build();
```

### Disable health checks

To disable health checks completely, use the
`healthCheckEnabled()` method of the `MultiClusterClientConfig.ClusterConfig`
builder:

```java
MultiClusterClientConfig.ClusterConfig clusterConfig =
    MultiClusterClientConfig.ClusterConfig.builder(hostAndPort, clientConfig)
        .healthCheckEnabled(false) // Disable health checks entirely
        .build();
```

## Manual failback

By default, the failback mechanism runs health checks on all servers in the
weighted list and selects the highest-weighted server that is
healthy. However, you can also use the `setActiveCluster()` method of 
`MultiClusterPooledConnectionProvider` to select which cluster to use
manually:

```java
// The `setActiveCluster()` method receives the `HostAndPort` of the
// cluster to switch to.
provider.setActiveCluster(west);
```

Note that `setActiveCluster()` is thread-safe.

If you decide to implement manual failback, you will need a way for external
systems to trigger this method in your application. For example, if your application
exposes a REST API, you might consider creating a REST endpoint to call
`setActiveCluster()`.

## Troubleshooting

This section lists some common problems and their solutions.

### Excessive or constant health check failures

If all health checks fail, you should first rule out authentication
problems with the Redis server and also make sure there are no persistent
network connectivity problems. If you still see frequent or constant
failures, try increasing the timeout for health checks and the
interval between them:

```java
HealthCheckStrategy.Config config = HealthCheckStrategy.Config.builder()
    .interval(5000)                 // Less frequent checks
    .timeout(2000)                  // More generous timeout
    .build();
```

### Slow failback after recovery

If failback is too slow after a server recovers, you can try
increasing the frequency of health checks and reducing the grace
period before failback is attempted (the grace period is the
minimum time after a failover before Jedis will check if a
failback is possible).

```java
HealthCheckStrategy.Config config = HealthCheckStrategy.Config.builder()
    .interval(1000)                    // More frequent checks
    .build();

// Adjust failback timing
MultiClusterClientConfig multiConfig = new MultiClusterClientConfig.Builder(clusterConfigs)
    .gracePeriod(5000)                 // Shorter grace period
    .build();
```
