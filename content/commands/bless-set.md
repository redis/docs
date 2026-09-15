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
- denyoom
- fast
complexity: O(1)
description: Adds protection flags to a key against memory pressure.
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
linkTitle: BLESS SET
railroad_diagram: /images/railroad/bless-set.svg
since: 8.12.0
summary: Adds protection flags to a key against memory pressure.
syntax_fmt: BLESS SET key NO-EVICT
title: BLESS SET
---
`BLESS SET` marks a key so that Redis skips it when choosing candidates for eviction under memory pressure. The key must already exist.

## Required arguments

<details open><summary><code>key</code></summary>

The name of the key to protect. The key must already exist, or the command returns an error.

</details>

<details open><summary><code>NO-EVICT</code></summary>

The protection flag to add. `NO-EVICT` is currently the only supported flag.

</details>

## Details

### Behavior

- `BLESS SET` is idempotent: it returns `1` the first time the flag is added to a key, and `0` on later calls if the key already carries that flag.
- A blessed key is skipped as an eviction candidate under every `maxmemory-policy` value. See [Protecting keys from eviction]({{< relref "/develop/reference/eviction#bless" >}}) for how this interacts with the `maxmemory` limit.
- `BLESS SET` generates a `bless` [keyspace notification]({{< relref "/develop/pubsub/keyspace-notifications" >}}) event.
- `BLESS SET` can itself be blocked with an out-of-memory error under the same conditions as any other write command. [`BLESS CLEAR`]({{< relref "/commands/bless-clear" >}}) isn't subject to this, so you can always remove protection to free up eviction candidates.
- The flag isn't included in [`DUMP`]({{< relref "/commands/dump" >}}) output, and [`RESTORE`]({{< relref "/commands/restore" >}}) doesn't set it on the restored key. If `RESTORE` targets a key that's already blessed and uses `REPLACE`, the destination key keeps its existing protection.
- The flag persists across restarts and replicates like any other write.

## Examples

{{% redis-cli %}}
redis> SET session:42 "some value"
OK
redis> BLESS SET session:42 NO-EVICT
(integer) 1
redis> BLESS SET session:42 NO-EVICT
(integer) 0
redis> BLESS SET missing-key NO-EVICT
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
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` if the flag was added, `0` if the key already had it.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

-tab-sep-

One of the following:
* [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): `1` if the flag was added, `0` if the key already had it.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key doesn't exist.

{{< /multitabs >}}

## See also

[`BLESS CLEAR`]({{< relref "/commands/bless-clear" >}}) | [`BLESS GET`]({{< relref "/commands/bless-get" >}}) | [`BLESS SCAN`]({{< relref "/commands/bless-scan" >}})

## Related topics

- [Key eviction]({{< relref "/develop/reference/eviction" >}})
