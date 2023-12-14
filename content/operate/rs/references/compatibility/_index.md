---
Title: Redis Enterprise compatibility with open source Redis
alwaysopen: false
categories:
- docs
- operate
- rs
description: Redis Enterprise compatibility with open source Redis.
linkTitle: Open source compatibility
weight: $weight
---
Both Redis Enterprise Software and [Redis Cloud]({{< relref "/operate/rc" >}}) are compatible with open source
Redis (OSS Redis). Redis contributes extensively to the open source Redis
project and uses it inside of Redis Enterprise. As a rule, we adhere to
the open source project's specifications and update
Redis Enterprise with the latest version of open source Redis.

## Redis commands

See [Compatibility with open source Redis commands]({{< relref "/operate/rs/references/compatibility/commands" >}}) to learn which open source Redis commands are compatible with Redis Enterprise (Software and Cloud).

## Configuration settings

[Compatibility with open source Redis configuration settings]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) lists the open source Redis configuration settings supported by Redis Enterprise (Software and Cloud).

## Redis clients

You can use any standard [Redis client](https://redis.io/docs/clients/) with Redis Enterprise.

## RESP compatibility

Redis Enterprise supports RESP2 and RESP3. See [RESP compatibility with Redis Enterprise]({{< relref "/operate/rs/references/compatibility/resp" >}}) for more information.

## Compatibility with open source Redis Cluster API

Redis Enterprise supports [Redis OSS Cluster API]({{< relref "/operate/rs/clusters/optimize/oss-cluster-api" >}}) if it is enabled for a database. For more information, see [Enable OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}).
