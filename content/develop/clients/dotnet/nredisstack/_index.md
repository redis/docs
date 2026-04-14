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
description: Access Redis Open Source modules
linkTitle: NRedisStack extensions
title: NRedisStack extensions guide
weight: 30
---

[NRedisStack](https://github.com/redis/NRedisStack) is a library that builds upon [StackExchange.Redis](https://github.com/StackExchange/StackExchange.Redis) and provides an API for the extended set of Redis data types and features, such as [JSON]({{< relref "/develop/data-types/json" >}}), [Redis search]({{< relref "/develop/ai/search-and-query" >}}), and [Time series]({{< relref "/develop/data-types/timeseries" >}}).
The sections below explain how to install `NRedisStack`. Note that this also installs
`StackExchange.Redis` as a dependency, so you don't need to install it as a separate step.

`NRedisStack` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

{{< note >}}
You can also access Redis with an object-mapping client interface. See
[Redis OM for .NET]({{< relref "/integrate/redisom-for-net" >}})
for more information.
{{< /note >}}

## Install

Using the `dotnet` CLI, run:

```bash
dotnet add package NRedisStack
```

## Redis Open Source modules

To access Redis Open Source capabilities, use the appropriate interface like this:

```cs
IBloomCommands bf = db.BF();    // Bloom filter commands
ICuckooCommands cf = db.CF();  // Cuckoo filter commands
ICmsCommands cms = db.CMS();   // Count-min sketch commands
ITopKCommands topk = db.TOPK(); // Top-K commands
ITdigestCommands tdigest = db.TDIGEST(); // T-digest commands
ISearchCommands ft = db.FT();  // Redis search commands
IJsonCommands json = db.JSON(); // JSON commands
ITimeSeriesCommands ts = db.TS(); // Time series commands
```

## More information

See the other pages in this section for more information and examples.
