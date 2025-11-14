---
acl_categories:
- '@bloom'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: iterator
  type: integer
- name: data
  type: string
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(n), where n is the capacity
description: Restores a filter previously saved using SCANDUMP
group: bf
hidden: false
linkTitle: BF.LOADCHUNK
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Restores a filter previously saved using SCANDUMP
syntax_fmt: BF.LOADCHUNK key iterator data
syntax_str: iterator data
title: BF.LOADCHUNK
---
Restores a Bloom filter previously saved using [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}).

See the [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}) command for example usage.

<note><b>Notes</b>

- This command overwrites the Bloom filter stored under `key`. 
- Make sure that the Bloom filter is not changed between invocations.

</note>

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter to restore.
</details>

<details open><summary><code>iterator</code></summary>

Iterator value associated with `data` (returned by [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}))
</details>

<details open><summary><code>data</code></summary>

Current data chunk (returned by [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}))
</details>

## Examples

See [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}) for an example.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

{{< multitabs id="bf-loadchunk-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when invalid data was passed.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, wrong key type, or when invalid data was passed.

{{< /multitabs >}}