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
your own code. We support client libraries
for five main languages:
- [Python]({{< relref "/develop/connect/clients/python" >}})
- [C#/.NET]({{< relref "/develop/connect/clients/dotnet" >}})
- [Node.js]({{< relref "/develop/connect/clients/nodejs" >}})
- [Java]({{< relref "/develop/connect/clients/java" >}})
- [Go]({{< relref "/develop/connect/clients/go" >}})

We also provide several higher-level
[object mapping (OM)]({{< relref "/develop/connect/clients/om-clients" >}})
libraries for [Python]({{< relref "/integrate/redisom-for-python" >}}),
[C#/.NET]({{< relref "/integrate/redisom-for-net" >}}),
[Node.js]({{< relref "/integrate/redisom-for-node-js" >}}), and
[Java/Spring]({{< relref "/integrate/redisom-for-java" >}}).

## Community-supported clients

The table below shows the recommended third-party client libraries for languages that
Redis does not support directly:

| Language | Client name | Github | Docs |
| :-- | :-- | :-- | :-- |
| C | hiredis | https://github.com/redis/hiredis | https://github.com/redis/hiredis |
| [PHP](https://www.php.net/) | redis extension | https://github.com/phpredis/phpredis | https://github.com/phpredis/phpredis/blob/develop/README.md |
| [PHP](https://www.php.net/) | predis library | https://github.com/predis/predis | https://github.com/predis/predis/wiki |
| [Ruby](https://www.ruby-lang.org/en/) | redis-rb | https://github.com/redis/redis-rb | https://rubydoc.info/gems/redis |
| [Rust](https://www.rust-lang.org/) | redis-rs | https://github.com/redis-rs/redis-rs | https://docs.rs/redis/latest/redis/ | 

## Requirements

You will need access to a Redis server to use these libraries.
You can experiment with a local installation of Redis Stack
(see [Install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}})) or with a free trial of [Redis Cloud]({{< relref "/operate/rc" >}}).
To interact with a Redis server without writing code, use the
[Redis CLI]({{< relref "/develop/connect/cli" >}}) and
[Redis Insight]({{< relref "/develop/connect/insight" >}}) tools.

## Client library guides
