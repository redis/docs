---
Title: Supported connection clients
categories:
- docs
- operate
- rs
description: Info about Redis client libraries and supported clients when using the
  discovery service.
weight: 10
---
You can connect to Redis Enterprise Software databases programmatically using client libraries.

## Redis client libraries

To connect an application to a Redis database hosted by Redis Enterprise Software, use a [client library]({{< relref "/develop/connect/clients/" >}}) appropriate for your programming language.

You can also use the `redis-cli` utility to connect to a database from the command line.

For examples of each approach, see the [Redis Enterprise Software quickstart]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}).

Note: You cannot use client libraries to configure Redis Enterprise Software.  Instead, use:

- The Redis Enterprise Software [Cluster Manager UI]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}})
- The [REST API]({{< relref "/operate/rs/references/rest-api" >}})
- Command-line utilities, such as [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}})

### Discovery service

We recommend the following clients when using a [discovery service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}) based on the Redis Sentinel API:

- [redis-py]({{< relref "/develop/connect/clients/python" >}}) (Python client)
- [NRedisStack]({{< relref "/develop/connect/clients/dotnet" >}}) (.NET client)
- [Jedis]({{< relref "/develop/connect/clients/java/jedis" >}}) (synchronous Java client)
- [Lettuce]({{< relref "/develop/connect/clients/java/lettuce" >}}) (asynchronous Java client)
- [go-redis]({{< relref "/develop/connect/clients/go" >}}) (Go client)
- [Hiredis](https://github.com/redis/hiredis) (C client)

If you need to use another client, you can use [Sentinel Tunnel](https://github.com/RedisLabs/sentinel_tunnel)
to discover the current Redis master with Sentinel and create a TCP tunnel between a local port on the client and the master.

