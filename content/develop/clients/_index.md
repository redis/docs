---
aliases:
- /develop/connect/clients
- /develop/connect/
- /develop/connect
- /connect/clients/
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
for nine main languages:

| Language | Client name | Docs | Supported |
| :-- | :-- | :-- | :-- |
| [Python](https://www.python.org/) | [`redis-py`](https://github.com/redis/redis-py) |[`redis-py` guide](/content/develop/clients/redis-py/_index.md) | Yes |
| [Python](https://www.python.org/) | [`RedisVL`](https://github.com/redis/redis-vl-python) |[RedisVL guide](/content/develop/ai/redisvl/_index.md) | Yes 
| [C#/.NET](https://learn.microsoft.com/en-us/dotnet/csharp/) | [`StackExchange.Redis`](https://github.com/StackExchange/StackExchange.Redis) |[`StackExchange.Redis` guide](/content/develop/clients/dotnet/_index.md) | Yes |
| [C#/.NET](https://learn.microsoft.com/en-us/dotnet/csharp/) | [`NRedisStack`](https://github.com/redis/NRedisStack) |[`NRedisStack` guide](/content/develop/clients/dotnet/nredisstack/_index.md) | Yes |
| [JavaScript](https://nodejs.org/en) | [`node-redis`](https://github.com/redis/node-redis) | [`node-redis` guide](/content/develop/clients/nodejs/_index.md) | Yes |
| [JavaScript](https://nodejs.org/en) | [`ioredis`](https://github.com/redis/ioredis) | [`ioredis` guide](/content/develop/clients/ioredis/_index.md) | Yes |
| [Java](https://www.java.com/en/) | [`Jedis`](https://github.com/redis/jedis) | [`Jedis` guide](/content/develop/clients/jedis/_index.md) |  Yes |
| [Java](https://www.java.com/en/) | [`Lettuce`](https://github.com/redis/lettuce) | [`Lettuce` guide](/content/develop/clients/lettuce/_index.md) | Yes |
| [Go](https://go.dev/) | [`go-redis`](https://github.com/redis/go-redis) | [`go-redis` guide](/content/develop/clients/go/_index.md) | Yes |
| [PHP](https://www.php.net/)| [`Predis`](https://github.com/predis/predis) | [`Predis` guide](/content/develop/clients/php/_index.md) | Best effort [*](#best-effort) |
| [C](https://en.wikipedia.org/wiki/C_(programming_language)) | [`hiredis`](https://github.com/redis/hiredis) | [`hiredis` guide](/content/develop/clients/hiredis/_index.md) | Yes |
| [Rust](https://www.rust-lang.org/) | [`redis-rs`](https://github.com/redis-rs/redis-rs) | [`redis-rs` guide](/content/develop/clients/rust/_index.md) | Best effort [*](#best-effort) |
| [Ruby](https://www.ruby-lang.org/en/) | [`redis-rb`](https://github.com/redis/redis-rb) | [`redis-rb` guide](/content/develop/clients/ruby/_index.md) | Yes |

> [!NOTE]
> *<a name="best-effort"></a>
> Redis does not provide official support for third-party client libraries.
> However, we contribute new features, offer guidance, and collaborate with the community
> on a best-effort basis to help ensure these libraries remain reliable and up-to-date.

See [Client library support and versioning policy](/content/develop/clients/version-support.md)
for details about how Redis maintains, versions, and tests the official client libraries.

We also provide several higher-level
[object mapping (OM)](/content/develop/clients/om-clients/_index.md)
libraries for [Python](/content/integrate/redisom-for-python/_index.md),
[C#/.NET](/content/integrate/redisom-for-net/_index.md),
[Node.js](/content/integrate/redisom-for-node-js/_index.md), and
[Java/Spring](/content/integrate/redisom-for-java/_index.md).

## Community-supported clients

The table below shows some popular third-party client libraries. Note that Redis does not
develop or contribute to these libraries directly.

| Language | Client name | Github | Docs |
| :-- | :-- | :-- | :-- |
| [C++](https://en.wikipedia.org/wiki/C%2B%2B) | Boost.Redis | https://github.com/boostorg/redis | https://www.boost.org/doc/libs/develop/libs/redis/doc/html/index.html |
| [Dart](https://dart.dev/) | redis_dart_link | https://github.com/toolsetlink/redis_dart_link | https://github.com/toolsetlink/redis_dart_link |
| [PHP](https://www.php.net/) | PhpRedis extension | https://github.com/phpredis/phpredis | https://github.com/phpredis/phpredis/blob/develop/README.md |
| [Python](https://www.python.org/) | coredis | https://github.com/alisaifee/coredis | https://coredis.readthedocs.io |
| [Scala](https://www.scala-lang.org/) | Sage | https://github.com/ghostdogpr/sage | https://ghostdogpr.github.io/sage/ |

## Requirements

You will need access to a Redis server to use these libraries.
You can experiment with a local installation of Redis Open Source
(see [Install Redis Open Source](/content/operate/oss_and_stack/install/install-stack/_index.md)) or with a free trial of [Redis Cloud](/content/operate/rc/_index.md).
To interact with a Redis server without writing code, use the
[Redis CLI](/content/develop/tools/cli.md) and
[Redis Insight](/content/develop/tools/insight/_index.md) tools.

## Choose a client library for your language

For some languages, we only recommend one client library, but Python, JavaScript,
Java, C#, and PHP have multiple options. The sections below summarize the differences
between the options for each language.

### Python

-   [`redis-py`](https://github.com/redis/redis-py) is the recommended Python client library for 
    most use cases.
-   [`RedisVL`](https://github.com/redis/redis-vl-python) is specialized for handling 
    high-dimensional vector data and is a good choice for AI/ML workflows.
-   [RedisOM for Python](https://github.com/redis/redis-om-python) is an object mapping library that
    provides a high-level API for working with Redis data structures.

### JavaScript

-   [`node-redis`](https://github.com/redis/node-redis) is the recommended JavaScript client library 
    for most use cases.
-   [`ioredis`](https://github.com/redis/ioredis) is an older library that is still supported, but
    lacks some of the newer features and performance optimizations of `node-redis`.
    Note that there is a migration guide available if you are interested in converting
    your `ioredis` project to `node-redis`
    (see [Migrate from ioredis](/content/develop/clients/nodejs/migration.md)).
-   [RedisOM for Node.js](https://github.com/redis/redis-om-node) is an object mapping library that
    provides a high-level API for working with Redis data structures.

### Java

-   [`Jedis`](https://github.com/redis/jedis) supports the full feature set of Redis and has a  
    straightforward API, but is limited to synchronous operations.
-   [`Lettuce`](https://github.com/redis/lettuce) supports synchronous, asynchronous,
    and reactive operations. However, it has a more complex API than Jedis and doesn't currently
    support all Redis features (notably time series and probabilistic data structures).
-   [RedisOM for Java](https://github.com/redis/redis-om-spring) is an object mapping library that
    provides a high-level API for working with Redis data structures.

### C#

-   [`StackExchange.Redis`](https://github.com/StackExchange/StackExchange.Redis) is the 
    recommended C# client library for using the core Redis data types and commands.
-   [`NRedisStack`](https://github.com/redis/NRedisStack) builds upon
    `StackExchange.Redis` with
    support for an extended set of data types and features, such as
    [JSON](/content/develop/data-types/json/_index.md),
    [Redis search](/content/develop/ai/search-and-query/_index.md), and
    [Time series](/content/develop/data-types/timeseries/_index.md).
-   [RedisOM for .NET](https://github.com/redis/redis-om-dotnet) is an object mapping library that
    provides a high-level API for working with Redis data structures.

### PHP

-   [`Predis`](https://github.com/predis/predis) is the recommended PHP client library for
    most use cases. It has "best effort" support from the Redis team (it's a third-party library
    but the Redis team contributes to it and helps with issues) and has good coverage in the
    [Redis documentation](/content/develop/clients/php/_index.md). However, it is implemented in
    PHP, which limits its performance compared to [phpredis](https://github.com/phpredis/phpredis),
    which is implemented in C.
-   [phpredis](https://github.com/phpredis/phpredis) is a popular and well-maintained PHP client
    library that is implemented using C extensions to PHP for better performance. However, it is
    not actively supported or documented by the Redis team.

### Client library decision tree

Use the decision tree below to help you choose the right client library for your needs,
based on the recommendations in the previous sections. Note that you should regard the
conclusions as a guideline for your research, not as a definitive answer.

```decision-tree {id="client-recommendation"}
id: client-recommendation
scope: clients
indentWidth: 28
rootQuestion: singleClientLanguageQuestion
questions:
    singleClientLanguageQuestion:
        text: |
            Are you using Go, Rust, C, C++, Dart, or Ruby?
        whyAsk: |
            These languages have only one recommended client library,
            so the choice is straightforward
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: |
                        These languages only have one recommended client library. Use
                        the client library for your language listed in the table above.
                    id: singleClientLanguageOutcome
            no:
                value: "No"
                nextQuestion: multiClientLanguageQuestion

    multiClientLanguageQuestion:
        text: |
            Are you using Python, JavaScript, Java, or C#/.NET
            and require object mapping (ORM-like) functionality?
        whyAsk: |
            RedisOM provides a high-level API for these languages.
            If you don't need OM, we'll help you choose the best low-level client
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: |
                        Use RedisOM for your language
                        (available for Python, JavaScript, Java, and C#/.NET)
                    id: redisOMOutcome
            no:
                value: "No"
                nextQuestion: lowLevelClientQuestion

    lowLevelClientQuestion:
        text: Which language are you using?
        whyAsk: |
            Different languages have different low-level client libraries
            optimized for their ecosystems
        answers:
            python:
                value: Py
                nextQuestion: pythonLowLevelQuestion
            javascript:
                value: JS
                nextQuestion: javascriptLowLevelQuestion
            java:
                value: Java
                nextQuestion: javaLowLevelQuestion
            php:
                value: PHP
                nextQuestion: phpLowLevelQuestion
            dotnet:
                value: "C#"
                nextQuestion: dotnetLowLevelQuestion

    dotnetLowLevelQuestion:
        text: |
            Do you need Redis Stack features such as JSON,
            Search, vector search, or Time series?
        whyAsk: |
            StackExchange.Redis is the recommended client for core Redis commands,
            while NRedisStack extends it with support for Redis Stack data types and features
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: Use NRedisStack
                    id: nRedisStackOutcome
            no:
                value: "No"
                outcome:
                    label: Use StackExchange.Redis
                    id: stackExchangeRedisOutcome

    pythonLowLevelQuestion:
        text: |
            Are you building an AI/ML application
            mainly based around high-dimensional vector operations?
        whyAsk: |
            RedisVL is specialized for AI/ML workflows with vector data,
            while redis-py is better for general-purpose use
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: Use RedisVL
                    id: redisVLOutcome
            No:
                value: "No"
                outcome:
                    label: Use redis-py
                    id: redisPyOutcome

    javaLowLevelQuestion:
        text: Do you need async or reactive operations?
        whyAsk: |
            Jedis supports only synchronous operations with a simpler API,
            while Lettuce supports async and reactive patterns
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: Use Lettuce
                    id: lettuceOutcome
            no:
                value: "No"
                outcome:
                    label: Use Jedis
                    id: jedisOutcome

    javascriptLowLevelQuestion:
        text: Do you have an existing codebase using ioredis?
        whyAsk: |
            If you're already using ioredis, you can continue with it.
            For new projects, node-redis is the recommended choice
        answers:
            yes:
                value: "Yes"
                nextQuestion: ioredisAdvancedFeaturesQuestion
            no:
                value: "No"
                outcome:
                    label: Use node-redis
                    id: nodeRedisOutcome

    ioredisAdvancedFeaturesQuestion:
        text: Do you want to use advanced Redis features such as search, vector database, and JSON?
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: Migrate to node-redis using our migration guide
                    id: migrateToNodeRedisOutcome
            no:
                value: "No"
                outcome:
                    label: Continue using ioredis
                    id: continueIoredisOutcome

    phpLowLevelQuestion:
        text: |
            Is maximum performance a higher priority than full support and documentation?
        whyAsk: |
            PhpRedis is a C extension with better performance,
            while Predis is a pure PHP implementation that is better supported and documented
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: Use PhpRedis
                    id: phpredisOutcome
            no:
                value: "No"
                outcome:
                    label: Use Predis
                    id: predisOutcome
```
