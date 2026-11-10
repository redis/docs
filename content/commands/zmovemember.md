---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
arguments:
- display_text: source
  key_spec_index: 0
  name: source
  type: key
- display_text: destination
  key_spec_index: 1
  name: destination
  type: key
- display_text: num-members
  name: num-members
  type: integer
- display_text: member
  multiple: true
  name: member
  type: string
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  name: condition
  optional: true
  type: oneof
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
- denyoom
complexity: O(K*(log(N)+log(M))) where K is the number of given members and N and
  M are the source and destination sizes.
description: Moves specified members from one sorted set to another, preserving scores.
  Can restrict moves to members absent from or present in the destination. Deletes
  the source sorted set if the last member was moved.
group: sorted-set
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
- RW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: ZMOVEMEMBER
railroad_diagram: /images/railroad/zmovemember.svg
since: 8.12.0
summary: Moves specified members from one sorted set to another, preserving scores.
  Can restrict moves to members absent from or present in the destination. Deletes
  the source sorted set if the last member was moved.
syntax_fmt: "ZMOVEMEMBER source destination num-members member [member ...] [NX |\n\
  \  XX]"
title: ZMOVEMEMBER
---
Atomically moves named members from the sorted set at `source` to the sorted
set at `destination`, preserving their scores.

By default, a moved member's source score replaces its score if it already
exists in `destination`. Use `NX` to move only members absent from the
destination, or `XX` to move only members already present there. A member that
does not satisfy the condition stays in the source.

Other destination members are retained. Redis creates `destination` only when
needed and deletes `source` when its last member is moved. Existing key
expiration times are preserved; a newly created destination has no expiration.

Missing source members are skipped. Duplicates are moved only once, and moved
members are returned in request order. If no requested member can move, the
command returns null. When both keys name the same sorted set, it returns null
without looking up the requested members.

If `source` exists and either key holds another type, the command returns a
`WRONGTYPE` error before moving any member.

In Redis Open Source Cluster, both keys must be in the same hash slot.
See [multi-key operations](/content/develop/using-commands/multi-key-operations.md).

Use [`ZMOVE`](/content/commands/zmove.md) to select by lowest score, highest
score, or score range. Use [`BZMOVE`](/content/commands/bzmove.md) to wait for
members to become available.

## Required arguments

<details open><summary><code>source</code></summary>

The key of the sorted set to move members from.

</details>

<details open><summary><code>destination</code></summary>

The key of the sorted set to move members to.

</details>

<details open><summary><code>num-members</code></summary>

The number of following member arguments. This must be a positive integer.
The explicit count separates member names from optional arguments, so names
such as `NX`, `XX`, `COUNT`, and numeric strings remain valid members.

</details>

<details open><summary><code>member [member ...]</code></summary>

Exactly `num-members` names to look up in `source`.

</details>

## Optional arguments

<details open><summary><code>NX | XX</code></summary>

- `NX` moves only members that do not exist in `destination`.
- `XX` moves only members that already exist in `destination`.

The options are mutually exclusive. Without either option, every requested
member found in `source` can move, whether or not it exists in `destination`.

</details>

## Examples

Move a named member, skipping missing names and duplicates:

{{% redis-cli %}}
redis> ZADD source:{example} 1 one 2 two
(integer) 2
redis> ZADD destination:{example} 99 two 100 retained
(integer) 2
redis> ZMOVEMEMBER source:{example} destination:{example} 3 missing two two
1) 1) "two"
   2) "2"
redis> ZRANGE source:{example} 0 -1 WITHSCORES
1) "one"
2) "1"
redis> ZRANGE destination:{example} 0 -1 WITHSCORES
1) "two"
2) "2"
3) "retained"
4) "100"
redis> ZMOVEMEMBER source:{example} destination:{example} 1 missing
(nil)
{{% /redis-cli %}}

Condition moves on destination membership:

{{% redis-cli %}}
redis> ZADD source:{conditional} 1 existing 2 new
(integer) 2
redis> ZADD destination:{conditional} 99 existing
(integer) 1
redis> ZMOVEMEMBER source:{conditional} destination:{conditional} 2 existing new NX
1) 1) "new"
   2) "2"
redis> ZSCORE source:{conditional} existing
"1"
redis> ZMOVEMEMBER source:{conditional} destination:{conditional} 1 existing XX
1) 1) "existing"
   2) "1"
redis> ZRANGE destination:{conditional} 0 -1 WITHSCORES
1) "existing"
2) "1"
3) "new"
4) "2"
{{% /redis-cli %}}

Use option names as literal members by including them in the counted list:

{{% redis-cli %}}
redis> ZADD source:{tokens} 1 NX 2 XX
(integer) 2
redis> ZMOVEMEMBER source:{tokens} destination:{tokens} 2 NX XX NX
1) 1) "NX"
   2) "1"
2) 1) "XX"
   2) "2"
{{% /redis-cli %}}

The first `NX` and `XX` are member names. The final `NX` is the condition.

## Return information

{{< multitabs id="zmovemember-return-info" tab1="RESP2" tab2="RESP3" >}}

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays in request order, nested even when only one
  member is moved. Each score is a bulk string.
- [Nil reply](/content/develop/reference/protocol-spec.md#null-arrays): `source`
  does not exist, none of the requested members can move, or both keys name the
  same sorted set.

-tab-sep-

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays in request order, nested even when only one
  member is moved. Each score is a double.
- [Null reply](/content/develop/reference/protocol-spec.md#nulls): `source`
  does not exist, none of the requested members can move, or both keys name the
  same sorted set.

{{< /multitabs >}}
