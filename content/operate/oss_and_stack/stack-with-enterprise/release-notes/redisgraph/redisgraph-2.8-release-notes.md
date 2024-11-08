---
Title: RedisGraph 2.8 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Introduces multi-labeled nodes, indexes over relationship properties,
  and additional expressivity (Cypher construct, functions, and operators). Major
  performance enhancements. Many bug fixes.
linkTitle: v2.8 (February 2022)
min-version-db: 6.2.0
min-version-rs: 6.2.8
weight: 95
---
## Requirements

RedisGraph v2.8.26 requires:

- Minimum Redis compatibility version (database): 6.2.0
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v2.8.26 (March 2023)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2880](https://github.com/RedisGraph/RedisGraph/issues/2880) Potential crash when using WITH * expressions
  - [#2917](https://github.com/RedisGraph/RedisGraph/issues/2917) Potential crash when using CASE expressions (MOD-4873)
  - [#2836](https://github.com/RedisGraph/RedisGraph/issues/2836) Potential crash on *0 variable-length path (MOD-4817)
  - [#2916](https://github.com/RedisGraph/RedisGraph/issues/2916) Potential crash when executing concurrent queries that utilize full-text indices (MOD-4818)


## v2.8.25 (February 2023)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#2890](https://github.com/RedisGraph/RedisGraph/issues/2890) Potential wrong results on variable-length path

## v2.8.24 (February 2023)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2777](https://github.com/RedisGraph/RedisGraph/issues/2777), [#2841](https://github.com/RedisGraph/RedisGraph/issues/2841) Potential crash when sending queries from multiple connections and timeout is not 0
  - [#2844](https://github.com/RedisGraph/RedisGraph/issues/2844) Potential partial results when same parametrized query is running from multiple connections
  - [#2739](https://github.com/RedisGraph/RedisGraph/issues/2739), [#2774](https://github.com/RedisGraph/RedisGraph/issues/2774) Paths with exact variable length >1 are not matched

- Improvements:

  - [#2758](https://github.com/RedisGraph/RedisGraph/pull/2758) Improved edge deletion performance


## v2.8.21 (January 2023)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2754](https://github.com/RedisGraph/RedisGraph/pull/2754) Partial sync may hang (MOD-4594)
    - [#2695](https://github.com/RedisGraph/RedisGraph/pull/2695) Potential crash on certain write queries (MOD-4286, MOD-4545)
    - [#2637](https://github.com/RedisGraph/RedisGraph/issues/2637), [#2460](https://github.com/RedisGraph/RedisGraph/issues/2460), [#2680](https://github.com/RedisGraph/RedisGraph/issues/2680) Crash on invalid queries
    - [#2484](https://github.com/RedisGraph/RedisGraph/issues/2484) Indexes can be created on invalid property names
    - [#2672](https://github.com/RedisGraph/RedisGraph/issues/2672) Wrong matching result on multiple labels
    - [#2643](https://github.com/RedisGraph/RedisGraph/issues/2643) Duplicate reports when matching relationship type `:R|R`
    - [#2687](https://github.com/RedisGraph/RedisGraph/issues/2687), [#2414](https://github.com/RedisGraph/RedisGraph/issues/2414) Error when `UNWIND`ing relationships
    - [#2635](https://github.com/RedisGraph/RedisGraph/issues/2635) Cannot `UNWIND` an expression that is not a list
    - [#2636](https://github.com/RedisGraph/RedisGraph/issues/2636) `MERGE` ... `ON` ... - cannot remove a property by setting it to null

- Improvements:

    - [#2790](https://github.com/RedisGraph/RedisGraph/pull/2790) Improved performance by disabling SuiteSparse:GraphBLAS' global free pool
    - [#2757](https://github.com/RedisGraph/RedisGraph/pull/2757) Improved performance of `indegree` and `outdegree`
    - [#2740](https://github.com/RedisGraph/RedisGraph/issues/2740) Don’t show partial results for timed out `GRAPH.PROFILE`

## v2.8.20 (September 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#2591](https://github.com/RedisGraph/RedisGraph/issues/2591) Potential crash trying to utilize a nonexistent index
    - [#2558](https://github.com/RedisGraph/RedisGraph/issues/2558) Multi-relationship properties created before index creation are not indexed
    - [#2571](https://github.com/RedisGraph/RedisGraph/issues/2571) `min` and `max` return wrong results when the argument is an array
    - [#2587](https://github.com/RedisGraph/RedisGraph/issues/2587) Some queries generate a "forced unlocking commit flow" warning

- Improvements:

    - [#2533](https://github.com/RedisGraph/RedisGraph/issues/2533) Graph slow log can be reset with `GRAPH.SLOWLOG g RESET`

## v2.8.19 (August 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

    - [#2517](https://github.com/RedisGraph/RedisGraph/issues/2517) Crash on invalid `REDUCE` queries
    - [#2525](https://github.com/RedisGraph/RedisGraph/issues/2525) `toJSON` - node labels are not separated with a comma (`,`)
    - [#2467](https://github.com/RedisGraph/RedisGraph/issues/2467) Possibly wrong results when using a variable named `anon_N`
    - [#2522](https://github.com/RedisGraph/RedisGraph/pull/2522) Deleting an edge index leaves traces
    - [#2477](https://github.com/RedisGraph/RedisGraph/issues/2477) Cannot extract the latitude or the longitude of a point

- Improvements:

    - [#2519](https://github.com/RedisGraph/RedisGraph/pull/2519) When a query is cached and then a relevant index is created, recalculate the execution plan

## v2.8.17 (July 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2499](https://github.com/RedisGraph/RedisGraph/pull/2499) Potential crash with concurrent connections due to missing lock - additional fixes
    - [#2424](https://github.com/RedisGraph/RedisGraph/issues/2424) Potential crash when using `ORDER BY`
    - [#2491](https://github.com/RedisGraph/RedisGraph/issues/2491) Whitespaces between `MATCH` terms can render the query invalid

## v2.8.16 (July 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2478](https://github.com/RedisGraph/RedisGraph/pull/2478) Potential crash with concurrent connections due to missing lock
    - [#2370](https://github.com/RedisGraph/RedisGraph/issues/2370) Potential crash / wrong results / warning messages when using edge indexes
    - [#2473](https://github.com/RedisGraph/RedisGraph/issues/2473) Crash on invalid `distance()` query with index

## v2.8.15 (June 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2241](https://github.com/RedisGraph/RedisGraph/issues/2241) Possible crash on queries with `MERGE` operation in a Cartesian product (MOD-3500)
    - [#2394](https://github.com/RedisGraph/RedisGraph/issues/2394) Possible crash when freeing an index immediately after its creation

## v2.8.14 (June 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Features:

    - [#2403](https://github.com/RedisGraph/RedisGraph/pull/2403) Introduce `toFloat` function
    - [#2365](https://github.com/RedisGraph/RedisGraph/issues/2365) Commands that don't execute on the main thread now also appear in [SLOWLOG]({{< relref "/commands/slowlog" >}})

- Bug fixes:

    - [#2381](https://github.com/RedisGraph/RedisGraph/pull/2381) Rare data corruption on data encoding
    - [#2393](https://github.com/RedisGraph/RedisGraph/issues/2393), [#2395](https://github.com/RedisGraph/RedisGraph/issues/2395) Crash when searching an index for a runtime-determined value
    - [#2377](https://github.com/RedisGraph/RedisGraph/issues/2377) Crash on `INT_MIN % -1`
    - [#2390](https://github.com/RedisGraph/RedisGraph/issues/2390) Crash on distance filter
    - [#2407](https://github.com/RedisGraph/RedisGraph/issues/2407) Crash on double to string
    - [#2422](https://github.com/RedisGraph/RedisGraph/pull/2422) `toJSON` returned floating points cropped to 6 decimals

{{<note>}}
New RDB version (v12). RDB files created with v2.8.14 or later are not backward compatible.
{{</note>}}

## v2.8.13 (May 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2351](https://github.com/RedisGraph/RedisGraph/pull/2351) Potential memory leak on query timeout
    - [#2348](https://github.com/RedisGraph/RedisGraph/issues/2348) Crash when converting certain Cypher queries to RediSearch queries
    - [#2331](https://github.com/RedisGraph/RedisGraph/pull/2331) Two memory leaks (one on failed RDB loading, one on certain invalid queries)
    - [#2328](https://github.com/RedisGraph/RedisGraph/pull/2328), [#2306](https://github.com/RedisGraph/RedisGraph/issues/2306), [#2307](https://github.com/RedisGraph/RedisGraph/issues/2307), [#2326](https://github.com/RedisGraph/RedisGraph/issues/2326) Disallow redeclaration of variables; fixed false redeclaration errors
    - [#2363](https://github.com/RedisGraph/RedisGraph/pull/2363) Nodes were sometimes created with more labels than those specified

## v2.8.12 (May 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2278](https://github.com/RedisGraph/RedisGraph/issues/2278), [#2301](https://github.com/RedisGraph/RedisGraph/pull/2301) Potential crash on bulk update
    - [#2262](https://github.com/RedisGraph/RedisGraph/issues/2262), [#2271](https://github.com/RedisGraph/RedisGraph/issues/2271), [#2272](https://github.com/RedisGraph/RedisGraph/issues/2272), [#2273](https://github.com/RedisGraph/RedisGraph/issues/2273), [#2282](https://github.com/RedisGraph/RedisGraph/issues/2282), [#2288](https://github.com/RedisGraph/RedisGraph/issues/2288), [#2299](https://github.com/RedisGraph/RedisGraph/issues/2299), [#2312](https://github.com/RedisGraph/RedisGraph/issues/2312), [#2321](https://github.com/RedisGraph/RedisGraph/issues/2321), [#2325](https://github.com/RedisGraph/RedisGraph/issues/2325), [#2323](https://github.com/RedisGraph/RedisGraph/issues/2323) Potential crash on certain queries
    - [#1441](https://github.com/RedisGraph/RedisGraph/issues/1441) Query returns wrong result: projection before Cartesian product causes only one result to be returned
    - [#2298](https://github.com/RedisGraph/RedisGraph/issues/2298) Query returns wrong result: wrong value when fetching a string property from a map
    - [#2318](https://github.com/RedisGraph/RedisGraph/pull/2318) Memory leak

{{<note>}}
Duplicate column names in a query are no longer valid. For example, the query `GRAPH.QUERY g "MATCH (e) RETURN e, e"` is not valid. If you need to return the same column twice, you can rewrite the query as `GRAPH.QUERY g "MATCH (e) RETURN e, e as e2"`.
{{</note>}}

## v2.8.11 (March 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

    - [#2259](https://github.com/RedisGraph/RedisGraph/issues/2259), [#2258](https://github.com/RedisGraph/RedisGraph/pull/2258) Fix memory leak and potential crash on [RDB]({{< relref "/operate/oss_and_stack/management/persistence" >}}) saving

## v2.8.10 (March 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details: 

- Features:

    - [#2245](https://github.com/RedisGraph/RedisGraph/pull/2245) Support graphs [eviction]({{< relref "/develop/reference/eviction" >}})

- Bug fixes:

    - [#1493](https://github.com/RedisGraph/RedisGraph/issues/1493), [#2240](https://github.com/RedisGraph/RedisGraph/pull/2240) Fixed crash on certain queries
    - [#2229](https://github.com/RedisGraph/RedisGraph/issues/2229), [#2222](https://github.com/RedisGraph/RedisGraph/pull/2222) Fixed crash on certain queries
    - [#2209](https://github.com/RedisGraph/RedisGraph/issues/2209), [#2228](https://github.com/RedisGraph/RedisGraph/pull/2228) Fixed crash on certain invalid `DELETE` queries
    - [#2237](https://github.com/RedisGraph/RedisGraph/issues/2237), [#2242](https://github.com/RedisGraph/RedisGraph/pull/2242) Fixed crash on certain `PROFILE` queries
    - [#2230](https://github.com/RedisGraph/RedisGraph/issues/2230), [#2232](https://github.com/RedisGraph/RedisGraph/pull/2232) Fixed wrong number of reported deleted relationships on certain queries
    - [#2233](https://github.com/RedisGraph/RedisGraph/pull/2233) Certain valid queries were reported invalid
    - [#2246](https://github.com/RedisGraph/RedisGraph/issues/2246) Fixed memory leaks

- Improvements:

    - [#2235](https://github.com/RedisGraph/RedisGraph/pull/2235) Improved [RDB]({{< relref "/operate/oss_and_stack/management/persistence" >}}) loading performance

## v2.8.9 (March 2022)

This is a maintenance release for RedisGraph 2.8.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details: 

- Features:

    - [#2181](https://github.com/RedisGraph/RedisGraph/pull/2181), [#2182](https://github.com/RedisGraph/RedisGraph/pull/2182) Full support for ARM builds

- Bug fixes:

    - [#2167](https://github.com/RedisGraph/RedisGraph/pull/2167) Fixed a potential crash: filter placement in `OPTIONAL` subtrees
    - [#2176](https://github.com/RedisGraph/RedisGraph/pull/2176) Fixed a potential crash: invalid memory access in nested `DISTINCT` functions
    - [#2217](https://github.com/RedisGraph/RedisGraph/pull/2217) Fixed a potential crash: memory access after free on `FLUSHALL`
    - [#2207](https://github.com/RedisGraph/RedisGraph/pull/2207) Fixed memory leak when `MAX_QUEUED_QUERIES` is used
    - [#2220](https://github.com/RedisGraph/RedisGraph/pull/2220) `WITH * WHERE` - the `WHERE` filters were ignored
    - [#2151](https://github.com/RedisGraph/RedisGraph/pull/2151) Return correct results for aggregations with no inputs
    - [#2163](https://github.com/RedisGraph/RedisGraph/pull/2163) Emit error correctly on multi-query inputs

- Improvements:

    - [#2173](https://github.com/RedisGraph/RedisGraph/pull/2173) Improve performance of breadth-first search

## v2.8 GA (v2.8.8) (February 2022)

This is the General Availability release of RedisGraph 2.8.

### Highlights

RedisGraph 2.8 introduces multi-labeled nodes, indexes over relationship properties, additional expressivity (construct, functions, and operators), major performance enhancements, and many bug fixes.

#### What's new in 2.8

- Multi-labeled nodes

    {{<note>}}
The `labels` function's signature has changed. The function now returns a list of labels instead of a single label.
<br /><br />
If you are using this function and upgrading to RedisGraph 2.8, a simple fix is to replace any call to `labels(x)` with `labels(x)[0]`. This returns the first label associated with node `x`. For uni-labeled nodes, the result in RedisGraph 2.8 is similar to the results of `labels(x)` in RedisGraph 2.4.
    {{</note>}}
  
- Indexes over relationship properties
- Enhanced full-text search
- Delta matrices: node and relationships additions and deletions are much faster, as they are first updated in small delta matrices. The main matrices are then bulk-updated.
- Additional Cypher construct, functions, and operators
- RediSearch 2.2.7
- [SuiteSparse](https://github.com/DrTimothyAldenDavis/GraphBLAS) (GraphBLAS) 6.0.0

### Details

- Features (since 2.8-M02):

    - [#2109](https://github.com/RedisGraph/RedisGraph/pull/2109) Introduce `allShortestPaths` BFS function
    - [#2099](https://github.com/RedisGraph/RedisGraph/pull/2099) Introduce `keys` function
    - [#2047](https://github.com/RedisGraph/RedisGraph/pull/2047) Introduce `reduce` function
    - [#2076](https://github.com/RedisGraph/RedisGraph/pull/2076) Introduce XOR operation in filter trees
    - [#2088](https://github.com/RedisGraph/RedisGraph/pull/2088) Introduce pattern comprehensions
    - [#2051](https://github.com/RedisGraph/RedisGraph/pull/2051) Allow copying of entity attribute sets in `SET` clauses
    - [#2067](https://github.com/RedisGraph/RedisGraph/pull/2067) Allow modification of virtual key entity count (`VKEY_MAX_ENTITY_COUNT`) at runtime
    - [#2102](https://github.com/RedisGraph/RedisGraph/pull/2102) New load time configuration option `NODE_CREATION_BUFFER` - see [documentation](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/configuration.md#node_creation_buffer) (MOD-2348)
    - [#2049](https://github.com/RedisGraph/RedisGraph/pull/2049) RediSearch supports field definitions

- Performance improvements (since 2.8-M02):

    - [#2097](https://github.com/RedisGraph/RedisGraph/pull/2097) Locks favor writers to prevent write exhaustion
    - [#1945](https://github.com/RedisGraph/RedisGraph/pull/1945) Track node count per label in graph statistics
    - [#1872](https://github.com/RedisGraph/RedisGraph/pull/1872) Delta matrices are always [hypersparse](https://fossies.org/linux/SuiteSparse/GraphBLAS/docs/graphblas_demo.html#40)
    - [#1871](https://github.com/RedisGraph/RedisGraph/pull/1871) Matrix sync policies reduce the number of syncs required
    - [#1869](https://github.com/RedisGraph/RedisGraph/pull/1869) Transposed matrices are always boolean
    - [#2101](https://github.com/RedisGraph/RedisGraph/pull/2101) Entity annotation has been replaced with an AST `toString` function
    - [#1878](https://github.com/RedisGraph/RedisGraph/pull/1878) Slowlog queries no longer create graphs
    - [#2067](https://github.com/RedisGraph/RedisGraph/pull/2067) Index graph entities incrementally on restore
    - Faster AOF recovery (PM-1252)

- Bug fixes (since 2.8-M02):

    - [#2016](https://github.com/RedisGraph/RedisGraph/pull/2016) Implement new BFS algorithm
    - [#2105](https://github.com/RedisGraph/RedisGraph/pull/2105) Creating a node with multiple properties using the same key only accepts the last value
    - [#2055](https://github.com/RedisGraph/RedisGraph/pull/2055) Avoid arithmetic overflow in `avg` function
    - [#2048](https://github.com/RedisGraph/RedisGraph/pull/2048) Modulo by zero emits division by zero error
    - [#2020](https://github.com/RedisGraph/RedisGraph/pull/2020) Fix evaluation of variable-length edges in expression ordering
    - [#2028](https://github.com/RedisGraph/RedisGraph/pull/2028) Fix utilization of record offset in procedure calls, refactor outputs
    - [#2014](https://github.com/RedisGraph/RedisGraph/pull/2014) Update label for every node in the AST
    - [#2002](https://github.com/RedisGraph/RedisGraph/pull/2002) Fix crash in index utilization using wrong query_graph
    - [#1976](https://github.com/RedisGraph/RedisGraph/pull/1976) Use operand matrix when available
    - [#1973](https://github.com/RedisGraph/RedisGraph/pull/1973) Emit error on a query that only contains parameters
    - [#1950](https://github.com/RedisGraph/RedisGraph/pull/1950) Print ExecutionPlan in `GRAPH.EXPLAIN` only if no errors are encountered in the construction
    - [#1933](https://github.com/RedisGraph/RedisGraph/pull/1933) Free thread-local data on graph deletion
    - [#1942](https://github.com/RedisGraph/RedisGraph/pull/1942) Fix dimensions of transposed delta matrices
    - [#1940](https://github.com/RedisGraph/RedisGraph/pull/1940) Do not use block client if deny blocking is specified
    - [#1898](https://github.com/RedisGraph/RedisGraph/pull/1898) Error when setting a property to an array containing an invalid type
    - [#1931](https://github.com/RedisGraph/RedisGraph/pull/1931) Sync matrices on parent process before serialization fork
    - [#1897](https://github.com/RedisGraph/RedisGraph/pull/1897) Aliases in `WITH` ... `ORDER BY` must be valid references
    - [#1913](https://github.com/RedisGraph/RedisGraph/pull/1913) Update thread-local AST for every cloned operation
    - [#1915](https://github.com/RedisGraph/RedisGraph/pull/1915) Validate function references in parameters
    - [#1911](https://github.com/RedisGraph/RedisGraph/pull/1911) Refactor `cron` task for managing query timeouts
    - [#1902](https://github.com/RedisGraph/RedisGraph/pull/1902) Fix incorrect behavior on `NULL` values in `CASE`...`WHEN` expressions
    - [#1904](https://github.com/RedisGraph/RedisGraph/pull/1904) Allow reconfiguring query timeout to 0
    - [#1888](https://github.com/RedisGraph/RedisGraph/pull/1888) Synchronize matrices on creation in RDB load
    - [#1892](https://github.com/RedisGraph/RedisGraph/pull/1892) Validate values specified in `SET` clauses
    - [#1889](https://github.com/RedisGraph/RedisGraph/pull/1889) Tuple iterator now updates properly when changing matrix to serialize
    - [#1870](https://github.com/RedisGraph/RedisGraph/pull/1870) Fix crash in `range` function
    - [#2125](https://github.com/RedisGraph/RedisGraph/issues/2125) Fix crash on `UNION` ... `RETURN` * queries (MOD-2524)
    - [#2043](https://github.com/RedisGraph/RedisGraph/pull/2043) Avoid serialization of duplicate graph keys
    - [#2067](https://github.com/RedisGraph/RedisGraph/pull/2067) Numeric indices no longer lose precision on very large values
    - [#2072](https://github.com/RedisGraph/RedisGraph/issues/2072), [#2081](https://github.com/RedisGraph/RedisGraph/pull/2081) CRLF sequences embedded in strings no longer trigger a protocol error when being emitted
    - [#2139](https://github.com/RedisGraph/RedisGraph/pull/2139) Fix crash when trying to retrieve an out-of-bounds item
    - [#2149](https://github.com/RedisGraph/RedisGraph/pull/2149) Fix crash when matching a node engages an index to search for a value that is a RediSearch stop word
