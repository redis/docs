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

#### 1. Plan your indexes strategically
   - Understand your query patterns: before creating indexes, analyze your expected query patterns to ensure indexes are optimized for performance.
   - Avoid over-indexing: indexing every field increases memory usage and can slow down updates. Only index fields essential for your queries.
   - Choose appropriate index types: use the correct field types (`TEXT`, `TAG`, `NUMERIC`, `GEO`, or `VECTOR`) for your data to maximize efficiency.

#### 2. Index creation
   - Atomic creation: use the `FT.CREATE` command to atomically define an index schema.
   - Field weighting: assign weights to `TEXT` fields to prioritize certain fields in full-text search results.
   - Prefix optimization: leverage the `PREFIX` option to restrict indexing to keys with specific patterns.
   - Data loading strategy: load data into Redis before creating an index when working with large datasets. Use the `ON HASH` or `ON JSON` options to match the data structure.

#### 3. Index aliasing
   - What is index aliasing?
     - Aliases act as abstracted names for indexes, allowing applications to reference the alias instead of the actual index name. This simplifies schema updates and index management.
   - Use cases for index aliasing:
     - Seamless schema updates: point the alias to a new index without changing application code.
     - Version control: assign aliases like `products_live` to track the active index version.
     - Testing and rollback: temporarily assign aliases to test indexes, and revert if needed.
   - How to manage aliases:
     - Assign an alias: `FT.ALIASADD my_alias my_index`
     - Update an alias: `FT.ALIASUPDATE my_alias new_index`
     - Remove an alias: `FT.ALIASDEL my_alias`

#### 4. Monitoring index population
   - Check document count:
     - Use the `FT.INFO` command to monitor the `num_docs` field, ensuring all expected documents are indexed.
     - Example:
       ```bash
       FT.INFO my_new_index
       ```
   - Run test queries:
     - Validate data with sample queries to ensure proper indexing:
       ```bash
       FT.SEARCH my_new_index "*"
       ```
   - Query profiling:
     - Use `FT.PROFILE` to analyze query plans and validate performance:
       ```bash
       FT.PROFILE my_new_index SEARCH QUERY "your_query"
       ```
   - Automate checks:
     - Implement scripts to periodically verify document counts and query results. For example, in Python:
       ```python
       import redis

       def check_index_readiness(index_name, expected_docs):
           r = redis.StrictRedis(host='localhost', port=6379, decode_responses=True)
           info = r.execute_command('FT.INFO', index_name)
           num_docs = int(info[info.index('num_docs') + 1])
           return num_docs >= expected_docs

       if check_index_readiness('my_new_index', 100000):
           print("Index is fully populated!")
       else:
           print("Index is still populating...")
       ```

#### 5. Monitoring index performance
   - Query profiling: use the `FT.PROFILE` command to analyze query performance and identify bottlenecks.
   - Memory usage: regularly monitor memory usage with the `INFO memory` and `FT.INFO` commands to detect growth patterns and optimize resource allocation.
   - Search query logs: enable query logging for better insights into how indexes are utilized.

#### 6. Index maintenance
   - Reindexing: if schema changes are required, create a new index with the updated schema and reassign the alias once the index is ready.
   - Expire old data: use Redis key expiration or TTLs to automatically remove outdated records and keep indexes lean.

#### 7. Scaling and high availability
   - Sharding considerations: in a clustered Redis setup, ensure indexes are designed with key distribution in mind to prevent query inefficiencies.
   - Replication: test how indexes behave under replica promotion to ensure consistent query behavior across nodes.
   - Active-Active support: if using Redis in an active-active setup, validate how index updates propagate to avoid inconsistencies.

#### 8. Versioning and testing
   - Index versioning: when changing schemas, create a new version of the index alongside the old one and migrate data progressively.
   - Staging environment: test index changes in a staging environment before deploying them to production.

#### 9. Cleaning up
   - Index deletion: use the `FT.DROPINDEX` command to remove unused indexes and free up memory. Be cautious with the `DD` (Delete Documents) flag to avoid unintended data deletion.
   - Monitoring orphaned keys: Ensure no keys remain that were previously associated with dropped indexes.

#### 10. Documentation and automation
   - Maintain clear index schemas: document your index configurations to facilitate future maintenance.
   - Automate index management: use scripts or orchestration tools to automate index creation, monitoring, and cleanup.
