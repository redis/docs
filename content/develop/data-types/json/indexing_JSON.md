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
description: Combine Redis JSON and Search and Query to index and search JSON documents
linkTitle: Index/Search
title: Index/Search JSON documents
weight: 2
---

In addition to storing JSON documents, you can also index them using the [Search and Query]({{< relref "/develop/stack/search" >}}) feature. This enables full-text search capabilities and document retrieval based on their content.

To use these features, you must install two modules: RedisJSON and RediSearch. [Redis Stack]({{< relref "/develop/stack" >}}) automatically includes both modules.

See the [tutorial]({{< relref "/develop/stack/search/indexing_json" >}}) to learn how to search and query your JSON.