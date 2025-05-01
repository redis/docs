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
description: Get your `redis-py` app ready for production
linkTitle: Production usage
title: Production usage
weight: 70
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
    {{< checklist-item "#retries" >}}Retries{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#health-checks" >}}Health checks{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
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
[Connect with a connection pool]({{< relref "/develop/clients/redis-py/connect#connect-with-a-connection-pool" >}})
to learn how to use this technique with `redis-py`.

### Client-side caching

[Client-side caching]({{< relref "/develop/clients/client-side-caching" >}})
involves storing the results from read-only commands in a local cache. If the
same command is executed again later, the results can be obtained from the cache,
without contacting the server. This improves command execution time on the client,
while also reducing network traffic and server load. See
[Connect using client-side caching]({{< relref "/develop/clients/redis-py/connect#connect-using-client-side-caching" >}})
for more information and example code.

### Retries

Redis connections and commands can often fail due to transient problems,
such as temporary network outages or timeouts. When this happens,
the operation will generally succeed after a few attempts, despite
failing the first time.

You can configure `redis-py` to retry connections automatically after
specified errors occur. Use an instance of the `Retry` class to
specify the number of times to retry after a failure and a backoff
strategy to determine the time between attempts. For example, the
following code creates a `Retry` with
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
that will make three repeated attempts after a failure:

```py
from redis.backoff import ExponentialBackoff
from redis.retry import Retry

# Run 3 retries with exponential backoff strategy.
retry = Retry(ExponentialBackoff(), 3)
```

Pass the `Retry` instance in the `retry` parameter when you connect
to Redis. When you are connecting to a standalone Redis server,
you can also set the `retry_on_timeout` parameter to `True`
to retry only after timeout errors, or pass a list of exception
types in the `retry_on_error` parameter.

```py
# Retry only on timeout
r = Redis(
  retry=retry,
  retry_on_timeout=True
    .
    .
)

# Retry on any of a specified list of command exceptions.
from redis.exceptions import (
   BusyLoadingError,
   ConnectionError,
   TimeoutError
)
    .
    .

r = Redis(
  retry=retry,
  retry_on_error=[BusyLoadingError, ConnectionError, TimeoutError],
    .
    .
)
```

If you specify either `retry_on_timeout` or `retry_on_error` without
a `retry` parameter, the default is to retry once immediately with no
backoff.

For a connection to a Redis cluster, you can specify a `retry` instance.
However, the list of exceptions is not configurable and is always set
to `TimeoutError`, `ConnectionError`, and `ClusterDownError`. You can use
the `cluster_error_retry_attempts` parameter to specify the number of
attempts to make after encountering one of these errors:

```py

```

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
every few seconds) to verify that the connection is working.
Set the `health_check_interval` parameter during
a connection (with either `Redis` or `ConnectionPool`) to specify
an integer number of seconds. If the connection remains idle for
longer than this interval, it will automatically issue a
[`PING`]({{< relref "/commands/ping" >}}) command and check the
response before continuing with any client commands.

```py
# Issue a health check if the connection is idle for longer
# than three seconds.
r = Redis(
  health_check_interval = 3,
    .
    .
)
```

Health checks help to detect problems as soon as possible without
waiting for a user to report them. If a `ConnectionError` or `TimeoutError`
occurs for the health check itself, a second attempt will be made before
reporting failure.

### Exception handling

Redis handles many errors using return values from commands, but there
are also situations where exceptions can be thrown. In production code,
you should handle exceptions wherever they can occur. In particular,
exceptions can occur when you
[connect to the server]({{< relref "/develop/clients/redis-py/connect" >}}),
create a [query index]({{< relref "/develop/interact/search-and-query/indexing" >}}),
or execute a
[watched transaction]({{< relref "/develop/clients/redis-py/transpipe#watch-keys-for-changes" >}}).

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
