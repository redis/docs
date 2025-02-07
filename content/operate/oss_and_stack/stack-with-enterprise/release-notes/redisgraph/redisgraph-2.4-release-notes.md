---
Title: RedisGraph 2.4 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Added Map and Geospatial Point data types.
linkTitle: v2.4 (March 2021)
min-version-db: 6.0.0
min-version-rs: 6.0.8
weight: 96
---

## Requirements

RedisGraph v2.4.14 requires:

- Minimum Redis compatibility version (database): 6.0.0
- Minimum Redis Enterprise Software version (cluster): 6.0.8

## v2.4.14 (May 2022)

This is a maintenance release for RedisGraph 2.4.

Update urgency: `LOW`: No need to upgrade unless there are new features you want to use.

Details:

- Bug fixes:

    - [#2072](https://github.com/RedisGraph/RedisGraph/issues/2072), [#2081](https://github.com/RedisGraph/RedisGraph/pull/2081) CRLF sequences embedded in strings no longer trigger a protocol error when being emitted

- Improvements:

    - [#2102](https://github.com/RedisGraph/RedisGraph/pull/2102) New load-time configuration option `NODE_CREATION_BUFFER` - see [documentation](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/configuration.md#node_creation_buffer) (MOD-2348)

{{<note>}}
For Redis Enterprise users who want to upgrade to this patch, this version requires being on version 6.2.8 or later.
{{</note>}}

## v2.4.13 (December 2021)

This is a maintenance release for RedisGraph 2.4.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Performance improvements
    - [#2040](https://github.com/RedisGraph/RedisGraph/pull/2040) Use optimal order of traversals

- Bug fixes:
    - [#2046](https://github.com/RedisGraph/RedisGraph/pull/2046) Avoid serialization of duplicate graph keys (high urgency)
    - [#2033](https://github.com/RedisGraph/RedisGraph/pull/2033) Update RediSearch to 2.0.13

## v2.4.12 (October 2021)

This is a maintenance release for RedisGraph 2.4.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:
    - [#1981](https://github.com/RedisGraph/RedisGraph/pull/1981) Crash in index scan

## v2.4.11 (October 2021)
This is a maintenance release for RedisGraph 2.4.

Update urgency: `MODERATE` : Program an upgrade of the server, but it's not urgent.

Details:
- Bug fixes:
    - #[1931](https://github.com/RedisGraph/RedisGraph/issues/1931) Fix race condition on calling [`BGSAVE`]({{< relref "/commands/bgsave" >}}) while flushing matrices
    - #[1898](https://github.com/RedisGraph/RedisGraph/issues/1898) Error when setting a property to an array containing an invalid type
    - #[1897](https://github.com/RedisGraph/RedisGraph/issues/1897) Aliases in `WITH...ORDER BY` must be valid references%

## v2.4.10 (September 2021)

This is a maintenance release for RedisGraph 2.4

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:
- Critical bug fixes:
    - #[1911](https://github.com/RedisGraph/RedisGraph/issues/1911) When a query timeout is set and the graph contained indexes, a crash could occur while releasing indexes

- Bug fixes:
    - #[1913](https://github.com/RedisGraph/RedisGraph/issues/1913) Update thread-local AST for every cloned operation
    - #[1915](https://github.com/RedisGraph/RedisGraph/issues/1915) Validate function references in parameters%

## v2.4.7 (July 2021)

This is a maintenance release for RedisGraph 2.4

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:
- Bug fixes:
    - #[1746](https://github.com/redisgraph/redisgraph/issues/1746) Avoid invalid memory access after reallocating labels array
    - #[1748](https://github.com/redisgraph/redisgraph/issues/1748) Only allocate space for deleted nodes and edges
    - #[1749](https://github.com/redisgraph/redisgraph/issues/1749), #[1730](https://github.com/redisgraph/redisgraph/issues/1730) Support updating properties with map referenced by parameter or variable
    - #[1754](https://github.com/redisgraph/redisgraph/issues/1754) Map should return volatile data
    - #[1773](https://github.com/redisgraph/redisgraph/issues/1773) Matrix resize doesn't set both rows and columns atomically
    - #[1799](https://github.com/redisgraph/redisgraph/issues/1799) Always instantiate new persistent matrices as sparse%

## v2.4.6 (June 2021)

This is a maintenance release for RedisGraph 2.4

Update urgency: Medium

Details:

- Performance improvements:
    - #[1702](https://github.com/redisgraph/redisgraph/issues/1702) Optimize matrix synchronization in GRAPH.BULK commands
    - #[1716](https://github.com/redisgraph/redisgraph/issues/1716) Reduce lock calls in retrieving matrices for reading
    - #[1741](https://github.com/redisgraph/redisgraph/issues/1741) Improve edge extraction
    - #[1388](https://github.com/redisgraph/redisgraph/issues/1388) Node creation buffer
    - #[1724](https://github.com/redisgraph/redisgraph/issues/1724) Update RediSearch 2.0
    - #[1731](https://github.com/redisgraph/redisgraph/issues/1731) Release lock after MergeCreate builds entities
    - #[1734](https://github.com/redisgraph/redisgraph/issues/1734) Added multi edge flag

- Bug fixes:
    - #[1726](https://github.com/redisgraph/redisgraph/issues/1726) JsonEncoder: invalid cast
    - #[1709](https://github.com/redisgraph/redisgraph/issues/1709) #1712 Fix potential deadlock in BGSAVE
    - #[1703](https://github.com/redisgraph/redisgraph/issues/1703) Uniquing logic in UNION subqueries
    - #[1720](https://github.com/redisgraph/redisgraph/issues/1720) Propagate configuration updates to replicas
    - #[1714](https://github.com/redisgraph/redisgraph/issues/1714) Don't build scan operations for bound variables
    - #[1708](https://github.com/redisgraph/redisgraph/issues/1708) Regression in GRAPH.CONFIG GET *
    - #[1715](https://github.com/redisgraph/redisgraph/issues/1715) Validate function private data before freeing it

- Miscellaneous:

    - #[1691](https://github.com/redisgraph/redisgraph/issues/1691) Reword error message on setting property value to invalid type

## v2.4.4 (15 May 2021)

This is a maintenance release for RedisGraph 2.4.

Update urgency: Medium

Details:

- Minor Enhancements:
    - #[1666](https://github.com/redisgraph/redisgraph/issues/1666) Add configuration parameter to limit the memory usage of queries
    - #[1639](https://github.com/redisgraph/redisgraph/issues/1639) Add functionality to SET all properties on an entity to a map

- Bug fixes:
    - #[1678](https://github.com/redisgraph/redisgraph/issues/1678) Crash on multiple procedure calls in a single query

## v2.4.3 (8 May 2021)

This is a maintenance release for RedisGraph 2.4.

Update urgency: Medium

Details:

- Features:
    - #[1657](https://github.com/redisgraph/redisgraph/issues/1657) Support filtering on variable-length edges in traversals
    - #[1514](https://github.com/redisgraph/redisgraph/issues/1514) Add support for shortestPath in MATCH clauses
    - #[1664](https://github.com/redisgraph/redisgraph/issues/1664) Add support for limiting max queued queries
    - #[1653](https://github.com/redisgraph/redisgraph/issues/1653), #[1655](https://github.com/redisgraph/redisgraph/issues/1655) Add support for square root (sqrt) function

- Performance improvements:
    - #[1641](https://github.com/redisgraph/redisgraph/issues/1641) Use indexes when filters can only be resolved at runtime
    - #[1668](https://github.com/redisgraph/redisgraph/issues/1668) Apply path filters after all other filters

- Bug fixes:
    - #[1650](https://github.com/redisgraph/redisgraph/issues/1650) Fix memory leak on allocated keys in OpAggregate
    - #[1671](https://github.com/redisgraph/redisgraph/issues/1671) Disallow nested aggregates in map values, circumventing a bug that introduced invalid group keys
    - #[1644](https://github.com/redisgraph/redisgraph/issues/1644) Fix bug in which values for unknown schema types are cached
    - #[1656](https://github.com/redisgraph/redisgraph/issues/1656) Fix potential crash when releasing thread pools on server shutdown


## v2.4 GA (March 2021)

Headlines:

- This release introduces the Map and Geospatial Point data types.

Details:

- Features:
  - #[1514](https://github.com/redisgraph/redisgraph/issues/1514) Add support for Map data type.
  - #[1516](https://github.com/redisgraph/redisgraph/issues/1516) Add support for Geospatial Point data type.
  - #[1562](https://github.com/redisgraph/redisgraph/issues/1562) Add `toJSON` function.
  - #[1607](https://github.com/redisgraph/redisgraph/issues/1607) Querying full-text indexes can yield the `score` of each result.
  - #[1610](https://github.com/redisgraph/redisgraph/issues/1610) Expose runtime configuration for read query timeouts.

- Performance improvements:
  - #[1596](https://github.com/redisgraph/redisgraph/issues/1596) [Redisgraph-bulk-loader](https://github.com/RedisGraph/redisgraph-bulk-loader) no longer blocks the server.

- Minor Enhancements
  - #[1590](https://github.com/redisgraph/redisgraph/issues/1590) Improve handling of runtime errors.
  - #[1580](https://github.com/redisgraph/redisgraph/issues/1580) Enable assertions in debug mode.

- Bugfixes (compared to RC1)
  - #[1618](https://github.com/redisgraph/redisgraph/issues/1618) Fix relationship types being omitted in traversals of 3 or more types.

{{< note >}}
This is the first GA version of 2.4. The version inside Redis will be 2.4.2 in semantic versioning. Since the version of a module in Redis is numeric, we could not add an GA flag.
{{< /note >}}
