---
acl_categories:
- '@write'
- '@sortedset'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
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
  since: 3.0.2
  type: oneof
- arguments:
  - display_text: gt
    name: gt
    token: GT
    type: pure-token
  - display_text: lt
    name: lt
    token: LT
    type: pure-token
  name: comparison
  optional: true
  since: 6.2.0
  type: oneof
- display_text: change
  name: change
  optional: true
  since: 3.0.2
  token: CH
  type: pure-token
- display_text: increment
  name: increment
  optional: true
  since: 3.0.2
  token: INCR
  type: pure-token
- arguments:
  - display_text: score
    name: score
    type: double
  - display_text: member
    name: member
    type: string
  multiple: true
  name: data
  type: block
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
- fast
complexity: O(log(N)) for each item added, where N is the number of elements in the
  sorted set.
description: Adds one or more members to a sorted set, or updates their scores. Creates
  the key if it doesn't exist.
group: sorted-set
hidden: false
history:
- - 2.4.0
  - Accepts multiple elements.
- - 3.0.2
  - Added the `XX`, `NX`, `CH` and `INCR` options.
- - 6.2.0
  - Added the `GT` and `LT` options.
key_specs:
- RW: true
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
  update: true
linkTitle: ZADD
railroad_diagram: /images/railroad/zadd.svg
since: 1.2.0
summary: Adds one or more members to a sorted set, or updates their scores. Creates
  the key if it doesn't exist.
syntax_fmt: "ZADD key [NX | XX] [GT | LT] [CH] [INCR] score member [score member\n\
  \  ...]"
title: ZADD
---
Adds all the specified members with the specified scores to the sorted set
stored at `key`.
It is possible to specify multiple score / member pairs.
If a specified member is already a member of the sorted set, the score is
updated and the element reinserted at the right position to ensure the correct
ordering.

If `key` does not exist, a new sorted set with the specified members as sole
members is created, like if the sorted set was empty. If the key exists but does not hold a sorted set, an error is returned.

The score values should be the string representation of a double precision floating point number. `+inf` and `-inf` values are valid values as well.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key that holds the sorted set.

</details>

<details open><summary><code>score member [score member ...]</code></summary>

One or more score-member pairs to add or update. `score` is a double-precision floating-point number.

</details>

## Optional arguments

`NX` and `XX` are mutually exclusive, as are `GT` and `LT`.

<details open><summary><code>NX</code></summary>

Only add new members; do not update existing members.

</details>

<details open><summary><code>XX</code></summary>

Only update existing members; do not add new members.

</details>

<details open><summary><code>GT</code></summary>

Only update an existing member if the new score is greater than the current score. Does not prevent adding new members.

</details>

<details open><summary><code>LT</code></summary>

Only update an existing member if the new score is less than the current score. Does not prevent adding new members.

</details>

<details open><summary><code>CH</code></summary>

Change the return value from the number of added members to the number of changed members (added plus updated).

</details>

<details open><summary><code>INCR</code></summary>

Increment the member's score by `score` instead of setting it, behaving like `ZINCRBY`. Only one score-member pair may be given.

</details>

## Examples

{{< clients-example set="cmds_sorted_set" step="zadd" description="Foundational: Add one or more members to a sorted set with scores using ZADD (creates sorted set if needed, updates scores if member exists)" difficulty="beginner" >}}
> ZADD myzset 1 "one"
(integer) 1
> ZADD myzset 1 "uno"
(integer) 1
> ZADD myzset 2 "two" 3 "three"
(integer) 2
> ZRANGE myzset 0 -1 WITHSCORES
1) "one"
2) "1"
3) "uno"
4) "1"
5) "two"
6) "2"
7) "three"
8) "3"
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
ZADD myzset 1 "one"
ZADD myzset 1 "uno"
ZADD myzset 2 "two" 3 "three"
ZRANGE myzset 0 -1 WITHSCORES
{{% /redis-cli %}}

## Details

### Range of integer scores that can be expressed precisely

Redis sorted sets use a double 64-bit floating-point number to represent the score. This format precisely represents integers between `-(2^53)` and `+(2^53)`, inclusive. In practical terms, you can store integers from -9007199254740992 to 9007199254740992 without losing precision. Redis represents larger integers and fractions in exponential form internally, so you may get only an approximation of the score you set.

### Sorted sets 101

Sorted sets are sorted by their score in an ascending way.
The same element only exists a single time, no repeated elements are
permitted. The score can be modified both by `ZADD` that will update the
element score, and as a side effect, its position on the sorted set, and
by [`ZINCRBY`]({{< relref "/commands/zincrby" >}}) that can be used in order to update the score relatively to its
previous value.

The current score of an element can be retrieved using the [`ZSCORE`]({{< relref "/commands/zscore" >}}) command,
that can also be used to verify if an element already exists or not.

For an introduction to sorted sets, see the data types page on [sorted
sets][tdtss].

[tdtss]: /develop/data-types#sorted-sets

### Elements with the same score

While the same element can't be repeated in a sorted set since every element
is unique, it is possible to add multiple different elements *having the same score*. When multiple elements have the same score, they are *ordered lexicographically* (they are still ordered by score as a first key, however, locally, all the elements with the same score are relatively ordered lexicographically).

The lexicographic ordering used is binary, it compares strings as array of bytes.

If the user inserts all the elements in a sorted set with the same score (for example 0), all the elements of the sorted set are sorted lexicographically, and range queries on elements are possible using the command [`ZRANGEBYLEX`]({{< relref "/commands/zrangebylex" >}}) (Note: it is also possible to query sorted sets by range of scores using [`ZRANGEBYSCORE`]({{< relref "/commands/zrangebyscore" >}})).


## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="zadd-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

Any of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the operation was aborted because of a conflict with one of the _XX/NX/LT/GT_ options.
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of new members when the _CH_ option is not used.
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of new or updated members when the _CH_ option is used.
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): the updated score of the member when the _INCR_ option is used.

-tab-sep-

Any of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): if the operation was aborted because of a conflict with one of the _XX/NX/LT/GT_ options.
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of new members when the _CH_ option is not used.
* [Integer reply](../../develop/reference/protocol-spec#integers): the number of new or updated members when the _CH_ option is used.
* [Double reply](../../develop/reference/protocol-spec#doubles): the updated score of the member when the _INCR_ option is used.

{{< /multitabs >}}
