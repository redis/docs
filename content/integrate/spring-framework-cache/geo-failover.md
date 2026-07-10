---
LinkTitle: Geographic failover
Title: Client-side geographic failover
alwaysopen: false
categories:
- docs
- integrate
- stack
- oss
- rs
- rc
- oss
- client
description: Configure resilient, failover-aware Redis connections in a Spring Data
  Redis application.
group: framework
summary: Use client-side geographic failover from a Spring Data Redis application
  to automatically switch between Redis endpoints when one becomes unavailable.
type: integration
weight: 20
bannerText: This feature is currently in preview and may be subject to change.
relatedPages:
- /develop/clients/failover
- /develop/clients/lettuce/failover
- /develop/clients/jedis/failover
---

[Client-side geographic failover]({{< relref "/develop/clients/failover" >}})
improves the availability of your connections to Redis: if the endpoint your
application is using fails or becomes too slow, the client automatically switches
to another healthy endpoint, and then fails back when the preferred endpoint
recovers. See [Client-side geographic failover]({{< relref "/develop/clients/failover" >}})
for an overview of the concepts, including failover, failback, and health checks.

Spring Data Redis does not yet expose this feature through its own configuration.
However, Spring Data Redis works with both the [Lettuce]({{< relref "/develop/clients/lettuce" >}})
and [Jedis]({{< relref "/develop/clients/jedis" >}}) clients, and both
provide a `MultiDbClient` failover API. You can therefore use failover as a workaround:
configure a failover-aware client as a Spring bean, then use it throughout your
application. This page shows how to do this with either client. Select the tab for
the client you use.

## Requirements

- [Spring Data Redis 4.1.x](https://github.com/spring-projects/spring-data-redis/releases/tag/4.1.0) or later.
- Two or more Redis endpoints that can serve your application. These can be two standalone Redis servers or two [Active-Active]({{< relref "/operate/rs/databases/active-active" >}}) database endpoints in different locations.
- To use failover with **Lettuce**, ensure your project uses a Lettuce version that provides the failover API (`io.lettuce.core.failover`). Spring Data Redis pulls in Lettuce transitively, so you may need to override the managed Lettuce version to one that includes it.
- To use failover with **Jedis**, use Jedis 7 or later (which provides `MultiDbClient`) and add the `resilience4j` dependencies. See the [Jedis client-side geographic failover]({{< relref "/develop/clients/jedis/failover" >}}) page for the full dependency list.

## Configure a failover-aware client

Define a Spring [configuration class](https://docs.spring.io/spring-framework/reference/core/beans/java/configuration-annotation.html)
that creates a `MultiDbClient` with one entry for each endpoint and exposes it as a
bean. The `weight` orders the endpoints: the client tries the highest-weighted
healthy endpoint first and uses lower-weighted endpoints only while the preferred
one is unhealthy.

{{< multitabs id="failover-config"
    tab1="Lettuce"
    tab2="Jedis" >}}

```java
import io.lettuce.core.RedisURI;
import io.lettuce.core.failover.MultiDbClient;
import io.lettuce.core.failover.api.DatabaseConfig;
import io.lettuce.core.failover.api.InitializationPolicy;
import io.lettuce.core.failover.api.MultiDbOptions;
import io.lettuce.core.failover.api.StatefulRedisMultiDbConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class MultiDbCacheConfig {

    // The higher weight is tried first; the lower-weighted node is used
    // only while the primary is unhealthy.
    private static final String PRIMARY_URI = "redis://localhost:6379";
    private static final float PRIMARY_WEIGHT = 1.0f;

    private static final String SECONDARY_URI = "redis://localhost:6380";
    private static final float SECONDARY_WEIGHT = 0.5f;

    @Bean(destroyMethod = "shutdown")
    public MultiDbClient failoverClient() {
        // No healthCheckStrategySupplier() is set, so the default PingStrategy
        // is used: a periodic PING with the library defaults.
        DatabaseConfig primary   = DatabaseConfig.builder(RedisURI.create(PRIMARY_URI)).weight(PRIMARY_WEIGHT).build();
        DatabaseConfig secondary = DatabaseConfig.builder(RedisURI.create(SECONDARY_URI)).weight(SECONDARY_WEIGHT).build();

        // ONE_AVAILABLE lets the client start as long as at least one node is
        // up. Failback to the higher-weighted node is enabled by default.
        MultiDbOptions options = MultiDbOptions.builder()
                .initializationPolicy(InitializationPolicy.BuiltIn.ONE_AVAILABLE)
                .build();

        MultiDbClient client = MultiDbClient.create(List.of(primary, secondary), options);
        return client;
    }

    @Bean(destroyMethod = "close")
    public StatefulRedisMultiDbConnection<String, String> failoverConnection(MultiDbClient failoverClient) {
        // Same surface as a normal StatefulRedisConnection (sync/async/reactive),
        // but routing and failover are handled inside the connection.
        return failoverClient.connect();
    }
}
```

With Lettuce, the `MultiDbClient` produces a `StatefulRedisMultiDbConnection`, which
offers the same synchronous, asynchronous, and reactive APIs as an ordinary Lettuce
connection.

-tab-sep-

```java
import redis.clients.jedis.DefaultJedisClientConfig;
import redis.clients.jedis.HostAndPort;
import redis.clients.jedis.JedisClientConfig;
import redis.clients.jedis.MultiDbClient;
import redis.clients.jedis.MultiDbConfig;
import redis.clients.jedis.MultiDbConfig.DatabaseConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MultiDbCacheConfig {

    @Bean(destroyMethod = "close")
    public MultiDbClient failoverClient() {
        JedisClientConfig config = DefaultJedisClientConfig.builder().build();

        HostAndPort primary = new HostAndPort("localhost", 6379);
        HostAndPort secondary = new HostAndPort("localhost", 6380);

        // The higher weight is tried first; the lower-weighted node is used
        // only while the primary is unhealthy. The default PingStrategy health
        // check is used, and failback is enabled by default.
        MultiDbConfig multiConfig = MultiDbConfig.builder()
                .database(DatabaseConfig.builder(primary, config).weight(1.0f).build())
                .database(DatabaseConfig.builder(secondary, config).weight(0.5f).build())
                .build();

        return MultiDbClient.builder()
                .multiDbConfig(multiConfig)
                .build();
    }
}
```

With Jedis, `MultiDbClient` implements the standard Redis commands directly (like
`RedisClient`) and handles connection management and failover transparently. See the
[Jedis client-side geographic failover]({{< relref "/develop/clients/jedis/failover" >}})
page for the required `resilience4j` dependencies and the full set of configuration
options.

{{< /multitabs >}}

The examples above hard-code the endpoints and weights for clarity. In a real
application, you would typically supply them from an external property source,
such as `application.yaml`, using
[Spring Boot configuration properties](https://docs.spring.io/spring-boot/reference/features/external-config.html).

## Use the client

Inject the failover-aware bean wherever you need it. Your code does not need to know
about the failover behavior: every command runs against the endpoint that the client
currently considers healthy, so if the active endpoint fails, the next command is
served by another endpoint without any change to your code.

{{< multitabs id="failover-usage"
    tab1="Lettuce"
    tab2="Jedis" >}}

```java
import io.lettuce.core.SetArgs;
import io.lettuce.core.api.sync.RedisCommands;
import io.lettuce.core.failover.api.StatefulRedisMultiDbConnection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CacheController {

    private final RedisCommands<String, String> redis;

    public CacheController(StatefulRedisMultiDbConnection<String, String> connection) {
        // .sync() is the same API as on a plain StatefulRedisConnection;
        // the multi-db connection just transparently routes the command.
        this.redis = connection.sync();
    }

    @GetMapping("/api/cache/{key}")
    public String get(@PathVariable String key) {
        String value = redis.get(key);          // runs against the active endpoint
        if (value == null) {
            value = expensiveLookup(key);        // compute the value on a miss
            redis.set(key, value, SetArgs.Builder.ex(60));   // SET with a 60s TTL
        }
        return value;
    }

    private static String expensiveLookup(String key) {
        // ... your application logic ...
        return "value-for-" + key;
    }
}
```

-tab-sep-

```java
import redis.clients.jedis.MultiDbClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CacheController {

    private final MultiDbClient redis;

    public CacheController(MultiDbClient redis) {
        // MultiDbClient implements the standard Redis commands, like RedisClient,
        // and routes each command to the currently healthy endpoint.
        this.redis = redis;
    }

    @GetMapping("/api/cache/{key}")
    public String get(@PathVariable String key) {
        String value = redis.get(key);          // runs against the active endpoint
        if (value == null) {
            value = expensiveLookup(key);        // compute the value on a miss
            redis.setex(key, 60, value);         // SET with a 60s TTL
        }
        return value;
    }

    private static String expensiveLookup(String key) {
        // ... your application logic ...
        return "value-for-" + key;
    }
}
```

{{< /multitabs >}}

This approach wires the failover-aware client (or its connection) directly as a bean,
rather than through Spring Data Redis's `RedisConnectionFactory` and `RedisTemplate`.
Any component that issues commands through this bean is routed to the currently healthy
endpoint. Note that, by default, a command already in flight when a failover occurs may
fail rather than being retried on the new endpoint; see the client-specific pages below
for the retry options.

## Observe failover

To make failover transitions visible, register a listener that runs on each switch.

{{< multitabs id="failover-observe"
    tab1="Lettuce"
    tab2="Jedis" >}}

Subscribe to Lettuce's event bus when you create the client. The `DatabaseSwitchEvent`
fires each time the client switches endpoint, and the `AllDatabasesUnhealthyEvent`
fires when no endpoint is available. The example below logs these events, so declare
an SLF4J logger field on the configuration class:

```java
private static final Logger log = LoggerFactory.getLogger(MultiDbCacheConfig.class);
```

Then subscribe to the events in the `failoverClient()` bean method, before returning
the client:

```java
import io.lettuce.core.failover.event.AllDatabasesUnhealthyEvent;
import io.lettuce.core.failover.event.DatabaseSwitchEvent;

client.getResources().eventBus().get()
        .filter(e -> e instanceof DatabaseSwitchEvent)
        .cast(DatabaseSwitchEvent.class)
        .subscribe(e -> log.warn("Redis failover: {} -> {} (reason={})",
                e.getFromDb(), e.getToDb(), e.getReason()));

client.getResources().eventBus().get()
        .filter(e -> e instanceof AllDatabasesUnhealthyEvent)
        .cast(AllDatabasesUnhealthyEvent.class)
        .subscribe(e -> log.error("All Redis nodes unhealthy after {} attempts: {}",
                e.getFailedAttempts(), e.getUnhealthyDatabases()));
```

-tab-sep-

Register a `databaseSwitchListener` on the `MultiDbClient` builder. The example below
logs each switch, so declare an SLF4J logger field on the configuration class:

```java
private static final Logger log = LoggerFactory.getLogger(MultiDbCacheConfig.class);
```

Then add the listener when building the client in the `failoverClient()` bean method:

```java
return MultiDbClient.builder()
        .multiDbConfig(multiConfig)
        .databaseSwitchListener(event ->
                log.warn("Redis failover: switched to {} (reason={})",
                        event.getDatabaseName(), event.getReason()))
        .build();
```

{{< /multitabs >}}

## Health checks and failback

The examples above use the default health check strategy (`PingStrategy`), which
periodically sends a [`PING`]({{< relref "/commands/ping" >}}) command to each
endpoint. Both clients also support a lag-aware strategy for Active-Active databases
and custom strategies, and both enable failback to the higher-weighted endpoint by
default. For the full set of failover, health check, and failback options, see the
client-specific documentation:

- [Lettuce client-side geographic failover]({{< relref "/develop/clients/lettuce/failover" >}})
- [Jedis client-side geographic failover]({{< relref "/develop/clients/jedis/failover" >}})
