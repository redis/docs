---
acl_categories:
- '@write'
- '@list'
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
complexity: O(N) where N is the number of elements moved.
description: Moves up to (or exactly) a number of elements from one list to another
  and returns them. Deletes the source list if it becomes empty.
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
linkTitle: LMOVEM
railroad_diagram: /images/railroad/lmovem.svg
since: 8.10.0
summary: Moves up to (or exactly) a number of elements from one list to another and
  returns them. Deletes the source list if it becomes empty.
syntax_fmt: "LMOVEM source destination <LEFT | RIGHT> <LEFT | RIGHT>\n  [<COUNT\_\
  count | EXACTLY\_exactly> <OBO | BULK>]"
title: LMOVEM
---
{{< note >}}
This command's behavior varies in clustered Redis environments. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Atomically moves one or more elements from the list stored at `source` to the
list stored at `destination` and returns the moved elements.
`LMOVEM` is the multiple-element version of [`LMOVE`]({{< relref "/commands/lmove" >}}): without the
optional `how-many` block, it behaves exactly like [`LMOVE`]({{< relref "/commands/lmove" >}}) but returns
the moved element as a one-element array.

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
  than `exactly` elements, nothing is moved and the command returns nil.

</details>

<details open><summary><code>OBO | BULK</code></summary>

The order in which elements are pushed onto `destination`:

- `OBO` (one by one) moves elements individually: each element is popped from
  `source` and pushed to `destination` before the next one is moved.
- `BULK` moves all of the elements at once, preserving their relative order.

The two orderings differ only in the resulting arrangement of elements. See
[Element ordering](#element-ordering) for details.

</details>

## Examples

{{% redis-cli %}}
RPUSH mylist 1 2 3 4
LMOVEM mylist myotherlist LEFT LEFT COUNT 2 OBO
LRANGE mylist 0 -1
LRANGE myotherlist 0 -1
LMOVEM mylist myotherlist LEFT LEFT EXACTLY 5 BULK
RPUSH samelist a b c
LMOVEM samelist samelist LEFT LEFT EXACTLY 2 OBO
LRANGE samelist 0 -1
{{% /redis-cli %}}

## Details

### Moving multiple elements

`LMOVEM` moves elements from one end of `source` (selected by the first
`LEFT | RIGHT` argument) to one end of `destination` (selected by the second
`LEFT | RIGHT` argument), and returns the moved elements as an array. If
`source` does not exist, no operation is performed and the command returns an
empty array (or nil when `EXACTLY` is used).

The `COUNT` and `EXACTLY` selectors decide how many elements are moved:

- With `COUNT count`, the command moves up to `count` elements. If `source`
  holds fewer than `count` elements, all available elements are moved.
- With `EXACTLY exactly`, the command moves the requested number of elements
  only if `source` holds at least that many. Otherwise it moves nothing and
  returns nil. This is useful when elements form fixed-size groups (for example,
  pairs or triplets) that must be moved together or not at all.

### Element ordering

The `OBO` and `BULK` orderings determine how the moved elements are arranged on
`destination`:

- `OBO` (one by one) pops and pushes each element in turn, so an element popped
  earlier ends up "beneath" one popped later at the destination end.
- `BULK` moves the whole batch at once, preserving the elements' relative order.

When `source` and `destination` are the same key, this difference becomes a
useful side effect. `BULK` leaves the list unchanged (the elements are removed
and re-added in the same order), so it is effectively a no-op. `OBO`, however,
reverses the moved elements in place. For example, with `mylist` holding
`a, b, c`, running `LMOVEM mylist mylist LEFT LEFT EXACTLY 2 OBO` pops `a` then
`b` and pushes each back to the head, leaving `mylist` as `b, a, c`.

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="lmovem-return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): the moved elements, in destination order.
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if `EXACTLY` was used and `source` did not hold enough elements.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): the moved elements, in destination order.
* [Null reply](../../develop/reference/protocol-spec#nulls): if `EXACTLY` was used and `source` did not hold enough elements.

{{< /multitabs >}}

## See also

[`LMOVE`]({{< relref "commands/lmove/" >}}) | [`BLMOVEM`]({{< relref "commands/blmovem/" >}}) | [`LMPOP`]({{< relref "commands/lmpop/" >}}) | [`RPOPLPUSH`]({{< relref "commands/rpoplpush/" >}})

## Related topics

- [Redis lists]({{< relref "/develop/data-types/lists" >}})

