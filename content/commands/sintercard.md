---
acl_categories:
- '@read'
- '@set'
- '@slow'
arguments:
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- display_text: limit
  name: limit
  optional: true
  token: LIMIT
  type: integer
arity: -3
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
command_flags:
- readonly
- movablekeys
complexity: O(N*M) worst case where N is the cardinality of the smallest set and M
  is the number of sets.
description: Returns the number of members of the intersect of multiple sets.
group: set
hidden: false
key_specs:
- RO: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: SINTERCARD
since: 7.0.0
summary: Returns the number of members of the intersect of multiple sets.
syntax_fmt: "SINTERCARD numkeys key [key ...] [LIMIT\_limit]"
syntax_str: "key [key ...] [LIMIT\_limit]"
title: SINTERCARD
---
This command is similar to [`SINTER`]({{< relref "/commands/sinter" >}}), but instead of returning the result set, it returns just the cardinality of the result.
Returns the cardinality of the set which would result from the intersection of all the given sets.

Keys that do not exist are considered to be empty sets.
With one of the keys being an empty set, the resulting set is also empty (since set intersection with an empty set always results in an empty set).

By default, the command calculates the cardinality of the intersection of all given sets.
When provided with the optional `LIMIT` argument (which defaults to 0 and means unlimited), if the intersection cardinality reaches limit partway through the computation, the algorithm will exit and yield limit as the cardinality.
Such implementation ensures a significant speedup for queries where the limit is lower than the actual intersection cardinality.

## Examples

{{% redis-cli %}}
SADD key1 "a"
SADD key1 "b"
SADD key1 "c"
SADD key1 "d"
SADD key2 "c"
SADD key2 "d"
SADD key2 "e"
SINTER key1 key2
SINTERCARD 2 key1 key2
SINTERCARD 2 key1 key2 LIMIT 1
{{% /redis-cli %}}

