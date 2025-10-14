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
one is added. The buffer can be configured to have a fixed number of failures and/or a failure ratio (specified as a percentage), both based on a time window..

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
sending a Redis [`PING`]({{< relref "/commands/ping" >}}) command and ensuring
that it gives the expected response.

You can also configure Jedis to run health checks on the current target
server during periods of inactivity, even if no failover has occurred. This can
help to detect problems even if your app is not actively using the server.

## Failover configuration

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, Jedis should fail over to
`redis-west`.

{{< note >}}Jedis v6 supported failover/failback using a special
`UnifiedJedis` constructor. You should update existing code to use
the approach shown below for Jedis v7 and later.
{{< /note >}}

First, add the `resilience4j` dependencies to your project. If you
are using [Maven](https://maven.apache.org/), add the following
dependencies to your `pom.xml` file:

```xml
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-circuitbreaker</artifactId>
    <version>1.7.1</version>
</dependency>
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-retry</artifactId>
    <version>1.7.1</version>
</dependency>
```

If you are using [Gradle](https://gradle.org/), add the following
dependencies to your `build.gradle` file:

```bash
compileOnly 'io.github.resilience4j:resilience4j-circuitbreaker:1.7.1'
compileOnly 'io.github.resilience4j:resilience4j-retry:1.7.1'
```

In your source file, create some simple configuration for the client and
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

Supply the weighted list of endpoints using the `MultiDbConfig` builder.
Use the `weight` option to order the endpoints, with the highest
weight being tried first.

```java
HostAndPort east = new HostAndPort("redis-east.example.com", 14000);
HostAndPort west = new HostAndPort("redis-west.example.com", 14000);

MultiDbConfig.Builder multiConfig = MultiDbConfig.builder()
        .database(DatabaseConfig.builder(east, config).connectionPoolConfig(poolConfig).weight(1.0f).build())
        .database(DatabaseConfig.builder(west, config).connectionPoolConfig(poolConfig).weight(0.5f).build());
```

The builder lets you add several options to configure the
[circuit breaker](#circuit-breaker-configuration) behavior
and [retries](#retry-configuration) (these are explained in more detail below).

```java
// Configure circuit breaker for failure detection
multiConfig
        .failureDetector(MultiDbConfig.CircuitBreakerConfig.builder()
                .slidingWindowSize(2)        // Sliding window size as a duration in seconds.
                .failureRateThreshold(10.0f)    // Percentage of failures to trigger circuit breaker.
                .minNumOfFailures(1000)          // Minimum number of failures before circuit breaker is tripped.
                .build())
        .failbackSupported(true)                // Enable failback.
        .failbackCheckInterval(120000)          // Check every 2 minutes to see if the unhealthy database has recovered.
        .gracePeriod(60000)                     // Keep database disabled for 60 seconds after it becomes unhealthy.
        // Optional: configure retry settings
        .commandRetry(MultiDbConfig.RetryConfig.builder()
                .maxAttempts(3)                  // Maximum number of retry attempts (including the initial call)
                .waitDuration(500)               // Number of milliseconds to wait between retry attempts.
                .exponentialBackoffMultiplier(2) // Exponential backoff factor multiplied by the wait duration between retries.
                .build())
        // Optional: configure fast failover
        .fastFailover(true)                       // Force closing connections to unhealthy database on failover.
        .retryOnFailover(false);                  // Do not retry failed commands during failover.
```

Finally, use the configuration to build the `MultiDbClient`.

```java
MultiDbClient multiDbClient = MultiDbClient.builder()
        .multiDbConfig(multiConfig.build())
        .build();
```

Like `UnifiedJedis`, `MultiDbClient` implements the usual Redis commands,
but will also handle the connection management and failover transparently.

### Circuit breaker configuration

The `MultiDbConfig.CircuitBreakerConfig` builder lets you pass several options to configure
the circuit breaker:

| Builder method | Default value | Description|
| --- | --- | --- |
| `slidingWindowSize()` | `2` | Duration in seconds to keep failures and successes in the sliding window. |
| `minNumOfFailures()` | `1000` | Minimum number of failures that must occur before the circuit breaker is tripped. |
| `failureRateThreshold()` | `10.0f` | Percentage of failures to trigger the circuit breaker. |
| `includedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures. By default, it includes just `JedisConnectionException`. |
| `ignoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for failure rate calculation. |

### Retry configuration

The `MultiDbConfig.RetryConfig` builder has the following options to configure retries:

| Builder method | Default value | Description|
| --- | --- | --- |
| `maxAttempts()` | `3` | Maximum number of retry attempts (including the initial call). Set to `1` to disable retries. |
| `waitDuration()` | `500` | Initial number of milliseconds to wait between retry attempts. |
| `exponentialBackoffMultiplier()` | `2` | [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) factor multiplied by the wait duration between retries. For example, with a wait duration of 1 second and a multiplier of 2, the retries would occur after 1s, 2s, 4s, 8s, 16s, and so on. |
| `includedExceptionList()` | See description | `List` of `Throwable` classes that should be considered as failures to be retried. By default, it includes just `JedisConnectionException`. |
| `ignoreExceptionList()` | `null` | `List` of `Throwable` classes that should be ignored for retry. |

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

public class FailoverReporter implements Consumer<DatabaseSwitchEvent> {

    @Override
    public void accept(DatabaseSwitchEvent e) {
        System.out.println("Jedis failover to database: " + e.getDatabaseName() + " due to " + e.getReason());
    }
}
```

Use the `databaseSwitchListener()` method of the `MultiDbClient` builder to
register your custom action:

```java
FailoverReporter reporter = new FailoverReporter();
MultiDbClient client = MultiDbClient.builder()
        .databaseSwitchListener(reporter)
        .build();
```

Your `accept()` method is now called whenever a failover occurs.

Since `Consumer` is a functional interface, you can also use a lambda
expression to supply the custom action directly.

```java
MultiDbClient client = MultiDbClient.builder()
        .databaseSwitchListener(
            event -> System.out.println("Switched to: " + event.getEndpoint())
        )
        .build();
```

## Health check configuration

There are several strategies available for health checks that you can configure using the
`MultiClusterClientConfig` builder. The sections below explain these strategies
in more detail.

### `PingStrategy` (default)

The default strategy, `PingStrategy`, periodically sends a Redis
[`PING`]({{< relref "/commands/ping" >}}) command
and checks that it gives the expected response. Any unexpected response
or exception indicates an unhealthy server. Although `PingStrategy` is
very simple, it is a good basic approach for most Redis deployments.

### `LagAwareStrategy` (preview)

`LagAwareStrategy` (currently in preview) is designed specifically for
Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active" >}})
deployments. It uses the Redis Enterprise REST API to check database availability
and can also optionally check replication lag.

`LagAwareStrategy` determines the health of the server using the
[REST API]({{< relref "/operate/rs/references/rest-api" >}}). The example
below shows how to configure `LagAwareStrategy` and activate it using
the `healthCheckStrategySupplier()` method of the `MultiDbConfig.DatabaseConfig`
builder.

```java
BiFunction<HostAndPort, Supplier<RedisCredentials>, MultiDbConfig.StrategySupplier> healthCheckStrategySupplier =
    (HostAndPort dbHostPort, Supplier<RedisCredentials> credentialsSupplier) -> {
        LagAwareStrategy.Config lagConfig = LagAwareStrategy.Config.builder(dbHostPort, credentialsSupplier)
                .interval(5000)                       // Check every 5 seconds
                .timeout(3000)                        // 3 second timeout
                .extendedCheckEnabled(true)
                .build();

        return (hostAndPort, jedisClientConfig) -> new LagAwareStrategy(lagConfig);
    };

    // Configure REST API endpoint and credentials
    HostAndPort restEndpoint = new HostAndPort("redis-enterprise-db-fqdn", 9443);
    Supplier<RedisCredentials> credentialsSupplier = () -> new DefaultRedisCredentials("rest-api-user", "pwd");
    // Build a single LagAwareStrategy based on REST endpoint and credentials
    LagAwareStrategy.Config lagConfig = LagAwareStrategy.Config
        .builder(restEndpoint, credentialsSupplier)
        .interval(5000) // Check every 5 seconds
        .timeout(3000) // 3 second timeout
        .extendedCheckEnabled(true)
        .build();
    MultiDbConfig.StrategySupplier lagAwareStrategySupplier = (hostAndPort,
        jedisClientConfig) -> new LagAwareStrategy(lagConfig);
```

### Custom health check strategy

You can supply your own custom health check strategy by
implementing the `HealthCheckStrategy` interface. For example, you might
use this to integrate with external monitoring tools or to implement
checks that are specific to your application. The example below
shows a simple custom strategy. Pass your custom strategy implementation to the `MultiDbConfig.DatabaseConfig`
builder with the `healthCheckStrategySupplier()` method.

```java
// Custom strategy supplier
MultiDbConfig.StrategySupplier customStrategy =
        (hostAndPort, jedisClientConfig) -> {
            // Return your custom HealthCheckStrategy implementation
            return new MyCustomHealthCheckStrategy(hostAndPort, jedisClientConfig);
        };

MultiDbConfig.DatabaseConfig dbConfig =
        MultiDbConfig.DatabaseConfig.builder(hostAndPort, clientConfig)
                .healthCheckStrategySupplier(customStrategy)
                .weight(1.0f)
                .build();
```

### Disable health checks

To disable health checks completely, use the
`healthCheckEnabled()` method of the `MultiDbConfig.DatabaseConfig`
builder:

```java
MultiDbConfig.DatabaseConfig dbConfig = MultiDbConfig.DatabaseConfig.builder(east, config)
    .healthCheckEnabled(false) // Disable health checks entirely
    .build();
```

## Manual failback

By default, the failback mechanism runs health checks on all servers in the
weighted list and selects the highest-weighted server that is
healthy. However, you can also use the `setActiveDatabase()` method of
`MultiDbClient` to select which database to use manually:

```java
// The `setActiveDatabase()` method receives the `HostAndPort` of the
// cluster to switch to.
client.setActiveDatabase(west);
```

Note that `setActiveDatabase()` is thread-safe.

If you decide to implement manual failback, you will need a way for external
systems to trigger this method in your application. For example, if your application
exposes a REST API, you might consider creating a REST endpoint to call
`setActiveDatabase()`.

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
// Faster recovery configuration
HealthCheckStrategy.Config config = HealthCheckStrategy.Config.builder()
    .interval(1000)                    // More frequent checks
    .build();

// Adjust failback timing
MultiDbConfig multiConfig = MultiDbConfig.builder()
        .gracePeriod(5000)                 // Shorter grace period
        .build();
```
