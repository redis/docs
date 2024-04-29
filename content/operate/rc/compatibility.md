---
Title: Redis Cloud compatibility with source available Redis
alwaysopen: false
categories:
- docs
- operate
- rc
description: Redis Cloud compatibility with source available Redis.
linkTitle: Source available compatibility
weight: 90
tocEmbedHeaders: true
---

Both [Redis Enterprise Software]({{< relref "/operate/rs" >}}) and Redis Cloud are compatible with source available Redis.

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Enterprise Software and Redis Cloud support RESP2 and RESP3. In Redis Cloud, you can choose between RESP2 and RESP3 when you [create a database]({{< relref "/operate/rc/databases/create-database" >}}) and you can change it when you [edit a database]({{< relref "/operate/rc/databases/view-edit-database" >}}). For more information about the different RESP versions, see the [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions).

## Compatibility with Redis Cluster API

Redis Cloud supports [Redis Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) on Redis Cloud Pro if it is enabled for a database. Review [Redis Cluster API architecture]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) to determine if you should enable this feature for your database.