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
description: Connect your Java application to a Redis database
linkTitle: Connect
title: Connect to the server
weight: 2
---

Start by creating a connection to your Redis server. There are many ways to achieve this using Lettuce. Here are a few.

## Basic connection

```java
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class ConnectBasicTest {

    public void connectBasic() {
        RedisURI uri = RedisURI.Builder
                .redis("localhost", 6379)
                .withAuthentication("default", "yourPassword")
                .build();
        RedisClient client = RedisClient.create(uri);
        StatefulRedisConnection<String, String> connection = client.connect();
        RedisCommands<String, String> commands = connection.sync();

        commands.set("foo", "bar");
        String result = commands.get("foo");
        System.out.println(result); // >>> bar

        connection.close();

        client.shutdown();
    }
}
```

## Connect to a Redis cluster

To connect to a Redis cluster, use `RedisClusterClient`. 

```java
import io.lettuce.core.cluster.RedisClusterClient;
import io.lettuce.core.cluster.api.StatefulRedisClusterConnection;

//...
try (RedisClusterClient clusterClient = RedisClusterClient.create(redisURI)) {    
    StatefulRedisClusterConnection<String, String> connection = clusterClient.connect();
        
    //...
    
    connection.close();    
}
```

Learn more about Cluster connections and how to configure them in [the reference guide](https://redis.github.io/lettuce/ha-sharding/#redis-cluster).

## Asynchronous connection

```java
package org.example;
import java.util.*;
import java.util.concurrent.ExecutionException;

import io.lettuce.core.*;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.api.StatefulRedisConnection;

public class Async {
  public static void main(String[] args) {
    RedisClient redisClient = RedisClient.create("redis://localhost:6379");

    try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
      RedisAsyncCommands<String, String> asyncCommands = connection.async();

      // Asynchronously store & retrieve a simple string
      asyncCommands.set("foo", "bar").get();
      System.out.println(asyncCommands.get("foo").get()); // prints bar

      // Asynchronously store key-value pairs in a hash directly
      Map<String, String> hash = new HashMap<>();
      hash.put("name", "John");
      hash.put("surname", "Smith");
      hash.put("company", "Redis");
      hash.put("age", "29");
      asyncCommands.hset("user-session:123", hash).get();

      System.out.println(asyncCommands.hgetall("user-session:123").get());
      // Prints: {name=John, surname=Smith, company=Redis, age=29}
    } catch (ExecutionException | InterruptedException e) {
      throw new RuntimeException(e);
    } finally {
      redisClient.shutdown();
    }
  }
}
```

Learn more about asynchronous Lettuce API in [the reference guide](https://redis.github.io/lettuce/#asynchronous-api).

## Reactive connection

```java
package org.example;
import java.util.*;
import io.lettuce.core.*;
import io.lettuce.core.api.reactive.RedisReactiveCommands;
import io.lettuce.core.api.StatefulRedisConnection;

public class Main {
  public static void main(String[] args) {
    RedisClient redisClient = RedisClient.create("redis://localhost:6379");

    try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
      RedisReactiveCommands<String, String> reactiveCommands = connection.reactive();

      // Reactively store & retrieve a simple string
      reactiveCommands.set("foo", "bar").block();
      reactiveCommands.get("foo").doOnNext(System.out::println).block(); // prints bar

      // Reactively store key-value pairs in a hash directly
      Map<String, String> hash = new HashMap<>();
      hash.put("name", "John");
      hash.put("surname", "Smith");
      hash.put("company", "Redis");
      hash.put("age", "29");

      reactiveCommands.hset("user-session:124", hash).then(
              reactiveCommands.hgetall("user-session:124")
                  .collectMap(KeyValue::getKey, KeyValue::getValue).doOnNext(System.out::println))
          .block();
      // Prints: {surname=Smith, name=John, company=Redis, age=29}

    } finally {
      redisClient.shutdown();
    }
  }
}
```

Learn more about reactive Lettuce API in [the reference guide](https://redis.github.io/lettuce/#reactive-api).

## Connect to a Redis cluster

```java
import io.lettuce.core.RedisURI;
import io.lettuce.core.cluster.RedisClusterClient;
import io.lettuce.core.cluster.api.StatefulRedisClusterConnection;
import io.lettuce.core.cluster.api.async.RedisAdvancedClusterAsyncCommands;

// ...

RedisURI redisUri = RedisURI.Builder.redis("localhost").withPassword("authentication").build();

RedisClusterClient clusterClient = RedisClusterClient.create(redisUri);
StatefulRedisClusterConnection<String, String> connection = clusterClient.connect();
RedisAdvancedClusterAsyncCommands<String, String> commands = connection.async();

// ...

connection.close();
clusterClient.shutdown();
```

### TLS connection

When you deploy your application, use TLS and follow the [Redis security guidelines]({{< relref "/operate/oss_and_stack/management/security/" >}}).

```java
RedisURI redisUri = RedisURI.Builder.redis("localhost")
                                 .withSsl(true)
                                 .withPassword("secret!") // use your Redis password
                                 .build();

RedisClient client = RedisClient.create(redisUri);
```

## Connection Management in Lettuce

Lettuce uses `ClientResources` for efficient management of shared resources like event loop groups and thread pools.
For connection pooling, Lettuce leverages `RedisClient` or `RedisClusterClient`, which can handle multiple concurrent connections efficiently.

## Connection pooling

A typical approach with Lettuce is to create a single `RedisClient` instance and reuse it to establish connections to your Redis server(s).
These connections are multiplexed; that is, multiple commands can be run concurrently over a single or a small set of connections, making explicit pooling less practical.
See
[Connection pools and multiplexing]({{< relref "/develop/clients/pools-and-muxing" >}})
for more information.

Lettuce provides pool config to be used with Lettuce asynchronous connection methods.

```java
package org.example;
import io.lettuce.core.RedisClient;
import io.lettuce.core.RedisURI;
import io.lettuce.core.TransactionResult;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.async.RedisAsyncCommands;
import io.lettuce.core.codec.StringCodec;
import io.lettuce.core.support.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;

public class Pool {
  public static void main(String[] args) {
    RedisClient client = RedisClient.create();

    String host = "localhost";
    int port = 6379;

    CompletionStage<BoundedAsyncPool<StatefulRedisConnection<String, String>>> poolFuture
        = AsyncConnectionPoolSupport.createBoundedObjectPoolAsync(
            () -> client.connectAsync(StringCodec.UTF8, RedisURI.create(host, port)),
            BoundedPoolConfig.create());

    // await poolFuture initialization to avoid NoSuchElementException: Pool exhausted when starting your application
    AsyncPool<StatefulRedisConnection<String, String>> pool = poolFuture.toCompletableFuture()
        .join();

    // execute work
    CompletableFuture<TransactionResult> transactionResult = pool.acquire()
        .thenCompose(connection -> {

          RedisAsyncCommands<String, String> async = connection.async();

          async.multi();
          async.set("key", "value");
          async.set("key2", "value2");
          System.out.println("Executed commands in pipeline");
          return async.exec().whenComplete((s, throwable) -> pool.release(connection));
        });
    transactionResult.join();

    // terminating
    pool.closeAsync();

    // after pool completion
    client.shutdownAsync();
  }
}
```

In this setup, `LettuceConnectionFactory` is a custom class you would need to implement, adhering to Apache Commons Pool's `PooledObjectFactory` interface, to manage lifecycle events of pooled `StatefulRedisConnection` objects.

## Connect using Seamless client experience (SCE)

*Seamless client experience (SCE)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.
See [Seamless client experience]({{< relref "/develop/clients/sce" >}})
for more information about SCE.

To enable SCE on the client, create a `MaintenanceEventsOptions` object
and pass it to the `ClientOptions` builder using the `supportMaintenanceEvents()` method:

```java
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.protocol.ProtocolVersion;
  .
  .

RedisClient redisClient = RedisClient.create("redis://localhost:6379");
        
MaintenanceEventsOptions maintOptions = MaintenanceEventsOptions.builder()
    // You can also pass `false` as a parameter to `supportMaintenanceEvents()`
    // to explicitly disable SCE.
    .supportMaintenanceEvents()
    .build();

ClientOptions clientOptions = ClientOptions.builder()
    .supportMaintenanceEvents(maintOptions)
    .protocolVersion(ProtocolVersion.RESP3)
    .build();

redisClient.setOptions(clientOptions);

try (StatefulRedisConnection<String, String> connection = redisClient.connect()) {
  .
  .
```

{{< note >}}SCE requires the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, so you must add the option `protocolVersion(ProtocolVersion.RESP3)`
to the `ClientOptions` builder explicitly.
{{< /note >}}
