---
acl_categories:
- '@dangerous'
- '@read'
- '@search'
- '@slow'
arguments:
- name: index
  type: string
- name: field_name
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
complexity: O(N)
description: Returns the distinct tags indexed in a Tag field
doc_flags:
- deprecated
group: search
hidden: false
linkTitle: FT.TAGVALS
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Returns the distinct tags indexed in a Tag field
syntax: 'FT.TAGVALS index field_name

  '
syntax_fmt: FT.TAGVALS index field_name
syntax_str: field_name
title: FT.TAGVALS
---

Return a distinct set of values indexed in a Tag field

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is full-text index name. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

<details open>
<summary><code>field_name</code></summary>

is name of a Tag file defined in the schema.
</details>

Use FT.TAGVALS if your tag indexes things like cities, categories, and so on.

## Limitations

FT.TAGVALS provides no paging or sorting, and the tags are not alphabetically sorted. FT.TAGVALS only operates on [tag fields]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}}).
The returned strings are lowercase with whitespaces removed, but otherwise unchanged.

## Return

FT.TAGVALS returns an array reply of all distinct tags in the tag index.

## Examples

<details open>
<summary><b>Return a set of values indexed in a Tag field</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.TAGVALS idx myTag
1) "Hello"
2) "World"
{{< / highlight >}}
</details>

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) 

## Related topics

- [Tag fields]({{< relref "/develop/interact/search-and-query/advanced-concepts/tags" >}})
- [RediSearch]({{< relref "/develop/interact/search-and-query/" >}})
