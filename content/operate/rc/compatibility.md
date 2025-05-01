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

Both [Redis Enterprise Software]({{< relref "/operate/rs" >}}) and Redis Cloud are compatible with Redis Open Source.

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Enterprise Software and Redis Cloud support RESP2 and RESP3. In Redis Cloud, you can choose between RESP2 and RESP3 when you [create a database]({{< relref "/operate/rc/databases/create-database" >}}) and you can change it when you [edit a database]({{< relref "/operate/rc/databases/view-edit-database" >}}). For more information about the different RESP versions, see the [Redis serialization protocol specification]({{< relref "/develop/reference/protocol-spec" >}}#resp-versions).

## Client-side caching compatibility

Redis Software and Redis Cloud support [client-side caching]({{<relref "/develop/clients/client-side-caching">}}) for databases with Redis versions 7.4 or later. See [Client-side caching compatibility with Redis Software and Redis Cloud]({{<relref "/operate/rs/references/compatibility/client-side-caching">}}) for more information about compatibility.

## Compatibility with Redis Cluster API

Redis Cloud supports [Redis Cluster API]({{< relref "/operate/rc/databases/configuration/clustering#oss-cluster-api" >}}) on Redis Cloud Pro if it is enabled for a database. Review [Redis Cluster API architecture]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) to determine if you should enable this feature for your database.