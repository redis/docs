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
  - display_text: min
    name: min
    token: MIN
    type: pure-token
  - display_text: max
    name: max
    token: MAX
    type: pure-token
  - arguments:
    - display_text: byscore
      name: byscore
      token: BYSCORE
      type: pure-token
    - display_text: score-min
      name: score-min
      type: double
    - display_text: score-max
      name: score-max
      type: double
    name: score-range
    type: block
  name: selection
  type: oneof
- display_text: count
  name: count
  optional: true
  token: COUNT
  type: integer
arity: -4
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
complexity: O(log(N) + K*(log(N)+log(M))) where N and M are the source and destination
  sizes and K is the number of moved members.
description: Moves highest- or lowest-scoring members, or a score range of members,
  from one sorted set to another, preserving scores. Deletes the source sorted set
  if the last member was moved.
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
linkTitle: ZMOVE
railroad_diagram: /images/railroad/zmove.svg
since: 8.12.0
summary: Moves highest- or lowest-scoring members, or a score range of members, from
  one sorted set to another, preserving scores. Deletes the source sorted set if the
  last member was moved.
syntax_fmt: "ZMOVE source destination <MIN | MAX | BYSCORE score-min score-max>\n\
  \  [COUNT count]"
title: ZMOVE
---
Atomically moves members from the sorted set at `source` to the sorted set at
`destination`, preserving their scores. Select members by lowest score (`MIN`),
highest score (`MAX`), or a score range (`BYSCORE`).

If a moved member already exists in `destination`, its score is replaced with
the source score. Other destination members are retained. Redis creates
`destination` if needed and deletes `source` when its last member is moved.
Existing key expiration times are preserved; a newly created destination has no
expiration.

When both keys name the same sorted set, the command returns null without
iterating over members. If `source` exists and either key holds another type,
the command returns a `WRONGTYPE` error before moving any members.

In Redis Open Source Cluster, both keys must be in the same hash slot.
Use a shared hash tag, such as `bookmarks:{user:42}` and
`batch:{user:42}:001`. See [multi-key operations](/content/develop/using-commands/multi-key-operations.md).

Use [`BZMOVE`](/content/commands/bzmove.md) to wait for members to become
available, or [`ZMOVEMEMBER`](/content/commands/zmovemember.md) to move named
members, optionally conditioned on their presence in the destination.

## Required arguments

<details open><summary><code>source</code></summary>

The key of the sorted set to move members from.

</details>

<details open><summary><code>destination</code></summary>

The key of the sorted set to move members to.

</details>

<details open><summary><code>MIN | MAX | BYSCORE score-min score-max</code></summary>

- `MIN` moves the members with the lowest scores, in ascending score order.
  Equal scores use ascending lexicographical member order.
- `MAX` moves the members with the highest scores, in descending score order.
  Equal scores use descending lexicographical member order.
- `BYSCORE score-min score-max` moves members whose scores fall within the
  specified range. Members are moved and returned in ascending score order,
  with equal scores ordered lexicographically.

Without `COUNT`, `MIN` and `MAX` move one member, and `BYSCORE` moves all
matching members.

Score bounds are inclusive by default. Prefix a bound with `(` to exclude it.
For example, `BYSCORE -inf (1700000000` selects scores strictly less than
`1700000000`. Use `-inf` and `+inf` for unbounded ends of the range.

</details>

## Optional arguments

<details open><summary><code>COUNT count</code></summary>

Move at most `count` selected members. `count` must be a positive integer.
Zero and negative counts return `ERR count should be greater than 0` before
any members are moved. There is no offset argument.

</details>

## Examples

Move one member while preserving unrelated destination members:

{{% redis-cli %}}
redis> ZADD scores:{example} 1 one 2 two 3 three
(integer) 3
redis> ZADD moved:{example} 99 one 100 retained
(integer) 2
redis> ZMOVE scores:{example} moved:{example} MIN
1) 1) "one"
   2) "1"
redis> ZMOVE scores:{example} moved:{example} MAX
1) 1) "three"
   2) "3"
redis> ZRANGE moved:{example} 0 -1 WITHSCORES
1) "one"
2) "1"
3) "three"
4) "3"
5) "retained"
6) "100"
redis> ZMOVE scores:{example} moved:{example} MIN COUNT 0
(error) ERR count should be greater than 0
redis> ZRANGE scores:{example} 0 -1 WITHSCORES
1) "two"
2) "2"
{{% /redis-cli %}}

Claim a bounded batch with scores strictly less than a cutoff:

{{% redis-cli %}}
redis> ZADD bookmarks:{user:42} 1699999998 bookmark:a 1699999999 bookmark:b 1700000000 bookmark:c
(integer) 3
redis> ZMOVE bookmarks:{user:42} batch:{user:42}:001 BYSCORE -inf (1700000000 COUNT 500
1) 1) "bookmark:a"
   2) "1699999998"
2) 1) "bookmark:b"
   2) "1699999999"
redis> ZRANGE bookmarks:{user:42} 0 -1 WITHSCORES
1) "bookmark:c"
2) "1700000000"
redis> ZMOVE bookmarks:{user:42} batch:{user:42}:002 BYSCORE -inf (1700000000 COUNT 500
(nil)
{{% /redis-cli %}}

## Claim a batch for processing

When scores represent update times, use `BYSCORE` with an exclusive upper bound
to claim older members. Selection, destination insertion, and source removal
happen in one atomic command. Other clients cannot change a selected member's
score between the range check and its removal.

Give each consumer batch a separate destination key. Persist the batch, then
delete that destination after successful processing. Writers can continue to
add or update members in `source`; deleting the batch does not delete those
later source updates.

`ZMOVE` does not acknowledge processing or automatically retry failed batches.
Your application must retain and recover unprocessed destinations. It moves
only sorted-set members and scores; values stored under other keys are not
copied or snapshotted.

## Return information

{{< multitabs id="zmove-return-info" tab1="RESP2" tab2="RESP3" >}}

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays, nested even when only one member is moved.
  Each score is a bulk string. Pairs follow the selected order.
- [Nil reply](/content/develop/reference/protocol-spec.md#null-arrays): no members
  were moved because `source` does not exist, no scores match, or both keys
  name the same sorted set.

-tab-sep-

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays, nested even when only one member is moved.
  Each score is a double. Pairs follow the selected order.
- [Null reply](/content/develop/reference/protocol-spec.md#nulls): no members
  were moved because `source` does not exist, no scores match, or both keys
  name the same sorted set.

{{< /multitabs >}}
