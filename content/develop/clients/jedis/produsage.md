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
description: Get your Jedis app ready for production
linkTitle: Production usage
title: Production usage
weight: 6
---

This guide offers recommendations to get the best reliability and
performance in your production environment.

## Checklist

Each item in the checklist below links to the section
for a recommendation. Use the checklist icons to record your
progress in implementing the recommendations.

{{< checklist "prodlist" >}}
    {{< checklist-item "#connection-pooling" >}}Connection pooling{{< /checklist-item >}}
    {{< checklist-item "#client-side-caching" >}}Client-side caching{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#health-checks" >}}Health checks{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
    {{< checklist-item "#dns-cache-and-redis" >}}DNS cache and Redis{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

### Connection pooling

Example code often opens a connection at the start, demonstrates a feature,
and then closes the connection at the end. However, production code
typically uses connections many times intermittently. Repeatedly opening
and closing connections has a performance overhead.

Use [connection pooling]({{< relref "/develop/clients/pools-and-muxing" >}})
to avoid the overhead of opening and closing connections without having to
write your own code to cache and reuse open connections. See
[Connect with a connection pool]({{< relref "/develop/clients/jedis/connect#connect-with-a-connection-pool" >}})
to learn how to use this technique with Jedis.

### Client-side caching

[Client-side caching]({{< relref "/develop/clients/client-side-caching" >}})
involves storing the results from read-only commands in a local cache. If the
same command is executed again later, the results can be obtained from the cache,
without contacting the server. This improves command execution time on the client,
while also reducing network traffic and server load. See
[Connect using client-side caching]({{< relref "/develop/clients/jedis/connect#connect-using-client-side-caching" >}})
for more information and example code.

### Timeouts

If a network or server error occurs while your code is opening a
connection or issuing a command, it can end up hanging indefinitely.
You can prevent this from happening by setting timeouts for socket
reads and writes and for opening connections.

To set a timeout for a connection, use the `JedisPooled` or `JedisPool` constructor with the `timeout` parameter, or use `JedisClientConfig` with the `socketTimeout` and `connectionTimeout` parameters.
(The socket timeout is the maximum time allowed for reading or writing data while executing a
command. The connection timeout is the maximum time allowed for establishing a new connection.)

```java
HostAndPort hostAndPort = new HostAndPort("localhost", 6379);

JedisPooled jedisWithTimeout = new JedisPooled(hostAndPort,
    DefaultJedisClientConfig.builder()
        .socketTimeoutMillis(5000)  // set timeout to 5 seconds
        .connectionTimeoutMillis(5000) // set connection timeout to 5 seconds
        .build(),
    poolConfig
);
```

### Health checks

If your code doesn't access the Redis server continuously then it
might be useful to make a "health check" periodically (perhaps once
every few seconds). You can do this using a simple
[`PING`]({{< relref "/commands/ping" >}}) command:

```java
try (Jedis jedis = jedisPool.getResource()) {
  if (! "PONG".equals(jedis.ping())) {
    // Report problem.
  }
}
```

Health checks help to detect problems as soon as possible without
waiting for a user to report them.

### Exception handling

Redis handles many errors using return values from commands, but there
are also situations where exceptions can be thrown. In production code,
you should handle exceptions as they occur.

The Jedis exception hierarchy is rooted on `JedisException`, which implements
`RuntimeException`. All exceptions in the hierarchy are therefore unchecked
exceptions.

```
JedisException
├── JedisDataException
│   ├── JedisRedirectionException
│   │   ├── JedisMovedDataException
│   │   └── JedisAskDataException
│   ├── AbortedTransactionException
│   ├── JedisAccessControlException
│   └── JedisNoScriptException
├── JedisClusterException
│   ├── JedisClusterOperationException
│   ├── JedisConnectionException
│   └── JedisValidationException
└── InvalidURIException
```

#### General exceptions

In general, Jedis can throw the following exceptions while executing commands:

- `JedisConnectionException` - when the connection to Redis is lost or closed unexpectedly. Configure failover to handle this exception automatically with Resilience4J and the built-in Jedis failover mechanism.  
- `JedisAccessControlException` - when the user does not have the permission to execute the command or the user ID and/or password are incorrect.
- `JedisDataException` - when there is a problem with the data being sent to or received from the Redis server. Usually, the error message will contain more information about the failed command.
- `JedisException` - this exception is a catch-all exception that can be thrown for any other unexpected errors.

Conditions when `JedisException` can be thrown:
- Bad return from a health check with the [`PING`]({{< relref "/commands/ping" >}}) command
- Failure during SHUTDOWN
- Pub/Sub failure when issuing commands (disconnect)
- Any unknown server messages
- Sentinel: can connect to sentinel but master is not monitored or all Sentinels are down.
- MULTI or DISCARD command failed 
- Shard commands key hash check failed or no Reachable Shards
- Retry deadline exceeded/number of attempts (Retry Command Executor)
- POOL - pool exhausted, error adding idle objects, returning broken resources to the pool

All the Jedis exceptions are runtime exceptions and in most cases irrecoverable, so in general bubble up to the API capturing the error message.

### DNS cache and Redis

When you connect to a Redis server with multiple endpoints, such as [Redis Enterprise Active-Active](https://redis.com/redis-enterprise/technology/active-active-geo-distribution/), you *must*
disable the JVM's DNS cache. If a server node or proxy fails, the IP address for any database
affected by the failure will change. When this happens, your app will keep
trying to use the stale IP address if DNS caching is enabled.

Use the following code to disable the DNS cache:

```java
java.security.Security.setProperty("networkaddress.cache.ttl","0");
java.security.Security.setProperty("networkaddress.cache.negative.ttl", "0");
```
