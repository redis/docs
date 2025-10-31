---
acl_categories:
- '@search'
arguments:
- name: index
  type: string
- name: synonym_group_id
  type: string
- name: skipinitialscan
  optional: true
  token: SKIPINITIALSCAN
  type: pure-token
- multiple: true
  name: term
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
command_flags:
- readonly
complexity: O(1)
description: Creates or updates a synonym group with additional terms
group: search
hidden: false
linkTitle: FT.SYNUPDATE
module: Search
since: 1.2.0
stack_path: docs/interact/search-and-query
summary: Creates or updates a synonym group with additional terms
syntax: "FT.SYNUPDATE index synonym_group_id \n  [SKIPINITIALSCAN] term [term ...]\n"
syntax_fmt: "FT.SYNUPDATE index synonym_group_id [SKIPINITIALSCAN] term [term\n  ...]"
syntax_str: synonym_group_id [SKIPINITIALSCAN] term [term ...]
title: FT.SYNUPDATE
---

Update a synonym group

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name.
</details>

<details open>
<summary><code>synonym_group_id</code></summary>

is synonym group to return.
</details>

Use FT.SYNUPDATE to create or update a synonym group with additional terms. The command triggers a scan of all documents.

## Optional parameters

<details open>
<summary><code>SKIPINITIALSCAN</code></summary>

does not scan and index, and only documents that are indexed after the update are affected.
</details>

## Examples

<details open>
<summary><b>Update a synonym group</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.SYNUPDATE idx synonym hello hi shalom
OK
{{< / highlight >}}

{{< highlight bash >}}
127.0.0.1:6379> FT.SYNUPDATE idx synonym SKIPINITIALSCAN hello hi shalom
OK
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Flexible & Annual"><span title="Supported">&#x2705; Supported</span></span><br /><span title="Free & Fixed"><span title="Supported">&#x2705; Supported</nobr></span></span> |  |


## Return information

{{< multitabs id="ft-synupdate-return-info" 
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

[`FT.SYNDUMP`]({{< relref "commands/ft.syndump/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})