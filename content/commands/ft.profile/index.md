---
arguments:
- name: index
  type: string
- arguments:
  - name: search
    token: SEARCH
    type: pure-token
  - name: aggregate
    token: AGGREGATE
    type: pure-token
  name: querytype
  type: oneof
- name: limited
  optional: true
  token: LIMITED
  type: pure-token
- name: queryword
  token: QUERY
  type: pure-token
- name: query
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
description: Performs a `FT.SEARCH` or `FT.AGGREGATE` command and collects performance
  information
group: search
hidden: false
linkTitle: FT.PROFILE
module: Search
since: 2.2.0
stack_path: docs/interact/search-and-query
summary: Performs a `FT.SEARCH` or `FT.AGGREGATE` command and collects performance
  information
syntax: 'FT.PROFILE index SEARCH | AGGREGATE [LIMITED] QUERY query

  '
syntax_fmt: FT.PROFILE index <SEARCH | AGGREGATE> [LIMITED] QUERY query
syntax_str: <SEARCH | AGGREGATE> [LIMITED] QUERY query
title: FT.PROFILE
---

Apply [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) or [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/) command to collect performance details.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name, created using [`FT.CREATE`]({{< baseurl >}}/commands/ft.create/).
</details>

<details open>
<summary><code>SEARCH | AGGREGATE</code></summary>

is difference between [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) and [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/).
</details>

<details open>
<summary><code>LIMITED</code></summary>

removes details of `reader` iterator.
</details>

<details open>
<summary><code>QUERY {query}</code></summary>

is query string, sent to [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/).
</details>

<note><b>Note:</b> To reduce the size of the output, use `NOCONTENT` or `LIMIT 0 0` to reduce the reply results or `LIMITED` to not reply with details of `reader iterators` inside built-in unions such as `fuzzy` or `prefix`.</note>

## Return

`FT.PROFILE` returns an array reply, with the first array reply identical to the reply of [`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) and [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/) and a second array reply with information of time in milliseconds (ms) used to create the query and time and count of calls of iterators and result-processors.

Return value has an array with two elements:

- Results - The normal reply from RediSearch, similar to a cursor.
- Profile - The details in the profile are:
  - Total profile time - The total runtime of the query, in ms.
  - Parsing time - Parsing time of the query and parameters into an execution plan, in ms.
  - Pipeline creation time - Creation time of execution plan including iterators,
  result processors, and reducers creation, in ms.
  - Iterators profile - Index iterators information including their type, term, count, and time data.
  Inverted-index iterators have in addition the number of elements they contain. Hybrid vector iterators returning the top results from the vector index in batches, include the number of batches.
  - Result processors profile - Result processors chain with type, count, and time data.

## Examples

<details open>
<summary><b>Collect performance information about an index</b></summary>

Imagine you have a dataset consisting of 1M JSON documents, each with the following structure.

```json
{
  "fid": "5x2i3a4s2l",
  "key_name": "25450229-6221-445c-b3ec-0b69c5c423db",
  "quote": "What a piece of work is man! how noble in reason! how infinite in faculty! in form and moving how express and admirable! in action how like an angel! in apprehension how like a god! the beauty of the world, the paragon of animals! .",
  "color": "blue",
  "num": 141
}
```

You've created an index similar to the following.

```bash
FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.num AS num NUMERIC SORTABLE $.color AS color TAG SORTABLE UNF $.quote AS quote TEXT NOSTEM SORTABLE
```

Next, you run the `FT.PROFILE` command with a search you intend to run on the index.

{{< highlight bash >}}
127.0.0.1:6379> FT.PROFILE idx SEARCH QUERY '((@num:[100 100] -@color:{blue} @quote:question) | @num:[200 600])' RETURN 1 $.fid
1) "106898"                                    search results
2) "key:0cad5563-151f-4f9c-8bcc-398f82913e14"
3) 1) "$.fid"
   2) "8v0x3m7n2z"
4) "key:2316d075-27b7-4c7c-9f2f-f1fe09d53d4e"
5) 1) "$.fid"
   2) "8j6q8t3b5g"
...
21) 1) "$.fid"
   2) "0y5q3d1y1m"


22) 1) "Shard #1"                              profile information
   2) 1) "Total profile time"
      2) "500"
   3) 1) "Parsing time"
      2) "0"
   4) 1) "Pipeline creation time"
      2) "0"
   5) 1) "Warning"
      2) "Timeout limit was reached"
   6) 1) "Iterators profile"
      2) 1) "Type"
         2) "UNION"
         3) "Query type"
         4) "UNION"
         5) "Time"
         6) "256"
         7) "Counter"
         8) "53099"
         9) "Child iterators"
         10) 1) "Type"
            2) "INTERSECT"
            3) "Time"
            4) "7"
            5) "Counter"
            6) "149"
            7) "Child iterators"
            8) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "75 - 112"
               5) "Time"
               6) "0"
               7) "Counter"
               8) "149"
               9) "Size"
               10) "6383"
            9) 1) "Type"
               2) "NOT"
               3) "Time"
               4) "6"
               5) "Counter"
               6) "149"
               7) "Child iterator"
               8) 1) "Type"
                  2) "INTERSECT"
                  3) "Time"
                  4) "6"
                  5) "Counter"
                  6) "130"
                  7) "Child iterators"
                  8) 1) "Type"
                     2) "TAG"
                     3) "Term"
                     4) "blue"
                     5) "Time"
                     6) "1"
                     7) "Counter"
                     8) "1638"
                     9) "Size"
                     10) "16123"
                  9) 1) "Type"
                     2) "TEXT"
                     3) "Term"
                     4) "question"
                     5) "Time"
                     6) "1"
                     7) "Counter"
                     8) "1595"
                     9) "Size"
                     10) "27773"
         11) 1) "Type"
            2) "UNION"
            3) "Query type"
            4) "NUMERIC"
            5) "Time"
            6) "154"
            7) "Counter"
            8) "52951"
            9) "Child iterators"
            10) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "189 - 227"
               5) "Time"
               6) "3"
               7) "Counter"
               8) "3779"
               9) "Size"
               10) "6637"
            11) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "228 - 265"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4947"
               9) "Size"
               10) "6288"
            12) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "266 - 304"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "5122"
               9) "Size"
               10) "6409"
            13) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "305 - 341"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4959"
               9) "Size"
               10) "6199"
            14) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "342 - 378"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4786"
               9) "Size"
               10) "6088"
            15) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "379 - 415"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4789"
               9) "Size"
               10) "6064"
            16) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "416 - 453"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4955"
               9) "Size"
               10) "6227"
            17) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "454 - 488"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4778"
               9) "Size"
               10) "6031"
            18) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "489 - 524"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4765"
               9) "Size"
               10) "6011"
            19) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "525 - 559"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4631"
               9) "Size"
               10) "5790"
            20) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "560 - 595"
               5) "Time"
               6) "4"
               7) "Counter"
               8) "4821"
               9) "Size"
               10) "6083"
            21) 1) "Type"
               2) "NUMERIC"
               3) "Term"
               4) "596 - 625"
               5) "Time"
               6) "0"
               7) "Counter"
               8) "630"
               9) "Size"
               10) "5002"
   7) 1) "Result processors profile"
      2) 1) "Type"
         2) "Index"
         3) "Time"
         4) "356"
         5) "Counter"
         6) "53099"
      3) 1) "Type"
         2) "Scorer"
         3) "Time"
         4) "96"
         5) "Counter"
         6) "53099"
      4) 1) "Type"
         2) "Sorter"
         3) "Time"
         4) "48"
         5) "Counter"
         6) "10"
      5) 1) "Type"
         2) "Loader"
         3) "Time"
         4) "0"
         5) "Counter"
         6) "10"
{{< / highlight >}}
</details>

## See also

[`FT.SEARCH`]({{< baseurl >}}/commands/ft.search/) | [`FT.AGGREGATE`]({{< baseurl >}}/commands/ft.aggregate/) 

## Related topics

[RediSearch]({{< relref "/develop/interact/search-and-query/" >}})

