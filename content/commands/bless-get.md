---
acl_categories:
- '@keyspace'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 3
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
- fast
complexity: O(1).
description: Returns the active protection flags of a key.
group: generic
hidden: false
key_specs:
- RO: true
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
linkTitle: BLESS GET
railroad_diagram: /images/railroad/bless-get.svg
since: 8.12.0
summary: Returns the active protection flags of a key.
syntax_fmt: BLESS GET key
title: BLESS GET
---
`BLESS GET` returns the eviction-protection flags currently set on a key. The key must already exist.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to inspect. The key must already exist, or the command returns an error.

</details>

## Details

`BLESS GET` returns an empty array if the key exists but has no protection flags. `NO-EVICT` is currently the only flag `BLESS` defines.

## Examples

{{% redis-cli %}}
redis> SET session:42 "some value"
OK
redis> BLESS GET session:42
(empty array)
redis> BLESS SET session:42 NO-EVICT
(integer) 1
redis> BLESS GET session:42
1) "NO-EVICT"
redis> BLESS GET missing-key
(error) ERR no such key
{{% /redis-cli %}}

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of the key's active protection flags, empty if none are set.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of the key's active protection flags, empty if none are set.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

{{< /multitabs >}}

## See also

[`BLESS SET`]({{< relref "/commands/bless-set" >}}) | [`BLESS CLEAR`]({{< relref "/commands/bless-clear" >}}) | [`BLESS SCAN`]({{< relref "/commands/bless-scan" >}})

## Related topics

- [Key eviction]({{< relref "/develop/reference/eviction" >}})
