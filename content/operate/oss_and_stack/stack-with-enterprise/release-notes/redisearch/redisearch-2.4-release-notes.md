---
Title: RediSearch 2.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Vector Similarity Search (VSS). New query syntax Dialect version 2. Choose
  between Dialect 1 and Dialect 2 for query parser behavior. Hybrid queries.
linkTitle: v2.4 (March 2022)
min-version-db: 6.0.0
min-version-rs: 6.0.0
weight: 93
---
## Requirements

RediSearch v2.4.16 requires:

- Minimum Redis compatibility version (database): 6.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.0

## v2.4.16 (November 2022)

This is a maintenance release for RediSearch 2.4

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2962](https://github.com/RediSearch/RediSearch/pull/2962) Crash upon AOF preload - Use local GC context in periodic callback (MOD-3951)
  - [#2863](https://github.com/RediSearch/RediSearch/pull/2863) High CPU Utilization - Change MAX_LEV_DISTANCE to 4 (MOD-3563)
  - [#3041](https://github.com/RediSearch/RediSearch/pull/3041), [#3063](https://github.com/RediSearch/RediSearch/pull/3063), [#3051](https://github.com/RediSearch/RediSearch/pull/3051), [#3143](https://github.com/RediSearch/RediSearch/pull/3143) Several memory leaks (MOD-4121, MOD-4252)
  - [#3119](https://github.com/RediSearch/RediSearch/pull/3119) Crash on intersect iterator GetCriteriaTester (MOD-4200)
  - [#3128](https://github.com/RediSearch/RediSearch/pull/3128) Filter rules must be reevaluated per index per document (MOD-4207)
  - [#3127](https://github.com/RediSearch/RediSearch/pull/3127) Fix assertion failure on wrong result counting, which leads to a crash (MOD-4214)
  - [#3171](https://github.com/RediSearch/RediSearch/pull/3171) Missing implementation of NumericRangeIterator_OnReopen which lead to crash (MOD-4255)
  - [#3191](https://github.com/RediSearch/RediSearch/pull/3191) Wrong query iterator casting which resulted in 100% CPU utilization (MOD-4290)
  - [#3197](https://github.com/RediSearch/RediSearch/pull/3197) Release failed to create temporary indices on the main thread (MOD-4388)
  - [#2981](https://github.com/RediSearch/RediSearch/pull/2981) Double freeing in iterators of hybrid queries resulting in crash (MOD-4411)
  - [#3161](https://github.com/RediSearch/RediSearch/pull/3161) Latency used to increase over time when combining INKEYS and wildcard query (MOD-4343)

## v2.4.15 (October 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3095](https://github.com/RediSearch/RediSearch/pull/3095) Replace order of parsing the parameters and query in the coordinator (MOD-4205)
  - [#3012](https://github.com/RediSearch/RediSearch/pull/3012) Improved efficiency of LLAPI `findInfo`, which could reduce stability during upgrade in Redis Enterprise (MOD-4197, MOD-4052)
  - [#3040](https://github.com/RediSearch/RediSearch/pull/3040), [#3049](https://github.com/RediSearch/RediSearch/pull/3049) Fix for `SORTBY` numeric field for non-SORTABLE fields on the coordinator (MOD-4115)
  - [#3050](https://github.com/RediSearch/RediSearch/pull/3050) Results from fields from a missing value should come last when combined with `SORTBY` (MOD-4120)

- Improvements:

  - [#3047](https://github.com/RediSearch/RediSearch/pull/3047) Add `strlen` string function to `FT.AGGREGATE` (MOD-4141)
  - [#3038](https://github.com/RediSearch/RediSearch/pull/3038) Add `number_of_uses` to `FT.INFO` for the number of times the index was queried

## v2.4.14 (August 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Improvements:

  - [Vector similarity v0.3.2](https://github.com/RedisAI/VectorSimilarity/releases/tag/v0.3.2)
  - [#2955](https://github.com/RediSearch/RediSearch/pull/2955) Add timeout during prefix query (MOD-3949)
  - [#2957](https://github.com/RediSearch/RediSearch/pull/2957) Efficient removal from prefix list for cases with many indices

- Bug fixes:

  - [#2937](https://github.com/RediSearch/RediSearch/pull/2937) Returning `NULL` response after encountering an expired document (MOD-3515)
  - [#2962](https://github.com/RediSearch/RediSearch/pull/2962) Crash upon AOF preload (MOD-3951)
  - [#2986](https://github.com/RediSearch/RediSearch/pull/2986) Memory leak related to schema prefixes

## v2.4.11 (July 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2892](https://github.com/RediSearch/RediSearch/pull/2892) Combining `SORTBY` with `MAX` on `FT.SEARCH` (which is not supported) caused an inconsistent response and out-of-memory error (MOD-3540, MOD-3644)
  - [VecSim v0.3.1](https://github.com/RedisAI/VectorSimilarity/releases/tag/v0.3.1)
    - HNSW indices: reclaim memory upon deletion - HNSW index's data structures now reclaim memory and shrink upon deletion

- Improvements:

  - [VecSim v0.3.1](https://github.com/RedisAI/VectorSimilarity/releases/tag/v0.3.1)
    - HNSW indices: delete procedure is up to 40% faster
    - More accurate memory consumption reporting for HNSW indices

## v2.4.10 (July 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2863](https://github.com/RediSearch/RediSearch/pull/2863) Crash due to too high (Levenshtein) `DISTANCE` in `FT.SPELLCHECK`. This fix limits the `DISTANCE` to 4. (MOD-3563)
  - [#2875](https://github.com/RediSearch/RediSearch/pull/2875) Not all documents with vector fields were indexed with Auto Tiering (MOD-3584)
  - [#2846](https://github.com/RediSearch/RediSearch/pull/2846) Enforce Redis Enterprise memory limit for vector indices

## v2.4.9 (June 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2837](https://github.com/RediSearch/RediSearch/pull/2837), [#2836](https://github.com/RediSearch/RediSearch/issues/2836) Crash on `FT.AGGREGATE` "... APPLY '-INF % -1'..."
  - [#2814](https://github.com/RediSearch/RediSearch/pull/2814) `FT.EXPLAIN` without parameters causes a crash
  - [#2790](https://github.com/RediSearch/RediSearch/pull/2790) Incorrect `num_terms` value in `FT.INFO` after a term is deleted from all the docs (garbage collection)
  - [#2804](https://github.com/RediSearch/RediSearch/pull/2804) Freeze when `OFFSET`+`LIMIT` was greater than `maxSearchResults` (config)
  - [#2791](https://github.com/RediSearch/RediSearch/pull/2791) Add `BlockedClientMeasureTime` to coordinator for more accurate performance stats
  - [#2802](https://github.com/RediSearch/RediSearch/pull/2802) Tagged parts of keys (curly brackets `{}`) are now returned by `FT.SEARCH`

- Improvements:

  - [#2806](https://github.com/RediSearch/RediSearch/pull/2806) Do not load the JSON API when RediSearch is initialized as a library

- Minor breaking change:

  - As pointed out above, [#2802](https://github.com/RediSearch/RediSearch/pull/2802) is a bug fix. However, if your application relies on RediSearch incorrectly trimming the tagged part of a key (using `{}`), this could break your application. This only applies to users who are using RediSearch in clustered databases.

## v2.4.8 (May 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.
However, if you're using Vector Similarity (introduced in RediSearch 2.4), there are some critical bugs that may affect a subset of users. In this case, you should upgrade.

Details:

- Bug fixes:

  - [#2739](https://github.com/RediSearch/RediSearch/pull/2739) Memory leak in coordinator related to Vector Similarity (MOD-3023)
  - [#2736](https://github.com/RediSearch/RediSearch/pull/2736), [#2782](https://github.com/RediSearch/RediSearch/pull/2782) Memory allocation restrictions for Vector Similarity indices (causing OOM) (MOD-3195)
  - [#2755](https://github.com/RediSearch/RediSearch/pull/2755) Compare the entire vector field name instead of a prefix when creating a new vector index
  - [#2780](https://github.com/RediSearch/RediSearch/pull/2780) Initialize all variables in `EvalContext` (which might have led to crashes in clustered databases)

- Improvements:

  - [#2740](https://github.com/RediSearch/RediSearch/pull/2740) Performance optimization for hybrid vector queries

## v2.4.6 (May 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2716](https://github.com/RediSearch/RediSearch/pull/2716) Removed assert statement that could cause crashes with replica of (MOD-3008, MOD-3012)
  - [#2734](https://github.com/RediSearch/RediSearch/pull/2734) `ON_TIMEOUT RETURN` policy fix: return results obtained until timeout rather than discarding them
  - [#2714](https://github.com/RediSearch/RediSearch/pull/2714) Memory leak on non-TLS setup in coordinator

## v2.4.5 (April 2022)

This is a maintenance release for RediSearch 2.4.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2702](https://github.com/RediSearch/RediSearch/pull/2702) `INKEYS` combined with Vector Similarity caused server unresponsiveness (MOD-2952)
  - [#2705](https://github.com/RediSearch/RediSearch/pull/2705) Incorrect results when deleting a document that was skipped at index time
  - [#2698](https://github.com/RediSearch/RediSearch/issues/2698) Synonyms in Chinese

- Improvements:

  - [#2694](https://github.com/RediSearch/RediSearch/pull/2694) Performance: In a `TEXT` field, skip term iterator if term does not appear in requested field

## v2.4.3 (March 2022)

This is the General Availability release of RediSearch 2.4.

### Headlines

RediSearch 2.4 introduces a new capability, Vector Similarity Search (VSS), which allows indexing and querying vector data stored (as BLOBs) in Redis hashes.

It also introduces a new query syntax to address query parser inconsistencies found in previous versions of RediSearch. Users can now choose between Dialect version 1 (to keep existing query parser behavior) or Dialect version 2 (to switch to the updated behavior).

All VSS queries or any query using the `PARAMS` option must use Dialect version 2.

### What's new in 2.4

- `FT.CREATE` is extended to support the creation of 2 popular types of vector indexes:

  - **FLAT Index**

    This type of index is used when the recall is more important than the speed of query execution. A query vector will be compared to all vectors in a flat index. The search results will return the exact top k nearest neighbors to the query vector.

  - **Hierarchical Navigable Small World (HNSW) Index**

    This index is a modified implementation of the library written by the author of this influential [academic paper](https://arxiv.org/abs/1603.09320). An HNSW vector index is used when the speed of query execution is preferred over recall. The results returned are approximate nearest neighbors (ANNs).

    You can try out different HNSW index parameters (`M`, `EFCONSTRUCTION`, `EFRUNTIME`) to improve the “recall versus speed” balance.

- Use `FT.SEARCH` to retrieve the top K hashes with the most similar vectors to a given query vector.

- Hybrid queries in `FT.SEARCH`:

  Use hybrid queries to retrieve Redis hashes that match a combination of vector and non-vector search criteria. Non-vector search criteria can include expressions combining `NUMERIC`, `TEXT`, `TAG`, and `GEO` fields.

  Hybrid queries are often used in modern ecommerce search applications featuring “visual” similarity plus metadata similarity.
  For example, you can use a single hybrid query to find products that are visually similar to a given image within a price range and/or geo-location.

- Use [`FT.CONFIG`](https://github.com/RediSearch/RediSearch/blob/master/docs/Commands.md#ftconfig) to set `DEFAULT_DIALECT` at the module level. By default, `DEFAULT_DIALECT` is set to 1.

- Override `DIALECT`:

  It is possible to override the module-level dialect for a specific command at runtime. You can specify the dialect when executing any of the following commands:

    - `FT.SEARCH`

    - [`FT.AGGREGATE`](https://github.com/RediSearch/RediSearch/blob/master/docs/Commands.md#ftaggregate)

    - [`FT.EXPLAIN`](https://github.com/RediSearch/RediSearch/blob/master/docs/Commands.md#ftexplain)

    - [`FT.EXPLAINCLI`](https://github.com/RediSearch/RediSearch/blob/master/docs/Commands.md#ftexplaincli)

    - [`FT.SPELLCHECK`](https://github.com/RediSearch/RediSearch/blob/master/docs/Commands.md#ftspellcheck)

  If you do not specify dialect when running any of these commands, they will use the default module-level dialect value.

### Details

- Features:

  - [#2671](https://github.com/RediSearch/RediSearch/pull/2671) Add Dialect support

- Performance enhancements (since 2.4-RC1):

  - [#2647](https://github.com/RediSearch/RediSearch/pull/2647) Normalize vector once for ad-hoc flat search
  - [#2638](https://github.com/RediSearch/RediSearch/pull/2638) Optimized hybrid query when no scores are required
  - [#2653](https://github.com/RediSearch/RediSearch/pull/2653) Updating specific field load optimization rule
  - [#2670](https://github.com/RediSearch/RediSearch/pull/2670) Use `REDISMODULE_EVENT_SHUTDOWN` to clear resources

- Security and privacy (since 2.4-RC1):

  - [#2584](https://github.com/RediSearch/RediSearch/pull/2584) Fix MOD-2086, added support for TLS passphrase

- Bug fixes (since 2.4-RC1):

  - [#2651](https://github.com/RediSearch/RediSearch/pull/2651) Fix client freeze on docs expire during query
  - [#2641](https://github.com/RediSearch/RediSearch/pull/2641) Memory leak in the coordinator
  - [#2645](https://github.com/RediSearch/RediSearch/pull/2645) Ignore NULL value on ingest
  - [#2654](https://github.com/RediSearch/RediSearch/pull/2654) VecSim hybrid query - return empty iterator for invalid intersection child iterator

### Introducing DIALECT

RediSearch 2.4.3 introduces a new query syntax to address query parser inconsistencies found in previous versions of RediSearch. Users can now choose between:

- Dialect version 1 (to keep the query dialect as in RediSearch 2.2)

- Dialect version 2 (to use the updated dialect)

Existing RediSearch 2.2 users will not have to modify their queries since the default dialect is 1.
However, all RediSearch users should gradually update their queries to use dialect version 2.

#### Background

Under certain conditions, some query parsing rules did not behave as originally intended.
Queries containing the following operators could return unexpected results:

- `AND`
- quotes, ~, -, and % (exact, optional, negation, fuzzy)
- `OR`

To minimize the impact on existing, unaffected RediSearch users, a DIALECT setting was introduced to allow:

- Existing queries to run without any modification (DIALECT 1)

- New queries to benefit from the updated query-parsing behavior (DIALECT 2)


#### Examples of impacted queries

Your existing queries may behave differently under different DIALECT versions, if they fall into any of the following categories:

- Your query has a field modifier followed by multiple words.

  Consider this simple query <nobr>`@name:James Brown`</nobr>.

  The field modifier `@name` is followed by 2 words: `James` and `Brown`.

  With DIALECT 1, the parser interprets this query as "find `James Brown` in the `@name` field."

  With DIALECT 2, the parser interprets it as "find `James` in the `@name` field AND `Brown` in ANY text field." In other words, the query parser interprets it as <nobr>`(@name:James) Brown`</nobr>.

  With DIALECT 2, you could achieve the default behavior from DIALECT 1 by updating your query to <nobr>`@name:(James Brown)`</nobr>.

- Your query uses quotes, ~, -, % (exact, optional, negation, fuzzy).

  Consider a simple query with negation <nobr>`-hello world`</nobr>.

  With DIALECT 1, the parser interprets this query as "find values in any field that does not contain `hello` AND does not contain `world`." This is the equivalent of <nobr>`-(hello world)`</nobr> or <nobr>`-hello -world`</nobr>.

  With DIALECT 2, the parser interprets it as `-hello` AND `world`, so only `hello` is negated.

  With DIALECT 2, you could achieve the default behavior from dialect 1 by updating your query to <nobr>`-(hello world)`</nobr>.

Another example that illustrates the differences in parser behavior is
`hello world | "goodbye" moon`:

- With DIALECT 1, the parser interprets this query as searching for `(hello world | "goodbye") moon`

- With DIALECT 2, the parser interprets it as searching for either `hello world` OR `"goodbye" moon`.

{{<note>}}
This is the first GA version of 2.4. The version inside Redis will be 2.4.3 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.
{{</note>}}
