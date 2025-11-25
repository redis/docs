---
acl_categories:
- '@search'
arguments:
- name: index
  type: string
- name: skipinitialscan
  optional: true
  token: SKIPINITIALSCAN
  type: pure-token
- name: schema
  token: SCHEMA
  type: pure-token
- name: add
  token: ADD
  type: pure-token
- name: field
  type: string
- name: options
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
complexity: O(N) where N is the number of keys in the keyspace
description: Adds a new field to the index
group: search
hidden: false
linkTitle: FT.ALTER
module: Search
railroad_diagram: /images/railroad/ft.alter.svg
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Adds a new field to the index
syntax: 'FT.ALTER {index} [SKIPINITIALSCAN] SCHEMA ADD {attribute} {options} ...

  '
syntax_fmt: FT.ALTER index [SKIPINITIALSCAN] SCHEMA ADD field options
syntax_str: '[SKIPINITIALSCAN] SCHEMA ADD field options'
title: FT.ALTER
---

Add a new attribute to the index. Adding an attribute to the index causes any future document updates to use the new attribute when indexing and reindexing existing documents.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary> 

is index name to create. 
</details>

<details open>
<summary><code>SKIPINITIALSCAN</code></summary> 

if set, does not scan and index.
</details>

<details open>
<summary><code>SCHEMA ADD {attribute} {options} ...</code></summary>

after the SCHEMA keyword, declares which fields to add:

- `attribute` is attribute to add.
- `options` are attribute options. Refer to [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) for more information.

<note><b>Note:</b>

Depending on how the index was created, you may be limited by the number of additional text
attributes which can be added to an existing index. If the current index contains fewer than 32
text attributes, then `SCHEMA ADD` will only be able to add attributes up to 32 total attributes (meaning that the
index will only ever be able to contain 32 total text attributes). If you wish for the index to
contain more than 32 attributes, create it with the `MAXTEXTFIELDS` option.
</note>
</details>

## Examples

<details open>
<summary><b>Alter an index</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.ALTER idx SCHEMA ADD id2 NUMERIC SORTABLE
OK
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-alter-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, invalid schema syntax.

-tab-sep-

One of the following:
* [Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}): `OK` if executed correctly.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, invalid schema syntax.

{{< /multitabs >}}

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) 

## Related topics

- [RediSearch]({{< relref "/develop/ai/search-and-query/" >}})



