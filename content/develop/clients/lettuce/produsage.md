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
weight: 3
---

The following sections explain how to handle situations that may occur
in your production environment.

## Timeouts

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
