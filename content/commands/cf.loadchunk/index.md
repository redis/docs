---
acl_categories:
- '@cuckoo'
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
- oss
- kubernetes
- clients
complexity: O(n), where n is the capacity
description: Restores a filter previously saved using SCANDUMP
group: cf
hidden: false
linkTitle: CF.LOADCHUNK
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Restores a filter previously saved using SCANDUMP
syntax_fmt: CF.LOADCHUNK key iterator data
syntax_str: iterator data
title: CF.LOADCHUNK
---
Restores a cuckoo filter previously saved using [`CF.SCANDUMP`]({{< relref "commands/cf.scandump/" >}}).

See the [`CF.SCANDUMP`]({{< relref "commands/cf.scandump/" >}}) command for example usage.

<note><b>Notes</b>

- This command overwrites the cuckoo filter stored under `key`.
- Make sure that the cuckoo filter is not changed between invocations.

</note>

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter to restore.
</details>

<details open><summary><code>iterator</code></summary>

Iterator value associated with `data` (returned by [`CF.SCANDUMP`]({{< relref "commands/cf.scandump/" >}}))
</details>

<details open><summary><code>data</code></summary>

Current data chunk (returned by [`CF.SCANDUMP`]({{< relref "commands/cf.scandump/" >}}))
</details>

## Return value

Returns one of these replies:

- [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - `OK` if executed correctly
- [] on error (invalid arguments, wrong key type, wrong data, etc.)

## Examples

See [`CF.SCANDUMP`]({{< relref "commands/cf.scandump/" >}}) for an example.
