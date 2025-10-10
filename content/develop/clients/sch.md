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
weight: 50
---

*Smart client handoffs (SCH)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client reconnect or otherwise respond gracefully without significant
interruptions in service.

SCH is primarily useful when server software or hardware upgrades
are required. It provides two main features to help the
client avoid disruptions in service during the maintenance period:

-   **Relaxed timeouts**: Upgrades tend to impact the general performance of the server.
    Advance notification of the upgrade lets a client adjust its command
    timeouts to take this into account and avoid aborting commands too soon.
-   **Transparent reconnection**: Upgrades also involve migrating
    Redis shards to new nodes, which inevitably disconnects clients from
    existing nodes. However, with some advance warning of the disconnection,
    a client can buffer commands, connect to a new node, and then resume
    the buffered commands without aborting any of them. As a result, users
    see no disruption in service.

## Enable SCH

SCH is enabled by default on Redis Cloud, but you must enable it
explicitly on Redis Enterprise servers by using the
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

SCH is enabled automatically on the client side during connection
if you select the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, which is a requirement for SCH. However, you can
configure some parameters, such as the timeouts to use
during maintenance.
See the pages linked below to learn how to configure SCH for:

- [redis-py]({{< relref "/develop/clients/redis-py/connect#connect-using-seamless-client-experience-sce" >}})
- [node-redis]({{< relref "/develop/clients/nodejs/connect#connect-using-seamless-client-experience-sce" >}})
- [Lettuce]({{< relref "/develop/clients/lettuce/connect#connect-using-seamless-client-experience-sce" >}})
- [go-redis]({{< relref "/develop/clients/go/connect#connect-using-seamless-client-experience-sce" >}})
