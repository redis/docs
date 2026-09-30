---
Title: Redis Software compatibility with Redis Open Source
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Redis Software compatibility with Redis Open Source.
hideListLinks: true
linkTitle: Redis Open Source compatibility
weight: $weight
tocEmbedHeaders: true
---
Both Redis Software and [Redis Cloud](/content/operate/rc/_index.md) are compatible with Redis Open Source. 

If you're planning a move from a self-managed Redis Open Source deployment to Redis Software, see [Move from Redis Open Source to Redis Software](/content/operate/rs/installing-upgrading/move-from-open-source.md) for how configuration and deployment differ.

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Software and Redis Cloud support RESP2 and RESP3. See [RESP compatibility with Redis Software](/content/operate/rs/references/compatibility/resp.md) for more information.

## Client-side caching compatibility

Redis Software and Redis Cloud support [client-side caching](/content/develop/clients/client-side-caching.md) for databases with Redis versions 7.4 or later. See [Client-side caching compatibility with Redis Software and Redis Cloud](/content/operate/rs/references/compatibility/client-side-caching.md) for more information about compatibility and configuration options.

## Compatibility with open source Redis Cluster API

Redis Software supports [Redis OSS Cluster API](/content/operate/rs/clusters/optimize/oss-cluster-api.md) if it is enabled for a database. For more information, see [Enable OSS Cluster API](/content/operate/rs/databases/configure/oss-cluster-api.md).
