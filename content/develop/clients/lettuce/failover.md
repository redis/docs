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
description: Improve reliability using the failover features of Lettuce.
linkTitle: Geographic failover
title: Client-side geographic failover
topics:
- failover
- failback
- resilience
- health checks
- retries
relatedPages:
- /develop/clients/failover
scope: [client-specific, implementation]
weight: 50
bannerText: This feature is currently in preview and may be subject to change.
---

Lettuce supports [Client-side geographic failover](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
how to configure Lettuce for failover. For an overview of the concepts,
see the main [Client-side geographic failover]({{< relref "/develop/clients/failover" >}}) page.

## Connection configuration

The example below shows a simple case with a list of two servers,
`redis-east` and `redis-west`, where `redis-east` is the preferred
target. If `redis-east` fails, Lettuce should fail over to
`redis-west`.

In your source file, import the required classes:

```java
import io.lettuce.core.RedisURI;
import io.lettuce.core.failover.DatabaseConfig;
import io.lettuce.core.failover.MultiDbClient;
import io.lettuce.core.failover.MultiDbOptions;
import io.lettuce.core.failover.api.StatefulRedisMultiDbConnection;
```

Supply the weighted endpoints using a `List` of `DatabaseConfig` objects
(see [Selecting a failover target]({{< relref "/develop/clients/failover#selecting-a-failover-target" >}})
for a full description of how the weighted list is used).
Use the `weight` option in the builder to order the endpoints, with the highest
weight being tried first.

```java
RedisURI eastUri = RedisURI.builder()
        .withHost("redis-east.example.com")
        .withPort(6379)
        .withPassword("secret".toCharArray())
        .build();

DatabaseConfig east = DatabaseConfig.builder(eastUri)
        .weight(1.0f)
        .build();

RedisURI westUri = RedisURI.builder()
        .withHost("redis-west.example.com")
        .withPort(6379)
        .withPassword("secret".toCharArray())
        .build();

DatabaseConfig west = DatabaseConfig.builder(westUri)
        .weight(0.5f)
        .build();

List<DatabaseConfig> databases = Arrays.asList(east, west);
```

Pass the list of `DatabaseConfig` objects to a `MultiDbClient` instance
during creation. This class provides the same features as the standard
`RedisClient` class, but will also handle the connection management and failover transparently.
Likewise, the `StatefulRedisMultiDbConnection` implements the same interface
to Redis commands as the standard `StatefulRedisConnection` class.

```java
MultiDbClient client = MultiDbClient.create(databases);

// Connect and use like a regular Redis connection
StatefulRedisMultiDbConnection<String, String> connection = client.connect();

// Execute commands asynchronously - they go to the highest-weighted
// healthy database
connection.async().set("key", "value");
String value = connection.async().get("key").get();

// Clean up
connection.close();
client.shutdown();
```

### Database configuration

Use the `DatabaseConfig` builder to configure each database in the list.
The builder provides the following methods:

| Method | Default | Description |
| --- | --- | --- |
| `weight()` | `1.0f` | Priority weight for database selection. |
| `circuitBreakerConfig()` | Default config | `CircuitBreakerConfig` object to configure failure detection. See [Circuit breaker configuration](#circuit-breaker-configuration) below for details. |
| `healthCheckStrategySupplier()` | `PingStrategy.DEFAULT` | `HealthCheckStrategySupplier` object to configure health checks. See [Health check configuration](#health-check-configuration) below for details. |
| `clientOptions()` | Default options | Per-database `ClientOptions` configuration. |

### Client configuration

Use the `MultiDbOptions` builder to supply global options for the multi-database client
including failback configuration:

| Method | Default | Description |
| --- | --- | --- |
| `failbackSupported()` | `true` | Enable automatic failback to higher-priority databases. |
| `failbackCheckInterval()` | `Duration.ofSeconds(120)` | Interval for checking if failed databases have recovered. |
| `gracePeriod()` | `Duration.ofSeconds(60)` | Time to wait before allowing failback to a recovered database. |
| `delayInBetweenFailoverAttempts()` | `Duration.ofSeconds(12)` | Delay between failover attempts when no healthy database is available. |
| `initializationPolicy()` | `MAJORITY_AVAILABLE` | `InitializationPolicy` enum value for connection initialization. |

The initialization policy is used to decide if the number of healthy databases available
at startup is sufficient to consider the client initialized and ready to use. The
policies are:

- `ALL_AVAILABLE` - All databases must be available.
- `MAJORITY_AVAILABLE` - A majority of databases must be available.
- `ONE_AVAILABLE` - At least one database must be available.

The example below shows how to supply the configuration when you create the client.

```java
MultiDbOptions options = MultiDbOptions.builder()
        .failbackSupported(true)
        .failbackCheckInterval(Duration.ofSeconds(30))
        .gracePeriod(Duration.ofSeconds(10))
        .delayInBetweenFailoverAttempts(Duration.ofSeconds(5))
        .initializationPolicy(InitializationPolicy.ALL_AVAILABLE)
        .build();

MultiDbClient client = MultiDbClient.create(Arrays.asList(db1, db2), options);
```

## Failover configuration

The `DatabaseConfig` builder lets you pass configuration objects to specify
the behavior of the circuit breaker and health checks. These
are described in the sections below.

### Circuit breaker configuration

The `CircuitBreakerConfig` builder lets you pass several options to configure
the circuit breaker, as shown in the example below (see [Detecting connection problems]({{< relref "/develop/clients/failover#detecting-connection-problems" >}}) for more information on how the
circuit breaker works):

```java
import io.lettuce.core.failover.api.CircuitBreakerConfig;

CircuitBreakerConfig cbConfig = CircuitBreakerConfig.builder()
        .failureRateThreshold(50.0f)
        .minimumNumberOfFailures(100)
        .metricsWindowSize(5)
        .build();

DatabaseConfig db = DatabaseConfig.builder(redisUri)
        .circuitBreakerConfig(cbConfig)
        .build();
```

The builder provides the following methods:

| Method | Default value | Description|
| --- | --- | --- |
| `metricsWindowSize()` | `2` | Duration in seconds to keep failures and successes in the sliding window. |
| `minimumNumberOfFailures()` | `1000` | Minimum number of failures that must occur before the circuit breaker is tripped. |
| `failureRateThreshold()` | `10.0f` | Percentage of failures to trigger the circuit breaker. |
| `trackedExceptions()` | See description | `Set` of `Throwable` classes that should be considered as failures. The default set contains `RedisConnectionException`, `IOException`, `ConnectException`, `RedisCommandTimeoutException`, and `TimeoutException`. |

### Failover events

You may want to take some custom action when a failover occurs.
For example, you could log a warning, increment a metric, 
or externally persist the cluster connection state. Lettuce provides
two `Event` classes that you can subscribe to for this purpose,
`DatabaseSwitchEvent` and `AllDatabasesUnhealthyEvent`.

#### `DatabaseSwitchEvent`

Use `DatabaseSwitchEvent` to detect when the client switches to a different database.
The class implements three methods to get information about the event:

- `getFromDb()` - Returns the `RedisURI` of the database that was previously in use.
- `getToDb()` - Returns the `RedisURI` of the database that is now in use.
- `getReason()` - Returns one of the following `SwitchReason` enum values to describe why the switch occurred:
   - `HEALTH_CHECK` - Database failed health check
   - `CIRCUIT_BREAKER` - Circuit breaker opened due to failures
   - `FAILBACK` - Automatic failback to higher-priority database
   - `FORCED` - Manual switch via `switchTo()` (see [Manual failback](#manual-failback) below for details)

The example below shows a simple event handler that logs information about the switch.

```java
import io.lettuce.core.failover.event.DatabaseSwitchEvent;
import io.lettuce.core.failover.event.SwitchReason;

client.getResources().eventBus().get()
        .filter(event -> event instanceof DatabaseSwitchEvent)
        .cast(DatabaseSwitchEvent.class)
        .subscribe(event -> log.info("Switch: {} -> {} ({})",
                event.getFromDb(), event.getToDb(), event.getReason()));
```

#### `AllDatabasesUnhealthyEvent`

Use `AllDatabasesUnhealthyEvent` to detect when all databases become unhealthy.
This class implements two methods to get information about the event:

- `getFailedAttempts()` - Returns the number of consecutive failover attempts that have failed.
- `getUnhealthyDatabases()` - Returns a `List` of `RedisURI` objects for the unhealthy databases.

The example below shows a simple event handler that logs information about the unhealthy databases.

```java
import io.lettuce.core.failover.event.AllDatabasesUnhealthyEvent;

client.getResources().eventBus().get()
        .filter(event -> event instanceof AllDatabasesUnhealthyEvent)
        .cast(AllDatabasesUnhealthyEvent.class)
        .subscribe(event -> log.warn("All databases unhealthy! Attempts: {}, DBs: {}",
                event.getFailedAttempts(), event.getUnhealthyDatabases()));
```

## Health check configuration

Each health check consists of one or more separate "probes", each of which is a simple
test (such as a [`PING`]({{< relref "/commands/ping" >}}) command) to determine if the database is available. The results of the separate probes are combined
using a configurable policy to determine if the database is healthy.

There are several strategies available for health checks that you can deploy using the
`DatabaseConfig` builder. Each strategy is a class that implements the `HealthCheckStrategy` 
interface. Use the constructor of a `HealthCheckStrategy` implementation to pass
a `HealthCheckStrategy.Config` object to configure the health check behavior.
The methods of the base `HealthCheckStrategy` builder are shown in the table below.
Note that some strategies (including your own custom strategies) may use a
subclass of `HealthCheckStrategy.Config` to provide extra options.

| Method | Default value | Description |
| --- | --- | --- |
| `interval()` | `1000` | Interval in milliseconds between health checks. |
| `timeout()` | `1000` | Timeout in milliseconds for health check requests. |
| `numProbes()` | `3` | Number of probes to perform during each health check. |
| `delayInBetweenProbes()` | `100` | Delay in milliseconds between probes during a health check. |
| `policy()` | `ProbingPolicy.BuiltIn.ALL_SUCCESS` | Policy to determine if the database is healthy based on the probe results. The options are `ALL_SUCCESS` (all probes must succeed), `ANY_SUCCESS` (at least one probe must succeed), and `MAJORITY_SUCCESS` (majority of probes must succeed). |

The sections below explain the available strategies in more detail.

### `PingStrategy` (default)

The default strategy, `PingStrategy`, periodically sends a Redis
[`PING`]({{< relref "/commands/ping" >}}) command
and checks that it gives the expected response. Any unexpected response
or exception indicates an unhealthy server. Although `PingStrategy` is
very simple, it is a good basic approach for most Redis deployments.

Although `PingStrategy` is the default, you can still activate it
explicitly using the `healthCheckStrategySupplier()` method of the `DatabaseConfig`
builder. Use this approach if you want to configure the default
`PingStrategy` with custom options, as shown in the example below.

```java
import io.lettuce.core.failover.health.PingStrategy;
import io.lettuce.core.failover.health.HealthCheckStrategy;

HealthCheckStrategy.Config healthConfig = HealthCheckStrategy.Config.builder()
        .interval(5000)                 // Check every 5 seconds
        .timeout(1000)                  // 1 second timeout
        .numProbes(3)                   // 3 probes per check
        .delayInBetweenProbes(500)      // 500ms between probes
        .build();

DatabaseConfig db = DatabaseConfig.builder(redisUri)
        .healthCheckStrategySupplier((uri, factory) ->
                new PingStrategy(factory, healthConfig))
        .build();
```

### `LagAwareStrategy`

`LagAwareStrategy` is designed specifically for
Redis Software [Active-Active]({{< relref "/operate/rs/databases/active-active" >}})
deployments. It uses the Redis Software REST API to check database availability
and can also optionally check replication lag.

`LagAwareStrategy` determines the health of the server using the
[REST API]({{< relref "/operate/rs/references/rest-api" >}}). The example
below shows how to configure and use `LagAwareStrategy`. Note that
`LagAwareStrategy` requires the following dependencies (although they are
added automatically with Lettuce):

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-codec-http</artifactId>
</dependency>
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
</dependency>
```

Configure `LagAwareStrategy` using its configuration builder and then
pass the configured strategy to the `healthCheckStrategySupplier()` method of the `DatabaseConfig`
builder:

```java
import io.lettuce.core.failover.health.LagAwareStrategy;

LagAwareStrategy.Config lagConfig = LagAwareStrategy.Config.builder()
        .restApiUri(URI.create("https://cluster.redis.local:9443"))
        .credentials(() -> RedisCredentials.just("admin", "password"))
        .extendedCheckEnabled(true)  // Enable lag-aware checks
        .availabilityLagTolerance(Duration.ofMillis(100))
        .build();

DatabaseConfig db = DatabaseConfig.builder(redisUri)
        .healthCheckStrategySupplier((uri, factory) -> new LagAwareStrategy(lagConfig))
        .build();
```

The `LagAwareStrategy.Config` builder has the following options in
addition to the standard options provided by `HealthCheckStrategy.Config`:

| Method | Default value | Description|
| --- | --- | --- |
| `restApiUri()` | (required) | URI of the Redis Software REST API. |
| `credentials()` | (required) | Credentials for accessing the REST API. |
| `extendedCheckEnabled()` | `false` | Enable extended lag checking (this includes lag validation in addition to the standard datapath validation). |
| `availabilityLagTolerance()` | `Duration.ofMillis(100)` | Maximum lag tolerance in milliseconds for extended lag checking. |

### Custom health check strategy

You can supply your own custom health check strategy by
implementing the `HealthCheckStrategy` interface. For example, you might
use this to integrate with external monitoring tools or to implement
checks that are specific to your application. The example below
shows a simple custom strategy. Pass your custom strategy implementation to the `DatabaseConfig`
builder with the `healthCheckStrategySupplier()` method, as shown in the example below.

```java
// Custom strategy supplier
public class CustomHealthCheck extends AbstractHealthCheckStrategy {

    public CustomHealthCheck(HealthCheckStrategy.Config config) {
        super(config);
    }

    @Override
    public HealthStatus doHealthCheck(RedisURI endpoint) {
        // Return HealthStatus.HEALTHY, UNHEALTHY, or UNKNOWN
        return checkExternalMonitoringSystem(endpoint)
                ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
    }
}

// Use with healthCheckStrategySupplier()
DatabaseConfig db = DatabaseConfig.builder(redisUri)
        .healthCheckStrategySupplier((uri, factory) ->
                new CustomHealthCheck(HealthCheckStrategy.Config.create()))
        .build();
```

### Disable health checks

To disable health checks completely for a specific database, pass a value of
`HealthCheckStrategySupplier.NO_HEALTH_CHECK` to the
`healthCheckStrategySupplier()` method of the `DatabaseConfig`
builder:

```java
import io.lettuce.core.failover.health.HealthCheckStrategySupplier;

DatabaseConfig db = DatabaseConfig.builder(redisUri)
        .healthCheckStrategySupplier(HealthCheckStrategySupplier.NO_HEALTH_CHECK)
        .build();
```

## Managing databases at runtime

Although you will typically configure all databases during the initial connection, you can also modify the configuration at runtime. The example below shows how to add and remove database endpoints.

```java
StatefulRedisMultiDbConnection<String, String> connection = client.connect();

// Add a new database
RedisURI newDb = RedisURI.create("redis://new-server:6379");
DatabaseConfig newConfig = DatabaseConfig.builder(newDb)
        .weight(0.8f)
        .build();
connection.addDatabase(newConfig);

// Remove a database
connection.removeDatabase(existingUri);
```

### Manual failback

By default, the failback mechanism runs health checks on all servers in the
weighted list and selects the highest-weighted server that is
healthy. However, you can also use the `switchTo()` method of
`MultiDbClient` to select which database to use manually:

```java
StatefulRedisMultiDbConnection<String, String> connection = client.connect();

// Get current endpoint
RedisURI current = connection.getCurrentEndpoint();

// Get all available endpoints
Collection<RedisURI> endpoints = connection.getEndpoints();

// Check if a specific endpoint is healthy
boolean healthy = connection.isHealthy(targetUri);

// Force switch to a specific endpoint
connection.switchTo(targetUri);
```

Note that `switchTo()` is thread-safe.

If you decide to implement manual failback, you will need a way for external
systems to trigger this method in your application. For example, if your application
exposes a REST API, you might consider creating a REST endpoint to call
`switchTo()`.

## Behavior when all endpoints are unhealthy

In the extreme case where no endpoint is healthy, Lettuce will keep trying
indefinitely to reconnect to a healthy endpoint. The frequency of these attempts
is configured by the `delayInBetweenFailoverAttempts()` option in the `MultiDbConfig`
builder (see [Client configuration](#client-configuration)) with
a default value of 12 seconds.

Note that you can subscribe to the `AllDatabasesUnhealthyEvent` event to be notified when
all endpoints become unhealthy (see [Failover events](#failover-events) for more information). Your
event handler could include code to close the connection if the indefinite search for
a healthy endpoint is not suitable for your application (see
[Connection configuration](#connection-configuration) to learn how to close a connection).

## Troubleshooting

This section lists some common problems and their solutions. Note that you can
use debug logging for the failover client to get more information when problems occur.
To enable this, set the log level to `DEBUG` in your logging configuration:

```
logging.level.io.lettuce.core.failover=DEBUG
```

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
minimum time after a failover before Lettuce will check if a
failback is possible).

```java
// Faster recovery configuration
HealthCheckStrategy.Config config = HealthCheckStrategy.Config.builder()
    .interval(1000)                    // More frequent checks
    .build();

// Adjust failback timing
MultiDbOptions multiConfig = MultiDbOptions.builder()
        .gracePeriod(5000)                 // Shorter grace period
        .build();
```
