---
acl_categories:
- '@keyspace'
- '@write'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: no-evict
  name: no-evict
  token: NO-EVICT
  type: pure-token
arity: 4
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
- fast
complexity: O(1)
description: Removes protection flags from a key.
group: generic
hidden: false
key_specs:
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
linkTitle: BLESS CLEAR
railroad_diagram: /images/railroad/bless-clear.svg
since: 8.12.0
summary: Removes protection flags from a key.
syntax_fmt: BLESS CLEAR key NO-EVICT
title: BLESS CLEAR
---
`BLESS CLEAR` removes a protection flag from a key, making it eligible again for eviction. The key must already exist.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to unprotect. The key must already exist, or the command returns an error.

</details>

<details open><summary><code>NO-EVICT</code></summary>

The protection flag to remove. `NO-EVICT` is currently the only supported flag.

</details>

## Details

### Behavior

- `BLESS CLEAR` is idempotent: it returns `1` the first time the flag is removed from a key, and `0` on later calls if the key didn't carry that flag.
- Unlike [`BLESS SET`]({{< relref "/commands/bless-set" >}}), `BLESS CLEAR` isn't blocked when the server is out of memory, so protection can always be removed to free up eviction candidates.
- `BLESS CLEAR` generates an `unbless` [keyspace notification]({{< relref "/develop/pubsub/keyspace-notifications" >}}) event.
- Clearing the flag persists across restarts and replicates like any other write.

## Examples

{{% redis-cli %}}
redis> BLESS SET session:42 NO-EVICT
(integer) 1
redis> BLESS CLEAR session:42 NO-EVICT
(integer) 1
redis> BLESS CLEAR session:42 NO-EVICT
(integer) 0
redis> BLESS CLEAR missing-key NO-EVICT
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
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` if the flag was removed, `0` if the key didn't have it.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

-tab-sep-

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` if the flag was removed, `0` if the key didn't have it.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

{{< /multitabs >}}

## See also

[`BLESS SET`]({{< relref "/commands/bless-set" >}}) | [`BLESS GET`]({{< relref "/commands/bless-get" >}}) | [`BLESS SCAN`]({{< relref "/commands/bless-scan" >}})

## Related topics

- [Key eviction]({{< relref "/develop/reference/eviction" >}})
