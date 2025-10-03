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
## Q3 2025 (July - September) Updates

### Tools

- Added [redis-cli installation instructions]({{< relref "/develop/tools/cli" >}})

---

### Redis AI & Vectors

- Updated [vector types documentation]({{< relref "/develop/ai/search-and-query/vectors/_index" >}}) for INT8 and UINT8
- Added [GEO search precision information]({{< relref "/develop/ai/search-and-query/indexing/geoindex" >}})
- Enhanced [LangCache SDK]({{< relref "/develop/ai/langcache/_index" >}}) with savings calculator and improved API documentation

---

### Data Types

- [Bitmaps]({{< relref "/develop/data-types/bitmaps" >}}):
  - Added BITOP documentation with Python testable code examples
  - Added bit operation diagrams

---

### Client Libraries

#### Java (Jedis)
- Added [vector set embedding examples]({{< relref "/develop/clients/jedis/vecsets" >}})

#### .NET (NRedisStack)
- Added [vector set embedding examples]({{< relref "/develop/clients/dotnet/vecsets" >}})
- Enabled C#-Sync and C#-Async client variants with async examples on the landing page

#### Rust (NEW)
- Added initial [Rust client documentation]({{< relref "/develop/clients/rust/_index" >}})
- Enabled Rust-Sync and Rust-Async client variants
- Landing page code examples for Rust

---

### Documentation Updates

- Added [close/quit details]({{< relref "/develop/clients/_index" >}}) to client landing pages
- Added [redlock-universal]({{< relref "/develop/clients/patterns/distributed-locks" >}}) to Redlock implementations list
- Fixed [keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) typo
- Updated Unicode quotes to ASCII throughout documentation
- Fixed broken links and improved cross-references

## Q2 2025 (April - June) Updates

### Tools

- Redis Insight [v2.70.1 release notes]({{< relref "/develop/tools/insight/release-notes/v.2.70.1" >}})
- Redis Insight [v1.4.0 release notes]({{< relref "/develop/tools/insight/release-notes/v1.4.0" >}})
- Updated [Redis Insight pages]({{< relref "/develop/tools/insight/_index" >}}) with consistent image-card layout
- Added Redis Insight SVG icons and download links across [tools documentation]({{< relref "/develop/tools/_index" >}})

---

### Redis AI & Vectors

- Reorganized [search and query documentation]({{< relref "/develop/ai/search-and-query/_index" >}}) under AI section
- Added [AI video tutorials]({{< relref "/develop/ai/ai-videos" >}}) with YouTube content
- Added [AI notebook collection]({{< relref "/develop/ai/notebook-collection" >}}) with 8 new notebook links
- Expanded vector examples across multiple clients:
  - [Python vector sets]({{< relref "/develop/clients/redis-py/vecsets" >}})
  - [Go vector sets]({{< relref "/develop/clients/go/vecsets" >}})
  - [JavaScript vector sets]({{< relref "/develop/clients/nodejs/vecsets" >}})
  - [Lettuce vector queries]({{< relref "/develop/clients/lettuce/vecsearch" >}})
  - [Lettuce vector sets]({{< relref "/develop/clients/lettuce/vecsets" >}})
- Updated [redisvl documentation]({{< relref "/develop/ai/redisvl/_index" >}}) for versions 0.6.0-0.8.2
- Added [LangCache SDK]({{< relref "/develop/ai/langcache/_index" >}}) documentation with [API reference]({{< relref "/develop/ai/langcache/api-examples" >}})

---

### Redis 8.0 & 8.2 Features

- [Redis Open Source 8.2 documentation]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.2-release-notes" >}})
- Updated [Redis 8.0 release notes]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes" >}})
- [Redis Query Engine expiration capabilities]({{< relref "/develop/ai/search-and-query/advanced-concepts/expiration" >}}) in Redis 8
- Enhanced [TAG documentation]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}}) per GitHub issues
- [Vector quantization and compression]({{< relref "/develop/ai/search-and-query/vectors/svs-compression" >}}) moved to dedicated page

---

### Data Types

- TimeSeries:
  - [Enhanced time series examples]({{< relref "/develop/data-types/timeseries/_index" >}}) with query and aggregation info
  - Added testable code examples (TCE) support
- Probabilistic:
  - Added testable examples for [Python]({{< relref "/develop/clients/redis-py/prob/" >}}), [C#]({{< relref "/develop/clients/dotnet/prob/" >}}), [Java]({{< relref "/develop/clients/jedis/prob/" >}}), and [Go]({{< relref "/develop/clients/go/prob/" >}})
  - Updated [Cuckoo filter documentation]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})

---

### Client Libraries

#### Python (redis-py)
- Added [reconnection examples]({{< relref "/develop/clients/redis-py/connect/#retrying-connections" >}})
- Enhanced [timeout and retry details]({{< relref "/develop/clients/redis-py/produsage#timeouts" >}})
- Fixed [pip install command]({{< relref "/develop/clients/redis-py/amr/" >}}) for redis-py entraid extension
- Added [Binder environment links]({{< relref "/develop/clients/redis-py/_index#connect-and-test" >}}) for Python examples

#### Java (Jedis)
- Updated to [latest Jedis version]({{< relref "/develop/clients/jedis/#install" >}})
- Added [reconnection examples]({{< relref "/develop/clients/jedis/connect#retrying-a-command-after-a-connection-failure" >}})
- Enhanced [probabilistic data type examples]({{< relref "/develop/clients/jedis/prob" >}})

#### Node.js
- Added [command reliability information]({{< relref "/develop/clients/nodejs/produsage#command-execution-reliability" >}})
- Fixed [reconnection details]({{< relref "/develop/clients/nodejs/connect#reconnect-after-disconnection" >}})

#### .NET (NRedisStack)
- Added [retries and timeouts]({{< relref "/develop/clients/dotnet/produsage" >}}) to production usage advice
- Enhanced [dialect 2 notes]({{< relref "/develop/clients/dotnet/queryjson" >}})

#### Go (go-redis)
- Added [retries and timeouts]({{< relref "/develop/clients/go/produsage" >}}) to production usage
- Enhanced [dialect 2 notes]({{< relref "/develop/clients/go/queryjson" >}})
- Added [Connect with AMR]({{< relref "/develop/clients/go/amr" >}}) page.

#### Lettuce
- Updated to [latest Lettuce version]({{< relref "/develop/clients/lettuce/_index#install" >}})
- Added [command reliability information]({{< relref "/develop/clients/lettuce/produsage#connection-and-execution-reliability" >}})
- Added [JSON query examples]({{< relref "/develop/clients/lettuce/queryjson" >}})

#### PHP (Predis)
- Enhanced [dialect 2 notes]({{< relref "/develop/clients/php/queryjson" >}})

---

### Documentation Structure & Navigation

- Reorganized [develop section navigation]({{< relref "/develop/_index" >}}) with improved sidebar structure
- Moved [programmability section]({{< relref "/develop/programmability/_index" >}}) into develop area
- Relocated [patterns folder]({{< relref "/develop/clients/patterns/_index" >}}) to clients section
- Added [Using commands section]({{< relref "/develop/using-commands/_index" >}}) to develop area
- Enhanced [keyspace notifications]({{< relref "/develop/pubsub/keyspace-notifications" >}}) and [pub/sub]({{< relref "/develop/pubsub/_index" >}}) documentation
- Updated [transactions]({{< relref "/develop/using-commands/transactions" >}}) and [pipeline]({{< relref "/develop/using-commands/pipelining/" >}}) pages
- Added comprehensive aliases for backward compatibility

---

### Protocol & Technical Updates

- Fixed [RESP protocol specification]({{< relref "/develop/reference/protocol-spec" >}}) attribute byte documentation
- Enhanced [FT.AGGREGATE expression precedence]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations-syntax/" >}}) documentation
- Updated [distributed locks]({{< relref "/develop/clients/patterns/distributed-locks" >}}) documentation
- Fixed [FP32 vectorsets endianness]({{< relref "/develop/data-types/vector-sets#endianness-considerations-for-fp32-format" >}}) documentation

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
  - [JSON.GET]({{< relref "/commands/json.get/index.md" >}})
  - [TS.ADD]({{< relref "/commands/ts.add/index.md" >}})
  - [SCAN]({{< relref "/commands/scan/index.md" >}})
  - [SORT]({{< relref "/commands/sort/index.md" >}})
- RESP3 reply types documented in [Hiredis command page]({{< relref "/develop/clients/hiredis/issue-commands.md" >}})
- [CSC behavior clarified]({{< relref "/develop/clients/client-side-caching.md" >}})

---

### Search & Query

- Best practices:
  - [Dev-to-prod guide]({{< relref "/develop/ai/search-and-query/best-practices/dev-to-prod-best-practices.md" >}})
  - [Scalable queries]({{< relref "/develop/ai/search-and-query/best-practices/scalable-query-best-practices.md" >}})
  - [Index lifecycle]({{< relref "/develop/ai/search-and-query/best-practices/index-mgmt-best-practices.md" >}})
- New/updated topics:
  - [Autocomplete]({{< relref "/develop/ai/search-and-query/advanced-concepts/autocomplete.md" >}})
  - [Escaping & tokenization]({{< relref "/develop/ai/search-and-query/advanced-concepts/escaping.md" >}})
  - [Geo indexing]({{< relref "/develop/ai/search-and-query/indexing/geoindex.md" >}})
  - [Sorting, scoring, stemming]({{< relref "/develop/ai/search-and-query/advanced-concepts/sorting.md" >}})

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
* Added [Redis Open Source]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce" >}}) and [Redis Stack]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisstack" >}}) release notes.
* Added new [Redis for AI]({{< relref "/develop/ai" >}}) page.
* Added new [Predis (PHP client library)]({{< relref "/develop/clients/php" >}}) page.

## Q3 2024 (July - September) Updates

* Updated the [RAG with Redis quick start guide]({{< relref "/develop/get-started/rag" >}}).
* Updates for [Redis Open Source version 7.4]({{< relref "/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce" >}}).
* Added new [Redis Insight debugging]({{< relref "/develop/tools/insight/debugging" >}}) page.
* Completed a major re-write/restructuring of the [vector indexing page]({{< relref "/develop/ai/search-and-query/vectors" >}}).
* Added new [client-side caching page]({{< relref "/develop/clients/client-side-caching" >}}).
* Added new documentation for the [RDI in Redis Insight feature]({{< relref "/develop/tools/insight/rdi-connector" >}}).
* Added new documentation for the [Redis for VS Code feature]({{< relref "/develop/tools/redis-for-vscode/" >}}).
* Added multi-language code examples to the Redis Query Engine [query]({{< relref "/develop/ai/search-and-query/query">}}) pages.
* Added client-side caching information to the [supported clients]({{< relref "/develop/clients/client-side-caching#which-client-libraries-support-client-side-caching" >}}) pages.
* Numerous changes to the [Redis client content]({{< relref "/develop/clients" >}}).
