---
Title: Sorted sets in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Information about using sorted sets with an Active-Active database.
linkTitle: Sorted sets
weight: $weight
url: '/operate/rs/7.8/databases/active-active/develop/data-types/sorted-sets/'
---
{{< note >}}
[Redis Geospatial (Geo)]({{< relref "/commands/GEOADD" >}}) is based on Sorted Sets, so the same Active-Active database development instructions apply to Geo.
{{< /note >}}

Similar to Redis Sets, Redis Sorted Sets are non-repeating collections
of Strings. The difference between the two is that every member of a
Sorted Set is associated with a score used to order the Sorted Set from
lowest to highest. While members are unique, they may have the same
score.

With Sorted Sets, you can quickly add, remove or update elements as
well as get ranges by score or by rank (position). Sorted Sets in Active-Active databases
behave the same and maintain additional metadata to handle concurrent
conflicting writes. Conflict resolution is done in two
phases:

1. First, the database resolves conflict at the set level using "OR
    Set" (Observed-Remove Set). With OR-Set behavior, writes across
    multiple Active-Active database instances are typically unioned except in cases of
    conflicts. Conflicting writes can happen when an Active-Active database instance
    deletes an element while the other adds or updates the same element.
    In this case, an observed Remove rule is followed, and only
    instances it has already seen are removed. In all other cases, the
    Add / Update element wins.
1. Second, the database resolves conflict at the score level. In this
    case, the score is treated as a counter and applies the same
    conflict resolution as regular counters.

See the following examples to get familiar with Sorted Sets'
behavior in Active-Active database:

Example of Simple Sorted Set with No
Conflict:

|  **Time** | **CRDB Instance 1** | **CRDB Instance 2** |
|  ------: | :------: | :------: |
|  t1 | ZADD Z 1.1 x |  |
|  t2 | — Sync — | — Sync — |
|  t3 |  | ZADD Z 1.2 y |
|  t4 | — Sync — | — Sync — |
|  t5 | ZRANGE Z 0 -1 => x y | ZRANGE Z 0 -1 => x y |

**Explanation**:
When adding two different elements to a Sorted Set from different
replicas (in this example, x with score 1.1 was added by Instance 1 to
Sorted Set Z, and y with score 1.2 was added by Instance 2 to Sorted Set
Z) in a non-concurrent manner (i.e. each operation happened separately
and after both instances were in sync), the end result is a Sorted
Set including both elements in each Active-Active database instance.
Example of Sorted Set and Concurrent
Add:

|  **Time** | **CRDB Instance 1** | **CRDB Instance 2** |
|  ------: | :------: | :------: |
|  t1 | ZADD Z 1.1 x |  |
|  t2 |  | ZADD Z 2.1 x |
|  t3 | ZSCORE Z x => 1.1 | ZSCORE Z x => 2.1 |
|  t4 | — Sync — | — Sync — |
|  t5 | ZSCORE Z x => 2.1 | ZSCORE Z x => 2.1 |

**Explanation**:
When concurrently adding an element x to a Sorted Set Z by two different
Active-Active database instances (Instance 1 added score 1.1 and Instance 2 added score
2.1), the Active-Active database implements Last Write Win (LWW) to determine the score of
x. In this scenario, Instance 2 performed the ZADD operation at time
t2\>t1 and therefore the Active-Active database sets the score 2.1 to
x.

Example of Sorted Set with Concurrent Add Happening at the Exact Same
Time:

|  **Time** | **CRDB Instance 1** | **CRDB Instance 2** |
|  ------: | :------: | :------: |
|  t1 | ZADD Z 1.1 x | ZADD Z 2.1 x |
|  t2 | ZSCORE Z x => 1.1 | ZSCORE Z x => 2.1 |
|  t3 | — Sync — | — Sync — |
|  t4 | ZSCORE Z x => 1.1 | ZSCORE Z x => 1.1 |

**Explanation**:
The example above shows a relatively rare situation, in which two Active-Active database
instances concurrently added the same element x to a Sorted Set at the
same exact time but with a different score, i.e. Instance 1 added x with
a 1.1 score and Instance 2 added x with a 2.1 score. After syncing, the
Active-Active database realized that both operations happened at the same time and
resolved the conflict by arbitrarily (but consistently across all Active-Active database
instances) giving precedence to Instance 1.
Example of Sorted Set with Concurrent Counter
Increment:

|  **Time** | **CRDB Instance 1** | **CRDB Instance 2** |
|  ------: | :------: | :------: |
|  t1 | ZADD Z 1.1 x |  |
|  t2 | — Sync — | — Sync — |
|  t3 | ZINCRBY Z 1.0 x | ZINCRBY Z 1.0 x |
|  t4 | — Sync — | — Sync — |
|  t5 | ZSCORE Z x => 3.1 | ZSCORE Z x => 3.1 |

**Explanation**:
The result is the sum of all
ZINCRBY
operations performed by all Active-Active database instances.

Example of Removing an Element from a Sorted
Set:

|  **Time** | **CRDB Instance 1** | **CRDB Instance 2** |
|  ------: | :------: | :------: |
|  t1 | ZADD Z 4.1 x |  |
|  t2 | — Sync — | — Sync — |
|  t3 | ZSCORE Z x => 4.1 | ZSCORE Z x => 4.1 |
|  t4 | ZREM Z x | ZINCRBY Z 2.0 x |
|  t5 | ZSCORE Z x => nill | ZSCORE Z x => 6.1 |
|  t6 | — Sync — | — Sync — |
|  t7 | ZSCORE Z x => 2.0 | ZSCORE Z x => 2.0 |

**Explanation**:
At t4 - t5, concurrent ZREM and ZINCRBY operations ran on Instance 1
and Instance 2 respectively. Before the instances were in sync, the ZREM
operation could only delete what had been seen by Instance 1, so
Instance 2 was not affected. Therefore, the ZSCORE operation shows the
local effect on x. At t7, after both instances were in-sync, the Active-Active database
resolved the conflict by subtracting 4.1 (the value of element x in
Instance 1) from 6.1 (the value of element x in Instance 2).
