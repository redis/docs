---
acl_categories:
- '@search'
- '@read'
- '@fast'
arguments:
- name: index
  summary: Specifies the name of the index. The index must be created using `FT.CREATE`.
  type: string
- name: query
  summary: Specifies the query to profile and analyze performance.
  type: string
- name: verbatim
  optional: true
  summary: Searches using the exact query terms without stemming or synonym expansion.
  token: VERBATIM
  type: pure-token
- arguments:
  - name: count
    token: LOAD
    type: string
  - multiple: true
    name: field
    summary: Specifies a field in the index schema with its properties.
    type: string
  name: load
  optional: true
  type: block
- name: timeout
  optional: true
  summary: Sets a time limit for query execution, specified in milliseconds.
  token: TIMEOUT
  type: integer
- name: loadall
  optional: true
  token: LOAD *
  type: pure-token
- arguments:
  - name: nargs
    token: GROUPBY
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
      - arguments:
        - name: collect_token
          token: COLLECT
          type: pure-token
        - arguments:
          - name: fields_token
            token: FIELDS
            type: pure-token
          - arguments:
            - name: all
              token: '*'
              type: pure-token
            - arguments:
              - name: num_fields
                type: integer
              - multiple: true
                name: field
                type: string
              name: explicit
              type: block
            name: fields_spec
            type: oneof
          name: fields
          type: block
        - arguments:
          - name: sortby_token
            token: SORTBY
            type: pure-token
          - name: nargs
            type: integer
          - arguments:
            - name: field
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
            multiple: true
            name: key
            type: block
          name: sortby
          optional: true
          type: block
        - arguments:
          - name: limit_token
            token: LIMIT
            type: pure-token
          - name: offset
            type: integer
          - name: count
            type: integer
          name: limit
          optional: true
          type: block
        name: collect
        since: 8.8.0
        type: block
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
    summary: Applies a reducer function, like `SUM` or `COUNT`, on grouped results.
    type: block
  multiple: true
  name: groupby
  optional: true
  summary: Groups results by specified fields, often used for aggregations.
  type: block
- arguments:
  - name: nargs
    token: SORTBY
    type: integer
  - arguments:
    - name: property
      type: string
    - arguments:
      - name: asc
        token: ASC
        type: pure-token
      - name: desc
        token: DESC
        type: pure-token
      name: order
      type: oneof
    multiple: true
    name: fields
    optional: true
    type: block
  - name: num
    optional: true
    token: MAX
    type: integer
  name: sortby
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
    type: block
  - name: name
    token: AS
    type: string
  multiple: true
  name: apply
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
- expression: true
  name: filter
  optional: true
  summary: Applies a numeric range filter to restrict results to documents with field
    values within the specified range.
  token: FILTER
  type: string
- arguments:
  - name: withcursor
    token: WITHCURSOR
    type: pure-token
  - name: read_size
    optional: true
    token: COUNT
    type: integer
  - name: idle_time
    optional: true
    token: MAXIDLE
    type: integer
  name: cursor
  optional: true
  type: block
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
- name: dialect
  optional: true
  since: 2.4.3
  summary: Sets the query dialect version to be used.
  token: DIALECT
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
command_flags:
- readonly
complexity: O(1)
description: Run a search query on an index and perform aggregate transformations
  on the results
group: search
hidden: false
linkTitle: FT.AGGREGATE
module: Search
railroad_diagram: /images/railroad/ft.aggregate.svg
since: 1.1.0
stack_path: docs/interact/search-and-query
summary: Run a search query on an index and perform aggregate transformations on the
  results
syntax: "FT.AGGREGATE index query \n  [VERBATIM] \n  [LOAD count field [field ...]]\
  \ \n  [TIMEOUT timeout] \n  [GROUPBY nargs property [property ...] [REDUCE function\
  \ nargs arg [arg ...] [AS name] [REDUCE function nargs arg [arg ...] [AS name] ...]]\
  \ ...]] \n  [SORTBY nargs [property ASC | DESC [property ASC | DESC ...]] [MAX num]\
  \ [WITHCOUNT | WITHOUTCOUNT]] \n  [APPLY expression AS name [APPLY expression AS\
  \ name ...]] \n  [LIMIT offset num] \n  [FILTER filter] \n  [WITHCURSOR [COUNT read_size]\
  \ [MAXIDLE idle_time]] \n  [PARAMS nargs name value [name value ...]] \n  [SCORER\
  \ scorer]\n  [ADDSCORES] \n  [DIALECT dialect]\n"
title: FT.AGGREGATE
---

Run a search query on an index and perform aggregate transformations on the results.

{{< note >}}
This command will only return keys to which the user has read access.
{{< /note >}}

[Examples](#examples)

## Required arguments

<details open>
<summary><code>index</code></summary>

is index name against which the query is executed. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
</details>

<details open>
<summary><code>query</code></summary> 

is base filtering query that retrieves the documents. It follows the exact same syntax as the search query, including filters, unions, not, optional, and so on.
</details>

## Optional arguments

<details open>
<summary><code>VERBATIM</code></summary>

if set, does not try to use stemming for query expansion but searches the query terms verbatim.
</details>

<details open>
<summary><code>LOAD {nargs} {identifier} AS {property} …</code></summary> 

loads document attributes from the source document. 
 - `identifier` is either an attribute name for hashes and JSON or a JSON Path expression for JSON. 
 - `property` is the optional name used in the result. If it is not provided, the `identifier` is used. This should be avoided.
 - If `*` is used as `nargs`, all attributes in a document are loaded.

Attributes needed for aggregations should be stored as `SORTABLE`, where they are available to the aggregation pipeline with very low latency. `LOAD` hurts the performance of aggregate queries considerably because every processed record needs to execute the equivalent of [`HMGET`]({{< relref "/commands/hmget" >}}) against a Redis key, which when executed over millions of keys, amounts to high processing times.

<details open>
<summary><code>GROUPBY {nargs} {property}</code></summary> 

groups the results in the pipeline based on one or more properties. Each group should have at least one _reducer_, a function that handles the group entries,
  either counting them, or performing multiple aggregate operations (see below).
</details>
      
<details open>
<summary><code>REDUCE {func} {nargs} {arg} … [AS {name}]</code></summary>

reduces the matching results in each group into a single record, using a reduction function. For example, `COUNT` counts the number of records in the group. The reducers can have their own property names using the `AS {name}` optional argument. If a name is not given, the resulting name will be the name of the reduce function and the group properties. For example, if a name is not given to `COUNT_DISTINCT` by property `@foo`, the resulting name will be `count_distinct(@foo)`.
  
See [Supported GROUPBY reducers]({{< relref "develop/ai/search-and-query/advanced-concepts/aggregations#supported-groupby-reducers" >}}) for more details.
</details>

<details open>
<summary><code>SORTBY {nargs} {property} {ASC|DESC} [MAX {num}]</code></summary> 

sorts the pipeline up until the point of `SORTBY`, using a list of properties. 

 - By default, sorting is ascending, but `ASC` or `DESC ` can be added for each property. 
 - `nargs` is the number of sorting parameters, including `ASC` and `DESC`, for example, `SORTBY 4 @foo ASC @bar DESC`.
 - `MAX` is used to optimized sorting, by sorting only for the n-largest elements. Although it is not connected to `LIMIT`, you usually need just `SORTBY … MAX` for common queries.

Attributes needed for `SORTBY` should be stored as `SORTABLE` to be available with very low latency.

**Sorting Optimizations**: performance is optimized for sorting operations on `DIALECT 4` in different scenarios:
   - Skip Sorter - applied when there is no sort of any kind. The query can return after it reaches the `LIMIT` requested results.
   - Partial Range - applied when there is a `SORTBY` clause over a numeric field, with no filter or filter by the same numeric field, the query iterate on a range large enough to satisfy the `LIMIT` requested results.
   - Hybrid - applied when there is a `SORTBY` clause over a numeric field and another non-numeric filter. Some results will get filtered, and the initial range may not be large enough. The iterator is then rewinding with the following ranges, and an additional iteration takes place to collect the `LIMIT` requested results.
   - No optimization - If there is a sort by score or by non-numeric field, there is no other option but to retrieve all results and compare their values.

**Counts behavior**: optional `WITHCOUNT` argument returns accurate counts for the query results with sorting. This operation processes all results in order to get an accurate count, being less performant than the optimized option (default behavior on `DIALECT 4`)

You can also use `WITHOUTCOUNT` in place of `DIALECT 4` when used with either `FT.SEARCH` or `FT.AGGREGATE`.
</details>

<details open>
<summary><code>APPLY {expr} AS {name}</code></summary> 

applies a 1-to-1 transformation on one or more properties and either stores the result as a new property down the pipeline or replaces any property using this
  transformation. 
  
`expr` is an expression that can be used to perform arithmetic operations on numeric properties, or functions that can be applied on properties depending on their types (see below), or any combination thereof. For example, `APPLY "sqrt(@foo)/log(@bar) + 5" AS baz` evaluates this expression dynamically for each record in the pipeline and store the result as a new property called `baz`, which can be referenced by further `APPLY`/`SORTBY`/`GROUPBY`/`REDUCE` operations down the
  pipeline.

See [APPLY expressions]({{< relref "develop/ai/search-and-query/advanced-concepts/aggregations/#apply-expressions" >}}) for details.
</details>

<details open>
<summary><code>LIMIT {offset} {num}</code></summary> 

limits the number of results to return just `num` results starting at index `offset` (zero-based). It is much more efficient to use `SORTBY … MAX` if you
  are interested in just limiting the output of a sort operation.
  If a key expires during the query, an attempt to `load` the key's value will return a null array. 

However, limit can be used to limit results without sorting, or for paging the n-largest results as determined by `SORTBY MAX`. For example, getting results 50-100 of the top 100 results is most efficiently expressed as `SORTBY 1 @foo MAX 100 LIMIT 50 50`. Removing the `MAX` from `SORTBY` results in the pipeline sorting _all_ the records and then paging over results 50-100.
</details>

<details open>
<summary><code>FILTER {expr}</code></summary> 

filters the results using predicate expressions relating to values in each result.
  They are applied post query and relate to the current state of the pipeline.
</details>

<details open>
<summary><code>WITHCURSOR {COUNT} {read_size} [MAXIDLE {idle_time}]</code></summary> 

Scan part of the results with a quicker alternative than `LIMIT`.
See [Cursor API]({{< relref "develop/ai/search-and-query/advanced-concepts/aggregations#cursor-api" >}}) for more details.
</details>

<details open>
<summary><code>TIMEOUT {milliseconds}</code></summary> 

if set, overrides the timeout parameter of the module.
</details>

<details open>
<summary><code>PARAMS {nargs} {name} {value}</code></summary> 

defines one or more value parameters. Each parameter has a name and a value. 

You can reference parameters in the `query` by a `$`, followed by the parameter name, for example, `$user`. Each such reference in the search query to a parameter name is substituted by the corresponding parameter value. For example, with parameter definition `PARAMS 4 lon 29.69465 lat 34.95126`, the expression `@loc:[$lon $lat 10 km]` is evaluated to `@loc:[29.69465 34.95126 10 km]`. You cannot reference parameters in the query string where concrete values are not allowed, such as in field names, for example, `@loc`. To use `PARAMS`, set `DIALECT` to `2` or greater than `2`.
</details>

<details open>
<summary><code>SCORER {scorer}</code></summary>

uses a [built-in]({{< relref "/develop/ai/search-and-query/advanced-concepts/scoring" >}}) or a [user-provided]({{< relref "/develop/ai/search-and-query/administration/extensions" >}}) scoring function.
</details>

<details open>
<summary><code>ADDSCORES</code></summary>

The `ADDSCORES` option exposes the full-text score values to the aggregation pipeline.
You can use `@__score` in a pipeline as shown in the following example:

`FT.AGGREGATE idx 'hello' ADDSCORES SORTBY 2 @__score DESC`
</details>

<details open>
<summary><code>DIALECT {dialect_version}</code></summary> 

selects the dialect version under which to execute the query. If not specified, the query will execute under the default dialect version set during module initial loading or via [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) command.
</details>

## Return multiple values

See [Return multiple values]({{< relref "commands/ft.search#return-multiple-values/" >}}) in [`FT.SEARCH`]({{< relref "commands/ft.search/" >}})
The `DIALECT` can be specified as a parameter in the FT.AGGREGATE command. If it is not specified, the `DEFAULT_DIALECT` is used, which can be set using [`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) or by passing it as an argument to the `redisearch` module when it is loaded.
For example, with the following document and index:

```sh
127.0.0.1:6379> JSON.SET doc:1 $ '[{"arr": [1, 2, 3]}, {"val": "hello"}, {"val": "world"}]'
OK
127.0.0.1:6379> FT.CREATE idx ON JSON PREFIX 1 doc: SCHEMA $..arr AS arr NUMERIC $..val AS val TEXT
OK
```
Notice the different replies, with and without `DIALECT 3`:

```sh
127.0.0.1:6379> FT.AGGREGATE idx * LOAD 2 arr val 
1) (integer) 1
2) 1) "arr"
   2) "[1,2,3]"
   3) "val"
   4) "hello"

127.0.0.1:6379> FT.AGGREGATE idx * LOAD 2 arr val DIALECT 3
1) (integer) 1
2) 1) "arr"
   2) "[[1,2,3]]"
   3) "val"
   4) "[\"hello\",\"world\"]"
```

## Complexity

Non-deterministic. Depends on the query and aggregations performed, but it is usually linear to the number of results returned.

## Examples

<details open>
<summary><b>Sort page visits by day</b></summary>

Find visits to the page `about.html`, group them by the day of the visit, count the number of visits, and sort them by day.

{{< highlight bash >}}
FT.AGGREGATE idx "@url:\"about.html\""
    APPLY "day(@timestamp)" AS day
    GROUPBY 2 @day @country
      REDUCE count 0 AS num_visits
    SORTBY 1 @day
{{< /highlight >}}
</details>

<details open>
<summary><b>Find most books ever published</b></summary>

Find most books ever published in a single year.

{{< highlight bash >}}
FT.AGGREGATE books-idx *
    GROUPBY 1 @published_year
      REDUCE COUNT 0 AS num_published
    GROUPBY 0
      REDUCE MAX 1 @num_published AS max_books_published_per_year
{{< /highlight >}}
</details>

<details open>
<summary><b>Reduce all results</b></summary>

The last example used `GROUPBY 0`. Use `GROUPBY 0` to apply a `REDUCE` function over all results from the last step of an aggregation pipeline -- this works on both the  initial query and subsequent `GROUPBY` operations.

Search for libraries within 10 kilometers of the longitude -73.982254 and latitude 40.753181 then annotate them with the distance between their location and those coordinates.

{{< highlight bash >}}
 FT.AGGREGATE libraries-idx "@location:[-73.982254 40.753181 10 km]"
    LOAD 1 @location
    APPLY "geodistance(@location, -73.982254, 40.753181)"
{{< /highlight >}}

Here, notice the required use of `LOAD` to pre-load the `@location` attribute because it is a GEO attribute.    

Next, count GitHub events by user (actor), to produce the most active users.

{{< highlight bash >}}
127.0.0.1:6379> FT.AGGREGATE gh "*" GROUPBY 1 @actor REDUCE COUNT 0 AS num SORTBY 2 @num DESC MAX 10
 1) (integer) 284784
 2) 1) "actor"
    2) "lombiqbot"
    3) "num"
    4) "22197"
 3) 1) "actor"
    2) "codepipeline-test"
    3) "num"
    4) "17746"
 4) 1) "actor"
    2) "direwolf-github"
    3) "num"
    4) "10683"
 5) 1) "actor"
    2) "ogate"
    3) "num"
    4) "6449"
 6) 1) "actor"
    2) "openlocalizationtest"
    3) "num"
    4) "4759"
 7) 1) "actor"
    2) "digimatic"
    3) "num"
    4) "3809"
 8) 1) "actor"
    2) "gugod"
    3) "num"
    4) "3512"
 9) 1) "actor"
    2) "xdzou"
    3) "num"
    4) "3216"
[10](10)) 1) "actor"
    2) "opstest"
    3) "num"
    4) "2863"
11) 1) "actor"
    2) "jikker"
    3) "num"
    4) "2794"
(0.59s)
{{< /highlight >}}

</details>

<details open>
<summary><b>Use the case function for conditional logic</b></summary>
{{< highlight bash >}}
//Simple mapping
FT.AGGREGATE products "*"
APPLY case(@price > 100, "premium", "standard") AS category

//Nested conditions where an error should be returned
FT.AGGREGATE orders "*"
APPLY case(@status == "pending", 
           case(@priority == "high", 1, 2), 
           case(@status == "completed", 3, 4)) AS status_code

//Mapped approach
FT.AGGREGATE orders "*"
APPLY case(@status == "pending", 1, 0) AS is_pending
APPLY case(@is_pending == 1 && @priority == "high", 1,2) AS status_high
APPLY case(@is_pending == 0 && @priority == "high", 3,4) AS status_completed
{{< /highlight >}}

</details>

<details open>
<summary><b>Collect top documents per group</b></summary>

Group movies by genre and collect the top 5 movies per group, sorted by rating in descending order. Return the top 50 groups.

{{< highlight bash >}}
FT.AGGREGATE idx:movies "*"
    LOAD *
    GROUPBY 1 @genre
      REDUCE COLLECT 10 FIELDS 1 * SORTBY 2 @rating DESC LIMIT 0 5 AS top_movies
    SORTBY 1 @genre LIMIT 0 50
{{< /highlight >}}

In this example:
- All document fields are fetched via `*`.
- Duplicates are retained (default behavior, no `DISTINCT` flag).
- Documents within each group are sorted by `@rating` descending.
- Only the top 5 documents per group are returned.
- Only the top 50 groups are returned.
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-aggregate-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) where each row is an array reply representing a single aggregate result. The [integer reply]({{< relref "develop/reference/protocol-spec#resp-integers" >}}) at position `1` does not represent a valid value.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existent index, invalid query syntax.

-tab-sep-

One of the following:
* [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) with the following fields:
    - `attributes`: [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of attribute names.
    - `format`: [Simple string]({{< relref "/develop/reference/protocol-spec#simple-strings" >}}) - result format.
    - `results`: [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of [maps]({{< relref "/develop/reference/protocol-spec#maps" >}}) containing aggregated data.
    - `total_results`: [Integer]({{< relref "/develop/reference/protocol-spec#integers" >}}) - total number of results.
    - `warning`: [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of warning messages.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: incorrect number of arguments, non-existent index, invalid query syntax.

{{< /multitabs >}}

## See also

[`FT.CONFIG SET`]({{< relref "commands/ft.config-set/" >}}) | [`FT.SEARCH`]({{< relref "commands/ft.search/" >}})

## Related topics

- [Aggregations]({{< relref "/develop/ai/search-and-query/advanced-concepts/aggregations" >}})
- [Key and field expiration behavior]({{< relref "/develop/ai/search-and-query/advanced-concepts/expiration" >}})
- [RediSearch]({{< relref "/develop/ai/search-and-query" >}})
- [Search commands in MULTI/EXEC transactions and Lua scripts]({{< relref "/develop/ai/search-and-query/advanced-concepts/transactions" >}})
