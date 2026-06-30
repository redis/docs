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
description: Learn how to avoid disruptions during Redis server maintenance.
linkTitle: Smart client handoffs
title: Smart client handoffs
scope: overview
relatedPages:
- /develop/clients/redis-py/connect#connect-using-smart-client-handoffs-sch
- /develop/clients/nodejs/connect#connect-using-smart-client-handoffs-sch
- /develop/clients/lettuce/connect#connect-using-smart-client-handoffs-sch
- /develop/clients/go/connect#connect-using-smart-client-handoffs-sch
topics:
- smart-client-handoffs
- resilience
weight: 50
---

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Software servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client reconnect or otherwise respond gracefully without significant
interruptions in service.

SCH is primarily useful when server software or hardware upgrades
are required. It provides two main features to help the
client avoid disruptions in service during the maintenance period:

-   **Relaxed timeouts**: Upgrades tend to impact the general performance of the server.
    Advance notification of the upgrade lets a client adjust its command
    timeouts to take this into account and avoid aborting commands too soon.
-   **Pre-handoffs**: Upgrades also involve migrating
    Redis shards to new nodes, which inevitably disconnects clients from
    existing nodes. However, with some advance warning of the disconnection,
    a client can buffer commands, connect to a new node, and then resume
    the buffered commands without aborting any of them. As a result, users
    see no disruption in service. These transparent reconnections to new endpoints
    are known as *pre-handoffs*.

{{< note >}}SCH does not work with blocking connections.
These include connections used for blocking operations like
[`BLPOP`]({{< relref "/commands/blpop" >}}) and also
[pub/sub]({{< relref "/develop/pubsub" >}}) subscriptions.
All non-blocking operations are safe to use with SCH.
{{< /note >}}

## SCH support in Redis client libraries

SCH is enabled automatically on the client side during connection
if you select the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, which is a requirement for SCH. However, you can
configure some parameters, such as the timeouts to use
during maintenance.

The table below lists the Redis client libraries that support SCH,
and the versions that added support for basic connections and
[OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}) connections.

| Client | Basic connection | OSS Cluster API | Client-side geographic failover |
| :-- | :-- | :-- | :-- |
| [redis-py]({{< relref "/develop/clients/redis-py/connect#connect-using-smart-client-handoffs-sch" >}}) | v7.0.0 | v7.2.0 | Disabled |
| [node-redis]({{< relref "/develop/clients/nodejs/connect#connect-using-smart-client-handoffs-sch" >}}) | v5.9.0 | v5.11.0 | Disabled |
| [Lettuce]({{< relref "/develop/clients/lettuce/connect#connect-using-smart-client-handoffs-sch" >}}) | v7.0.0 | - | Disabled |
| [go-redis]({{< relref "/develop/clients/go/connect#connect-using-smart-client-handoffs-sch" >}}) | v9.16.0 | v9.18.0 | Disabled |

{{< note >}}SCH is currently disabled when a client is configured for
[Client-side geographic failover]({{< relref "/develop/clients/failover" >}}).
Integration of the two features is planned for a future release.
{{< /note >}}

## SCH support in Redis server products

### Redis Cloud

SCH is fully supported and enabled by default on Redis Cloud, except when you
are using one of the following options:

- [AWS PrivateLink]({{< relref "/operate/rc/security/aws-privatelink" >}})
- [Google Cloud Private Service Connect]({{< relref "/operate/rc/security/private-service-connect" >}})

These services don't currently allow for pre-handoffs, but you still get the
benefit of relaxed timeouts during database version upgrades. All other
configurations have full support for both relaxed timeouts and pre-handoffs.

### Redis Software

You must enable SCH explicitly on self-managed Redis Software servers by using the
[v1/cluster]({{< relref "/operate/rs/references/rest-api/requests/cluster" >}})
REST API request to set the `client_maint_notifications` option to `true`.
The example below shows how to do this using the
[`curl`](https://curl.se/) command line utility:

```bash
curl -k -X PUT -H "accept: application/json" \
    -H "content-type: application/json" \
    -u "test@redis.com:test123" \
    -d '{ "client_maint_notifications": true }' \
    https://localhost:9443/v1/cluster
```

Redis Software uses relaxed timeouts to avoid command failures during
database version upgrades. SCH is supported for Redis Software from v8.0.2 on,
and OSS Cloud and OSS Cluster API from v8.0.16 on.

The degree of support for pre-handoffs depends on
the specific upgrade method you use, as detailed in the table below.

{{< embed-md "rs-sch-support.md" >}}

### Redis Enterprise for Kubernetes

SCH is not currently supported for [Kubernetes]({{< relref "/operate/kubernetes" >}}) clusters.

### Redis Open Source

SCH is not currently supported for [Redis Open Source]({{< relref "/operate/oss_and_stack" >}}).
