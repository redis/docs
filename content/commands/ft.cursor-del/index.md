---
acl_categories:
- '@search'
- '@read'
- '@fast'
arguments:
- name: index
  type: string
- name: cursor_id
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
complexity: O(1)
description: Deletes a cursor
group: search
hidden: false
linkTitle: FT.CURSOR DEL
module: Search
since: 1.1.0
stack_path: docs/interact/search-and-query
summary: Deletes a cursor
syntax: 'FT.CURSOR DEL index cursor_id

  '
syntax_fmt: FT.CURSOR DEL index cursor_id
syntax_str: cursor_id
title: FT.CURSOR DEL
---

Delete a cursor

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name.
</details>

<details open>
<summary><code>cursor_id</code></summary>

is id of the cursor.
</details>

## Returns

FT.CURSOR DEL returns a simple string reply `OK` if executed correctly, or an error reply otherwise.

## Examples

<details open>
<summary><b>Delete a cursor</b></summary>

{{< highlight bash >}}
redis> FT.CURSOR DEL idx 342459320
OK
{{< / highlight >}}

Check that the cursor is deleted.

{{< highlight bash >}}
127.0.0.1:6379> FT.CURSOR DEL idx 342459320
(error) Cursor does not exist
{{< / highlight >}}
</details>

## See also

[`FT.CURSOR READ`]({{< baseurl >}}/commands/ft.cursor-read/) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})