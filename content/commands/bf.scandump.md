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
description: Begins an incremental save of the bloom filter
group: bf
hidden: false
linkTitle: BF.SCANDUMP
module: Bloom
railroad_diagram: /images/railroad/bf.scandump.svg
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Begins an incremental save of the bloom filter
syntax_fmt: BF.SCANDUMP key iterator
title: BF.SCANDUMP
---
Begins an incremental save of the Bloom filter.

This command is useful for large Bloom filters that cannot fit into the [`DUMP`]({{< relref "/commands/dump" >}}) and [`RESTORE`]({{< relref "/commands/restore" >}}) model.

The first time this command is called, the value of `iter` should be 0. 

This command returns successive `(iter, data)` pairs until `(0, NULL)` to indicate completion.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a Bloom filter to save.
</details>

<details open><summary><code>iterator</code></summary>

Iterator value; either 0 or the iterator from a previous invocation of this command
</details>

## Examples

{{< highlight bash >}}
redis> BF.RESERVE bf 0.1 10
OK
redis> BF.ADD bf item1
1) (integer) 1
redis> BF.SCANDUMP bf 0
1) (integer) 1
2) "\x01\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x05\x00\x00\x00\x02\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00@\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x9a\x99\x99\x99\x99\x99\xa9?J\xf7\xd4\x9e\xde\xf0\x18@\x05\x00\x00\x00\n\x00\x00\x00\x00\x00\x00\x00\x00"
redis> BF.SCANDUMP bf 1
1) (integer) 9
2) "\x01\b\x00\x80\x00\x04 \x00"
redis> BF.SCANDUMP bf 9
1) (integer) 0
2) ""
redis> DEL bf
(integer) 1
redis> BF.LOADCHUNK bf 1 "\x01\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x05\x00\x00\x00\x02\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00@\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x9a\x99\x99\x99\x99\x99\xa9?J\xf7\xd4\x9e\xde\xf0\x18@\x05\x00\x00\x00\n\x00\x00\x00\x00\x00\x00\x00\x00"
OK
redis> BF.LOADCHUNK bf 9 "\x01\b\x00\x80\x00\x04 \x00"
OK
redis> BF.EXISTS bf item1
(integer) 1
{{< / highlight >}}

Python code:
{{< highlight bash >}}
chunks = []
iter = 0
while True:
    iter, data = BF.SCANDUMP(key, iter)
    if iter == 0:
        break
    else:
        chunks.append([iter, data])

# Load it back
for chunk in chunks:
    iter, data = chunk
    BF.LOADCHUNK(key, iter, data)
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

## Return information

{{< multitabs id="bf-scandump-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array of an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) (_Iterator_) and a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) (_Data_).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, the key was not found, or the key is of the wrong type.

The Iterator is passed as input to the next invocation of `BF.SCANDUMP`. If _Iterator_ is 0, then it means iteration has completed.

The iterator-data pair should also be passed to [`BF.LOADCHUNK`]({{< relref "commands/bf.loadchunk/" >}}) when restoring the filter.

-tab-sep-

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}): a two-element array of an [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}) (_Iterator_) and a [Bulk string reply]({{< relref "/develop/reference/protocol-spec#bulk-strings" >}}) (_Data_).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: invalid arguments, the key was not found, or the key is of the wrong type.

The Iterator is passed as input to the next invocation of `BF.SCANDUMP`. If _Iterator_ is 0, then it means iteration has completed.

The iterator-data pair should also be passed to [`BF.LOADCHUNK`]({{< relref "commands/bf.loadchunk/" >}}) when restoring the filter.

{{< /multitabs >}}