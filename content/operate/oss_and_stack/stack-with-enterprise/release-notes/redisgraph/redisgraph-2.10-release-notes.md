---
Title: RedisGraph 2.10 release notes
alwaysopen: false
categories:
- docs
- operate
- stack
description: Introduces new path algorithms, additional expressivity (constructs and
  functions), performance improvements, and bug fixes.
linkTitle: v2.10 (November 2022)
min-version-db: 6.2.0
min-version-rs: 6.2.8
weight: 94
---
## Requirements

RedisGraph v2.10.15 requires:

- Minimum Redis compatibility version (database): 6.2.0
- Minimum Redis Enterprise Software version (cluster): 6.2.8

## v2.10.15 (September 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3172](https://github.com/RedisGraph/RedisGraph/pull/3172) Crash on certain write queries (MOD-5645)
  - [#3179](https://github.com/RedisGraph/RedisGraph/pull/3179) High CPU on idle

- Improvements:

  - [#3184](https://github.com/RedisGraph/RedisGraph/pull/3184) Revert breaking change introduced in 2.10: `toString` supports list argument again
  - [#3185](https://github.com/RedisGraph/RedisGraph/pull/3185) Don’t write AUX field in the RDB file when there are no graphs in the keyspace

## v2.10.12 (July 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3129](https://github.com/RedisGraph/RedisGraph/pull/3129) Crash on certain queries (`INDEX SCAN` followed by `DEL` followed by `SET`) (MOD-5430)

## v2.10.11 (June 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3096](https://github.com/RedisGraph/RedisGraph/pull/3096) Potential crash on query timeout (MOD-5202)
  - [#3042](https://github.com/RedisGraph/RedisGraph/issues/3042), [#3052](https://github.com/RedisGraph/RedisGraph/issues/3052) Potential crashes due to false assertions

## v2.10.10 (April 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `MODERATE`: Program an upgrade of the server, but it's not urgent.

Details:

- Bug fixes:

  - [#3038](https://github.com/RedisGraph/RedisGraph/issues/3038) Potential crash when a query with a `UNION` clause sets or modifies an indexed property
  - [#2631](https://github.com/RedisGraph/RedisGraph/issues/2631), [#2968](https://github.com/RedisGraph/RedisGraph/issues/2968) Potential crash on certain `MATCH` clauses where label filters are used (MOD-5093)
  - [#2957](https://github.com/RedisGraph/RedisGraph/issues/2957) Label filters in expressions such as `WITH n MATCH (n:X)` are ignored
  - [#2931](https://github.com/RedisGraph/RedisGraph/issues/2931), [#3027](https://github.com/RedisGraph/RedisGraph/issues/3027) Wrong overflow error message

## v2.10.9 (March 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2880](https://github.com/RedisGraph/RedisGraph/issues/2880) Potential crash when using `WITH *` expressions
  - [#2917](https://github.com/RedisGraph/RedisGraph/issues/2917) Potential crash when using `CASE` expressions (MOD-4873)
  - [#2836](https://github.com/RedisGraph/RedisGraph/issues/2836) Potential crash on `*0` variable-length path (MOD-4817)
  - [#2916](https://github.com/RedisGraph/RedisGraph/issues/2916) Potential crash when executing concurrent queries that utilize full-text indices (MOD-4818)

## v2.10.8 (February 2023)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2777](https://github.com/RedisGraph/RedisGraph/issues/2777), [#2841](https://github.com/RedisGraph/RedisGraph/issues/2841) Potential crash when sending queries from multiple connections and timeout is not 0
  - [#2844](https://github.com/RedisGraph/RedisGraph/issues/2844) Potential partial results when same parametrized query is running from multiple connections
  - [#2739](https://github.com/RedisGraph/RedisGraph/issues/2739), [#2774](https://github.com/RedisGraph/RedisGraph/issues/2774) Paths with exact variable length >1 are not matched
  - [#2794](https://github.com/RedisGraph/RedisGraph/issues/2794) `toInteger` and `toIntegerOrNull` don't convert Booleans
  - [#2798](https://github.com/RedisGraph/RedisGraph/issues/2798) `right` and `left` should reply with an error when `length` is null
  - [#2809](https://github.com/RedisGraph/RedisGraph/issues/2809) `TIMEOUT_MAX` configuration parameter is not enforced when `TIMEOUT_DEFAULT` is 0
  - [#2780](https://github.com/RedisGraph/RedisGraph/issues/2780) `indegree` and `outdegree` - relationships are counted more than once when same relationship type is supplied more than once

- Improvements:

  - [#2790](https://github.com/RedisGraph/RedisGraph/pull/2790) Improved performance by disabling SuiteSparse:GraphBLAS' global free pool
  - [#2758](https://github.com/RedisGraph/RedisGraph/pull/2758) Improved edge deletion performance
  - [#2781](https://github.com/RedisGraph/RedisGraph/issues/2781) `indegree` and `outdegree` now also accept an argument which is a list of labels

## v2.10.5 (December 2022)

This is a maintenance release for RedisGraph 2.10.

Update urgency: `HIGH`: There is a critical bug that may affect a subset of users. Upgrade!

Details:

- Bug fixes:

  - [#2754](https://github.com/RedisGraph/RedisGraph/pull/2754) Partial sync may hang (MOD-4594)

- Improvements:

  - [#2757](https://github.com/RedisGraph/RedisGraph/pull/2757) Improved performance of `indegree` and `outdegree`
  - [#2681](https://github.com/RedisGraph/RedisGraph/issues/2681) Fixed some error messages
  - [#2740](https://github.com/RedisGraph/RedisGraph/issues/2740) Don’t show partial results for timed-out `GRAPH.PROFILE`

## v2.10 GA (v2.10.4) (November 2022)

This is the General Availability release of RedisGraph 2.10.

### Highlights

RedisGraph 2.10 introduces new path algorithms, additional expressivity (constructs and functions), performance improvements, and bug fixes.

#### What's new in 2.10

- New pathfinding algorithms: 
  - The `algo.SPpaths` procedure yields one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths between a given pair of nodes.
  - The `algo.SSpaths` procedure yields one, _n_, or all minimal-weight, optionally bounded-cost, optionally bounded-length paths from a given node.
- Introduce `SET` for adding node labels and `REMOVE` for removing node labels, node properties, and edge properties.
- Support deleting paths with `DELETE`.
- Introduce 29 functions: `toBoolean`, `toBooleanOrNull`, `toFloatOrNull`, `toIntegerOrNull`, `toStringOrNull`, `toBooleanList`, `toFloatList`, `toIntegerList`, `toStringList`, `properties`, `split`, `last`, `isEmpty`, `e`, `exp`, `log`, `log10`, `sin`, `cos`, `tan`, `cot`, `asin`, `acos`, `atan`, `atan2`, `degrees`, `radians`, `pi`, and `haversin`.
- Graph slow log can be reset with `GRAPH.SLOWLOG g RESET`.
- Queries are now atomic (_Atomicity_ is the guarantee that each query either succeeds or fails with no side effects). Whenever a failure occurs, the query effect is rolled back from an undo log.

### Details

- Bug fixes (since 2.10-RC1):

  - [#2695](https://github.com/RedisGraph/RedisGraph/pull/2695) Potential crash on certain write queries (MOD-4286, MOD-4545)
  - [#2724](https://github.com/RedisGraph/RedisGraph/issues/2724) Potential crash when setting property values based on nonexistent properties
  - [#2460](https://github.com/RedisGraph/RedisGraph/issues/2460), [#2637](https://github.com/RedisGraph/RedisGraph/issues/2637), [#2680](https://github.com/RedisGraph/RedisGraph/issues/2680) Crash on invalid queries
  - [#2672](https://github.com/RedisGraph/RedisGraph/issues/2672) Wrong matching result on multiple labels
  - [#2643](https://github.com/RedisGraph/RedisGraph/issues/2643) Duplicate reports when matching relationship type `:R|R`
  - [#2687](https://github.com/RedisGraph/RedisGraph/issues/2687), [#2414](https://github.com/RedisGraph/RedisGraph/issues/2414) Error when `UNWIND`ing relationships
  - [#2636](https://github.com/RedisGraph/RedisGraph/issues/2636) `MERGE` ... `ON` ... - cannot remove property by setting it to null
  - [#2710](https://github.com/RedisGraph/RedisGraph/pull/2710) Undo log fix
  - [#2435](https://github.com/RedisGraph/RedisGraph/issues/2435) Incorrect result when comparing a value to NaN
  - [#2497](https://github.com/RedisGraph/RedisGraph/issues/2497) Incorrect result when comparing a value to null
  - [#2676](https://github.com/RedisGraph/RedisGraph/issues/2676) `sqrt`, `log`, `log10` - incorrect result for negative values
  - [#2213](https://github.com/RedisGraph/RedisGraph/issues/2213) Division and Modulo by zero - wrong behavior
