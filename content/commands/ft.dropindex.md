---
acl_categories:
- '@dangerous'
- '@search'
- '@slow'
- '@write'
arguments:
- name: index
  type: string
- arguments:
  - name: delete docs
    token: DD
    type: pure-token
  name: delete docs
  optional: true
  type: oneof
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
complexity: O(1) or O(N) if documents are deleted, where N is the number of keys in
  the keyspace
description: Deletes the index
group: search
hidden: false
linkTitle: FT.DROPINDEX
module: Search
since: 2.0.0
stack_path: docs/interact/search-and-query
summary: Deletes the index
syntax: "FT.DROPINDEX index \n  [DD]\n"
syntax_fmt: FT.DROPINDEX index [DD]
syntax_str: '[DD]'
title: FT.DROPINDEX
---

Delete an index

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is full-text index name. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

## Optional arguments

<details open>
<summary><code>DD</code></summary>

drop index operation that, if set, deletes the actual document keys. `FT.DROPINDEX index DD` is an asynchronous operation.

By default, FT.DROPINDEX does not delete the documents associated with the index. Adding the `DD` option deletes the documents as well. 
If an index creation is still running ([`FT.CREATE`]({{< relref "commands/ft.create/" >}}) is running asynchronously), only the document hashes that have already been indexed are deleted. 
The document hashes left to be indexed remain in the database.
To check the completion of the indexing, use [`FT.INFO`]({{< relref "commands/ft.info/" >}}).

</details>

## Examples

<details open>
<summary><b>Delete an index</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.DROPINDEX idx DD
OK
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis Enterprise<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-dropindex-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

{{< /multitabs >}}

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) | [`FT.INFO`]({{< relref "commands/ft.info/" >}})

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})
