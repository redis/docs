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

{{< checklist "pyprodlist" >}}
    {{< checklist-item "#connection-pooling" >}}Connection pooling{{< /checklist-item >}}
    {{< checklist-item "#client-side-caching" >}}Client-side caching{{< /checklist-item >}}
    {{< checklist-item "#retries" >}}Retries{{< /checklist-item >}}
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

You can configure `redis-py` to retry commands automatically when
errors occur. Use an instance of the `Retry` class to
specify the number of times to retry after a failure. You can also
specify a backoff strategy to control the time gap between attempts.
For example, the following code creates a `Retry` with
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
(to retry only after timeout errors), or pass a list of exception
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

For a connection to a Redis cluster, you can specify a `retry` instance,
but the list of exceptions is not configurable and is always set
to `TimeoutError`, `ConnectionError`, and `ClusterDownError`.

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
you should handle exceptions wherever they can occur. 

Import the exceptions you need to check from the `redis.exceptions`
module. The list below describes some of the most common exceptions.

- `ConnectionError`: Thrown when a connection attempt fails
  (for example, when connection parameters are invalid or the server
  is unavailable) and sometimes when a [health check](#health-checks)
  fails. There is also a subclass, `AuthenticationError`, specifically
  for authentication failures.
- `ResponseError`: Thrown when you attempt an operation that has no valid
  response. Examples include executing a command on the wrong type of key
  (as when you try an
  ['LPUSH']({{< relref "/develop/data-types/lists#automatic-creation-and-removal-of-keys" >}})
  command on a string key), creating an
  [index]({{< relref "/develop/interact/search-and-query/indexing" >}})
  with a name that already exists, and using an invalid ID for a
  [stream entry]({{< relref "/develop/data-types/streams/#entry-ids" >}}).
- `TimeoutError`: Thrown when a timeout persistently happens for a command,
  despite any [retries](#retries).
- `WatchError`: Thrown when a
  [watched key]({{< relref "/develop/clients/redis-py/transpipe#watch-keys-for-changes" >}}) is
  modified during a transaction.
