---
aliases:
- /develop/interact/search-and-query/advanced-concepts/dialects
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
description: Learn how to use query dialects
linkTitle: Query dialects
title: Query dialects
weight: 16
---

Redis Open Source currently supports four query dialects for use with the [`FT.SEARCH`]({{< relref "/commands/ft.search/" >}}), [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate/" >}}), and other Redis Query Engine commands.
Dialects provide for enhancing the query API incrementally, introducing innovative behaviors and new features that support new use cases in a way that does not break the API for existing applications.

{{< note >}}Dialects 1, 3, and 4 are deprecated in Redis 8 in Redis Open Source. However, DIALECT 1 remains the default.
{{< /note >}}

## `DIALECT 1` (Deprecated)

Dialect version 1 was the default query syntax dialect from the first release of search and query until dialect version 2 was introduced with version [2.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.4.3).
This dialect is also the default dialect. See below for information about changing the default dialect.

## `DIALECT 2`

Dialect version 2 was introduced in the [2.4](https://github.com/RediSearch/RediSearch/releases/tag/v2.4.3) release to address query parser inconsistencies found in previous versions of Redis. Dialect version 1 remains the default dialect. To use dialect version 2, append `DIALECT 2` to your query command.
Support for vector search also was introduced in the 2.4 release and requires `DIALECT 2`. See [here]({{< relref "/develop/ai/search-and-query/query/vector-search" >}}) for more details.
`FT.SEARCH ... DIALECT 2`

It was determined that under certain conditions some query parsing rules did not behave as originally intended.
Particularly, some queries containing the operators below could return unexpected results.

1. AND, multi-word phrases that imply intersection
1. `"..."` (exact), `~` (optional), `-` (negation), and `%` (fuzzy)
1. OR, words separated by the `|` (pipe) character that imply union
1. wildcard characters

Existing queries that used dialect 1 may behave differently using dialect 2 if they fall into any of the following categories:

1. Your query has a field modifier followed by multiple words. Consider the sample query:

    `@name:James Brown`

    Here, the field modifier `@name` is followed by two words, `James` and `Brown`.

    In `DIALECT 1`, this query would be interpreted as find `James Brown` in the `@name` field.
    In `DIALECT 2`, this query would be interpreted as find `James` in the `@name` field, and `Brown` in any text field. In other words, it would be interpreted as `(@name:James) Brown`. 
    In `DIALECT 2`, you could achieve the dialect 1 behavior by updating your query to `@name:(James Brown)`.

1. Your query uses `"..."`, `~`, `-`, and/or `%`. Consider a simple query with negation:

    `-hello world`

    In `DIALECT 1`, this query is interpreted as find values in any field that do not contain `hello` and do not contain `world`; the equivalent of `-(hello world)` or `-hello -world`.
    In `DIALECT 2`, this query is interpreted as `-hello` and `world` (only `hello` is negated).
    In `DIALECT 2`, you could achieve the dialect 1 behavior by updating your query to `-(hello world)`.

1. Your query used `|`. Consider the simple query:

    `hello world | "goodbye" moon`

    In `DIALECT 1`, this query is interpreted as searching for `(hello world | "goodbye") moon`.
    In `DIALECT 2`, this query is interpreted as searching for either `hello world` `"goodbye" moon`.

1. Your query uses a wildcard pattern. Consider the simple query:

    `"w'foo*bar?'"`

    As shown above, you must use double quotes to contain the `w` pattern.

With `DIALECT 2` you can use un-escaped spaces in tag queries, even with stopwords.

{{% alert title=Note %}}
`DIALECT 2` is required with vector searches.
{{% /alert %}}

`DIALECT 2` functionality was enhanced in the 2.10 release.
It introduces support for new comparison operators for `NUMERIC` fields:

* `==` (equal).
  
  `FT.SEARCH idx "@numeric==3456" DIALECT 2`

  and

  `FT.SEARCH idx "@numeric:[3456]" DIALECT 2`
* `!=` (not equal).
  
  `FT.SEARCH idx "@numeric!=3456" DIALECT 2`
* `>` (greater than).
  
  `FT.SEARCH idx "@numeric>3456" DIALECT 2`
* `>=` (greater than or equal).
  
  `FT.SEARCH idx "@numeric>=3456" DIALECT 2`
* `<` (less than).
  
  `FT.SEARCH idx "@numeric<3456" DIALECT 2`
* `<=` (less than or equal).
  
  `FT.SEARCH idx "@numeric<=3456" DIALECT 2`

The Dialect version 2 enhancements also introduce simplified syntax for logical operations:

* `|` (or).

  `FT.SEARCH idx "@tag:{3d3586fe-0416-4572-8ce1 | 3d3586fe-0416-6758-4ri8}" DIALECT 2`

  which is equivalent to

  `FT.SEARCH idx "(@tag:{3d3586fe-0416-4572-8ce1} | @tag{3d3586fe-0416-6758-4ri8})" DIALECT 2`

* `<space>` (and).

  `FT.SEARCH idx "(@tag:{3d3586fe-0416-4572-8ce1} @tag{3d3586fe-0416-6758-4ri8})" DIALECT 2`

* `-` (negation).

  `FT.SEARCH idx "(@tag:{3d3586fe-0416-4572-8ce1} -@tag{3d3586fe-0416-6758-4ri8})" DIALECT 2`

* `~` (optional/proximity).

  `FT.SEARCH idx "(@tag:{3d3586fe-0416-4572-8ce1} ~@tag{3d3586fe-0416-6758-4ri8})" DIALECT 2`

## `DIALECT 3` (Deprecated)

Dialect version 3 was introduced in the [2.6](https://github.com/RediSearch/RediSearch/releases/tag/v2.6.3) release. This version introduced support for multi-value indexing and querying of attributes for any attribute type ( [TEXT]({{< relref "develop/ai/search-and-query/indexing/#index-json-arrays-as-text" >}}), [TAG]({{< relref "develop/ai/search-and-query/indexing/#index-json-arrays-as-tag" >}}), [NUMERIC]({{< relref "develop/ai/search-and-query/indexing/#index-json-arrays-as-numeric" >}}), [GEO]({{< relref "develop/ai/search-and-query/indexing/#index-json-arrays-as-geo" >}}) and [VECTOR]({{< relref "develop/ai/search-and-query/indexing/#index-json-arrays-as-vector" >}})) defined by a [JSONPath]({{< relref "/develop/data-types/json/path" >}}) leading to an array or multiple scalar values. Support for [GEOSHAPE]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}}) queries was also introduced in this version.

The primary difference between dialects version 2 and version 3 is that JSON is returned rather than scalars for multi-value attributes. Apart from specifying `DIALECT 3` at the end of a [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) command, there are no other syntactic changes. Dialect version 1 remains the default dialect. To use dialect version 3, append `DIALECT 3` to your query command.

`FT.SEARCH ... DIALECT 3`

**Example**

Sample JSON:

```
{
  "id": 123,
  "underlyings": [
    {
      "currency": "USD",
      "spot": 99,
      "underlier": "AAPL UW"
    },
    {
      "currency": "USD",
      "spot": 100,
      "underlier": "NFLX UW"
    }
  ]
}
```

Create an index:

```
FT.CREATE js_idx ON JSON PREFIX 1 js: SCHEMA $.underlyings[*].underlier AS und TAG
```

Now search, with and without `DIALECT 3`.

- With dialect 1 (default):

    ```
    ft.search js_idx * return 1 und
      1) (integer) 1
      2) "js:1"
      3) 1) "und"
         2) "AAPL UW"
    ```
    
    Only the first element of the expected two elements is returned.

- With dialect 3:

    ```
    ft.search js_idx * return 1 und DIALECT 3
        1) (integer) 1
        2) "js:1"
        3) 1) "und"
           2) "[\"AAPL UW\",\"NFLX UW\"]"
    ```

    Both elements are returned.

## `DIALECT 4` (Deprecated)

Dialect version 4 was introduced in the [2.8](https://github.com/RediSearch/RediSearch/releases/tag/v2.8.4) release. It introduces performance optimizations for sorting operations on [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) and [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}). Apart from specifying `DIALECT 4` at the end of a [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) command, there are no other syntactic changes. Dialect version 1 remains the default dialect. To use dialect version 4, append `DIALECT 4` to your query command.

`FT.SEARCH ... DIALECT 4`

Dialect version 4 will improve performance in four different scenarios:

1. **Skip sorter** - applied when there is no sorting to be done. The query can return once it reaches the `LIMIT` of requested results.
1. **Partial range** - applied when there is a `SORTBY` on a numeric field, either with no filter or with a filter by the same numeric field. Such queries will iterate on a range large enough to satisfy the `LIMIT` of requested results.
1. **Hybrid** - applied when there is a `SORTBY` on a numeric field in addition to another non-numeric filter. It could be the case that some results will get filtered, leaving too small a range to satisfy any specified `LIMIT`. In such cases, the iterator then is re-wound and additional iterations occur to collect result up to the requested `LIMIT`.
1. **No optimization** - If there is a sort by score or by a non-numeric field, there is no other option but to retrieve all results and compare their values to the search parameters.

You can also use `WITHOUTCOUNT` in place of `DIALECT 4` when used with either FT.SEARCH or FT.AGGREGATE.

## Use `FT.EXPLAINCLI` to compare dialects
	
The [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}) command is a powerful tool that provides a window into the inner workings of your queries. It's like a roadmap that details your query's journey from start to finish.

When you run [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}), it returns an array representing the execution plan of a complex query. This plan is a step-by-step guide of how Redis interprets your query and how it plans to fetch results. It's a behind-the-scenes look at the process, giving you insights into how the search engine works.

The [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}) accepts a `DIALECT` argument, allowing you to execute the query using different dialect versions, allowing you to compare the resulting query plans.

To use [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}), you need to provide an index and a query predicate. The index is the name of the index you created using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}), and the query predicate is the same as if you were sending it to [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) or [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}).

Here's an example of how to use [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli/" >}}) to understand differences in dialect versions 1 and 2.

Negation of the intersection between tokens `hello` and `world`:

```FT.EXPLAINCLI idx:dialects "-hello world" DIALECT 1
1) NOT {
2)   INTERSECT {
3)     hello
4)     world
5)   }
6) }
7)
```

Intersection of the negation of the token `hello` together with token `world`:

```
FT.EXPLAINCLI idx:dialects "-hello world" DIALECT 2
 1) INTERSECT {
 2)   NOT {
 3)     hello
 4)   }
 5)   UNION {
 6)     world
 7)     +world(expanded)
 8)   }
 9) }
10) 
```

Same result as `DIALECT 1`:

```
FT.EXPLAINCLI idx:dialects "-(hello world)" DIALECT 2
1) NOT {
2)   INTERSECT {
3)     hello
4)     world
5)   }
6) }
7) 
```

{{% alert title=Note %}}
[`FT.EXPLAIN`]({{< relref "commands/ft.explain/" >}}) doesn't execute the query. It only explains the plan. It's a way to understand how your query is interpreted by the query engine, which can be invaluable when you're trying to optimize your searches.
{{% /alert %}}

## Change the default dialect

The default dialect is `DIALECT 1`. If you wish to change that, you can do so by using the `DEFAULT_DIALECT` parameter when loading the RediSearch module:

```
$ redis-server --loadmodule ./redisearch.so DEFAULT_DIALECT 2
```

You can also change the query dialect on an already running server using the `FT.CONFIG` command:

```
FT.CONFIG SET DEFAULT_DIALECT 2
```
