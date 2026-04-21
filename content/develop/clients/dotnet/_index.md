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
linkTitle: StackExchange.Redis (C#/.NET)
title: StackExchange.Redis guide (C#/.NET)
weight: 3
---

[StackExchange.Redis](https://github.com/StackExchange/StackExchange.Redis) is the main
.NET client for Redis. It provides an API for the core Redis data types and commands.
A separate library,
[NRedisStack](https://github.com/redis/NRedisStack), builds upon `StackExchange.Redis` with
support for an extended set of data types and features, such as [JSON]({{< relref "/develop/data-types/json" >}}),
[Redis search]({{< relref "/develop/ai/search-and-query" >}}),
[probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}}), and
[Time series]({{< relref "/develop/data-types/timeseries" >}}).

The sections below explain how to install `StackExchange.Redis` and connect your application
to a Redis database. See the [NRedisStack guide]({{< relref "/develop/clients/dotnet/nredisstack" >}}) for information about installing and using `NRedisStack` to access the extended feature set.

`StackExchange.Redis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

{{< note >}}
You can also access Redis with an object-mapping client interface. See
[Redis OM for .NET]({{< relref "/integrate/redisom-for-net" >}})
for more information.
{{< /note >}}

## Install

Using the `dotnet` CLI, run:

```bash
dotnet add package StackExchange.Redis
```

## Connect and test

Add the following imports to your source file:

{{< clients-example set="landing" step="import" lang_filter="C#-Sync (SE.Redis),C#-Async (SE.Redis)" description="Foundational: Import required SE.Redis namespaces for Redis client functionality" difficulty="beginner" >}}
{{< /clients-example >}}

Connect to localhost on port 6379. The client supports both synchronous and asynchronous commands.

{{< clients-example set="landing" step="connect" lang_filter="C#-Sync (SE.Redis),C#-Async (SE.Redis)" description="Foundational: Connect to a Redis server and establish a client connection" difficulty="beginner" >}}
{{< /clients-example >}}

You can test the connection by storing and retrieving a simple string.

{{< clients-example set="landing" step="set_get_string" lang_filter="C#-Sync (SE.Redis),C#-Async (SE.Redis)" description="Foundational: Set and retrieve string values using SET and GET commands" difficulty="beginner" >}}
{{< /clients-example >}}

Store and retrieve a HashMap.

{{< clients-example set="landing" step="set_get_hash" lang_filter="C#-Sync (SE.Redis),C#-Async (SE.Redis)" description="Foundational: Store and retrieve hash data structures using HSET and HGETALL" difficulty="beginner" >}}
{{< /clients-example >}}

## More information

See the other pages in this section for more information and examples.
