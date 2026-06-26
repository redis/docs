---
Title: Sets in Active-Active databases
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Information about using sets with an Active-Active database.
linkTitle: Sets
weight: $weight
url: '/operate/rs/7.22/databases/active-active/develop/data-types/sets/'
---
A Redis set is an unordered collection of strings. It is possible to
add, remove, and test for the existence of members with Redis commands.
A Redis set maintains a unique collection of elements. Sets can be great
for maintaining a list of events (click streams), users (in a group
conversation), products (in recommendation lists), engagements (likes,
shares) and so on.

Sets in Active-Active databases behave the same and maintain additional metadata to
achieve an "OR-Set" behavior to handle concurrent conflicting
writes. With the OR-Set behavior, writes across multiple Active-Active database instances
are typically unioned except in cases of conflicts. Conflicting instance
writes can happen when a Active-Active database instance deletes an element while the
other adds the same element. In this case and observed remove rule is
followed. That is, remove can only remove instances it has already seen
and in all other cases element add wins.

Here is an example of an "add wins" case:

|  **Time** | **CRDB Instance1** | **CRDB Instance2** |
|  ------: | :------: | :------: |
|  t1 | SADD key1 "a" |  |
|  t2 |  | SADD key1 "b" |
|  t3 | SMEMBERS key1 "a" | SMEMBERS key1 "b" |
|  t4 | — Sync — | — Sync — |
|  t3 | SMEMBERS key1 "a" "b" | SMEMBERS key1 "a" "b" |

Here is an example of an "observed remove" case.

|  **Time** | **CRDB Instance1** | **CRDB Instance2** |
|  ------: | :------: | :------: |
|  t1 | SMEMBERS key1 "a" "b" | SMEMBERS key1 "a" "b" |
|  t2 | SREM key1 "a" | SADD key1 "c" |
|  t3 | SREM key1 "c" |  |
|  t4 | — Sync — | — Sync — |
|  t3 | SMEMBERS key1 "c" "b" | SMEMBERS key1 "c" "b" |
