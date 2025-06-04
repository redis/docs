---
acl_categories:
- '@read'
- '@set'
- '@sortedset'
- '@list'
- '@slow'
- '@dangerous'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: pattern
  key_spec_index: 1
  name: by-pattern
  optional: true
  token: BY
  type: pattern
- arguments:
  - display_text: offset
    name: offset
    type: integer
  - display_text: count
    name: count
    type: integer
  name: limit
  optional: true
  token: LIMIT
  type: block
- display_text: pattern
  key_spec_index: 1
  multiple: true
  multiple_token: true
  name: get-pattern
  optional: true
  token: GET
  type: pattern
- arguments:
  - display_text: asc
    name: asc
    token: ASC
    type: pure-token
  - display_text: desc
    name: desc
    token: DESC
    type: pure-token
  name: order
  optional: true
  type: oneof
- display_text: sorting
  name: sorting
  optional: true
  token: ALPHA
  type: pure-token
arity: -2
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
complexity: O(N+M*log(M)) where N is the number of elements in the list or set to
  sort, and M the number of returned elements. When the elements are not sorted, complexity
  is O(N).
description: Returns the sorted elements of a list, a set, or a sorted set.
group: generic
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
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
- RO: true
  access: true
  begin_search:
    spec: {}
    type: unknown
  find_keys:
    spec: {}
    type: unknown
  notes: For the optional BY/GET keyword. It is marked 'unknown' because the key names
    derive from the content of the key we sort
linkTitle: SORT_RO
since: 7.0.0
summary: Returns the sorted elements of a list, a set, or a sorted set.
syntax_fmt: "SORT_RO key [BY\_pattern] [LIMIT\_offset count] [GET\_pattern [GET\n\
  \  pattern ...]] [ASC | DESC] [ALPHA]"
syntax_str: "[BY\_pattern] [LIMIT\_offset count] [GET\_pattern [GET pattern ...]]\
  \ [ASC | DESC] [ALPHA]"
title: SORT_RO
---
Read-only variant of the [`SORT`]({{< relref "/commands/sort" >}}) command. It is exactly like the original [`SORT`]({{< relref "/commands/sort" >}}) but refuses the `STORE` option and can safely be used in read-only replicas.

Since the original [`SORT`]({{< relref "/commands/sort" >}}) has a `STORE` option it is technically flagged as a writing command in the Redis command table. For this reason read-only replicas in a Redis Cluster will redirect it to the master instance even if the connection is in read-only mode (see the [`READONLY`]({{< relref "/commands/readonly" >}}) command of Redis Cluster).

The `SORT_RO` variant was introduced in order to allow [`SORT`]({{< relref "/commands/sort" >}}) behavior in read-only replicas without breaking compatibility on command flags.

See original [`SORT`]({{< relref "/commands/sort" >}}) for more details.

## Examples

```
SORT_RO mylist BY weight_*->fieldname GET object_*->fieldname
```

## Return information

{{< multitabs id="sort-ro-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sorted elements.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of sorted elements.

{{< /multitabs >}}
