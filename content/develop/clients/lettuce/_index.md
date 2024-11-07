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
description: Connect your Lettuce application to a Redis database
linkTitle: Lettuce (Java)
title: Lettuce guide (Java)
weight: 6
---

[Lettuce](https://github.com/redis/lettuce/tree/main/src/main) is an advanced Java client for Redis
that supports synchronous, asynchronous, and reactive connections.
If you only need synchronous connections then you may find the other Java client
[Jedis]({{< relref "/develop/connect/clients/java/jedis" >}}) easier to use.

The sections below explain how to install `Lettuce` and connect your application
to a Redis database.

`Lettuce` requires a running Redis or [Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) server. See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis installation instructions.

## Install

To include Lettuce as a dependency in your application, edit the appropriate dependency file as shown below.

If you use Maven, add the following dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.3.2.RELEASE</version> <!-- Check for the latest version on Maven Central -->
</dependency>
```

If you use Gradle, include this line in your `build.gradle` file:

```
dependencies {
    compileOnly 'io.lettuce:lettuce-core:6.3.2.RELEASE'
}
```

If you wish to use the JAR files directly, download the latest Lettuce and, optionally, Apache Commons Pool2 JAR files from Maven Central or any other Maven repository.

To build from source, see the instructions on the [Lettuce source code GitHub repo](https://github.com/lettuce-io/lettuce-core).

## Connect and test

Connect to a local server using the following code. This example
also stores and retrieves a simple string value to test the connection.

```java
import io.lettuce.core.*;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class ConnectBasicTest {

    public void connectBasic() {
        RedisURI uri = RedisURI.Builder
                .redis("localhost", 6379)
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

### Timeouts

Lettuce provides timeouts for many operations, such as command execution, SSL handshake, and Sentinel discovery. By default, Lettuce uses a global timeout value of 60 seconds for these operations, but you can override the global timeout value with individual timeout values for each operation.

{{% alert title="Tip" color="warning" %}}
Choosing suitable timeout values is crucial for your application's performance and stability and is specific to each environment.
Configuring timeouts is only necessary if you have issues with the default values. 
In some cases, the defaults are based on environment-specific settings (e.g., operating system settings), while in other cases, they are built into the Lettuce driver. 
For more details on setting specific timeouts, see the [Lettuce reference guide](https://redis.github.io/lettuce/).
{{% /alert  %}}

Below is an example of setting socket-level timeouts. The `TCP_USER_TIMEOUT` setting is useful for scenarios where the server stops responding without acknowledging the last request, while the `KEEPALIVE` setting is good for detecting dead connections where there is no traffic between the client and the server.

```java
RedisURI redisURI = RedisURI.Builder
        .redis("localhost")
        // set the global default from the default 60 seconds to 30 seconds
        .withTimeout(Duration.ofSeconds(30)) 
        .build();

try (RedisClient client = RedisClient.create(redisURI)) {
    // or set specific timeouts for things such as the TCP_USER_TIMEOUT and TCP_KEEPALIVE

    // A good general rule of thumb is to follow the rule
    // TCP_USER_TIMEOUT = TCP_KEEP_IDLE+TCP_KEEPINTVL * TCP_KEEPCNT
    // in this case, 20 = 5 + 5 * 3

    SocketOptions.TcpUserTimeoutOptions tcpUserTimeout = SocketOptions.TcpUserTimeoutOptions.builder()
            .tcpUserTimeout(Duration.ofSeconds(20))
            .enable().build();

    SocketOptions.KeepAliveOptions keepAliveOptions = SocketOptions.KeepAliveOptions.builder()
            .interval(Duration.ofSeconds(5))
            .idle(Duration.ofSeconds(5))
            .count(3).enable().build();

    SocketOptions socketOptions = SocketOptions.builder()
            .tcpUserTimeout(tcpUserTimeout)
            .keepAlive(keepAliveOptions)
            .build();

    client.setOptions(ClientOptions.builder()
            .socketOptions(socketOptions)
            .build());

    StatefulRedisConnection<String, String> connection = client.connect();
    System.out.println(connection.sync().ping());
}
```

### Connection pooling

A typical approach with Lettuce is to create a single `RedisClient` instance and reuse it to establish connections to your Redis server(s).
These connections are multiplexed; that is, multiple commands can be run concurrently over a single or a small set of connections, making explicit pooling less practical.
See
[Connection pools and multiplexing]({{< relref "/develop/connect/clients/pools-and-muxing" >}})
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

## DNS cache and Redis

When you connect to a Redis server with multiple endpoints, such as [Redis Enterprise Active-Active](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/), you *must*
disable the JVM's DNS cache. If a server node or proxy fails, the IP address for any database
affected by the failure will change. When this happens, your app will keep
trying to use the stale IP address if DNS caching is enabled.

Use the following code to disable the DNS cache:

```java
java.security.Security.setProperty("networkaddress.cache.ttl","0");
java.security.Security.setProperty("networkaddress.cache.negative.ttl", "0");
```

## Learn more

- [Lettuce reference documentation](https://redis.github.io/lettuce/)
- [Redis commands]({{< relref "/commands" >}})
- [Project Reactor](https://projectreactor.io/)
