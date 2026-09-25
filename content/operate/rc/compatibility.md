---
Title: Redis Cloud compatibility with Redis Open Source
alwaysopen: false
categories:
- docs
- operate
- rc
description: Redis Cloud compatibility with Redis Open Source.
linkTitle: Redis Open Source compatibility
weight: 90
tocEmbedHeaders: true
---

Both [Redis Software](/content/operate/rs/_index.md) and Redis Cloud are compatible with Redis Open Source.

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Software and Redis Cloud support RESP2 and RESP3. In Redis Cloud, you can choose between RESP2 and RESP3 when you [create a database](/content/operate/rc/databases/create-database/_index.md) and you can change it when you [edit a database](/content/operate/rc/databases/view-edit-database.md). For more information about the different RESP versions, see the [Redis serialization protocol specification](/content/develop/reference/protocol-spec.md#resp-versions).

## Client-side caching compatibility

Redis Software and Redis Cloud support [client-side caching](/content/develop/clients/client-side-caching.md) for databases with Redis versions 7.4 or later. See [Client-side caching compatibility with Redis Software and Redis Cloud](/content/operate/rs/references/compatibility/client-side-caching.md) for more information about compatibility.

## Compatibility with Redis Cluster API

Redis Cloud supports [Redis Cluster API](/content/operate/rc/databases/configuration/clustering.md#oss-cluster-api) on Redis Cloud Pro if it is enabled for a database. Review [Redis Cluster API architecture](/content/operate/rs/clusters/optimize/oss-cluster-api.md) to determine if you should enable this feature for your database.