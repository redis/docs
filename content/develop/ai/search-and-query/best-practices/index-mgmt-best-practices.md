---
Title: Index management best practices for Redis Query Engine
alwaysopen: false
categories:
- docs
- develop
- stack
- oss
- kubernetes
- clients
linkTitle: RQE index management
weight: 3
---
## Introduction to managing Redis Query Engine indexes

The Redis Query Engine (RQE) is a powerful tool for executing complex search and query operations on structured, semi-structured, and unstructured data. Indexes are the backbone of this functionality, enabling fast and efficient data retrieval.
Proper management of these indexes is essential for optimal performance, scalability, and resource utilization.

This guide outlines best practices for managing RQE indexes throughout their lifecycle. It provides recommendations on:

- Planning and creating indexes to suit your query patterns.
- Using index aliasing to manage schema updates and minimize downtime.
- Monitoring and verifying index population to ensure query readiness.
- Optimizing performance through query profiling and memory management.
- Maintaining and scaling indexes in both standalone and clustered Redis environments.
- Versioning, testing, and automating index management.

## Why index management matters

Indexes directly impact query speed and resource consumption.
Poorly managed indexes can lead to increased memory usage, slower query times, and challenges in maintaining data consistency.
By following the strategies outlined in this guide, you can:

- Reduce operational overhead.
- Improve application performance.
- Ensure smooth transitions during schema changes.
- Scale efficiently with your growing datasets.

## Plan your indexes strategically

Planning your indexes strategically requires understanding your application’s query patterns and tailoring indexes to match.
Begin by identifying the types of searches your application performs—such as full-text search, range queries, or geospatial lookups—and the fields involved.
Categorize fields based on their purpose: searchable fields (e.g., [`TEXT`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#text-fields" >}}) for full-text searches), filterable fields (e.g., [`TAG`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#tag-fields" >}}) for exact match searches), and sortable fields (e.g., [`NUMERIC`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#numeric-fields" >}}) for range queries or sorting).
Match field types to their intended use and avoid indexing fields that are rarely queried to conserve resources. Here's the list of index types:

- [`TEXT`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#text-fields" >}}): use `TEXT` for free-text searches and set weights if some fields are more important.
- [`TAG`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#tag-fields" >}}): use `TAG` for categorical data (e.g., product categories) that benefit from exact matching and filtering.
- [`NUMERIC`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#numeric-fields" >}}): use `NUMERIC` for numeric ranges (e.g., prices, timestamps).
- [`GEO`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#geo-fields" >}}): use `GEO` for geospatial coordinates (e.g., latitude/longitude).
- [`GEOSHAPE`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#geoshape-fields" >}}): use `GEOSHAPE` to represent locations as points, but also to define shapes and query the interactions between points and shapes (e.g., to find all points that are contained within an enclosing shape).
- [`VECTOR`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#vector-fields" >}}): use `VECTOR` for high-dimensional similarity searches.

See [these pages]({{< relref "/develop/ai/search-and-query/query" >}}) for discussions and examples on how best to use these index types.

Next, simulate queries on a sample dataset to identify potential bottlenecks.
Use tools like [`FT.PROFILE`]({{< relref "commands/ft.profile" >}}) to analyze query execution and refine your schema if needed.
For example, assign weights to `TEXT` fields for prioritizing results or use the `PREFIX` option of [`FT.CREATE`]({{< relref "commands/ft.create" >}}) to limit indexing to specific key patterns. Note that you can use multiple `PREFIX` clauses when you create an index (see [below](#index-creation))
After creating the index, validate its performance with real queries and monitor usage with the available tools:

- [`FT.EXPLAIN`]({{< relref "commands/ft.explain" >}}) and [`FT.EXPLAINCLI`]({{< relref "commands/ft.explaincli" >}}) allow you to see how Redis Query Engine parses a given search query. `FT.EXPLAIN` returns a structured breakdown of the query execution plan, while `FT.EXPLAINCLI` presents a more readable, tree-like format for easier interpretation. These commands are useful for diagnosing query structure and ensuring it aligns with the intended logic.
- [`FT.INFO`]({{< relref "commands/ft.info" >}}) provides detailed statistics about an index, including the number of indexed documents, memory usage, and configuration settings. It helps in monitoring index growth, assessing memory consumption, and verifying index structure to detect potential inefficiencies.
- [`FT.PROFILE`]({{< relref "commands/ft.profile" >}}) runs a query while capturing execution details, which helps to reveal query performance bottlenecks. It provides insights into processing time, key accesses, and filter application, making it a crucial tool for fine-tuning complex queries and optimizing search efficiency.

Avoid over-indexing. Indexing every field increases memory usage and can slow down updates.
Only index the fields that are essential for your planned queries.

## Index creation {#index-creation}
   - Use the [`FT.CREATE`]({{< relref "commands/ft.create" >}}) command to define an index schema.
   - Assign weights to `TEXT` fields to prioritize certain fields in full-text search results.
   - Use the `PREFIX` option to restrict indexing to keys with specific patterns.
      Using multiple PREFIX clauses when creating an index allows you to index multiple key patterns under a single index. This is useful in several scenarios:
      - If your Redis database stores different types of entities under distinct key prefixes (e.g., `user:123`, `order:456`), a single index can cover both by specifying multiple prefixes. For example:

          ```bash
          FT.CREATE my_index ON HASH PREFIX 2 "user:" "order:" SCHEMA name TEXT age NUMERIC status TAG
          ```

          This approach enables searching across multiple entity types without needing separate indexes.

      - Instead of querying multiple indexes separately, you can search across related data structures using a single query. This is particularly helpful when data structures share common fields, such as searching both customer and vendor records under a unified contacts index.

      - Maintaining multiple indexes for similar data types can be inefficient in terms of memory and query performance. By consolidating data under one index with multiple prefixes, you reduce overhead while still allowing for distinct key organization.

      - If your data model evolves and new key patterns are introduced, using multiple `PREFIX` clauses from the start ensures future compatibility without requiring a full reindexing.
   - Data loading strategy: load data into Redis before creating an index when working with large datasets. Use the `ON HASH` or `ON JSON` options to match the data structure.

## Index aliasing

Index aliases act as abstracted names for the underlying indexes, enabling applications to reference the alias instead of the actual index name. This approach simplifies schema updates and index management.

There are several use cases for index aliasing, including:

- Schema updates: when updating an index schema, create a new index and associate the same alias with it. This allows a seamless transition without requiring application-level changes.
- Version control: use aliases to manage different versions of an index. For example, assign the alias products to `products_v1` initially and later to `products_v2` when the schema evolves.
- Testing and rollback: assign an alias to a test index during staged deployments. If issues arise, quickly switch the alias back to the stable index.

Best practices for aliasing:

- Always create an alias for your indexes during initial setup, even if you don’t anticipate immediate schema changes.
- Use clear and descriptive alias names to avoid confusion (e.g., `users_current` or `orders_live`).
- Make sure that an alias points to only one index at a time to maintain predictable query results.
- Use aliases to provide tenant-specific access. For example, assign tenant-specific aliases like `tenant1_products` and `tenant2_products` to different indexes for isolated query performance.

Tools for managing aliases:

- Assign an alias: [`FT.ALIASADD`]({{< relref "commands/ft.aliasadd" >}}) `my_alias my_index`
- Update an alias: [`FT.ALIASUPDATE`]({{< relref "commands/ft.aliasupdate" >}}) `my_alias new_index`
- Remove an alias: [`FT.ALIASDEL`]({{< relref "commands/ft.aliasdel" >}}) `my_alias`

Monitoring and troubleshooting aliases:

- Use the `FT.INFO` command to check which aliases are associated with an index.
- Make sure your aliases always points to valid indexes and are correctly updated during schema changes.

## Monitor index population

- Use the `FT.INFO` command to monitor the `num_docs` and `indexing` fields, to check that all expected documents are indexed.
    ```bash
    FT.INFO my_new_index
    ```
- Validate data with sample queries to ensure proper indexing:
    ```bash
    FT.SEARCH my_new_index "*"
    ```
- Use `FT.PROFILE` to analyze query plans and validate performance:

    ```bash
    FT.PROFILE my_new_index SEARCH QUERY "your_query"
    ```
 - Implement scripts to periodically verify document counts and query results. For example, in Python:

    ```python
    import re    
    def check_index_readiness(index_name, expected_docs):
        r = redis.StrictRedis(host='localhost', port=6379, decode_responses=True)
        info = r.execute_command('FT.INFO', index_name)
        num_docs = int(info[info.index('num_docs') + 1])
        return num_docs >= expected_d    
    if check_index_readiness('my_new_index', 100000):
        print("Index is fully populated!")
    else:
        print("Index is still populating...")
    ```

## Monitoring index performance

- Use the `FT.PROFILE` command to analyze query performance and identify bottlenecks.
- Regularly monitor memory usage with the [`INFO`]({{< relref "commands/info" >}}) `memory` and `FT.INFO` commands to detect growth patterns and optimize resource allocation.

## Index maintenance

- If schema changes are required, create a new index with the updated schema and reassign the alias once the index is ready.
- Use [Redis key expiration]({{< relref "/develop/keyspace#key-expiration" >}}) to automatically remove outdated records and keep indexes lean.

### FT.ALTER vs. aliasing

Use [`FT.ALTER`]({{< relref "commands/ft.alter" >}}) when you need to add new fields to an existing index without rebuilding it, minimizing downtime and resource usage. However, `FT.ALTER` cannot remove or modify existing fields, limiting its flexibility.

Use index aliasing when making schema changes that require reindexing, such as modifying field types or removing fields. In this case, create a new index with the updated schema, populate it, and then use `FT.ALIASUPDATE` to seamlessly switch queries to the new index without disrupting application functionality.

## Scaling and high availability

- In a clustered Redis setup, make sure indexes are designed with key distribution in mind to prevent query inefficiencies.
- Test how indexes behave under replica promotion to ensure consistent query behavior across nodes.

## Versioning and testing

- When changing schemas, create a new version of the index alongside the old one and migrate data progressively.
- Test index changes in a staging environment before deploying them to production.

## Cleaning up

- Use the [`FT.DROPINDEX`]({{< relref "commands/ft.dropindex" >}}) command to remove unused indexes and free up memory. Be cautious with the `DD` (Delete Documents) flag to avoid unintended data deletion.
- Make sure no keys remain that were previously associated with dropped indexes if the data is no longer relevant.

## Documentation and automation

- Document your index configurations to facilitate future maintenance.
- Use scripts or orchestration tools to automate index creation, monitoring, and cleanup.
