---
Title: RedisGraph 2.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Support for scaling reads, OPTIONAL MATCH, query caching, and GRAPH.SLOWLOG.
linkTitle: v2.2 (November 2020)
min-version-db: 5.0.7
min-version-rs: 6.0.8
weight: 97
---
## Requirements

RedisGraph v2.2.16 requires:

- Minimum Redis compatibility version (database): 5.0.7
- Minimum Redis Enterprise Software version (cluster): 6.0.8

## v2.2.16 (April 2021)

This is a maintenance release for version 2.2.

Update urgency: Medium

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- Enhancements:

    - #[1610](https://github.com/RedisGraph/RedisGraph/pull/1610) Add module-level configuration for query timeouts
    - #[1572](https://github.com/RedisGraph/RedisGraph/pull/1572) Remove query size limitation from parser
    - #[1590](https://github.com/RedisGraph/RedisGraph/pull/1590) Improve reporting of runtime errors
    - #[1596](https://github.com/RedisGraph/RedisGraph/pull/1596) Run bulk loader commands on a non-blocking thread

- Performance Improvements:

    - #[1569](https://github.com/RedisGraph/RedisGraph/pull/1569) Avoid network overhead of emitting arrays with postponed length values

- Bugfixes:

    - #[1573](https://github.com/RedisGraph/RedisGraph/pull/1573) Lock graph on building/deleting full-text indexes, fixing a bug in full-text index replication
    - #[1618](https://github.com/RedisGraph/RedisGraph/pull/1618) Fix error in traversals of 3 or more possible relationship types

- Infrastructure:

    - #[1557](https://github.com/RedisGraph/RedisGraph/pull/1557) Add automated performance benchmarks and regression testing
    - #[1587](https://github.com/RedisGraph/RedisGraph/pull/1587), #[1598](https://github.com/RedisGraph/RedisGraph/pull/1598) Create build artifacts for multiple environments

## v2.2.14 (16 February 2021)

This is a maintenance release for version 2.2.

Update urgency: Medium

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- Performance improvements:

    - #[1565](https://github.com/RedisGraph/RedisGraph/pull/1565) Reserve a single thread for performing all write queries.
    - #[1548](https://github.com/RedisGraph/RedisGraph/pull/1548), #[1553](https://github.com/RedisGraph/RedisGraph/pull/1553), #[1554](https://github.com/RedisGraph/RedisGraph/pull/1554) only perform SET property updates when property value is changed.
    - #[1543](https://github.com/RedisGraph/RedisGraph/pull/1543) Enable O3 compiler optimizations on libcypher-parser.

- Bugfixes:

    - #[1556](https://github.com/RedisGraph/RedisGraph/pull/1556) Avoid premature freeing of Records in create and update contexts.
    - #[1541](https://github.com/RedisGraph/RedisGraph/pull/1541) Fix excessive memory consumption in OpApply.

## v2.2.13 (16 February 2021)

This is a maintenance release for version 2.2.

Update urgency: Medium

Headlines:

- This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- Minor enhancements:

    - #[1490](https://github.com/RedisGraph/RedisGraph/pull/1490) Add support for startNode() and endNode() functions.
    - #[1519](https://github.com/RedisGraph/RedisGraph/pull/1519) Add support for db.indexes() procedure.

- Performance improvements:

    - #[1393](https://github.com/RedisGraph/RedisGraph/pull/1393) Use one unified cache for all RedisGraph worker threads.
    - #[1498](https://github.com/RedisGraph/RedisGraph/pull/1498) Consider both filters and labels in selecting a traversal's starting point.
    - #[1468](https://github.com/RedisGraph/RedisGraph/pull/1468) Unify logic and error handling for aggregate and scalar functions.

- Bugfixes:

    - #[1534](https://github.com/RedisGraph/RedisGraph/pull/1534) Outdated label information used when performing index scans.
    - #[1532](https://github.com/RedisGraph/RedisGraph/pull/1532) Invalid optimization of IN \[array] lookups when values are indexed.
    - #[1524](https://github.com/RedisGraph/RedisGraph/pull/1524) Memory error in accessing complex values after CREATE operations.
    - #[1523](https://github.com/RedisGraph/RedisGraph/pull/1523) Erroneous results when traversing over some transposed matrix sequences.
    - #[1499](https://github.com/RedisGraph/RedisGraph/pull/1499) Erroneous results on variable-length traversals on repeatedly-transposed arrays.
    - #[1504](https://github.com/RedisGraph/RedisGraph/pull/1504) Crash on certain constructions of 0-hop traversals.
    - #[1495](https://github.com/RedisGraph/RedisGraph/pull/1495) Disallow access of properties that have not yet been created.
    - #[1503](https://github.com/RedisGraph/RedisGraph/pull/1503) Only allow literal values as parameters.
    - #[1496](https://github.com/RedisGraph/RedisGraph/pull/1496) Disallow assignment of complex data types to property values in MERGE contexts.
    - #[1494](https://github.com/RedisGraph/RedisGraph/pull/1494) Disallow assignment of values to properties on deleted entities.

- Build:

    - #[1524](https://github.com/RedisGraph/RedisGraph/pull/1524) Update test suite to run under Python 3.


## v2.2.11 (20 December 2020)

This is a maintenance release for version 2.2.

Headlines:

This release introduces support for runtime configuration of the maximum number of results to be returned.

Details:

- Features
    - #[1480](https://github.com/RedisGraph/RedisGraph/pull/1480) Introduce GRAPH.CONFIG SET/GET to allow result-set size to be configured at runtime.

## v2.2.10 (20 December 2020)

This is a maintenance release for version 2.2.

Headlines:

This release improves overall stability and fixes an issue with backwards compatibility logic for indexing.

Details:

- Bugfixes:
    - #[1475](https://github.com/RedisGraph/RedisGraph/pull/1475) Fix erroneous property update when using `SET` with an unindexed property followed by an indexed one.
    - #[1473](https://github.com/RedisGraph/RedisGraph/pull/1473) Fix backwards compatibility issue in rebuilding and dropping exact-match and full-text indexes.

## v2.2.9 (4 December 2020)

This is a maintenance release for version 2.2.

Headlines:

This release improves overall stability and provides fixes for issues found after the previous release.

Details:

- Performance improvements:
    - #[1426](https://github.com/RedisGraph/RedisGraph/pull/1426) Improve load times of adjacency matrices that always have different source and destination nodes.
- Minor enhancements:
    - #[1463](https://github.com/RedisGraph/RedisGraph/pull/1463) Remove all assertions from production builds.
    - #[1442](https://github.com/RedisGraph/RedisGraph/pull/1442) NULL property values should be ignored in `CREATE` clauses and trigger errors in MERGE clauses.
    - #[1429](https://github.com/RedisGraph/RedisGraph/pull/1429) Improve error handling of a number of invalid query constructions.
    - #[1431](https://github.com/RedisGraph/RedisGraph/pull/1431) Traversal patterns are only allowed in `MATCH`, `MERGE`, `CREATE`, and `WHERE` contexts.
- Bugfixes:
    - #[1429](https://github.com/RedisGraph/RedisGraph/pull/1429) Fix potential misapplications of `WHERE` filters.
    - #[1460](https://github.com/RedisGraph/RedisGraph/pull/1460) `RETURN` clauses can only be followed by `UNION` clauses.
    - #[1467](https://github.com/RedisGraph/RedisGraph/pull/1467) Disallow assignment of complex data types to property values.
    - #[1437](https://github.com/RedisGraph/RedisGraph/pull/1437) Failed property updates on `MERGE` should be handled gracefully.
    - #[1446](https://github.com/RedisGraph/RedisGraph/pull/1446) Fix errors in Cartesian Product filter placement.

## v2.2 GA (November 2020)

This is the General Availability Release of RedisGraph 2.2 (v2.2.8)!

Headlines:

- Enhanced support for scaling reads
- `OPTIONAL MATCH` (Left outer join)
- Query cache: Improve performance by caching the query execution plan
- Tooling to increase developer experience

Details:

- Support for scaling reads
    - #[1054](https://github.com/RedisGraph/RedisGraph/pull/1054)
 Drastic reduction of memory consumption during replication (and [Active-Passive]({{< relref "/operate/rs/databases/import-export/replica-of/create" >}})). Break down a large graph into several portions, each accommodating a virtual key and distribute those for reconstruction at the replica end, by doing so we reduce memory consumption on the replica's end.

- `OPTIONAL MATCH` support
    Unlike MATCH, which requires for a pattern to exist, `OPTIONAL MATCH` continues processing when the optional pattern doesn't exist. We can easily compare `OPTIONAL MATCH` in Cypher to an outer join in SQL. It works just like a regular `MATCH` with the difference that if no matches are found, `OPTIONAL MATCH` will use a null for missing parts of the pattern.

    - Query cache: Improve performance by caching the query execution plan

        When executing parameterised queries, RedisGraph will cache the execution plan for increased performance. By caching query's execution-plan, RedisGraph skips the parsing and execution-plan construction phase.
        Cache size can be configured at module load time. The default value is 25.

- Tooling to increase developer experience

    Introduction of `GRAPH.SLOWLOG` command which returns the longest running queries.
    In addition #[1274](https://github.com/RedisGraph/RedisGraph/pull/1274)
 introduces query timeouts with an optional query flag.

- Smaller features and enhancements:
    - #[1225](https://github.com/RedisGraph/RedisGraph/pull/1225)
 Only update index on change of relevant Node properties.
    - #[1229](https://github.com/RedisGraph/RedisGraph/pull/1229)
 RediSearch 1.8.2. (Dependency update)
    - #[1266](https://github.com/RedisGraph/RedisGraph/pull/1266)
, #[1277](https://github.com/RedisGraph/RedisGraph/pull/1277)
 Add support for `any()` and `all()` functions in list comprehension.
    - #[877](https://github.com/RedisGraph/RedisGraph/pull/877)
 Transpose matrices: maintain transpose relationship matrices such that we won't have to compute the transpose of a matrix at run-time. This feature is on by default but can be configured to reduce memory consumption.

- Small updates compared to RC7
    - Minor enhancements:
        - #[1365](https://github.com/RedisGraph/RedisGraph/pull/1365)
 Support array properties in bulk loader.
        - #[1377](https://github.com/RedisGraph/RedisGraph/pull/1377)
 Adding a new procedure `dbms.procedures` that returns all the procedures in the system.
        - #[1389](https://github.com/RedisGraph/RedisGraph/pull/1389)
 Allow property accesses on non-identifier entity references.
    - Bug fixes:
        - #[1406](https://github.com/RedisGraph/RedisGraph/pull/1406)
 Query validation should not check if procedure outputs have been defined.
        - #[1382](https://github.com/RedisGraph/RedisGraph/pull/1382)
 Add graph version to graph context object, response with an error when client graph version mismatch.
        - #[1361](https://github.com/RedisGraph/RedisGraph/pull/1361)
 Don't migrate `WITH` filters into Merge and Apply operation scope.

Notes:
This is the GA version of 2.2. The version inside Redis will be 20208 or 2.2.8 in semantic versioning. Since the version of a module in Redis is numeric, we could not add a GA flag.
