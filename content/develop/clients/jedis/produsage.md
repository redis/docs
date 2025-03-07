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

The following sections explain how to handle situations that may occur
in your production environment.

### Timeouts

To set a timeout for a connection, use the `JedisPooled` or `JedisPool` constructor with the `timeout` parameter, or use `JedisClientConfig` with the `socketTimeout` and `connectionTimeout` parameters:

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

### Exception handling

The Jedis Exception Hierarchy is rooted on `JedisException`, which implements `RuntimeException`, and are therefore all unchecked exceptions.

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
