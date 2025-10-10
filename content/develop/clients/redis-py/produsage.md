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
    {{< checklist-item "#client-side-caching" >}}Client-side caching{{< /checklist-item >}}
    {{< checklist-item "#retries" >}}Retries{{< /checklist-item >}}
    {{< checklist-item "#health-checks" >}}Health checks{{< /checklist-item >}}
    {{< checklist-item "#exception-handling" >}}Exception handling{{< /checklist-item >}}
    {{< checklist-item "#timeouts" >}}Timeouts{{< /checklist-item >}}
    {{< checklist-item "#seamless-client-experience" >}}Smart client handoffs{{< /checklist-item >}}
{{< /checklist >}}

## Recommendations

The sections below offer recommendations for your production environment. Some
of them may not apply to your particular use case.

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

`redis-py` can retry commands automatically when
errors occur. From version 6.0.0 onwards, the default behavior is to
attempt a failed command three times.
The timing between successive attempts is calculated using
[exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
with some random "jitter" added to avoid two or more connections retrying
commands in sync with each other.

You can override the default behavior using an instance of the `Retry` class to
specify the number of times to retry after a failure along with your
own choice of backoff strategy.
Pass the `Retry` object in the `retry` parameter when you connect.
For example, the connection in the code below uses an exponential backoff strategy
(without jitter) that will make eight repeated attempts after a failure:

```py
from redis.backoff import ExponentialBackoff
from redis.retry import Retry

# Run 8 retries with exponential backoff strategy.
retry = Retry(ExponentialBackoff(), 8)

r = Redis(
  retry=retry,
    .
    .
)
```

A retry is triggered when a command throws any exception
listed in the `supported_errors` attribute of the `Retry` class.
By default, the list only includes `ConnectionError` and `TimeoutError`,
but you can set your own choice of exceptions when you create the
instance:

```py
# Only retry after a `TimeoutError`.
retry = Retry(ExponentialBackoff(), 3, supported_errors=(TimeoutError,))
```

You can also add extra exceptions to the default list using the `retry_on_error`
parameter when you connect:

```py
# Add `BusyLoadingError` to the default list of exceptions.
from redis.exceptions import (
   BusyLoadingError,
)
    .
    .

r = Redis(
  retry=retry,
  retry_on_error=[BusyLoadingError],
    .
    .
)
```

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
waiting for a user to report them. Note that health checks, like
other commands, will be [retried](#retries) using the strategy
that you specified for the connection.

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
  [index]({{< relref "/develop/ai/search-and-query/indexing" >}})
  with a name that already exists, and using an invalid ID for a
  [stream entry]({{< relref "/develop/data-types/streams/#entry-ids" >}}).
- `TimeoutError`: Thrown when a timeout persistently happens for a command,
  despite any [retries](#retries).
- `WatchError`: Thrown when a
  [watched key]({{< relref "/develop/clients/redis-py/transpipe#watch-keys-for-changes" >}}) is
  modified during a transaction.

### Timeouts

After you issue a command or a connection attempt, the client will wait
for a response from the server. If the server doesn't respond within a
certain time limit, the client will throw a `TimeoutError`. By default,
the timeout happens after 10 seconds for both connections and commands, but you
can set your own timeouts using the `socket_connect_timeout` and `socket_timeout` parameters
when you connect:

```py
# Set a 15-second timeout for connections and a
# 5-second timeout for commands.
r = Redis(
  socket_connect_timeout=15,
  socket_timeout=5,
    .
    .
)
```

Take care to set the timeouts to appropriate values for your use case.
If you use timeouts that are too short, then `redis-py` might retry
commands that would have succeeded if given more time. However, if the
timeouts are too long, your app might hang unnecessarily while waiting for a
response that will never arrive.

### Smart client handoffs

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client take action to avoid disruptions in service.

See [Smart client handoffs]({{< relref "/develop/clients/sch" >}})
for more information about SCH and
[Connect using Smart client handoffs]({{< relref "/develop/clients/redis-py/connect#connect-using-smart-client-handoffs-sch" >}})
for example code.
