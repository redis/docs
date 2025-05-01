---
aliases: /develop/connect/clients/dotnet
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
description: Connect your .NET application to a Redis database
linkTitle: NRedisStack (C#/.NET)
title: NRedisStack guide (C#/.NET)
weight: 3
---

[NRedisStack](https://github.com/redis/NRedisStack) is the .NET client for Redis.
The sections below explain how to install `NRedisStack` and connect your application
to a Redis database.

`NRedisStack` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

You can also access Redis with an object-mapping client interface. See
[Redis OM for .NET]({{< relref "/integrate/redisom-for-net" >}})
for more information.

## Install

Using the `dotnet` CLI, run:

```bash
dotnet add package NRedisStack
```

## Connect and test

Connect to localhost on port 6379.

```csharp
using NRedisStack;
using NRedisStack.RedisStackCommands;
using StackExchange.Redis;
//...
ConnectionMultiplexer redis = ConnectionMultiplexer.Connect("localhost");
IDatabase db = redis.GetDatabase();
```

You can test the connection by storing and retrieving a simple string.

```csharp
db.StringSet("foo", "bar");
Console.WriteLine(db.StringGet("foo")); // prints bar
```

Store and retrieve a HashMap.

```csharp
var hash = new HashEntry[] { 
    new HashEntry("name", "John"), 
    new HashEntry("surname", "Smith"),
    new HashEntry("company", "Redis"),
    new HashEntry("age", "29"),
    };
db.HashSet("user-session:123", hash);

var hashFields = db.HashGetAll("user-session:123");
Console.WriteLine(String.Join("; ", hashFields));
// Prints: 
// name: John; surname: Smith; company: Redis; age: 29
```
## Redis Open Source modules

To access Redis Open Source capabilities, use the appropriate interface like this:

```
IBloomCommands bf = db.BF();
ICuckooCommands cf = db.CF();
ICmsCommands cms = db.CMS();
IGraphCommands graph = db.GRAPH();
ITopKCommands topk = db.TOPK();
ITdigestCommands tdigest = db.TDIGEST();
ISearchCommands ft = db.FT();
IJsonCommands json = db.JSON();
ITimeSeriesCommands ts = db.TS();
```

## More information

See the other pages in this section for more information and examples.
