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
description: Improve reliability using the failover/failback features of Jedis.
linkTitle: Failover/failback
title: Failover and failback
weight: 50
---

Jedis supports [failover and failback](https://en.wikipedia.org/wiki/Failover)
to improve the availability of connections to Redis databases. This page explains
the concepts and describes how to configure Jedis for failover and failback.

## Concepts

You may have [Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}})
or independent Redis servers that are all suitable to serve your app.
Typically, you would prefer some database endpoints over others for a particular
instance of your app (perhaps the ones that are closest geographically to the app server
to reduce network latency). However, if the best endpoint is not available due
to a failure, it is generally better to switch to another, suboptimal endpoint
than to let the app fail completely.

*Failover* is the technique of actively checking for connection failures and
automatically switching to another endpoint when a failure is detected.

{{< image filename="images/failover/failover-client-reconnect.svg" alt="Failover and client reconnection" >}}

The complementary technique of *failback* then involves checking the original
endpoint periodically to see if it has recovered, and switching back to it
when it is available again.

{{< image filename="images/failover/failover-client-failback.svg" alt="Failback: client switches back to original server" width="75%" >}}

### Detecting a failed connection

Jedis uses the [resilience4j](https://resilience4j.readme.io/docs/getting-started)
to detect connection failures using a
[circuit breaker design pattern](https://en.wikipedia.org/wiki/Circuit_breaker_design_pattern).

The circuit breaker is a software component that tracks recent connection
attempts in sequence, recording which ones have succeeded and which have failed.
(Note that many connection failures are transient, so before recording a failure,
the first response should usually be just to retry the connection a few times.)

The status of the connection attempts is kept in a "sliding window", which
is simply a buffer where the least recent item is dropped as each new
one is added.

{{< image filename="images/failover/failover-sliding-window.svg" alt="Sliding window of recent connection attempts" >}}

When the number of failures in the window exceeds a configured
threshold, the circuit breaker declares the server to be unhealthy and triggers
a failover.

### Selecting a failover target

Since you may have multiple Redis servers available to fail over to, Jedis
lets you configure a list of endpoints to try, ordered by priority or
"weight". When a failover is triggered, Jedis selects the highest-weighted
endpoint that is still healthy and uses it for the temporary connection.

### Health checks

Given that the original endpoint had some geographical or other advantage
over the failover target, you will generally want to fail back to it as soon
as it recovers. To detect when this happens, Jedis periodically
runs a "health check" on the server. This can be as simple as
sending a Redis [`ECHO`]({{< relref "/commands/echo" >}})) command and checking
that it gives a response.

You can also configure Jedis to run health checks on the current target
server during periods of inactivity. This can help to detect when the
server has failed and a failover is needed even when your app is not actively
using it.


