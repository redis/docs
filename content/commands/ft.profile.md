---
acl_categories:
- '@read'
- '@search'
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

Apply [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) or [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}) command to collect performance details. For usage, see [Examples](#examples).

## Required arguments

<details open>
<summary><code>index</code></summary>

is the name of an index created using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

<details open>
<summary><code>SEARCH | AGGREGATE</code></summary>

represents the profile type, either [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) or [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}).
</details>

<details open>
<summary><code>LIMITED</code></summary>

removes details of any `reader` iterators.
</details>

<details open>
<summary><code>QUERY {query}</code></summary>

is the query string, sent to `FT.SEARCH` or `FT.AGGREGATE`.
</details>

<note><b>Note:</b> To reduce the size of the output, use `NOCONTENT` or `LIMIT 0 0` to reduce the number of reply results, or `LIMITED` to not reply with details of `reader iterators` inside built-in unions, such as `fuzzy` or `prefix` iterators.</note>

## Return

`FT.PROFILE` returns a two-element array reply. The first element contains the results of the provided `FT.SEARCH` or `FT.AGGREGATE` command.
The second element contains information about query creation, iterator profiles, and result processor profiles.
Details of the second element follow in the sections below.

### Per-shard profiles

This section contains query execution details for each shard.
When more than one shard is in play, the shards will be labeled `Shard #1`, `Shard #2`, etc.
If there's only one shard, the label will be omitted.

| Returned field name      | Definition |
|:--                       |:--         |
| `Total`&nbsp;`profile`&nbsp;`time`     | The total run time (ms) of the query. Normally just a few ms. |
| `Parsing`&nbsp;`time`           | The time (ms) spent parsing the query and its parameters into a query plan. Normally just a few ms. |
| `Pipeline`&nbsp;`creation`&nbsp;`time` | The creation time (ms) of the execution plan, including iterators, result processors, and reducers creation. Normally just a few ms for `FT.SEARCH` queries, but expect a larger number for `FT.AGGREGATE` queries. |
| `Warning`                | Errors that occurred during query execution. |

### Iterator profiles

This section contains index iterator information, including `Type`, `Query Type`, `Term` (when applicable), `Time` (in ms), `Counter`, `Child iterator`, and `Size` information.
Each iterator represents an executor for each part of the query plan, nested per the execution plan. The operation types mentioned below (`UNION`, etc) should match up with the provided query.

Inverted-index iterators also include the number of elements they contain. Hybrid vector iterators return the top results from the vector index in batches, including the number of batches.

Iterator types include:

* `INTERSECT` (and) with `Child iterator`
* `UNION` (or) with `Child iterator`
* `NOT` (`-`) with `Child iterator`
* `Child iterator` - details of a sub-query component of a compound query.
* `TEXT` with `Term`
* `TAG` with `Term`
* `NUMERIC` with `Term`
* `VECTOR`
* `EMPTY`
* `WILDCARD`
* `OPTIONAL`

**Notes on `Counter` and `Size`**

Counter is the number of times an iterator was interacted with. A very high value in comparison to others is a possible warning flag. `NUMERIC` and `Child interator` types are broken into ranges, and `Counter` will vary depending on the range. For `UNION`, the sum of the counters in child iterators should be equal or greater than the child iterator’s counters.

`Size` is the size of the document set. `Counter` should always be equal or less than `Size`.

### Result processor profiles

Result processors form a powerful pipeline in Redis Query Engine. They work in stages to gather, filter, score, sort, and return results as efficiently as possible based on complex query needs. Each processor reports `Time` information, which represents the total duration (in milliseconds, or ms) spent by the processor to complete its operation, and `Counter` information, which indicates the number of times the processor was invoked during the query.

| Type            | Definition |
|:--              |:--         |
| `Metrics`&nbsp;`Applier` | The `Metrics Applier` processor calculates or aggregates specific metrics related to the search results. For example, this might include applying a distance or similarity metric to vector search results, or calculating scores based on relevance or other parameters. |
| `Index`           | The `Index` processor is responsible for the core retrieval of matching documents from the index based on the initial query criteria (e.g., full-text terms, filters, or numeric ranges). | 
| `Scorer`          | The `Scorer` processor assigns a relevance score to each document based on the query’s specified scoring function. This function could involve factors like term frequency, inverse document frequency, or other weighted metrics. |
| `Sorter`          | The `Sorter` processor arranges the query results based on a specified sorting criterion. This could be a field value (e.g., sorting by price, date, or another attribute) or by the score assigned during the scoring phase. It operates after documents are fetched and scored, ensuring the results are ordered as required by the query (e.g., ascending or descending order). `Scorer` results will always be present in `FT.SEARCH` profiles. |
| `Loader`          | The `Loader` processor retrieves the document contents after the results have been sorted and filtered. It ensures that only the fields specified by the query are loaded, which improves efficiency, especially when dealing with large documents where only a few fields are needed. |
| `Highlighter`     | The `Highlighter` processor is used to highlight matching terms in the search results. This is especially useful for full-text search applications, where relevant terms are often emphasized in the UI. |
| `Paginator`       | The `Paginator` processor is responsible for handling pagination by limiting the results to a specific range (e.g., LIMIT 0 10).It trims down the set of results to fit the required pagination window, ensuring efficient memory usage when dealing with large result sets. |
| `Vector`&nbsp;`Filter`   | For vector searches, the `Vector Filter` processor is sometimes used to pre-process results based on vector similarity thresholds before the main scoring and sorting. |

### Coordinator

This section is only present when run in a multi-shard environment.

| Returned field name | Definition |
|:--                  |:--         |
| `Total coordinator time` | Time measured from the beginning of query execution until all shards have completed query execution. (ms) |
| `Post-processing time`   | The time spent generating the FT.PROFILE output (overhead) (ms). |

## Examples

<details>
<summary><b>Collect performance information about a simple JSON index.</b></summary>

Imagine you have (1) a dataset consisting of 10 JSON documents, each with the following structure;

```json
{
  "pickup_zone": "POLYGON((-74.0610 40.7578, -73.9510 40.7578, -73.9510 40.6678, -74.0610 40.6678, -74.0610 40.7578))",
  "store_location": "-74.0060,40.7128",
  "brand": "Velorim",
  "model": "Jigger",
  "price": 270,
  "description": "Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids’ pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go.",
  "condition": "new"
}
```

And (2) a corresponding index:

```bash
FT.CREATE idx:bicycle ON JSON PREFIX 1 bicycle: SCORE 1.0 SCHEMA $.pickup_zone AS pickup_zone GEOSHAPE $.store_location AS store_location GEO $.brand AS brand TEXT WEIGHT 1.0 $.model AS model TEXT WEIGHT 1.0 $.description AS description TEXT WEIGHT 1.0 $.price AS price NUMERIC $.condition AS condition TAG SEPARATOR ,
```

Here's an example of running the `FT.PROFILE` command for a compound query.

{{< highlight bash >}}
127.0.0.1:6379> ft.profile idx:bicycle search query "@description:(kids | small) @condition:{new | used}"
1) 1) (integer) 3
   2) "bicycle:0"
   3) 1) "$"
      2) "{\"pickup_zone\":\"POLYGON((-74.0610 40.7578, -73.9510 40.7578, -73.9510 40.6678, -74.0610 40.6678, -74.0610 40.7578))\",\"store_location\":\"-74.0060,40.7128\",\"brand\":\"Velorim\",\"model\":\"Jigger\",\"price\":270,\"description\":\"Small and powerful, the Jigger is the best ride for the smallest of tikes! This is the tiniest kids\xe2\x80\x99 pedal bike on the market available without a coaster brake, the Jigger is the vehicle of choice for the rare tenacious little rider raring to go.\",\"condition\":\"new\"}"
   4) "bicycle:1"
   5) 1) "$"
      2) "{\"pickup_zone\":\"POLYGON((-118.2887 34.0972, -118.1987 34.0972, -118.1987 33.9872, -118.2887 33.9872, -118.2887 34.0972))\",\"store_location\":\"-118.2437,34.0522\",\"brand\":\"Bicyk\",\"model\":\"Hillcraft\",\"price\":1200,\"description\":\"Kids want to ride with as little weight as possible. Especially on an incline! They may be at the age when a 27.5\\\" wheel bike is just too clumsy coming off a 24\\\" bike. The Hillcraft 26 is just the solution they need!\",\"condition\":\"used\"}"
   6) "bicycle:2"
   7) 1) "$"
      2) "{\"pickup_zone\":\"POLYGON((-87.6848 41.9331, -87.5748 41.9331, -87.5748 41.8231, -87.6848 41.8231, -87.6848 41.9331))\",\"store_location\":\"-87.6298,41.8781\",\"brand\":\"Nord\",\"model\":\"Chook air 5\",\"price\":815,\"description\":\"The Chook Air 5  gives kids aged six years and older a durable and uberlight mountain bike for their first experience on tracks and easy cruising through forests and fields. The lower  top tube makes it easy to mount and dismount in any situation, giving your kids greater safety on the trails.\",\"condition\":\"used\"}"
2) 1) 1) Total profile time
      2) "0"
   2) 1) Parsing time
      2) "0"
   3) 1) Pipeline creation time
      2) "0"
   4) 1) Warning
   5) 1) Iterators profile
      2) 1) Type
         2) INTERSECT
         3) Time
         4) "0"
         5) Counter
         6) (integer) 6
         7) Child iterators
         8)  1) Type
             2) UNION
             3) Query type
             4) UNION
             5) Time
             6) "0"
             7) Counter
             8) (integer) 6
             9) Child iterators
            10)  1) Type
                 2) UNION
                 3) Query type
                 4) UNION
                 5) Time
                 6) "0"
                 7) Counter
                 8) (integer) 4
                 9) Child iterators
                10)  1) Type
                     2) TEXT
                     3) Term
                     4) kids
                     5) Time
                     6) "0"
                     7) Counter
                     8) (integer) 4
                     9) Size
                    10) (integer) 4
                11)  1) Type
                     2) TEXT
                     3) Term
                     4) +kid
                     5) Time
                     6) "0"
                     7) Counter
                     8) (integer) 4
                     9) Size
                    10) (integer) 4
            11)  1) Type
                 2) TEXT
                 3) Term
                 4) small
                 5) Time
                 6) "0"
                 7) Counter
                 8) (integer) 2
                 9) Size
                10) (integer) 2
         9)  1) Type
             2) UNION
             3) Query type
             4) TAG
             5) Time
             6) "0"
             7) Counter
             8) (integer) 6
             9) Child iterators
            10)  1) Type
                 2) TAG
                 3) Term
                 4) new
                 5) Time
                 6) "0"
                 7) Counter
                 8) (integer) 4
                 9) Size
                10) (integer) 10
            11)  1) Type
                 2) TAG
                 3) Term
                 4) used
                 5) Time
                 6) "0"
                 7) Counter
                 8) (integer) 4
                 9) Size
                10) (integer) 8
   6) 1) Result processors profile
      2) 1) Type
         2) Index
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      3) 1) Type
         2) Scorer
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      4) 1) Type
         2) Sorter
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      5) 1) Type
         2) Loader
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
{{< / highlight >}}
</details>

<details>
<summary><b>Collect performance information about a JSON index that includes vector data.</b></summary>

For this example, you'll create a very simple vector database and index.

Index:

```redis
FT.CREATE vss_idx ON JSON PREFIX 1 vec: SCHEMA $.vector AS vector VECTOR FLAT 6 TYPE FLOAT32 DIM 4 DISTANCE_METRIC L2
```

Database:

```redis
JSON.SET vec:1 $ '{"vector":[1,1,1,1]}'
JSON.SET vec:2 $ '{"vector":[2,2,2,2]}'
JSON.SET vec:3 $ '{"vector":[3,3,3,3]}'
JSON.SET vec:4 $ '{"vector":[4,4,4,4]}'
```

Here's an example of running the `FT.PROFILE` command for a vector query.

{{< highlight bash >}}
127.0.0.1:6379> ft.profile vss_idx search query "*=>[KNN 3 @vector $query_vec]" PARAMS 2 query_vec "\x00\x00\x00@\x00\x00\x00@\x00\x00@@\x00\x00@@" SORTBY __vector_score DIALECT 2
1) 1) (integer) 3
   2) "vec:2"
   3) 1) "__vector_score"
      2) "2"
      3) "$"
      4) "{\"vector\":[2,2,2,2]}"
   4) "vec:3"
   5) 1) "__vector_score"
      2) "2"
      3) "$"
      4) "{\"vector\":[3,3,3,3]}"
   6) "vec:1"
   7) 1) "__vector_score"
      2) "10"
      3) "$"
      4) "{\"vector\":[1,1,1,1]}"
2) 1) 1) Total profile time
      2) "0"
   2) 1) Parsing time
      2) "0"
   3) 1) Pipeline creation time
      2) "0"
   4) 1) Warning
   5) 1) Iterators profile
      2) 1) Type
         2) VECTOR
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
   6) 1) Result processors profile
      2) 1) Type
         2) Index
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      3) 1) Type
         2) Metrics Applier
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      4) 1) Type
         2) Sorter
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
      5) 1) Type
         2) Loader
         3) Time
         4) "0"
         5) Counter
         6) (integer) 3
{{< /highlight >}}
</details>

## Return information

{{< multitabs id="ft-profile-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with two elements: search results and profiling information.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

-tab-sep-

One of the following:
* [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) with two keys: `Results` containing search results and `Profile` containing profiling information.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

{{< /multitabs >}}

## See also

[`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) | [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}) 

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})

