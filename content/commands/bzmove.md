---
acl_categories:
- '@write'
- '@sortedset'
- '@slow'
- '@blocking'
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
  name: where
  type: oneof
- display_text: timeout
  name: timeout
  type: double
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
- denyoom
- blocking
complexity: O(K*(log(N)+log(M))) where K is the number of moved members and N and
  M are the source and destination sizes.
description: Moves highest- or lowest-scoring members from one sorted set to another,
  preserving scores. Blocks until a member is available otherwise. Deletes the source
  sorted set if the last member was moved.
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
linkTitle: BZMOVE
railroad_diagram: /images/railroad/bzmove.svg
since: 8.12.0
summary: Moves highest- or lowest-scoring members from one sorted set to another,
  preserving scores. Blocks until a member is available otherwise. Deletes the source
  sorted set if the last member was moved.
syntax_fmt: BZMOVE source destination <MIN | MAX> timeout [COUNT count]
title: BZMOVE
---
`BZMOVE` is the blocking variant of [`ZMOVE`](/content/commands/zmove.md) for
moving lowest-scoring or highest-scoring members between sorted sets.
When `source` contains members, it behaves like `ZMOVE` with the same `MIN` or
`MAX` selector and optional `COUNT`.

When `source` does not exist, the connection waits until at least one member
becomes available or the timeout expires. It then moves up to `count`
available members; it does not wait for a full batch. Changes to `destination`
do not unblock the connection. `BYSCORE` is not supported.

Moved members retain their source scores. If a member already exists in
`destination`, that score is overwritten. Other destination members are
retained. Redis creates `destination` if needed and deletes `source` when its
last member is moved. Existing expiration times are preserved.

If `source` and `destination` name the same key, the command returns null
without moving members or blocking. Inside a
[`MULTI`](/content/commands/multi.md)/[`EXEC`](/content/commands/exec.md)
transaction or a script, the command does not block. If no member is available,
it returns null. `COUNT 0` also returns null without blocking.

A source key of the wrong type causes a `WRONGTYPE` error immediately.
The destination type is checked when members are available to move. If a
blocked client wakes and `destination` holds another type, the command returns
`WRONGTYPE` and leaves the source members unchanged.

In Redis Open Source Cluster, both keys must be in the same hash slot.
See [multi-key operations](/content/develop/using-commands/multi-key-operations.md).

## Required arguments

<details open><summary><code>source</code></summary>

The key of the sorted set to move members from. This is the only key the
command blocks on.

</details>

<details open><summary><code>destination</code></summary>

The key of the sorted set to move members to.

</details>

<details open><summary><code>MIN | MAX</code></summary>

Move the members with the lowest scores (`MIN`) or highest scores (`MAX`).
`MIN` returns members in ascending score order, and `MAX` in descending score
order. Equal scores follow the corresponding lexicographical member order.

</details>

<details open><summary><code>timeout</code></summary>

The maximum time to block, in seconds. This is a non-negative double, so
fractional seconds are allowed. A timeout of `0` blocks indefinitely.

</details>

## Optional arguments

<details open><summary><code>COUNT count</code></summary>

Move at most `count` available members. The default is `1`. `count` must be a
non-negative integer. `COUNT 0` returns null immediately without blocking.

</details>

## Examples

Move the available members without waiting for a full batch:

{{% redis-cli %}}
redis> ZADD ready:{example} 1 first 2 second
(integer) 2
redis> BZMOVE ready:{example} processing:{example} MIN 1 COUNT 3
1) 1) "first"
   2) "1"
2) 1) "second"
   2) "2"
{{% /redis-cli %}}

To wait for a producer, run the following command when `ready:{queue}` does
not exist:

```text
BZMOVE ready:{queue} processing:{queue} MIN 0 COUNT 10
```

In a second connection, run `ZADD ready:{queue} 1 job:1`. The blocked command
moves the available member and returns `[["job:1", 1]]`; it does not wait for
nine more members.

## Return information

{{< multitabs id="bzmove-return-info" tab1="RESP2" tab2="RESP3" >}}

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays, nested even when only one member is moved.
  Each score is a bulk string. Pairs follow the selected order.
- [Nil reply](/content/develop/reference/protocol-spec.md#null-arrays): the timeout
  expired, both keys name the same sorted set, `COUNT 0` is used, or blocking
  is disallowed and no member is available.

-tab-sep-

One of the following:

- [Array reply](/content/develop/reference/protocol-spec.md#arrays): an array of
  two-element member/score arrays, nested even when only one member is moved.
  Each score is a double. Pairs follow the selected order.
- [Null reply](/content/develop/reference/protocol-spec.md#nulls): the timeout
  expired, both keys name the same sorted set, `COUNT 0` is used, or blocking
  is disallowed and no member is available.

{{< /multitabs >}}
