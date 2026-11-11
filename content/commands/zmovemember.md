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
- arguments:
  - display_text: num-members
    name: num-members
    type: integer
  - display_text: member
    multiple: true
    name: member
    type: string
  name: members
  token: MEMBERS
  type: block
arity: -6
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
syntax_fmt: "ZMOVEMEMBER source destination [NX | XX] MEMBERS num-members member\n\
  \  [member ...]"
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

<details open><summary><code>MEMBERS num-members member [member ...]</code></summary>

`MEMBERS` starts the list of names to look up in `source`. `num-members` must
be a positive integer, followed by exactly that many member names.

The explicit block separates member names from optional arguments. Names such
as `NX`, `XX`, `MEMBERS`, and numeric strings remain valid members. This also
leaves room for additional options outside the counted block.

</details>

## Optional arguments

<details open><summary><code>NX | XX</code></summary>

- `NX` moves only members that do not exist in `destination`.
- `XX` moves only members that already exist in `destination`.

The options are mutually exclusive. Specify the condition before or after the
complete `MEMBERS` block. Without either option, every requested member found
in `source` can move, whether or not it exists in `destination`.

</details>

## Examples

Move a named member, skipping missing names and duplicates:

{{% redis-cli %}}
redis> ZADD source:{example} 1 one 2 two
(integer) 2
redis> ZADD destination:{example} 99 two 100 retained
(integer) 2
redis> ZMOVEMEMBER source:{example} destination:{example} MEMBERS 3 missing two two
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
redis> ZMOVEMEMBER source:{example} destination:{example} MEMBERS 1 missing
(nil)
{{% /redis-cli %}}

Condition moves on destination membership:

{{% redis-cli %}}
redis> ZADD source:{conditional} 1 existing 2 new
(integer) 2
redis> ZADD destination:{conditional} 99 existing
(integer) 1
redis> ZMOVEMEMBER source:{conditional} destination:{conditional} NX MEMBERS 2 existing new
1) 1) "new"
   2) "2"
redis> ZSCORE source:{conditional} existing
"1"
redis> ZMOVEMEMBER source:{conditional} destination:{conditional} MEMBERS 1 existing XX
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
redis> ZADD source:{tokens} 1 NX 2 XX 3 MEMBERS 4 1
(integer) 4
redis> ZMOVEMEMBER source:{tokens} destination:{tokens} NX MEMBERS 4 NX XX MEMBERS 1
1) 1) "NX"
   2) "1"
2) 1) "XX"
   2) "2"
3) 1) "MEMBERS"
   2) "3"
4) 1) "1"
   2) "4"
{{% /redis-cli %}}

The `NX` before `MEMBERS` is the condition. The four names in the counted
block are literal members, including the second `MEMBERS`.

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
