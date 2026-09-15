---
acl_categories:
- '@keyspace'
- '@slow'
arguments:
- display_text: cursor
  name: cursor
  type: integer
- display_text: no-evict
  name: no-evict
  token: NO-EVICT
  type: pure-token
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
complexity: O(1) for every call. O(N) for a complete iteration, where N is the number
  of blessed keys.
description: Incrementally iterates the blessed keys of the current database that
  carry the given flag.
group: generic
hidden: false
hints:
- nondeterministic_output
- request_policy:special
- response_policy:special
linkTitle: BLESS SCAN
railroad_diagram: /images/railroad/bless-scan.svg
since: 8.12.0
summary: Incrementally iterates the blessed keys of the current database that carry
  the given flag.
syntax_fmt: "BLESS SCAN cursor NO-EVICT [COUNT\_count]"
title: BLESS SCAN
---
`BLESS SCAN` incrementally iterates the blessed keys of the current database that carry the given protection flag, using the same cursor-based protocol as [`SCAN`]({{< relref "/commands/scan" >}}).

## Required arguments

<details open><summary><code>cursor</code></summary>

The cursor value. Start an iteration with `0`, then use the cursor returned by each call as the argument to the next call.

</details>

<details open><summary><code>NO-EVICT</code></summary>

The protection flag to filter by. `NO-EVICT` is currently the only supported flag, and this argument is required.

</details>

## Optional arguments

<details open><summary><code>COUNT count</code></summary>

A hint for the number of keys to visit per iteration. The default is 1024.

</details>

## Details

`BLESS SCAN` follows the same cursor semantics and iteration guarantees as [`SCAN`]({{< relref "/commands/scan" >}}): a full iteration, from cursor `0` until the returned cursor is `0` again, is guaranteed to return every key that carried the given flag for the entire duration of the iteration. `COUNT` is only a hint, and a key may be returned more than once during a full iteration.

## Examples

{{% redis-cli %}}
redis> SET session:42 "some value"
OK
redis> SET cache:100 "some value"
OK
redis> BLESS SET session:42 NO-EVICT
(integer) 1
redis> BLESS SET cache:100 NO-EVICT
(integer) 1
redis> BLESS SCAN 0 NO-EVICT
1) "0"
2) 1) "cache:100"
   2) "session:42"
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): specifically, an array with two elements.
* The first element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) that represents an unsigned 64-bit number, the cursor.
* The second element is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the names of the scanned keys.

-tab-sep-

[Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): specifically, an array with two elements.
* The first element is a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) that represents an unsigned 64-bit number, the cursor.
* The second element is an [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the names of the scanned keys.

{{< /multitabs >}}

## See also

[`BLESS SET`]({{< relref "/commands/bless-set" >}}) | [`BLESS CLEAR`]({{< relref "/commands/bless-clear" >}}) | [`BLESS GET`]({{< relref "/commands/bless-get" >}})

## Related topics

- [Key eviction]({{< relref "/develop/reference/eviction" >}})
