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
description: Improve reliability using the failover/failback features of client libraries.
linkTitle: Geographic failover
title: Client-side geographic failover
topics:
- failover
- failback
- resilience
- health checks
relatedPages:
- /develop/clients/jedis/failover
- /develop/clients/redis-py/failover
scope: overview
weight: 50
---

Some Redis client libraries support
[Client-side geographic failover](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. Use this page
to get a general overview of the concepts and then see the documentation for
your client library to learn how to configure it for failover and failback:

- [Jedis]({{< relref "/develop/clients/jedis/failover" >}})
- [redis-py]({{< relref "/develop/clients/redis-py/failover" >}}) (preview)

## Concepts

You may have several [Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}})
or independent Redis servers that are all suitable to serve your app.
Typically, you would prefer to use some database endpoints over others for a particular
instance of your app (perhaps the ones that are closest geographically to the app server
to reduce network latency). However, if the best endpoint is not available due
to a failure, it is generally better to switch to another, suboptimal endpoint
than to let the app fail completely.

*Failover* is the technique of actively checking for connection failures or
unacceptably slow connections and automatically switching to the best available endpoint 
when they occur. This requires you to specify a list of endpoints to try, ordered by priority. The diagram below shows this process:

{{< image filename="images/failover/failover-client-reconnect.svg" alt="Failover and client reconnection" >}}

The complementary technique of *failback* then involves periodically checking the health
of all endpoints that have failed. If any endpoints recover, the failback mechanism
automatically switches the connection to the one with the highest priority. 
This could potentially be repeated until the optimal endpoint is available again.

{{< image filename="images/failover/failover-client-failback.svg" alt="Failback: client switches back to original server" width="75%" >}}

### Detecting connection problems

Redis clients use a [circuit breaker design pattern](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern) to detect connection problems.

The circuit breaker is a software component that tracks the sequence of recent
Redis connection attempts and commands, recording which ones have succeeded and
which have failed.
(Note that many command failures are caused by transient errors such as timeouts,
so before recording a failure, the first response should usually be just to retry
the command a few times.)

The status of the attempted command calls is kept in a "sliding window", which
is simply a buffer where the least recent item is dropped as each new
one is added. The buffer can be configured to have a fixed number of failures and/or a failure ratio (specified as a percentage), both based on a time window.

{{< image filename="images/failover/failover-sliding-window.svg" alt="Sliding window of recent connection attempts" >}}

When the number of failures in the window exceeds a configured
threshold, the circuit breaker declares the server to be unhealthy and triggers
a failover.

### Selecting a failover target

Since you may have multiple Redis servers available to fail over to, the client
lets you configure a list of endpoints to try, ordered by priority or
"weight". When a failover is triggered, the client selects the highest-weighted
endpoint that is still healthy and uses it for the temporary connection.

### Health checks

Given that the original endpoint had some geographical or other advantage
over the failover target, you will generally want to fail back to it as soon
as it recovers. In the meantime, another server might recover that is
still better than the current failover target, so it might be worth
failing back to that server even if it is not optimal.

Clients periodically run a "health check" on each server to see if it has recovered.
The health check can be as simple as sending a Redis
[`PING`]({{< relref "/commands/ping" >}}) or
[ECHO]({{< relref "/commands/echo" >}}) command and ensuring that it gives the
expected response.

You can also configure the client to run health checks on the current target
server during periods of inactivity, even if no failover has occurred. This can
help to detect problems even if your app is not actively using the server.
