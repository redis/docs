---
title: What's new?
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: High-level description of important updates to the Develop section
linkTitle: What's new?
hideListLinks: true
weight: 10
---
## Q1 2025 (January - March) Updates

### Tools

- Redis Insight [v2.66 release notes]({{< relref "/develop/tools/insight/release-notes/v.2.66.0.md" >}})
- Updated CLI output samples for [`bigkeys`, `memkeys`, `keystats`]({{< relref "/develop/tools/cli.md" >}})

---

### Redis AI & Vectors

- Expanded vector examples:
  - [Python]({{< relref "/develop/clients/redis-py/vecsearch.md" >}})
  - [Node.js]({{< relref "/develop/clients/nodejs/vecsearch.md" >}})
  - [Java (Jedis)]({{< relref "/develop/clients/jedis/vecsearch.md" >}})
  - [Go]({{< relref "/develop/clients/go/vecsearch.md" >}})
  - [.NET]({{< relref "/develop/clients/dotnet/vecsearch.md" >}})
- Updated AI integrations:
  - [AI overview]({{< relref "/develop/ai/index.md" >}})
  - [RAG intro]({{< relref "/develop/get-started/rag.md" >}})
  - [Redis in AI]({{< relref "/develop/get-started/redis-in-ai.md" >}})

---

### Data Types

- TimeSeries:
  - [`COMPACTION_POLICY`]({{< relref "/develop/data-types/timeseries/configuration.md" >}})
  - [Client-side caching update]({{< relref "/develop/clients/client-side-caching.md" >}})
- JSON:
  - [Active memory defragmentation]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json/commands.md" >}})
- Probabilistic:
  - [Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter.md" >}})
  - [Count-min sketch]({{< relref "/develop/data-types/probabilistic/count-min-sketch.md" >}})
  - [Top-K]({{< relref "/develop/data-types/probabilistic/top-k.md" >}})
  - [Cuckoo filter]({{< relref "/develop/data-types/probabilistic/cuckoo-filter.md" >}})

---

### Commands & API Docs

- Pages updated for format and accuracy:
  - [ACL SETUSER]({{< relref "/commands/acl-setuser/index.md" >}})
  - [JSON GET]({{< relref "/commands/json.get/index.md" >}})
  - [TS.ADD]({{< relref "/commands/ts.add/index.md" >}})
  - [SCAN]({{< relref "/commands/scan/index.md" >}})
  - [SORT]({{< relref "/commands/sort/index.md" >}})
- RESP3 reply types documented in [Hiredis command page]({{< relref "/develop/clients/hiredis/issue-commands.md" >}})
- [CSC behavior clarified]({{< relref "/develop/clients/client-side-caching.md" >}})

---

### Search & Query

- Best practices:
  - [Dev-to-prod guide]({{< relref "/develop/interact/search-and-query/best-practices/dev-to-prod-best-practices.md" >}})
  - [Scalable queries]({{< relref "/develop/interact/search-and-query/best-practices/scalable-query-best-practices.md" >}})
  - [Index lifecycle]({{< relref "/develop/interact/search-and-query/best-practices/index-mgmt-best-practices.md" >}})
- New/updated topics:
  - [Autocomplete]({{< relref "/develop/interact/search-and-query/advanced-concepts/autocomplete.md" >}})
  - [Escaping & tokenization]({{< relref "/develop/interact/search-and-query/advanced-concepts/escaping.md" >}})
  - [Geo indexing]({{< relref "/develop/interact/search-and-query/indexing/geoindex.md" >}})
  - [Sorting, scoring, stemming]({{< relref "/develop/interact/search-and-query/advanced-concepts/sorting.md" >}})

---

### Client Libraries

#### Go
- [Trans/pipe examples]({{< relref "/develop/clients/go/transpipe.md" >}})
- [JSON queries]({{< relref "/develop/clients/go/queryjson.md" >}})

#### .NET
- [Vector search]({{< relref "/develop/clients/dotnet/vecsearch.md" >}})
- [Trans/pipe usage]({{< relref "/develop/clients/dotnet/transpipe.md" >}})
- [JSON queries]({{< relref "/develop/clients/dotnet/queryjson.md" >}})

#### Java (Jedis)
- [Vector search]({{< relref "/develop/clients/jedis/vecsearch.md" >}})
- [Trans/pipe usage]({{< relref "/develop/clients/jedis/transpipe.md" >}})

#### Node.js
- [Vector queries]({{< relref "/develop/clients/nodejs/vecsearch.md" >}})
- [Trans/pipe examples]({{< relref "/develop/clients/nodejs/transpipe.md" >}})
- [JSON queries]({{< relref "/develop/clients/nodejs/queryjson.md" >}})

#### Redis-py
- [ScanIter usage]({{< relref "/develop/clients/redis-py/scaniter.md" >}})
- [Vector search]({{< relref "/develop/clients/redis-py/vecsearch.md" >}})
- [Trans/pipe usage]({{< relref "/develop/clients/redis-py/transpipe.md" >}})
- [JSON queries]({{< relref "/develop/clients/redis-py/queryjson.md" >}})

#### Lettuce
- [Cluster connection]({{< relref "/develop/clients/lettuce/connect.md" >}})
- [Production usage]({{< relref "/develop/clients/lettuce/produsage.md" >}})

#### Hiredis
- Full client guide:
  - [Overview]({{< relref "/develop/clients/hiredis/_index.md" >}})
  - [Connect]({{< relref "/develop/clients/hiredis/connect.md" >}})
  - [Issue commands]({{< relref "/develop/clients/hiredis/issue-commands.md" >}})
  - [Handle replies]({{< relref "/develop/clients/hiredis/handle-replies.md" >}})
  - [Transactions and pipelines]({{< relref "/develop/clients/hiredis/transpipe.md" >}})



## Q4 2024 (October - December) Updates

* Updated the RESP3 specification document to include the [attribute type]({{< relref "/develop/reference/protocol-spec#attributes" >}}).
* Updates to the [key eviction]({{< relref "/develop/reference/eviction" >}}) page.
* Updates to the Redis Insight page related to its new Redis Query Engine auto-completion [feature]({{< relref "/develop/tools/insight#workbench">}}).
* Restructured and added testable connection examples to the [client pages]({{< relref "/develop/clients" >}}).
* Added [Redis Community Edition]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce" >}}) and [Redis Stack]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisstack" >}}) release notes.
* Added new [Redis for AI]({{< relref "/develop/ai" >}}) page.
* Added new [Predis (PHP client library)]({{< relref "/develop/clients/php" >}}) page.

## Q3 2024 (July - September) Updates

* Updated the [RAG with Redis quick start guide]({{< relref "/develop/get-started/rag" >}}).
* Updates for [Redis Community Edition version 7.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce" >}}).
* Added new [Redis Insight debugging]({{< relref "/develop/tools/insight/debugging" >}}) page.
* Completed a major re-write/restructuring of the [vector indexing page]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}}).
* Added new [client-side caching page]({{< relref "/develop/clients/client-side-caching" >}}).
* Added new documentation for the [RDI in Redis Insight feature]({{< relref "/develop/tools/insight/rdi-connector" >}}).
* Added new documentation for the [Redis for VS Code feature]({{< relref "/develop/tools/redis-for-vscode/" >}}).
* Added multi-language code examples to the Redis Query Engine [query]({{< relref "/develop/interact/search-and-query/query">}}) pages.
* Added client-side caching information to the [supported clients]({{< relref "/develop/clients/client-side-caching#which-client-libraries-support-client-side-caching" >}}) pages.
* Numerous changes to the [Redis client content]({{< relref "/develop/clients" >}}).
