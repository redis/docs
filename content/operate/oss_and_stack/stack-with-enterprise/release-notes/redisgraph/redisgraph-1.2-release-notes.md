---
Title: RedisGraph 1.2 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Support multiple relationships of the same type R connecting two nodes.
  Lexer elides escape characters in string creation. Performance improvements.
linkTitle: v1.2 (April 2019)
min-version-db: 4.0.0
min-version-rs: 5.0.0
weight: 99
---
## Requirements

RedisGraph v1.2.2 requires:

- Minimum Redis compatibility version (database): 4.0.0
- Minimum Redis Enterprise Software version (cluster): 5.0.0

## v1.2.2 (May 2019)

Update urgency: Medium
This is a maintenance release for version 1.2.

This release improves overall stability and provides fixes for issues found after the previous release.

## v1.2.0 (April 2019)

This is a major release for RedisGraph.
Compared to previous release 1.0.15:

- Added functionality
    - #[452](https://github.com/RedisGraph/RedisGraph/issues/452) Support multiple relationships of the same type R connecting two nodes
    - #[392](https://github.com/RedisGraph/RedisGraph/issues/392) Lexer elides escape characters in string creation: support for property values with `'` or `"`
- Performance improvements
    - #[442](https://github.com/RedisGraph/RedisGraph/issues/442) Seek graph entity by id: `MATCH (n) WHERE ID(n) = 5 RETURN n`
    - #[422](https://github.com/RedisGraph/RedisGraph/issues/422) `MATCH (n) RETURN COUNT(n)` is now O(1)
    - #[421](https://github.com/RedisGraph/RedisGraph/issues/421) and #[459](https://github.com/RedisGraph/RedisGraph/issues/459) Lazy loading of matrices on subsequent writes of relationships and nodes
    - #[399](https://github.com/RedisGraph/RedisGraph/issues/399) Single transpose of matrices
- Minor Bugfixes:
    - #[456](https://github.com/RedisGraph/RedisGraph/issues/456) Memory leaks
    - #[439](https://github.com/RedisGraph/RedisGraph/issues/439) When label doesn't exists, the node count should return 0 #[439](https://github.com/RedisGraph/RedisGraph/issues/439)
    - #[435](https://github.com/RedisGraph/RedisGraph/issues/435) Referencing non existing properties #[435](https://github.com/RedisGraph/RedisGraph/issues/435)

Compared to 1.0:

- Added functionality
    - #[390](https://github.com/RedisGraph/RedisGraph/issues/390) GraphBLAS 2.3.0 [release notes](https://github.com/RedisLabsModules/RedisGraph/pull/390#issuecomment-470620353)
    - #[452](https://github.com/RedisGraph/RedisGraph/issues/452) Support multiple relationships of the same type R connecting two nodes
    - #[392](https://github.com/RedisGraph/RedisGraph/issues/392) Lexer elides escape characters in string creation: support for property values with ' or "
    - Enhanced cypher
        - Initial support for WITH clause: Allows query parts to be chained together, piping the results from one to be used as starting points or criteria of the next. [ref p.78](https://s3.amazonaws.com/artifacts.opencypher.org/openCypher9.pdf)
        - #[247](https://github.com/RedisGraph/RedisGraph/issues/247) Initial support for UNWIND
        - #[244](https://github.com/RedisGraph/RedisGraph/issues/244) RETURN * (give me everything bro)
        - #[236](https://github.com/RedisGraph/RedisGraph/issues/236) TYPE function (returns the type of a relationship)
        - #[288](https://github.com/RedisGraph/RedisGraph/issues/288) Querying patterns where a relationship between two nodes can be of different types. ()-[:A|:B]->()
        - #[252](https://github.com/RedisGraph/RedisGraph/issues/252) Multiple MATCH clauses
        - #[327](https://github.com/RedisGraph/RedisGraph/issues/327) Multiple CREATE clauses
        - #[305](https://github.com/RedisGraph/RedisGraph/issues/305) MERGE + SET
        - #[348](https://github.com/RedisGraph/RedisGraph/issues/348) Smaller memory footprint - encode properties
    - [Faster and better bulk loading](https://github.com/RedisGraph/redisgraph-bulk-loader)
- Performance improvements
    - #[442](https://github.com/RedisGraph/RedisGraph/issues/442) Seek graph entity by id: MATCH (n) WHERE ID(n) = 5 RETURN n
    - #[422](https://github.com/RedisGraph/RedisGraph/issues/422) MATCH (n) RETURN COUNT(n) is now O(1)
    - #[421](https://github.com/RedisGraph/RedisGraph/issues/421) and #[459](https://github.com/RedisGraph/RedisGraph/issues/459) Lazy loading of matrices on subsequent writes of relationships and nodes
    - #[399](https://github.com/RedisGraph/RedisGraph/issues/399) Single transpose of matrices
    - #[393](https://github.com/RedisGraph/RedisGraph/issues/393) Discard distinct when performing aggregation
    - #[289](https://github.com/RedisGraph/RedisGraph/issues/289) Index utilization when performing Cartesian product
    - #[308](https://github.com/RedisGraph/RedisGraph/issues/308) Granular writer locking
- Most noticeable bugfixes
    - #[456](https://github.com/RedisGraph/RedisGraph/issues/456) Memory leaks
    - #[439](https://github.com/RedisGraph/RedisGraph/issues/439) When label doesn't exists, the node count should return 0
    - #[435](https://github.com/RedisGraph/RedisGraph/issues/435) Referencing non existing properties
    - #[359](https://github.com/RedisGraph/RedisGraph/issues/359) Adding ORDER BY changes the number of returned hits when used in combination with LIMIT
    - #[363](https://github.com/RedisGraph/RedisGraph/issues/363) Remove graph entity property when it is set to null
    - #[386](https://github.com/RedisGraph/RedisGraph/issues/386) Return updated values on queries that modify data
    - #[249](https://github.com/RedisGraph/RedisGraph/issues/249) reset operation within execution plan should propagate upwards
    - #[259](https://github.com/RedisGraph/RedisGraph/issues/259) Replace operations appropriately when rewriting execution plan
    - #[262](https://github.com/RedisGraph/RedisGraph/issues/262) Entity returned from datablock should have its internals cleared
    - #[264](https://github.com/RedisGraph/RedisGraph/issues/264) Loaded triemap strings are not guaranteed space for a null terminator
