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
linkTitle: Seamless client experience
title: Seamless client experience
weight: 50
---

*Seamless client experience (SCE)* is a feature of Redis Cloud and
Redis Enterprise servers that lets them actively notify clients
about planned server maintenance shortly before it happens. This
lets a client reconnect or otherwise respond gracefully without significant
interruptions in service.

SCE is primarily useful when server software or hardware is upgraded.
Upgrades tend to impact the general performance of the server, so
advance notification of the upgrade lets a client adjust its command
timeouts to take this into account. Upgrades also involve migrating
Redis shards to new nodes, which inevitably disconnects clients from
existing nodes. However, with some advance warning of the disconnection,
a client can buffer commands, connect to a new node, and then resume
the buffered commands without aborting any of them. As a result, users
see no disruption in service.

## Enable SCE

SCE is enabled by default on Redis Cloud, but you must enable it
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

SCE is enabled automatically on the client side during connection
if you select the [RESP3]({{< relref "/develop/reference/protocol-spec#resp-versions" >}})
protocol, which is a requirement for SCE. However, you can
configure some parameters, such as the timeouts to use
during maintenance.
See the pages linked below to learn how to configure SCE for:

- [redis-py]({{< relref "/develop/clients/redis-py/connect#connect-using-seamless-client-experience-sce" >}})
- [node-redis]({{< relref "/develop/clients/nodejs/connect#connect-using-seamless-client-experience-sce" >}})
- [Lettuce]({{< relref "/develop/clients/lettuce/connect#connect-using-seamless-client-experience-sce" >}})
- [go-redis]({{< relref "/develop/clients/go/connect#connect-using-seamless-client-experience-sce" >}})
