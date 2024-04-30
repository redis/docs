---
Title: Redis Enterprise compatibility with source available Redis
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis Enterprise compatibility with source available Redis.
hideListLinks: true
linkTitle: Source available Redis compatibility
weight: $weight
tocEmbedHeaders: true
---
Both Redis Enterprise Software and [Redis Cloud]({{< relref "/operate/rc" >}}) are compatible with source available Redis. 

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Enterprise Software and Redis Cloud support RESP2 and RESP3. See [RESP compatibility with Redis Enterprise]({{< relref "/operate/rs/references/compatibility/resp" >}}) for more information.

## Compatibility with Redis Cluster API

Redis Enterprise supports [Redis Cluster API]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) if it is enabled for a database. For more information, see [Enable Redis Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}).
