---
acl_categories:
- '@read'
- '@sortedset'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - display_text: count
    name: count
    type: integer
  - display_text: withscores
    name: withscores
    optional: true
    token: WITHSCORES
    type: pure-token
  name: options
  optional: true
  type: block
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
complexity: O(N) where N is the number of members returned
description: Returns one or more random members from a sorted set.
group: sorted-set
hidden: false
hints:
- nondeterministic_output
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
linkTitle: ZRANDMEMBER
since: 6.2.0
summary: Returns one or more random members from a sorted set.
syntax_fmt: ZRANDMEMBER key [count [WITHSCORES]]
syntax_str: '[count [WITHSCORES]]'
title: ZRANDMEMBER
---
When called with just the `key` argument, return a random element from the sorted set value stored at `key`.

If the provided `count` argument is positive, return an array of **distinct elements**.
The array's length is either `count` or the sorted set's cardinality ([`ZCARD`]({{< relref "/commands/zcard" >}})), whichever is lower.

If called with a negative `count`, the behavior changes and the command is allowed to return the **same element multiple times**.
In this case, the number of returned elements is the absolute value of the specified `count`.

The optional `WITHSCORES` modifier changes the reply so it includes the respective scores of the randomly selected elements from the sorted set.

## Examples

{{% redis-cli %}}
ZADD dadi 1 uno 2 due 3 tre 4 quattro 5 cinque 6 sei
ZRANDMEMBER dadi
ZRANDMEMBER dadi
ZRANDMEMBER dadi -5 WITHSCORES
{{% /redis-cli %}}


## Specification of the behavior when count is passed

When the `count` argument is a positive value this command behaves as follows:

* No repeated elements are returned.
* If `count` is bigger than the cardinality of the sorted set, the command will only return the whole sorted set without additional elements.
* The order of elements in the reply is not truly random, so it is up to the client to shuffle them if needed.

When the `count` is a negative value, the behavior changes as follows:

* Repeating elements are possible.
* Exactly `count` elements, or an empty array if the sorted set is empty (non-existing key), are always returned.
* The order of elements in the reply is truly random.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zrandmember-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): without the additional _count_ argument, the command returns a randomly selected member, or [Nil reply](../../develop/reference/protocol-spec#bulk-strings) when _key_ doesn't exist.
[Array reply](../../develop/reference/protocol-spec#arrays): when the additional _count_ argument is passed, the command returns an array of members, or an empty array when _key_ doesn't exist. If the _WITHSCORES_ modifier is used, the reply is a list of members and their scores from the sorted set.

-tab-sep-

[Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): without the additional _count_ argument, the command returns a randomly selected member, or [Null reply](../../develop/reference/protocol-spec#nulls) when _key_ doesn't exist.
[Array reply](../../develop/reference/protocol-spec#arrays): when the additional _count_ argument is passed, the command returns an array of members, or an empty array when _key_ doesn't exist. If the _WITHSCORES_ modifier is used, the reply is a list of members and their scores from the sorted set.

{{< /multitabs >}}
