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

Add the following imports to your source file:

{{< clients-example set="landing" step="import" lang_filter="C#-Sync,C#-Async" description="Foundational: Import required NRedisStack namespaces for Redis client functionality" difficulty="beginner" >}}
{{< /clients-example >}}

Connect to localhost on port 6379. The client supports both synchronous and asynchronous commands.

{{< clients-example set="landing" step="connect" lang_filter="C#-Sync,C#-Async" description="Foundational: Connect to a Redis server and establish a client connection" difficulty="beginner" >}}
{{< /clients-example >}}

You can test the connection by storing and retrieving a simple string.

{{< clients-example set="landing" step="set_get_string" lang_filter="C#-Sync,C#-Async" description="Foundational: Set and retrieve string values using SET and GET commands" difficulty="beginner" >}}
{{< /clients-example >}}

Store and retrieve a HashMap.

{{< clients-example set="landing" step="set_get_hash" lang_filter="C#-Sync,C#-Async" description="Foundational: Store and retrieve hash data structures using HSET and HGETALL" difficulty="beginner" >}}
{{< /clients-example >}}

## Redis Open Source modules

To access Redis Open Source capabilities, use the appropriate interface like this:

```cs
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
