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
explicitly on Redis Enterprise servers.

You must also configure SCE on the client side during connection.
See the pages linked below to learn how to enable SCE for:

- [redis-py]({{< relref "/develop/clients/redis-py/connect#connect-using-seamless-client-experience-sce" >}})
- [node-redis]({{< relref "/develop/clients/nodejs/connect#connect-using-seamless-client-experience-sce" >}})
- [Lettuce]({{< relref "/develop/clients/lettuce/connect#connect-using-seamless-client-experience-sce" >}})
- [go-redis]({{< relref "/develop/clients/go/connect#connect-using-seamless-client-experience-sce" >}})
