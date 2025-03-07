---
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
- oss
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

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, wrong key type, wrong data, etc.)

## Examples

See [`BF.SCANDUMP`]({{< relref "commands/bf.scandump/" >}}) for an example.
