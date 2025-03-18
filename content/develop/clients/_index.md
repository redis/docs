---
aliases: /develop/connect/clients
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
hideListLinks: true
description: Connect your application to a Redis database and try an example
linkTitle: Client APIs
title: Connect with Redis client API libraries
weight: 30
---

Use the Redis client libraries to connect to Redis servers from
your own code. We document the following client libraries
for six main languages:

| Language | Client name | Docs | Supported |
| :-- | :-- | :-- | :-- |
| [Python](https://www.python.org/) | [`redis-py`](https://github.com/redis/redis-py) |[`redis-py` guide]({{< relref "/develop/clients/redis-py" >}}) | Yes |
| [Python](https://www.python.org/) | [`RedisVL`](https://github.com/redis/redis-vl-python) |[RedisVL guide]({{< relref "/integrate/redisvl" >}}) | Yes 
| [C#/.NET](https://learn.microsoft.com/en-us/dotnet/csharp/) | [`NRedisStack`](https://github.com/redis/NRedisStack) |[`NRedisStack` guide]({{< relref "/develop/clients/dotnet" >}}) | Yes |
| [JavaScript](https://nodejs.org/en) | [`node-redis`](https://github.com/redis/node-redis) | [`node-redis` guide]({{< relref "/develop/clients/nodejs" >}}) | Yes |
| [Java](https://www.java.com/en/) | [`Jedis`](https://github.com/redis/jedis) | [`Jedis` guide]({{< relref "/develop/clients/jedis" >}}) |  Yes |
| [Java](https://www.java.com/en/) | [`Lettuce`](https://github.com/redis/lettuce) | [`Lettuce` guide]({{< relref "/develop/clients/lettuce" >}}) | Yes |
| [Go](https://go.dev/) | [`go-redis`](https://github.com/redis/go-redis) | [`go-redis` guide]({{< relref "/develop/clients/go" >}}) | Yes |
| [PHP](https://www.php.net/)| [`Predis`](https://github.com/predis/predis) | [`Predis` guide]({{< relref "/develop/clients/php" >}}) | No |

We also provide several higher-level
[object mapping (OM)]({{< relref "/develop/clients/om-clients" >}})
libraries for [Python]({{< relref "/integrate/redisom-for-python" >}}),
[C#/.NET]({{< relref "/integrate/redisom-for-net" >}}),
[Node.js]({{< relref "/integrate/redisom-for-node-js" >}}), and
[Java/Spring]({{< relref "/integrate/redisom-for-java" >}}).

## Community-supported clients

The table below shows the recommended third-party client libraries for languages that
Redis does not document directly:

| Language | Client name | Github | Docs |
| :-- | :-- | :-- | :-- |
| C | hiredis | https://github.com/redis/hiredis | https://github.com/redis/hiredis |
| [C++](https://en.wikipedia.org/wiki/C%2B%2B) | Boost.Redis | https://github.com/boostorg/redis | https://www.boost.org/doc/libs/develop/libs/redis/doc/html/index.html |
| [Dart](https://dart.dev/) | redis_dart_link | https://github.com/toolsetlink/redis_dart_link | https://github.com/toolsetlink/redis_dart_link |
| [PHP](https://www.php.net/) | PhpRedis extension | https://github.com/phpredis/phpredis | https://github.com/phpredis/phpredis/blob/develop/README.md |
| [Ruby](https://www.ruby-lang.org/en/) | redis-rb | https://github.com/redis/redis-rb | https://rubydoc.info/gems/redis |
| [Rust](https://www.rust-lang.org/) | redis-rs | https://github.com/redis-rs/redis-rs | https://docs.rs/redis/latest/redis/ |


## Requirements

You will need access to a Redis server to use these libraries.
You can experiment with a local installation of Redis Stack
(see [Install Redis Stack]({{< relref "/operate/oss_and_stack/install/install-stack/" >}})) or with a free trial of [Redis Cloud]({{< relref "/operate/rc" >}}).
To interact with a Redis server without writing code, use the
[Redis CLI]({{< relref "/develop/tools/cli" >}}) and
[Redis Insight]({{< relref "/develop/tools/insight" >}}) tools.
