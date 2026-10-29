---
Title: Supported connection clients
categories:
- docs
- operate
- rs
description: Info about Redis client libraries and supported clients when using the
  discovery service.
weight: 10
url: '/operate/rs/7.8/databases/connect/supported-clients-browsers/'
---
You can connect to Redis Enterprise Software databases programmatically using client libraries.

## Redis client libraries

To connect an application to a Redis database hosted by Redis Enterprise Software, use a [client library](/content/develop/clients/_index.md) appropriate for your programming language.

You can also use the `redis-cli` utility to connect to a database from the command line.

For examples of each approach, see the [Redis Enterprise Software quickstart](/content/operate/rs/7.8/installing-upgrading/quickstarts/redis-enterprise-software-quickstart.md).

Note: You cannot use client libraries to configure Redis Enterprise Software.  Instead, use:

- The Redis Enterprise Software [Cluster Manager UI](/content/operate/rs/7.8/installing-upgrading/quickstarts/redis-enterprise-software-quickstart.md)
- The [REST API](/content/operate/rs/7.8/references/rest-api/_index.md)
- Command-line utilities, such as [`rladmin`](/content/operate/rs/7.8/references/cli-utilities/rladmin/_index.md)

### Discovery service

We recommend the following clients when using a [discovery service](/content/operate/rs/7.8/databases/durability-ha/discovery-service.md) based on the Redis Sentinel API:

- [redis-py](/content/develop/clients/redis-py/_index.md) (Python client)
- [StackExchange.Redis](/content/develop/clients/dotnet/_index.md) (.NET client)
- [Jedis](/content/develop/clients/jedis/_index.md) (synchronous Java client)
- [Lettuce](/content/develop/clients/lettuce/_index.md) (asynchronous Java client)
- [go-redis](/content/develop/clients/go/_index.md) (Go client)
- [Hiredis](https://github.com/redis/hiredis) (C client)

If you need to use another client, you can use [Sentinel Tunnel](https://github.com/RedisLabs/sentinel_tunnel)
to discover the current Redis master with Sentinel and create a TCP tunnel between a local port on the client and the master.

