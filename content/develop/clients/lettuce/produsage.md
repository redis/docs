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
description: Get your Lettuce app ready for production
linkTitle: Production usage
title: Production usage
weight: 50
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

{{< checklist "lettuceprodlist" >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#cluster-topology-refresh">}}Cluster topology refresh{{< /checklist-item >}}
    {{< checklist-item "#dns-cache-and-redis" >}}DNS cache and Redis{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
    {{< checklist-item "#connection-and-execution-reliability" >}}Connection and execution reliability{{< /checklist-item >}}
    {{< checklist-item "#seamless-client-experience" >}}Seamless client experience{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

## Timeouts

Lettuce provides timeouts for many operations, such as command execution, SSL handshake, and Sentinel discovery. By default, Lettuce uses a global timeout value of 60 seconds for these operations, but you can override the global timeout value with individual timeout values for each operation.

{{% alert title="Tip" color="warning" %}}
Choosing suitable timeout values is crucial for your application's performance and stability and is specific to each environment.
Configuring timeouts is only necessary if you have issues with the default values. 
In some cases, the defaults are based on environment-specific settings (e.g., operating system settings), while in other cases, they are built into the Lettuce driver. 
For more details on setting specific timeouts, see the [Lettuce reference guide](https://redis.github.io/lettuce/).
{{% /alert  %}}

### Prerequisites

To set TCP-level timeouts, you need to ensure you have one of [Netty Native Transports](https://netty.io/wiki/native-transports.html) installed. The most common one is `netty-transport-native-epoll`, which is used for Linux systems. You can add it to your project by including the following dependency in your `pom.xml` file:

```xml
<dependency>
    <groupId>io.netty</groupId>
    <artifactId>netty-transport-native-epoll</artifactId>
    <version>${netty.version}</version> <!-- e.g., 4.1.118.Final -->
    <classifier>linux-x86_64</classifier>
</dependency>
```

Once you have the native transport dependency, you can verify that by using the following code:

```java
logger.info("Lettuce epool is available: {}", EpollProvider.isAvailable());
```

If the snippet above returns `false`, you need to enable debugging logging for `io.lettuce.core` and `io.netty` to see why the native transport is not available.

For more information on using Netty Native Transport, see the [Lettuce reference guide](https://redis.github.io/lettuce/advanced-usage/#native-transports).

### Setting timeouts

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

## Cluster topology refresh

The Redis Cluster configuration is dynamic and can change at runtime. 
New nodes may be added, and the primary node for a specific slot can shift.
Lettuce automatically handles [MOVED]({{< relref "/operate/oss_and_stack/reference/cluster-spec#moved-redirection" >}}) and [ASK]({{< relref "/operate/oss_and_stack/reference/cluster-spec#ask-redirection" >}}) redirects, but to enhance your application's resilience, you should enable adaptive topology refreshing:

```java
RedisURI redisURI = RedisURI.Builder
        .redis("localhost")
        // set the global default from the default 60 seconds to 30 seconds
        .withTimeout(Duration.ofSeconds(30)) 
        .build();
        
// Create a RedisClusterClient with adaptive topology refresh
try (RedisClusterClient clusterClient = RedisClusterClient.create(redisURI)) {
    // Enable TCP keep-alive and TCP user timeout just like in the standalone example
    SocketOptions.TcpUserTimeoutOptions tcpUserTimeout = SocketOptions.TcpUserTimeoutOptions.builder()
            .tcpUserTimeout(Duration.ofSeconds(20))
            .enable()
            .build();

    SocketOptions.KeepAliveOptions keepAliveOptions = SocketOptions.KeepAliveOptions.builder()
            .interval(Duration.ofSeconds(5))
            .idle(Duration.ofSeconds(5))
            .count(3)
            .enable()
            .build();

    SocketOptions socketOptions = SocketOptions.builder()
            .tcpUserTimeout(tcpUserTimeout)
            .keepAlive(keepAliveOptions)
            .build();

    // Enable adaptive topology refresh
    // Configure adaptive topology refresh options
    ClusterTopologyRefreshOptions topologyRefreshOptions = ClusterTopologyRefreshOptions.builder()
            .enableAllAdaptiveRefreshTriggers()
            .adaptiveRefreshTriggersTimeout(Duration.ofSeconds(30))
            .build();
    
    ClusterClientOptions options = ClusterClientOptions.builder()
            .topologyRefreshOptions(topologyRefreshOptions)
            .socketOptions(socketOptions).build();

    clusterClient.setOptions(options);

    StatefulRedisClusterConnection<String, String> connection = clusterClient.connect();
    System.out.println(connection.sync().ping());
    connection.close();
}
```
Learn more about topology refresh configuration settings in [the reference guide](https://redis.github.io/lettuce/ha-sharding/#redis-cluster).


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

## Exception handling

Redis handles many errors using return values from commands, but there
are also situations where exceptions can be thrown. In production code,
you should handle exceptions as they occur.

See the Error handling sections of the
[Lettuce async](https://redis.github.io/lettuce/user-guide/async-api/#error-handling) and
[Lettuce reactive](https://redis.github.io/lettuce/user-guide/reactive-api/#error-handling)
API guides to learn more about handling exceptions.


## Connection and execution reliability

By default, Lettuce uses an *at-least-once* strategy for command execution.
It will automatically reconnect after a disconnection and resume executing
any commands that were queued when the connection was lost. If you
switch to *at-most-once* execution, Lettuce will
not reconnect after a disconnection and will discard commands
instead of queuing them. You can enable at-most-once execution by setting
`autoReconnect(false)` in the
`ClientOptions` when you create the client, as shown in the example below:

```java
RedisURI uri = RedisURI.Builder
                .redis("localhost", 6379)
                .withAuthentication("default", "yourPassword")
                .build();

RedisClient client = RedisClient.create(uri);

client.setOptions(ClientOptions.builder()
    .autoReconnect(false)
        .
        .
    .build());
```

If you need finer control over which commands you want to execute in which mode, you can
configure a *replay filter* to choose the commands that should retry after a disconnection.
The example below shows a filter that retries all commands except for
[`DECR`]({{< relref "/commands/decr" >}})
(this command is not [idempotent](https://en.wikipedia.org/wiki/Idempotence) and
so you might need to avoid executing it more than once). Note that
replay filters are only available in in Lettuce v6.6 and above.

```java
Predicate<RedisCommand<?, ?, ?> > filter =
        cmd -> cmd.getType().toString().equalsIgnoreCase("DECR");

client.setOptions(ClientOptions.builder()
    .replayFilter(filter)
    .build());
```

See
[Command execution reliability](https://redis.github.io/lettuce/advanced-usage/#command-execution-reliability)
in the Lettuce reference guide for more information.

## Seamless client experience

*Seamless client experience (SCE)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.

See [Seamless client experience]({{< relref "/develop/clients/sce" >}})
for more information about SCE and
[Connect using Seamless client experience]({{< relref "/develop/clients/lettuce/connect#connect-using-seamless-client-experience-sce" >}})
for example code.
