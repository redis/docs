---
acl_categories:
- '@write'
- '@list'
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
  - display_text: left
    name: left
    token: LEFT
    type: pure-token
  - display_text: right
    name: right
    token: RIGHT
    type: pure-token
  name: wherefrom
  type: oneof
- arguments:
  - display_text: left
    name: left
    token: LEFT
    type: pure-token
  - display_text: right
    name: right
    token: RIGHT
    type: pure-token
  name: whereto
  type: oneof
- display_text: timeout
  name: timeout
  type: double
- arguments:
  - arguments:
    - display_text: count
      name: count
      token: COUNT
      type: integer
    - display_text: exactly
      name: exactly
      token: EXACTLY
      type: integer
    name: selector
    type: oneof
  - arguments:
    - display_text: obo
      name: obo
      token: OBO
      type: pure-token
    - display_text: bulk
      name: bulk
      token: BULK
      type: pure-token
    name: ordering
    type: oneof
  name: how-many
  optional: true
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
- blocking
complexity: O(N) where N is the number of elements moved.
description: Moves up to (or exactly) a number of elements from one list to another
  and returns them. Blocks until the elements are available otherwise. Deletes the
  source list if it becomes empty.
group: list
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
  insert: true
linkTitle: BLMOVEM
railroad_diagram: /images/railroad/blmovem.svg
since: 8.10.0
summary: Moves up to (or exactly) a number of elements from one list to another and
  returns them. Blocks until the elements are available otherwise. Deletes the source
  list if it becomes empty.
syntax_fmt: "BLMOVEM source destination <LEFT | RIGHT> <LEFT | RIGHT> timeout\n  [<COUNT\_\
  count | EXACTLY\_exactly> <OBO | BULK>]"
title: BLMOVEM
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


`BLMOVEM` is the blocking variant of [`LMOVEM`]({{< relref "/commands/lmovem" >}}).
When `source` holds enough elements to satisfy the request, this command behaves
exactly like [`LMOVEM`]({{< relref "/commands/lmovem" >}}). Otherwise, Redis blocks the connection until
another client pushes the required elements to `source` or until `timeout` is
reached.

## Required arguments

<details open><summary><code>source</code></summary>

The key of the source list.

</details>

<details open><summary><code>destination</code></summary>

The key of the destination list.

</details>

<details open><summary><code>LEFT | RIGHT</code></summary>

The end of `source` to pop elements from: `LEFT` (head) or `RIGHT` (tail).

</details>

<details open><summary><code>LEFT | RIGHT</code></summary>

The end of `destination` to push elements to: `LEFT` (head) or `RIGHT` (tail).

</details>

<details open><summary><code>timeout</code></summary>

The maximum time to block, in seconds. A timeout of `0` blocks indefinitely.

</details>

## Optional arguments

The `how-many` block controls how many elements are moved and in what order.
When you include it, you must provide both a selector (`COUNT` or `EXACTLY`)
and an ordering (`OBO` or `BULK`).

<details open><summary><code>COUNT count | EXACTLY exactly</code></summary>

The number of elements to move:

- `COUNT count` moves up to `count` elements. If `source` holds fewer than
  `count` elements, all of them are moved. This matches the `count` semantics of
  [`LPOP`]({{< relref "/commands/lpop" >}}) and [`LMPOP`]({{< relref "/commands/lmpop" >}}).
- `EXACTLY exactly` moves exactly `exactly` elements. If `source` holds fewer
  than `exactly` elements, the command blocks (see [Blocking behavior](#blocking-behavior)).

</details>

<details open><summary><code>OBO | BULK</code></summary>

The order in which elements are pushed onto `destination`:

- `OBO` (one by one) moves elements individually: each element is popped from
  `source` and pushed to `destination` before the next one is moved.
- `BULK` moves all of the elements at once, preserving their relative order.

See the [Element ordering]({{< relref "/commands/lmovem#element-ordering" >}}) section of the [`LMOVEM`]({{< relref "/commands/lmovem" >}}) documentation for details.

</details>

## Details

### Blocking behavior

Whether `BLMOVEM` blocks depends on the selector:

- With `COUNT`, the command blocks only while `source` is empty. As soon as at
  least one element is available it unblocks, moves up to `count` elements, and
  returns them.
- With `EXACTLY`, the command blocks while `source` holds fewer than the
  requested number of elements. It unblocks only once `source` grows to at least
  that length, then moves exactly that many elements atomically.

A `timeout` of `0` blocks indefinitely. When used inside a
[`MULTI`]({{< relref "/commands/multi" >}})/[`EXEC`]({{< relref "/commands/exec" >}}) block or a Lua script, `BLMOVEM` does not block; it
behaves like [`LMOVEM`]({{< relref "/commands/lmovem" >}}) and, when the request cannot be satisfied,
returns nil immediately.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="blmovem-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): the moved elements, in destination order.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): the operation timed out.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): the moved elements, in destination order.
* [Null reply](../../develop/reference/protocol-spec#nulls): the operation timed out.

{{< /multitabs >}}

## See also

[`BLMOVE`]({{< relref "commands/blmove/" >}}) | [`LMOVEM`]({{< relref "commands/lmovem/" >}}) | [`BLMPOP`]({{< relref "commands/blmpop/" >}}) | [`BRPOPLPUSH`]({{< relref "commands/brpoplpush/" >}})

## Related topics

- [Redis lists]({{< relref "/develop/data-types/lists" >}})

