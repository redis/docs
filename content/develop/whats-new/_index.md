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

## Q3 2026 (July - September) Updates

### Redis Version Updates

- [Redis 8.10](/content/develop/whats-new/8-10.md) - New commands (`LMOVEM`/`BLMOVEM`, `SUNIONCARD`/`SDIFFCARD`, `FT.ALIASLIST`, `TS.NRANGE`/`TS.NREVRANGE`, `TS.READ`), hash templates, `FT.AGGREGATE` `COLLECT` reducer and stricter query timeout enforcement, extensive JSONPath extensions, plus core, Search, and JSON performance improvements.

## Q2 2026 (April - June) Updates

### Redis Version Updates

- [Redis 8.8](/content/develop/whats-new/8-8.md) - New Array data structure, `INCREX` rate limiter, in-group sorting reducer for `FT.AGGREGATE`, Rust iterators and devirtualized vector hot paths in Search, HyperLogLog and `MGET`/`MSET`/`HGETALL` performance improvements.

## Q1 2026 (January - March) Updates

### Tools

- Redis Insight [v3.2.0 release notes](/content/develop/tools/insight/release-notes/v.3.2.0.md)
- Redis Insight [v3.0.3 release notes](/content/develop/tools/insight/release-notes/v.3.0.3.md)
- Redis Insight [v2.68.0 release notes](/content/develop/tools/insight/release-notes/v.2.68.0.md)
- Redis Insight [v2.66.0 release notes](/content/develop/tools/insight/release-notes/v.2.66.0.md)

---

### Redis AI & Vectors

- Added [n8n vector store integration](/content/integrate/n8n-vector-store/_index.md)
- Updated [RedisVL 0.7.0 documentation](/content/develop/ai/redisvl/0.7.0/_index.md)
- Updated [RedisVL 0.9.1 documentation](/content/develop/ai/redisvl/0.9.1/_index.md)
- Updated [RedisVL 0.12.1 documentation](/content/develop/ai/redisvl/0.12.1/_index.md) (28 pages)

---

### Data Types

- Enhanced [example progression](/content/develop/data-types/_index.md) with metadata for:
  - [Strings](/content/develop/data-types/strings/_index.md)
  - [Hashes](/content/develop/data-types/hashes.md)
  - [Lists](/content/develop/data-types/lists.md)
  - [Sets](/content/develop/data-types/sets.md)
  - [Sorted sets](/content/develop/data-types/sorted-sets.md)
  - [Bitmaps](/content/develop/data-types/strings/bitmaps.md)
  - [Geospatial](/content/develop/data-types/geospatial.md)
  - [JSON](/content/develop/data-types/json/_index.md)
  - [Time series](/content/develop/data-types/timeseries/_index.md)
  - [Vector sets](/content/develop/data-types/vector-sets/_index.md)

---

### Client Libraries

#### Ruby (NEW)
- Added [Ruby client documentation](/content/develop/clients/ruby/_index.md)
- Landing page code examples for redis-rb

#### ioredis (NEW)
- Added [ioredis connect page](/content/develop/clients/ioredis/connect.md)

#### node-redis (JavaScript)
- Added Smart client handoffs section in the Connect page

#### Rust
- Added [Rust AMR/EntraID connection page](/content/develop/clients/rust/amr.md)
- Added Rust error handling documentation
- Added Rust transactions and pipelines documentation

#### Python (redis-py)
- Updated failover documentation with initial health checks
- Added failback configuration details
- Added observability page
- Added Smart client handoffs section in the Connect page

#### Java (Jedis)
- Added failback configuration section
- Updated failover behavior documentation

#### Java (Lettuce)
- Added failover documentation
- Added `LagAwareStrategy` dependencies
- Added Smart client handoffs section in the Connect page

#### .NET (NRedisStack)
- Added [FusionCache integration page](/content/integrate/fusioncache/_index.md)

#### Go
- Added observability page
- Added Smart client handoffs section in the Connect page

---

### Documentation Updates

- Added BinderHub support for "Run in browser" functionality with Python examples
- Added Jupyter notebook support with pre-configured environments
- Enhanced example progression metadata across all data types
- Added testable code example shortcodes with language-specific markers
- Fixed fuzzy search documentation with specific attribute examples
- Updated client library description differences across all major clients
- Added observability overview with OpenTelemetry metrics
- Added Smart client handoffs overview
- Docs for n8n Redis vector store integration
- Added railroad diagrams and API methods to all command pages

---

### Redis Version Updates

- [Redis 8.6](/content/develop/whats-new/8-6.md) - Stream idempotency, least recently modified eviction policies, hot key detection, TLS certificate-based authentication, enhanced time series with NaN support, memory optimizations
- [Redis 8.4](/content/develop/whats-new/8-4.md) - Updated documentation (removed RC1 designation)

## Q4 2025 (October - December) Updates

### Tools

- Enhanced Redis Insight documentation with autocomplete features

---

### Redis AI & Vectors

- Launched [AI Agent Builder](/content/develop/ai/agent-builder/_index.md) - interactive code generator for production-ready AI agents
- Documented [RedisVL 0.9.0](/content/develop/ai/redisvl/_index.md) (28 pages):
  - Vector search and indexing
  - Semantic caching
  - Message history management
  - Rerankers and routers
  - Vectorizers
- Added [AI video tutorials](/content/develop/ai/ai-videos.md) with YouTube content
- Added [AI notebook collection](/content/develop/ai/notebook-collection.md) with notebook links
- Added [LangCache documentation](/content/develop/ai/context-engine/langcache/_index.md) with API examples

---

### Client Libraries

#### Rust (NEW)
- Added [Rust client documentation](/content/develop/clients/rust/_index.md)
- Enabled Rust-Sync and Rust-Async client variants
- Landing page code examples for Rust

#### Java (Jedis)
- Added [vector set embedding examples](/content/develop/clients/jedis/vecsets.md)

#### .NET (NRedisStack)
- Added [vector set embedding examples](/content/develop/clients/dotnet/vecsets.md)
- Enabled C#-Sync and C#-Async client variants with async examples

---

### Documentation Updates

- Integrated BinderHub for "Run in browser" functionality with Python examples
- Launched Testable Code Examples (TCE) framework for hands-on learning
- Added new integration guides (cloud platforms, monitoring tools, AI/ML frameworks)

---

## Q3 2025 (July - September) Updates

### Tools

- Added [redis-cli installation instructions](/content/develop/tools/cli.md)

---

### Redis AI & Vectors

- Updated [vector types documentation](/content/develop/ai/search-and-query/vectors/_index.md) for INT8 and UINT8
- Added [GEO search precision information](/content/develop/ai/search-and-query/indexing/geoindex.md)
- Enhanced [LangCache SDK](/content/develop/ai/context-engine/langcache/_index.md) with savings calculator and improved API documentation

---

### Data Types

- [Bitmaps](/content/develop/data-types/strings/bitmaps.md):
  - Added BITOP documentation with Python testable code examples
  - Added bit operation diagrams

---

### Client Libraries

#### Java (Jedis)
- Added [vector set embedding examples](/content/develop/clients/jedis/vecsets.md)

#### .NET (NRedisStack)
- Added [vector set embedding examples](/content/develop/clients/dotnet/vecsets.md)
- Enabled C#-Sync and C#-Async client variants with async examples on the landing page

#### Rust (NEW)
- Added initial [Rust client documentation](/content/develop/clients/rust/_index.md)
- Enabled Rust-Sync and Rust-Async client variants
- Landing page code examples for Rust

---

### Documentation Updates

- Added [close/quit details](/content/develop/clients/_index.md) to client landing pages
- Added [redlock-universal](/content/develop/clients/patterns/distributed-locks.md) to Redlock implementations list
- Fixed [keyspace notifications](/content/develop/pubsub/keyspace-notifications.md) typo
- Updated Unicode quotes to ASCII throughout documentation
- Fixed broken links and improved cross-references

## Q2 2025 (April - June) Updates

### Tools

- Redis Insight [v2.70.1 release notes](/content/develop/tools/insight/release-notes/v.2.70.1.md)
- Redis Insight [v1.4.0 release notes](/content/develop/tools/insight/release-notes/v1.4.0.md)
- Updated [Redis Insight pages](/content/develop/tools/insight/_index.md) with consistent image-card layout
- Added Redis Insight SVG icons and download links across [tools documentation](/content/develop/tools/_index.md)

---

### Redis AI & Vectors

- Reorganized [search and query documentation](/content/develop/ai/search-and-query/_index.md) under AI section
- Added [AI video tutorials](/content/develop/ai/ai-videos.md) with YouTube content
- Added [AI notebook collection](/content/develop/ai/notebook-collection.md) with 8 new notebook links
- Expanded vector examples across multiple clients:
  - [Python vector sets](/content/develop/clients/redis-py/vecsets.md)
  - [Go vector sets](/content/develop/clients/go/vecsets.md)
  - [JavaScript vector sets](/content/develop/clients/nodejs/vecsets.md)
  - [Lettuce vector queries](/content/develop/clients/lettuce/vecsearch.md)
  - [Lettuce vector sets](/content/develop/clients/lettuce/vecsets.md)
- Updated [redisvl documentation](/content/develop/ai/redisvl/_index.md) for versions 0.6.0-0.8.2
- Added [LangCache SDK](/content/develop/ai/context-engine/langcache/_index.md) documentation with [API reference](/content/develop/ai/context-engine/langcache/api-examples.md)

---

### Redis 8.0 & 8.2 Features

- [Redis Open Source 8.2 documentation](/content/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.2-release-notes.md)
- Updated [Redis 8.0 release notes](/content/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/redisos-8.0-release-notes.md)
- [Redis Search expiration capabilities](/content/develop/ai/search-and-query/advanced-concepts/expiration.md) in Redis 8
- Enhanced [TAG documentation](/content/develop/ai/search-and-query/advanced-concepts/tags.md) per GitHub issues
- [Vector quantization and compression](/content/develop/ai/search-and-query/vectors/svs-compression.md) moved to dedicated page

---

### Data Types

- TimeSeries:
  - [Enhanced time series examples](/content/develop/data-types/timeseries/_index.md) with query and aggregation info
  - Added testable code examples (TCE) support
- Probabilistic:
  - Added testable examples for [Python](/content/develop/clients/redis-py/prob.md), [C#](/content/develop/clients/dotnet/nredisstack/prob.md), [Java](/content/develop/clients/jedis/prob.md), and [Go](/content/develop/clients/go/prob.md)
  - Updated [Cuckoo filter documentation](/content/develop/data-types/probabilistic/cuckoo-filter.md)

---

### Client Libraries

#### Python (redis-py)
- Added [reconnection examples](/content/develop/clients/redis-py/connect.md#retrying-connections)
- Enhanced [timeout and retry details](/content/develop/clients/redis-py/produsage.md#timeouts)
- Fixed [pip install command](/content/develop/clients/redis-py/amr.md) for redis-py entraid extension
- Added [Binder environment links](/content/develop/clients/redis-py/_index.md#connect-and-test) for Python examples

#### Java (Jedis)
- Updated to [latest Jedis version](/content/develop/clients/jedis/_index.md#install)
- Added [reconnection examples](/content/develop/clients/jedis/connect.md#retrying-a-command-after-a-connection-failure)
- Enhanced [probabilistic data type examples](/content/develop/clients/jedis/prob.md)

#### Node.js
- Added [command reliability information](/content/develop/clients/nodejs/produsage.md#command-execution-reliability)
- Fixed [reconnection details](/content/develop/clients/nodejs/connect.md#reconnect-after-disconnection)

#### .NET (StackExchange.Redis/NRedisStack)
- Added [retries and timeouts](/content/develop/clients/dotnet/produsage.md) to production usage advice
- Enhanced [dialect 2 notes](/content/develop/clients/dotnet/nredisstack/queryjson.md)

#### Go (go-redis)
- Added [retries and timeouts](/content/develop/clients/go/produsage.md) to production usage
- Enhanced [dialect 2 notes](/content/develop/clients/go/queryjson.md)
- Added [Connect with AMR](/content/develop/clients/go/amr.md) page.

#### Lettuce
- Updated to [latest Lettuce version](/content/develop/clients/lettuce/_index.md#install)
- Added [command reliability information](/content/develop/clients/lettuce/produsage.md#connection-and-execution-reliability)
- Added [JSON query examples](/content/develop/clients/lettuce/queryjson.md)

#### PHP (Predis)
- Enhanced [dialect 2 notes](/content/develop/clients/php/queryjson.md)

---

### Documentation Structure & Navigation

- Reorganized [develop section navigation](/content/develop/_index.md) with improved sidebar structure
- Moved [programmability section](/content/develop/programmability/_index.md) into develop area
- Relocated [patterns folder](/content/develop/clients/patterns/_index.md) to clients section
- Added [Using commands section](/content/develop/using-commands/_index.md) to develop area
- Enhanced [keyspace notifications](/content/develop/pubsub/keyspace-notifications.md) and [pub/sub](/content/develop/pubsub/_index.md) documentation
- Updated [transactions](/content/develop/using-commands/transactions.md) and [pipeline](/content/develop/using-commands/pipelining.md) pages
- Added comprehensive aliases for backward compatibility

---

### Protocol & Technical Updates

- Fixed [RESP protocol specification](/content/develop/reference/protocol-spec.md) attribute byte documentation
- Enhanced [FT.AGGREGATE expression precedence](/content/develop/ai/search-and-query/advanced-concepts/aggregations-syntax.md) documentation
- Updated [distributed locks](/content/develop/clients/patterns/distributed-locks.md) documentation
- Fixed [FP32 vectorsets endianness](/content/develop/data-types/vector-sets/_index.md#endianness-considerations-for-fp32-format) documentation

## Q1 2025 (January - March) Updates

### Tools

- Redis Insight [v2.66 release notes](/content/develop/tools/insight/release-notes/v.2.66.0.md)
- Updated CLI output samples for [`bigkeys`, `memkeys`, `keystats`](/content/develop/tools/cli.md)

---

### Redis AI & Vectors

- Expanded vector examples:
  - [Python](/content/develop/clients/redis-py/vecsearch.md)
  - [Node.js](/content/develop/clients/nodejs/vecsearch.md)
  - [Java (Jedis)](/content/develop/clients/jedis/vecsearch.md)
  - [Go](/content/develop/clients/go/vecsearch.md)
  - [.NET](/content/develop/clients/dotnet/nredisstack/vecsearch.md)
- Updated AI integrations:
  - [AI overview](/content/develop/ai/_index.md)
  - [RAG intro](/content/develop/get-started/rag.md)
  - [Redis in AI](/content/develop/get-started/redis-in-ai.md)

---

### Data Types

- TimeSeries:
  - [`COMPACTION_POLICY`](/content/develop/data-types/timeseries/configuration.md)
  - [Client-side caching update](/content/develop/clients/client-side-caching.md)
- JSON:
  - [Active memory defragmentation](/content/operate/oss_and_stack/stack-with-enterprise/json/commands.md)
- Probabilistic:
  - [Bloom filter](/content/develop/data-types/probabilistic/bloom-filter.md)
  - [Count-min sketch](/content/develop/data-types/probabilistic/count-min-sketch.md)
  - [Top-K](/content/develop/data-types/probabilistic/top-k.md)
  - [Cuckoo filter](/content/develop/data-types/probabilistic/cuckoo-filter.md)

---

### Commands & API Docs

- Pages updated for format and accuracy:
  - [ACL SETUSER](/content/commands/acl-setuser.md)
  - [JSON.GET](/content/commands/json.get.md)
  - [TS.ADD](/content/commands/ts.add.md)
  - [SCAN](/content/commands/scan.md)
  - [SORT](/content/commands/sort.md)
- RESP3 reply types documented in [Hiredis command page](/content/develop/clients/hiredis/issue-commands.md)
- [CSC behavior clarified](/content/develop/clients/client-side-caching.md)

---

### Search & Query

- Best practices:
  - [Dev-to-prod guide](/content/develop/ai/search-and-query/best-practices/dev-to-prod-best-practices.md)
  - [Scalable queries](/content/develop/ai/search-and-query/best-practices/scalable-query-best-practices.md)
  - [Index lifecycle](/content/develop/ai/search-and-query/best-practices/index-mgmt-best-practices.md)
- New/updated topics:
  - [Autocomplete](/content/develop/ai/search-and-query/advanced-concepts/autocomplete.md)
  - [Escaping & tokenization](/content/develop/ai/search-and-query/advanced-concepts/escaping.md)
  - [Geo indexing](/content/develop/ai/search-and-query/indexing/geoindex.md)
  - [Sorting, scoring, stemming](/content/develop/ai/search-and-query/advanced-concepts/sorting.md)

---

### Client Libraries

#### Go
- [Trans/pipe examples](/content/develop/clients/go/transpipe.md)
- [JSON queries](/content/develop/clients/go/queryjson.md)

#### .NET
- [Vector search](/content/develop/clients/dotnet/nredisstack/vecsearch.md)
- [Trans/pipe usage](/content/develop/clients/dotnet/transpipe.md)
- [JSON queries](/content/develop/clients/dotnet/nredisstack/queryjson.md)

#### Java (Jedis)
- [Vector search](/content/develop/clients/jedis/vecsearch.md)
- [Trans/pipe usage](/content/develop/clients/jedis/transpipe.md)

#### Node.js
- [Vector queries](/content/develop/clients/nodejs/vecsearch.md)
- [Trans/pipe examples](/content/develop/clients/nodejs/transpipe.md)
- [JSON queries](/content/develop/clients/nodejs/queryjson.md)

#### Redis-py
- [ScanIter usage](/content/develop/clients/redis-py/scaniter.md)
- [Vector search](/content/develop/clients/redis-py/vecsearch.md)
- [Trans/pipe usage](/content/develop/clients/redis-py/transpipe.md)
- [JSON queries](/content/develop/clients/redis-py/queryjson.md)

#### Lettuce
- [Cluster connection](/content/develop/clients/lettuce/connect.md)
- [Production usage](/content/develop/clients/lettuce/produsage.md)

#### Hiredis
- Full client guide:
  - [Overview](/content/develop/clients/hiredis/_index.md)
  - [Connect](/content/develop/clients/hiredis/connect.md)
  - [Issue commands](/content/develop/clients/hiredis/issue-commands.md)
  - [Handle replies](/content/develop/clients/hiredis/handle-replies.md)
  - [Transactions and pipelines](/content/develop/clients/hiredis/transpipe.md)



## Q4 2024 (October - December) Updates

* Updated the RESP3 specification document to include the [attribute type](/content/develop/reference/protocol-spec.md#attributes).
* Updates to the [key eviction](/content/develop/reference/eviction/index.md) page.
* Updates to the Redis Insight page related to its new Redis Search auto-completion [feature](/content/develop/tools/insight/_index.md#workbench).
* Restructured and added testable connection examples to the [client pages](/content/develop/clients/_index.md).
* Added [Redis Open Source](/content/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/_index.md) and [Redis Stack](/content/operate/oss_and_stack/stack-with-enterprise/release-notes/redisstack/_index.md) release notes.
* Added new [Redis for AI](/content/develop/ai/_index.md) page.
* Added new [Predis (PHP client library)](/content/develop/clients/php/_index.md) page.

## Q3 2024 (July - September) Updates

* Updated the [RAG with Redis quick start guide](/content/develop/get-started/rag.md).
* Updates for [Redis Open Source version 7.4](/content/operate/oss_and_stack/stack-with-enterprise/release-notes/redisce/_index.md).
* Added new [Redis Insight debugging](/content/develop/tools/insight/debugging.md) page.
* Completed a major re-write/restructuring of the [vector indexing page](/content/develop/ai/search-and-query/vectors/_index.md).
* Added new [client-side caching page](/content/develop/clients/client-side-caching.md).
* Added new documentation for the [RDI in Redis Insight feature](/content/develop/tools/insight/rdi-connector.md).
* Added new documentation for the [Redis for VS Code feature](/content/develop/tools/redis-for-vscode/_index.md).
* Added multi-language code examples to Redis Search [query](/content/develop/ai/search-and-query/query/_index.md) pages.
* Added client-side caching information to the [supported clients](/content/develop/clients/client-side-caching.md#which-client-libraries-support-client-side-caching) pages.
* Numerous changes to the [Redis client content](/content/develop/clients/_index.md).
