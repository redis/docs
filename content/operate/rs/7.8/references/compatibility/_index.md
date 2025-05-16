---
Title: Redis Enterprise compatibility with Redis Open Source
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Redis Enterprise compatibility with Redis Open Source.
hideListLinks: true
linkTitle: Redis Open Source compatibility
weight: $weight
tocEmbedHeaders: true
url: '/operate/rs/7.8/references/compatibility/'
---
Both Redis Enterprise Software and [Redis Cloud]({{< relref "/operate/rc" >}}) are compatible with Redis Open Source. 

{{< embed-md "rc-rs-oss-compatibility.md"  >}}

## RESP compatibility

Redis Enterprise Software and Redis Cloud support RESP2 and RESP3. See [RESP compatibility with Redis Enterprise]({{< relref "/operate/rs/7.8/references/compatibility/resp" >}}) for more information.

## Client-side caching compatibility

Redis Software and Redis Cloud support [client-side caching]({{<relref "/develop/clients/client-side-caching">}}) for databases with Redis versions 7.4 or later. See [Client-side caching compatibility with Redis Software and Redis Cloud]({{<relref "/operate/rs/7.8/references/compatibility/client-side-caching">}}) for more information about compatibility and configuration options.

## Compatibility with open source Redis Cluster API

Redis Enterprise supports [Redis OSS Cluster API]({{< relref "/operate/rs/7.8/clusters/optimize/oss-cluster-api" >}}) if it is enabled for a database. For more information, see [Enable OSS Cluster API]({{< relref "/operate/rs/7.8/databases/configure/oss-cluster-api" >}}).
