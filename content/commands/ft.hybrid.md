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
  - name: query
    type: string
  - name: scorer
    optional: true
    token: SCORER
    type: string
  - name: yield_score_as
    optional: true
    token: YIELD_SCORE_AS
    type: string
  name: search_clause
  type: block
- arguments:
  - name: vsim
    token: VSIM
    type: pure-token
  - name: field
    type: string
  - name: vector
    type: string
  - arguments:
    - arguments:
      - name: knn
        token: KNN
        type: pure-token
      - name: count
        type: integer
      - name: k
        token: K
        type: integer
      - name: ef_runtime
        optional: true
        token: EF_RUNTIME
        type: integer
      - name: yield_score_as
        optional: true
        token: YIELD_SCORE_AS
        type: string
      name: knn_clause
      type: block
    - arguments:
      - name: range
        token: RANGE
        type: pure-token
      - name: count
        type: integer
      - name: radius
        token: RADIUS
        type: double
      - name: epsilon
        optional: true
        token: EPSILON
        type: double
      - name: yield_score_as
        optional: true
        token: YIELD_SCORE_AS
        type: string
      name: range_clause
      type: block
    name: vector_query_type
    optional: true
    type: oneof
  - name: filter
    optional: true
    token: FILTER
    type: string
  name: vsim_clause
  type: block
- arguments:
  - name: combine
    token: COMBINE
    type: pure-token
  - arguments:
    - arguments:
      - name: rrf
        token: RRF
        type: pure-token
      - name: count
        type: integer
      - name: constant
        optional: true
        token: CONSTANT
        type: double
      - name: window
        optional: true
        token: WINDOW
        type: integer
      - name: yield_score_as
        optional: true
        token: YIELD_SCORE_AS
        type: string
      name: rrf_method
      type: block
    - arguments:
      - name: linear
        token: LINEAR
        type: pure-token
      - name: count
        type: integer
      - arguments:
        - name: alpha
          token: ALPHA
          type: double
        - name: beta
          token: BETA
          type: double
        name: weights
        optional: true
        type: block
      - name: window
        optional: true
        token: WINDOW
        type: integer
      - name: yield_score_as
        optional: true
        token: YIELD_SCORE_AS
        type: string
      name: linear_method
      type: block
    name: method
    type: oneof
  name: combine
  optional: true
  type: block
- arguments:
  - name: limit
    token: LIMIT
    type: pure-token
  - name: offset
    type: integer
  - name: num
    type: integer
  name: limit
  optional: true
  type: block
- arguments:
  - arguments:
    - name: sortby
      token: SORTBY
      type: string
    - arguments:
      - name: asc
        token: ASC
        type: pure-token
      - name: desc
        token: DESC
        type: pure-token
      name: order
      optional: true
      type: oneof
    name: sortby
    type: block
  - name: nosort
    token: NOSORT
    type: pure-token
  name: sorting
  optional: true
  type: oneof
- arguments:
  - name: params
    token: PARAMS
    type: pure-token
  - name: nargs
    type: integer
  - arguments:
    - name: name
      type: string
    - name: value
      type: string
    multiple: true
    name: values
    type: block
  name: params
  optional: true
  type: block
- name: timeout
  optional: true
  token: TIMEOUT
  type: integer
- name: format
  optional: true
  token: FORMAT
  type: string
- arguments:
  - name: count
    token: LOAD
    type: string
  - multiple: true
    name: field
    type: string
  name: load
  optional: true
  type: block
- name: loadall
  optional: true
  token: LOAD *
  type: pure-token
- arguments:
  - name: groupby
    token: GROUPBY
    type: pure-token
  - name: nproperties
    type: integer
  - multiple: true
    name: property
    type: string
  - arguments:
    - name: reduce
      token: REDUCE
      type: pure-token
    - arguments:
      - name: count
        token: COUNT
        type: pure-token
      - name: count_distinct
        token: COUNT_DISTINCT
        type: pure-token
      - name: count_distinctish
        token: COUNT_DISTINCTISH
        type: pure-token
      - name: sum
        token: SUM
        type: pure-token
      - name: min
        token: MIN
        type: pure-token
      - name: max
        token: MAX
        type: pure-token
      - name: avg
        token: AVG
        type: pure-token
      - name: stddev
        token: STDDEV
        type: pure-token
      - name: quantile
        token: QUANTILE
        type: pure-token
      - name: tolist
        token: TOLIST
        type: pure-token
      - name: first_value
        token: FIRST_VALUE
        type: pure-token
      - name: random_sample
        token: RANDOM_SAMPLE
        type: pure-token
      name: function
      type: oneof
    - name: nargs
      type: integer
    - multiple: true
      name: arg
      type: string
    - name: name
      optional: true
      token: AS
      type: string
    multiple: true
    name: reduce
    optional: true
    type: block
  name: groupby
  optional: true
  type: block
- arguments:
  - arguments:
    - arguments:
      - token: s
      name: exists
      summary: Checks whether a field exists in a document.
      token: exists
      type: function
    - arguments:
      - token: x
      name: log
      summary: Return the logarithm of a number, property or subexpression
      token: log
      type: function
    - arguments:
      - token: x
      name: abs
      summary: Return the absolute value of a numeric expression
      token: abs
      type: function
    - arguments:
      - token: x
      name: ceil
      summary: Round to the smallest integer not less than x
      token: ceil
      type: function
    - arguments:
      - token: x
      name: floor
      summary: Round to largest integer not greater than x
      token: floor
      type: function
    - arguments:
      - token: x
      name: log2
      summary: Return the logarithm of x to base 2
      token: log2
      type: function
    - arguments:
      - token: x
      name: exp
      summary: Return the exponent of x, e.g., e^x
      token: exp
      type: function
    - arguments:
      - token: x
      name: sqrt
      summary: Return the square root of x
      token: sqrt
      type: function
    - arguments:
      - token: s
      name: upper
      summary: Return the uppercase conversion of s
      token: upper
      type: function
    - arguments:
      - token: s
      name: lower
      summary: Return the lowercase conversion of s
      token: lower
      type: function
    - arguments:
      - token: s1
      - token: s2
      name: startswith
      summary: Return 1 if s2 is the prefix of s1, 0 otherwise.
      token: startswith
      type: function
    - arguments:
      - token: s1
      - token: s2
      name: contains
      summary: Return the number of occurrences of s2 in s1, 0 otherwise. If s2 is
        an empty string, return length(s1) + 1.
      token: contains
      type: function
    - arguments:
      - token: s
      name: strlen
      summary: Return the length of s
      token: strlen
      type: function
    - arguments:
      - token: s
      - token: offset
      - token: count
      name: substr
      summary: Return the substring of s, starting at offset and having count characters.
        If offset is negative, it represents the distance from the end of the string.
        If count is -1, it means "the rest of the string starting at offset".
      token: substr
      type: function
    - arguments:
      - token: fmt
      name: format
      summary: Use the arguments following fmt to format a string. Currently the only
        format argument supported is %s and it applies to all types of arguments.
      token: format
      type: function
    - arguments:
      - optional: true
        token: max_terms=100
      name: matched_terms
      summary: Return the query terms that matched for each record (up to 100), as
        a list. If a limit is specified, Redis will return the first N matches found,
        based on query order.
      token: matched_terms
      type: function
    - arguments:
      - token: s
      name: split
      summary: Split a string by any character in the string sep, and strip any characters
        in strip. If only s is specified, it is split by commas and spaces are stripped.
        The output is an array.
      token: split
      type: function
    - arguments:
      - token: x
      - optional: true
        token: fmt
      name: timefmt
      summary: Return a formatted time string based on a numeric timestamp value x.
      token: timefmt
      type: function
    - arguments:
      - token: timesharing
      - optional: true
        token: fmt
      name: parsetime
      summary: The opposite of timefmt() - parse a time format using a given format
        string
      token: parsetime
      type: function
    - arguments:
      - token: timestamp
      name: day
      summary: Round a Unix timestamp to midnight (00:00) start of the current day.
      token: day
      type: function
    - arguments:
      - token: timestamp
      name: hour
      summary: Round a Unix timestamp to the beginning of the current hour.
      token: hour
      type: function
    - arguments:
      - token: timestamp
      name: minute
      summary: Round a Unix timestamp to the beginning of the current minute.
      token: minute
      type: function
    - arguments:
      - token: timestamp
      name: month
      summary: Round a unix timestamp to the beginning of the current month.
      token: month
      type: function
    - arguments:
      - token: timestamp
      name: dayofweek
      summary: Convert a Unix timestamp to the day number (Sunday = 0).
      token: dayofweek
      type: function
    - arguments:
      - token: timestamp
      name: dayofmonth
      summary: Convert a Unix timestamp to the day of month number (1 .. 31).
      token: dayofmonth
      type: function
    - arguments:
      - token: timestamp
      name: dayofyear
      summary: Convert a Unix timestamp to the day of year number (0 .. 365).
      token: dayofyear
      type: function
    - arguments:
      - token: timestamp
      name: year
      summary: Convert a Unix timestamp to the current year (e.g. 2018).
      token: year
      type: function
    - arguments:
      - token: timestamp
      name: monthofyear
      summary: Convert a Unix timestamp to the current month (0 .. 11).
      token: monthofyear
      type: function
    - arguments:
      - token: ''
      name: geodistance
      summary: Return distance in meters.
      token: geodistance
      type: function
    expression: true
    name: expression
    token: APPLY
    type: string
  - name: name
    token: AS
    type: string
  multiple: true
  name: apply
  optional: true
  type: block
- expression: true
  name: filter
  optional: true
  token: FILTER
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
complexity: O(N+M) where N is the complexity of the text search and M is the complexity
  of the vector search
description: Performs hybrid search combining text search and vector similarity search
group: search
hidden: false
linkTitle: FT.HYBRID
since: 8.4.0
summary: Performs hybrid search combining text search and vector similarity search
syntax_fmt: "FT.HYBRID index\n  SEARCH query\n    [SCORER scorer]\n    [YIELD_SCORE_AS\
  \ name]\n  VSIM field vector\n    [KNN count [K k] [EF_RUNTIME ef_runtime]]\n \
  \   [RANGE count [RADIUS radius] [EPSILON epsilon]]\n    [YIELD_SCORE_AS name]\n\
  \    [FILTER filter]\n  [COMBINE RRF count [CONSTANT constant] [WINDOW window]\
  \ [YIELD_SCORE_AS name]]\n  [COMBINE LINEAR count [[ALPHA alpha] [BETA beta]] [WINDOW\
  \ window] [YIELD_SCORE_AS name]]\n  [LIMIT offset num]\n  [SORTBY count sortby\
  \ [ASC | DESC]]\n  [NOSORT]\n  [LOAD count field [field ...]]\n  [LOAD *]\n  [GROUPBY\
  \ nargs property [property ...]\n  [GROUPBY nargs property [property ...]\n   \
  \ [REDUCE function nargs arg [arg ...] [AS name]\n    [REDUCE function nargs arg\
  \ [arg ...] [AS name] ...]] ...]]\n  [APPLY expression AS name [APPLY expression\
  \ AS name ...]]\n  [FILTER filter]\n  [PARAMS nargs name value [name value ...]]\n\
  \  [TIMEOUT timeout]"
title: FT.HYBRID
---

Performs hybrid search combining text search and vector similarity with configurable fusion methods.

`FT.HYBRID` provides a unified interface for combining traditional full-text and vector-based search within a single query. It supports hybrid retrieval use cases such as semantic search, Retrieval-Augmented Generation (RAG), and intelligent agent applications. The command builds on the familiar query syntax of `FT.SEARCH` and `FT.AGGREGATE`, simplifying hybrid query construction while enabling flexible post-processing through aggregation capabilities.

{{< note >}}
This command will only return document IDs (`keyid`) and scores to which the user has read access.
To retrieve entire documents, use projections with `LOAD *` or `LOAD <count> field...`.
{{< /note >}}

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is the name of the index. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

<details open>
<summary><code>SEARCH "search-expression"</code></summary>

defines the text search component of the hybrid query. The search expression uses the same syntax as [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) queries, supporting all text search capabilities including field-specific searches, boolean operations, and phrase matching.
</details>

<details open>
<summary><code>VSIM @vector_field "vector-data"</code></summary>

defines the vector similarity component of the hybrid query. The `@vector_field` specifies which vector field in the index to search against (for example, `$vector`), and `"vector-data"` contains the query vector for similarity comparison (for example, `PARAMS 2 $vector <vector-blob>`).
</details>

## Optional arguments

<details open>
<summary><code>SCORER algorithm params...</code></summary>

specifies the scoring algorithm and parameters for the text search component. Supports aliasing and follows the parameter count convention where the first number indicates the total count of following parameters.

Example: `SCORER 4 BM25 1.2 0.75` uses BM25 algorithm with parameters 1.2 and 0.75.
</details>

<details open>
<summary><code>YIELD_SCORE_AS alias-search-score</code></summary>

assigns an alias to the search score for use in post-processing operations like `APPLY` or `SORTBY`.
</details>

<details open>
<summary><code>KNN count K top-k [EF_RUNTIME ef-value] [YIELD_SCORE_AS name]</code></summary>

configures K-nearest neighbors search for vector similarity. The `count` parameter indicates the number of following parameters. `K` specifies the number of nearest neighbors to find. `EF_RUNTIME` controls the search accuracy vs. speed tradeoff. `YIELD_SCORE_AS` assigns an alias to the score value.
</details>

<details open>
<summary><code>RANGE count RADIUS radius-value [EPSILON epsilon-value] [YIELD_SCORE_AS name]</code></summary>

configures range-based vector search within a specified radius. The `count` parameter indicates the number of following parameters. `RADIUS` defines the maximum distance for matches. `EPSILON` provides additional precision control.
</details>

<details open>
<summary><code>FILTER "filter-expression"</code></summary>

applies pre-filtering to vector search results or post-filtering when used after the `COMBINE` step as post-processing. This filter affects which documents are considered for vector similarity but doesn't impact scoring. In contrast, the `SEARCH` component affects both filtering and scoring. The `FILTER` syntax uses a search expression with the same syntax as [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}), supporting all text search capabilities including field-specific searches, boolean operations, and phrase matching
</details>

<details open>
<summary><code>POLICY [ADHOC_BF|BATCHES] [BATCH_SIZE batch-size-value]</code></summary>

controls the pre-filtering policy for vector queries. `ADHOC_BF` processes filters on-demand and `BATCHES` processes in configurable batch sizes. See the [pre-filtering policy]({{< relref "/develop/ai/search-and-query/vectors#filters" >}}) for more information.
</details>

<details open>
<summary><code>COMBINE method params...</code></summary>

specifies how to fuse the text search and vector similarity results. Supports multiple fusion methods:

- **RRF (Reciprocal Rank Fusion)**: Default method. Parameters include `WINDOW` (default 20) and `CONSTANT` (default 60).
- **LINEAR**: Linear combination with `ALPHA` and `BETA` weights.
- **FUNCTION**: Custom fusion function (future support).

Example: `COMBINE RRF 4 WINDOW 40 CONSTANT 1.5`
</details>

<details open>
<summary><code>YIELD_SCORE_AS alias-combined-score</code></summary>

assigns an alias to the combined fusion score for use in post-processing operations.
</details>

<details open>
<summary><code>LOAD count field...</code></summary>

specifies which fields to return in the results. The `count` parameter indicates the number of fields that follow.

Example: `LOAD 3 category brand price`
</details>

<details open>
<summary><code>GROUPBY count field... REDUCE function...</code></summary>

groups results by specified fields and applies reduction functions. Follows the parameter count convention. The `count` parameter indicates the number of fields that follow.

Example: `GROUPBY 4 category brand REDUCE 2 COUNT 0`
</details>

<details open>
<summary><code>APPLY expression AS field</code></summary>

applies transformations to create new fields. Can reference aliased scores and distances.

Example: `APPLY "@vector_distance+@score" AS final_score`
</details>

<details open>
<summary><code>SORTBY count field [ASC|DESC]</code></summary>

sorts the final results by the specified field in ascending or descending order. The `count` parameter indicates the number of fields that follow.
</details>

<details open>
<summary><code>FILTER post-filter-expression</code></summary>

applies final filtering to the fused results after combination and before sorting/limiting.
</details>

<details open>
<summary><code>LIMIT offset num</code></summary>

limits the final results. Default limit is 10 when not specified. The `offset` parameter is zero-indexed.
</details>

<details open>
<summary><code>PARAMS count key value...</code></summary>

defines parameter substitution for the query. Parameters can be referenced in search expressions using `$parameter_name`.

Example: `PARAMS 4 min_price 50 max_price 200`
</details>

<details open>
<summary><code>EXPLAINSCORE</code></summary>

includes detailed score explanations in the results, showing how both text search and vector similarity scores were calculated and combined.
</details>

<details open>
<summary><code>TIMEOUT timeout</code></summary>

sets a runtime timeout for the query execution in milliseconds.
</details>

<details open>
<summary><code>WITHCURSOR [COUNT read_size] [MAXIDLE idle_time]</code></summary>

enables cursor-based result pagination for large result sets. `COUNT` specifies the batch size, and `MAXIDLE` sets the cursor timeout.
</details>

## Default values and behaviors

FT.HYBRID provides sensible defaults to ease onboarding:

- **Query count**: 2 (one SEARCH and one VSIM component required)
- **Default LIMIT**: 10 results
- **Default SCORER**: BM25STD for text search
- **Default KNN K**: 10 neighbors
- **Default RRF WINDOW**: 20
- **Default RRF CONSTANT**: 60
- **Default EF_RUNTIME**: 10 (as vector KNN [default](https://redis.io/docs/latest/develop/ai/search-and-query/vectors/#hnsw-index))
- **Default EPSILON**: 0.01 (as the vector RANGE [default]({{< relref "/develop/ai/search-and-query/vectors#hnsw-index" >}}))
## Parameter count convention

All multi-parameter options use a count prefix that contains ALL tokens that follow:

- `KNN 4 K 10 EF_RUNTIME 100` - 2 key-value pairs
- `PARAMS 4 min_price 50 max_price 200` - 2 key-value pairs
- `COMBINE RRF 4 WINDOW 40 CONSTANT 1.5` - RRF method with 2 key-value pairs

The only exception is alias usage with `AS`, which is not counted:
- `APPLY "@vector_distance+@score" AS final_score`
- `LOAD 3 category AS cat brand AS brd price AS prc`

## Reserved fields

The following fields are reserved for internal use:

- `@__key` - reserved for loading key IDs when required
- `@__score` - reserved for the combined score (can be aliased)
- `@vector_distance` - yields the vector distance (can be aliased)
- `@__combined_score` - fused score from the COMBINE step

## Examples

<details open>
<summary><b>Basic hybrid search</b></summary>

Perform a simple hybrid search combining text search for "laptop" with vector similarity:

{{< highlight bash >}}
127.0.0.1:6379> FT.HYBRID products-idx
  SEARCH "laptop"
  VSIM @description_vector $query_vec
  KNN 2 K 10
{{< / highlight >}}
</details>

<details open>
<summary><b>Hybrid search with custom scoring and fusion</b></summary>

Search for electronics with custom BM25 parameters and RRF fusion:

{{< highlight bash >}}
127.0.0.1:6379> FT.HYBRID products-idx
  SEARCH "@category:electronics"
  SCORER 4 BM25 1.5 0.8
  YIELD_SCORE_AS text_score
  VSIM @features_vector $query_vec
  KNN 4 K 20 EF_RUNTIME 200
  YIELD_SCORE_AS vector_score
  COMBINE RRF 4 WINDOW 50 CONSTANT 80
  YIELD_SCORE_AS hybrid_score
  SORTBY 1 hybrid_score DESC
  LIMIT 0 20
{{< / highlight >}}
</details>

<details open>
<summary><b>Hybrid search with pre-filtering</b></summary>

Search with vector pre-filtering and post-processing:

{{< highlight bash >}}
127.0.0.1:6379> FT.HYBRID products-idx
  SEARCH "smartphone"
  VSIM @image_vector $query_vec
  KNN 2 K 15
  FILTER "@price:[100 500]"
  COMBINE LINEAR 4 ALPHA 0.7 BETA 0.3
  LOAD 4 title price category rating
  APPLY "@price * 0.9" AS discounted_price
  SORTBY 1 rating DESC
{{< / highlight >}}
</details>

<details open>
<summary><b>Hybrid search with parameters</b></summary>

Use parameter substitution for dynamic queries:

{{< highlight bash >}}
127.0.0.1:6379> FT.HYBRID products-idx
  SEARCH "@brand:$brand_name"
  VSIM @content_vector $query_vector
  RANGE 4 RADIUS 0.8 EPSILON 0.1
  FILTER "@availability:$stock_status"
  PARAMS 6 brand_name "Apple" query_vector <vector_blob> stock_status "in_stock"
  EXPLAINSCORE
{{< / highlight >}}
</details>

## Complexity

FT.HYBRID complexity depends on both the text search and vector similarity components:
- Text search: O(n) for simple term searches, where n is the number of matching documents. In multi-term queries with INTERSECT or UNION, or when using fuzzy or prefix matches, the complexity increases proportionally to the total number of entries scanned across all participating terms.
- Vector search: O(log n) for KNN with HNSW index, O(n) for range queries
- Fusion: O(k) where k is the number of results to combine
- Overall complexity is typically dominated by the more expensive component

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="ft-hybrid-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with the first element being the total number of results, followed by document IDs and their field-value pairs as [arrays]({{< relref "/develop/reference/protocol-spec#arrays" >}}).
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

-tab-sep-

One of the following:
* [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) with the following fields:
    - `total_results`: [Integer]({{< relref "/develop/reference/protocol-spec#integers" >}}) - total number of results
    - `execution_time`: [double]({{< relref "/develop/reference/protocol-spec#doubles" >}}) containing hybrid query execution time
    - `warnings`: [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of warning messages indicating partial results due to index errors or `MAXPREFIXEXPANSIONS`, out-of-memory conditions, and `TIMEOUT` reached
    - `results`: [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [maps]({{< relref "/develop/reference/protocol-spec#maps" >}}) containing document information
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index, syntax error in query.

{{< /multitabs >}}

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) | [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) | [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}})

## Related topics

- [Vector search concepts]({{< relref "/develop/ai/search-and-query/vectors" >}})
- [Combined search]({{< relref "/develop/ai/search-and-query/query/combined/" >}})
