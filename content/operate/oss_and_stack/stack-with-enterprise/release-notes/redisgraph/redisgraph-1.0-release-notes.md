---
Title: RedisGraph 1.0 release notes
linkTitle: v1.0 (November 2018)
description: Fixed memory leaks. Support ‘*’ within RETURN clause. Added TYPE function. Initial support for UNWIND clause.
min-version-db: "4.0.0"
min-version-rs: "5.0.0"
weight: 100
alwaysopen: false
categories: ["Modules"]
aliases: /modules/redisgraph/release-notes/redisgraph-1.0-release-notes/
---
## Requirements

RedisGraph v1.0.15 requires:

- Minimum Redis compatibility version (database): 4.0.0
- Minimum Redis Enterprise Software version (cluster): 5.0.0

## v1.0.15 (March 2019)

- GraphBLAS 2.3.0 [release notes](https://github.com/RedisLabsModules/RedisGraph/pull/390#issuecomment-470620353)
- WITH clause: Allows query parts to be chained together, piping the results from one to be used as starting points or criteria of the next. [ref p.78](https://s3.amazonaws.com/artifacts.opencypher.org/openCypher9.pdf)
- Enhancements
    - #[393](https://github.com/RedisGraph/RedisGraph/issues/393) Discard distinct when performing aggregation
- Minor bugfixes
    - #[359](https://github.com/RedisGraph/RedisGraph/issues/359) Adding ORDER BY changes the number of returned hits when used in combination with LIMIT
    - #[363](https://github.com/RedisGraph/RedisGraph/issues/363) Remove graph entity property when it is set to null
    - #[386](https://github.com/RedisGraph/RedisGraph/issues/386) Return updated values on queries that modify data

## v1.0.14 (21 February 2019)

License update, REDIS SOURCE AVAILABLE LICENSE AGREEMENT.

## v1.0.13 (6 February 2019)

Reuse attribute name to avoid duplication

## v1.0.12 (28 January 2019)

Traverse direction optimization to reduce number of matrix transpose

## v1.0.11 (17 January 2019)

- Removed OpenMP requirement
- Traverse from multiple nodes concurrently

## v1.0.10 (9 January 2019)

Update indices when MERGE creates new entities

## v1.0.9 (6 January 2019)

- Support for mixing MERGE and SET clauses
- Granular writer locking
- Fix graph serialization error in duplicate edge handling

## v1.0.8 (24 December 2018)

- Index utilization when performing cartesian product
- Increase usage of rm_malloc functions in module
- Allow serialization of NULL-valued properties
- Support for multiple relationship types

## v1.0.7 (18 December 2018)

- Bulk-insert support unicode
- Bulk-insert better progress reporting
- Multiple relationship types

## v1.0.5 (15 December 2018)

Bulk insert supports ID specifying + relationships attributes

## v1.0.4 (9 December 2018)

- Compact GraphBLAS, using structural semiring

## v1.0.3 (2 December 2018)

- GraphBLAS 2.2
- Multiple CREATE clauses
- Multiple MATCH clauses
- Bug fixes:
    - Replace operations appropriately when rewriting execution plan
    - Entity returned from datablock should have its internals cleared
    - Loaded triemap strings are not guaranteed space for a null terminator

## v1.0.2 (25 November 2018)

- Bug fix #[249](https://github.com/RedisGraph/RedisGraph/issues/249) reset operation within execution plan should propagate upwards

## v1.0.1 (22 November 2018)

- Resolved a number of memory leaks
- Support '*' within RETURN clause
- Add TYPE function
- Initial support for UNWIND clause
