---
Title: Set the key name in the target database
aliases: /integrate/redis-data-integration/ingest/data-pipelines/transform-examples/redis-set-key/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Set the key name in target database
summary: Learn how to customize Redis key names when synchronizing data from your primary database using Redis Data Integration.
type: integration
weight: 40
---

## Understanding Default Key Names

When RDI synchronizes data from your primary database to Redis, it automatically generates key names based on a specific pattern.
By default, RDI creates keys using the following format:

* **Single primary key**: `tablename:primarykeyname:primarykeyvalue`
* **Composite primary keys**: `tablename:key1name:key1value:key2name:key2value`

Examples

* For a table named `employee` with primary key `employeeid`, a record with `employeeid=1` will have the key `employee:employeeid:1`
* For a table named `orders` with composite primary keys `orderid` and `customerid`, a record with `orderid=1` and `customerid=2` will have the key `orders:orderid:1:customerid:2`

## Customizing Key Names

While the default key naming convention works for many use cases, you may need custom key formats to:

* Match existing Redis key patterns
* Create more concise key names
* Implement application-specific naming schemes
* Optimize for specific access patterns

To customize key names, use the `key` section within the `redis.write` output configuration. This section requires two parameters:

* `expression`: Defines the custom key format using a supported expression language
* `language`: Specifies the expression language to use (`jmespath` or `sql`)

### Example


```yaml
source:
  server_name: rdi
  db: inventory
  table: customers
output:
  - uses: redis.write
    with:
      key:
        expression: concat(['customers', '#', id])
        language: jmespath
```

## Special Considerations for Full Row Format

When working with the full row format, you need to handle key generation differently to ensure proper behavior across all operation types (create, update, and delete). You must reference attributes correctly to ensure consistent key generation, especially for delete operations where the "after" state is empty. The example below demonstrates how to handle this:

```yaml
source:
  server_name: rdi
  db: inventory
  table: customers
  row_format: full
output:
  - uses: redis.write
    with:
      key:
        # Here we use the operation code to determine the value of the key to ensure that
        # delete operations will result in the correct key being deleted
        expression: concat(['customers', '#', opcode == 'd' && before.id || after.id])
        language: jmespath
```

## Summary

Proper key naming is essential for effective data organization in Redis. RDI provides:

1. **Default key naming** that follows a consistent pattern based on table and primary key information
2. **Custom key naming** through the `key` section with `expression` and `language` parameters
3. **Special handling for full row format** to ensure consistent key generation across all operation types

By understanding and utilizing these options, you can ensure your Redis keys are optimally structured for your specific use case, making data retrieval more efficient and your Redis implementation more maintainable.
