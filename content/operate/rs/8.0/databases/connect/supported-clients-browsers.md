---
Title: Supported connection clients
categories:
- docs
- operate
- rs
description: Info about Redis client libraries and supported clients when using the
  discovery service.
weight: 10
url: '/operate/rs/8.0/databases/connect/supported-clients-browsers/'
---
You can connect to Redis Software databases programmatically using client libraries.

## Redis client libraries

To connect an application to a Redis database hosted by Redis Software, use a [client library](/content/develop/clients/_index.md) appropriate for your programming language.

You can also use the `redis-cli` utility to connect to a database from the command line.

For examples of each approach, see the [Redis Software quickstart](/content/operate/rs/8.0/installing-upgrading/quickstarts/redis-enterprise-software-quickstart.md).

Note: You cannot use client libraries to configure Redis Software.  Instead, use:

- The Redis Software [Cluster Manager UI](/content/operate/rs/8.0/installing-upgrading/quickstarts/redis-enterprise-software-quickstart.md)
- The [REST API](/content/operate/rs/8.0/references/rest-api/_index.md)
- Command-line utilities, such as [`rladmin`](/content/operate/rs/8.0/references/cli-utilities/rladmin/_index.md)

### Discovery service

All [recommended Redis client libraries](/content/develop/clients/_index.md) support the Redis Sentinel API, so you can use any of them with the [discovery service](/content/operate/rs/8.0/databases/durability-ha/discovery-service.md).

If you need to use a client that doesn't support Sentinel, you can use [Sentinel Tunnel](https://github.com/RedisLabs/sentinel_tunnel) to discover the current primary Redis endpoint with Sentinel and create a TCP tunnel between a local port on the client and the primary endpoint.

