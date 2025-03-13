---
Title: Best practices for scalable Redis Query Engine
alwaysopen: false
categories:
- docs
- operate
- stack
description: Best practices for scalable Redis Query Engine in Redis Software and Redis Cloud.
linkTitle: Best practices for scalable Redis Query Engine
weight: 25
---

[Vertical scaling of Redis Query Engine]({{<relref "/operate/oss_and_stack/stack-with-enterprise/search/query-performance-factor">}}) requires configuring query performance factors. With careful crafting of search indices and queries, query performance factors allow throughput scaling up to 16X. The following recommendations help queries avoid accessing the keyspace and enable Redis Query Engine to benefit from additional CPUs allocated by query performance factors.

## Best candidates for query performance factor improvements

- Query types:

    - [Full-text]({{<relref "/develop/interact/search-and-query/query/full-text">}})

    - [Tag]({{<relref "/develop/interact/search-and-query/advanced-concepts/tags">}})

    - [Vector]({{<relref "/develop/interact/search-and-query/query/vector-search">}})

- Result set types: 

    - Small result sets

    - Document subsets that are indexed in their [non-normalized]({{<relref "/develop/interact/search-and-query/advanced-concepts/sorting#normalization-unf-option">}}) form

## Indexing best practices

Follow these best practices for [indexing]({{<relref "/develop/interact/search-and-query/indexing">}}):

- Include fields in the index definition that are used in the query or the required result sets (projections).

- Use `SORTABLE` for all fields returned in result sets.

- Use the `UNF` option for `TAG` and `GEO` fields.

- Use the `NOSTEM` option for `TEXT` fields.

## Query best practices

Follow these best practices for [queries]({{<relref "/develop/interact/search-and-query/query">}}):

- Specify the result set fields in the `RETURN` or `LOAD` clauses and include them in the index definition. Don’t just return the default result set from [`FT.SEARCH`]({{< relref "commands/ft.search/" >}})  or `LOAD *` from [`FT.AGGREGATE`]({{< relref "commands/ft.aggregate/" >}}).

- Use `LIMIT` to reduce the result set size.

- Use [`DIALECT 3`]({{<relref "/develop/interact/search-and-query/advanced-concepts/dialects#dialect-3">}}) or higher for any queries against JSON.

## Index and query examples

The following examples depict an anti-pattern index schema and query, followed by a corrected schema and query, which allows for scalability with the Redis Query Engine.

### Anti-pattern index schema

The following index schema is not optimized for vertical scaling:

```sh
FT.CREATE jsonidx:profiles ON JSON PREFIX 1 profiles: 
          SCHEMA $.tags.* as t NUMERIC SORTABLE 
                 $.firstName as name TEXT 
                 $.location as loc GEO
```

### Anti-pattern query

The following query is not optimized for vertical scaling:

```sh
FT.AGGREGATE jsonidx:profiles '@t:[1299 1299]' LOAD * LIMIT 0 10
```

### Improved index schema

Here's an improved index schema that follows best practices for vertical scaling:

```sh
FT.CREATE jsonidx:profiles ON JSON PREFIX 1 profiles: 
          SCHEMA $.tags.* as t NUMERIC SORTABLE 
                 $.firstName as name TEXT NOSTEM SORTABLE 
                 $.lastName as lastname TEXT NOSTEM SORTABLE 
                 $.location as loc GEO SORTABLE 
                 $.id as id TAG SORTABLE UNF 
                 $.ver as ver TAG SORTABLE UNF
```

### Improved query

Here's an improved query that follows best practices for vertical scaling:

```sh
FT.AGGREGATE jsonidx:profiles '@t:[1299 1299]' 
                LOAD 6 id t name lastname loc ver
                LIMIT 0 10
                DIALECT 3
```
