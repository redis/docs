---
Title: Best practices for Redis Query Engine performance
alwaysopen: false
categories:
- docs
- develop
- stack
- oss
- kubernetes
- clients
linkTitle: RQE performance
weight: 1
---

{{< note >}}
If you're using Redis Software or Redis Cloud, see the [best practices for scalable Redis Query Engine]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/scalable-query-best-practices" >}}) page.
{{< /note >}}

## Checklist
Below are basic steps to ensure good performance of Redis Query Engine.

* Create a Redis data model with your query patterns in mind.
* Ensure the Redis architecture has been sized for the expected load using the [sizing calculator](https://redis.io/redisearch-sizing-calculator/).
* Provision Redis nodes with sufficient resources (RAM, CPU, network) to support the expected maximum load.
* Review [`FT.INFO`]({{< baseurl >}}/commands/ft.info) and [`FT.PROFILE`]({{< baseurl >}}/commands/ft.profile) outputs for anomalies and/or errors.
* Conduct load testing in a test environment with real-world queries and a load generated by either [memtier_benchmark](https://github.com/redislabs/memtier_benchmark) or a custom load application.

## Indexing considerations

### General
- Favor [`TAG`]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options#tag-fields" >}}) over [`NUMERIC`]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options#numeric-fields" >}}) for use cases that only require matching.
- Favor [`TAG`]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options#tag-fields" >}}) over [`TEXT`]({{< relref "/develop/interact/search-and-query/basic-constructs/field-and-type-options#text-fields" >}}) for use cases that don’t require full-text capabilities (pure match).

### Non-threaded search
- Put only those fields used in your queries in the index.
- Only make fields [`SORTABLE`]({{< relref "/develop/interact/search-and-query/advanced-concepts/sorting" >}}) if they are used in [`SORTBY`]({{< relref "/develop/interact/search-and-query/advanced-concepts/sorting#specifying-sortby" >}})
queries.
- Use [`DIALECT 4`]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects#dialect-4" >}}).

### Threaded (query performance factor or QPF) search
- Put both query fields and any projected fields (`RETURN` or `LOAD`) in the index.
- Set all fields to `SORTABLE`.
- Set TAG fields to [UNF]({{< relref "/develop/interact/search-and-query/advanced-concepts/sorting#normalization-unf-option" >}}).
- Optional: Set `TEXT` fields to `NOSTEM` if the use case will support it.
- Use [`DIALECT 4`]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects#dialect-4" >}}).

## Query optimization

- Avoid returning large result sets.  Use `CURSOR` or `LIMIT`.
- Avoid wildcard searches.
- Avoid projecting all fields (e.g., `LOAD *`). Project only those fields that are part of the index schema.
- If queries are long-running, enable threading (query performance factor) to reduce contention for the main Redis thread.

## Validate performance (`FT.PROFILE`)

You can analyze [`FT.PROFILE`]({{< baseurl >}}/commands/ft.profile) output to gain insights about query execution.
The following informational items are available for analysis:

- Total execution time
- Execution time per shard
- Coordination time (for multi-sharded environments)
- Breakdown of the query into fundamental components, such as `UNION` and `INTERSECT`
- Warnings, such as `TIMEOUT`

## Anti-patterns

The following items are anti-patterns for RQE:

- Large documents
- Deeply-nested fields
- Large result sets
- Wildcarding
- Large projections

The following examples depict an anti-pattern index schema and query, followed by a corrected index schema and query, which allows for scalability with the Redis Query Engine.

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
                LOAD 6 id t nam" lastname loc ver 
                LIMIT 0 10
                DIALECT 3
```