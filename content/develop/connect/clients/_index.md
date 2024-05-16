---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Connect your application to a Redis database and try an example
linkTitle: Clients
title: Connect with Redis clients
weight: 45
---

Use the Redis client libraries to connect to Redis servers from
your own code. We support and document client libraries
for four main languages:
[Python]({{< relref "/develop/connect/clients/python" >}}),
[C#/.NET]({{< relref "/develop/connect/clients/dotnet" >}}),
[Node.js]({{< relref "/develop/connect/clients/nodejs" >}}),
and [Java]({{< relref "/develop/connect/clients/java" >}}).
We also provide higher-level
[object mapping (OM)]({{< relref "/develop/connect/clients/om-clients" >}})
for these languages.

We also develop libraries for the following languages but with limited
support and documentation on external sites:

- [Go](https://redis.uptrace.dev/guide/)
- [Ruby](https://github.com/redis/redis-rb)
- [C](https://github.com/redis/hiredis)

You will need access to a Redis server to use these libraries.
You can experiment with a local installation of Redis Stack
(see [Install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}})) or with a free trial of [Redis Cloud]({{< relref "/operate/rc" >}}).
To interact with a Redis server without writing code, use the
[Redis CLI]({{< relref "/develop/connect/cli" >}}) and
[Redis Insight]({{< relref "/develop/connect/insight" >}}) tools.

## Client library guides