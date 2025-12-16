---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
- '@blocking'
arguments:
- display_text: timeout
  name: timeout
  type: double
- display_text: numkeys
  name: numkeys
  type: integer
- display_text: key
  key_spec_index: 0
  multiple: true
  name: key
  type: key
- arguments:
  - display_text: min
    name: min
    token: MIN
    type: pure-token
  - display_text: max
    name: max
    token: MAX
    type: pure-token
  name: where
  type: oneof
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
arity: -5
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
- write
- blocking
- movablekeys
complexity: O(K) + O(M*log(N)) where K is the number of provided keys, N being the
  number of elements in the sorted set, and M being the number of elements popped.
description: Removes and returns a member by score from one or more sorted sets. Blocks
  until a member is available otherwise. Deletes the sorted set if the last element
  was popped.
group: sorted-set
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 2
    type: index
  delete: true
  find_keys:
    spec:
      firstkey: 1
      keynumidx: 0
      keystep: 1
    type: keynum
linkTitle: BZMPOP
railroad_diagram: /images/railroad/bzmpop.svg
since: 7.0.0
summary: Removes and returns a member by score from one or more sorted sets. Blocks
  until a member is available otherwise. Deletes the sorted set if the last element
  was popped.
syntax_fmt: "BZMPOP timeout numkeys key [key ...] <MIN | MAX> [COUNT\_count]"
syntax_str: "numkeys key [key ...] <MIN | MAX> [COUNT\_count]"
title: BZMPOP
---
`BZMPOP` is the blocking variant of [`ZMPOP`]({{< relref "/commands/zmpop" >}}).

When any of the sorted sets contains elements, this command behaves exactly like [`ZMPOP`]({{< relref "/commands/zmpop" >}}).
When used inside a [`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) block or a Lua script, this command behaves exactly like [`ZMPOP`]({{< relref "/commands/zmpop" >}}).
When all sorted sets are empty, Redis will block the connection until another client adds members to one of the keys or until the `timeout` (a double value specifying the maximum number of seconds to block) elapses.
A `timeout` of zero can be used to block indefinitely.

See [`ZMPOP`]({{< relref "/commands/zmpop" >}}) for more information.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="bzmpop-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): when no element could be popped.
* [Array reply](../../develop/reference/protocol-spec#arrays): a two-element array with the first element being the name of the key from which elements were popped, and the second element is an array of the popped elements. Every entry in the elements array is also an array that contains the member and its score.

-tab-sep-

One of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): when no element could be popped.
* [Array reply](../../develop/reference/protocol-spec#arrays): a two-element array with the first element being the name of the key from which elements were popped, and the second element is an array of the popped elements. Every entry in the elements array is also an array that contains the member and its score.

{{< /multitabs >}}
