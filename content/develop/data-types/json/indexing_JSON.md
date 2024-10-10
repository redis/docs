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
description: Combine Redis JSON and the Redis Query Engine to index and search JSON documents
linkTitle: Index/Search
title: Index/Search JSON documents
weight: 2
---

In addition to storing JSON documents, you can also index them using the [Redis Query Engine]({{< relref "/develop/interact/search-and-query/" >}}) feature. This enables full-text search capabilities and document retrieval based on their content.

To use these features, you must install two modules: RedisJSON and RediSearch. [Redis Stack]({{< relref "/operate/oss_and_stack/" >}}) automatically includes both modules.

See the [tutorial]({{< relref "/develop/interact/search-and-query/indexing/" >}}) to learn how to search and query your JSON.