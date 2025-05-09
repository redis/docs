---
Title: Data denormalization
aliases: /integrate/redis-data-integration/ingest/data-pipelines/data-denormalization/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn about denormalization strategies
group: di
linkTitle: Data denormalization
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

The data in the source database is often
[*normalized*](https://en.wikipedia.org/wiki/Database_normalization).
This means that columns can't have composite values (such as arrays) and relationships between entities
are expressed as mappings of primary keys to foreign keys between different tables.
Normalized data models reduce redundancy and improve data integrity for write queries but this comes
at the expense of speed.
A Redis cache, on the other hand, is focused on making *read* queries fast, so RDI provides data
*denormalization* to help with this.

## Nest strategy

*Nesting* is the strategy RDI uses to denormalize many-to-one relationships in the source database.
It does this by representing the
parent object (the "one") as a JSON document with the children (the "many") nested inside a JSON map
attribute in the parent. The diagram belows shows a nesting with the child objects in a map
called `InvoiceLineItems`:

{{< image filename="/images/rdi/ingest/nest-flow.webp" width="500px" >}}

You configure normalization with a `nest` block in the child entities' RDI job, as shown in this example:

```yaml
source:
  server_name: chinook
  schema: public
  table: InvoiceLine
output:
  - uses: redis.write
    with:
      nest: # cannot co-exist with other parameters such as 'key'
        parent:
          # server_name: chinook
          # schema: public
          table: Invoice
        nesting_key: InvoiceLineId # cannot be composite
        parent_key: InvoiceId # cannot be composite
        path: $.InvoiceLineItems # path must start from document root ($)
        structure: map # only map supported for now
      on_update: merge # only merge supported for now
      data_type: json # only json supported for now
```

The job has a `with` section under `output` that includes the `nest` block.
The job must include the following attributes in the `nest` block:

- `parent`: This specifies the RDI data stream for the parent entities. Typically, you only
  need to supply the parent `table` name, unless you are nesting children under a parent that comes from
  a different source database. If you do this then you must also specify `server_name` and
  `schema` attributes. Note that this attribute refers to a Redis *key* that will be added to the target
  database, not to a table you can access from the pipeline. See [Using nesting](#using-nesting) below
  for the format of the key that is generated.
- `nesting_key`: The field of the child entity that stores the unique ID (primary key) of the child entity.
- `parent_key`: The field in the parent entity that stores the unique ID (foreign key) of the parent entity.
- `child_key`: The field in the child entity that stores the unique ID (foreign key) of the parent entity.
  You only need to add this attribute if the name of the child's foreign key field is different from the parent's.
- `path`: The [JSONPath](https://goessner.net/articles/JsonPath/)
  for the map where you want to store the child entities. The path must start with the `$` character, which denotes
  the document root.
- `structure`: (Optional) The type of JSON nesting structure for the child entities. Currently, only a JSON map
  is supported so if you supply this attribute then the value must be `map`.

## Using nesting

There are several important things to note when you use nesting:

- When you specify `nest` in the job, you must also set the `data_type` attribute to `json` and
  the `on_update` attribute to `merge` in the surrounding `output` block.
- Key expressions are *not* supported for the `nest` output blocks. The parent key is always calculated
  using the following template:

  ```bash
  <nest.parent.table>:<nest.parent_key>:<nest.parent_key.value | nest.child_key.value>
  ```
  
  For example:
  
  ```bash
  Invoice:InvoiceId:1
  ```

- If you specify `expire` in the `nest` output block then this will set the expiration on the *parent* object.
- You can only use one level of nesting.
- If you are using PostgreSQL then you must make the following change for all child tables that you want to nest:
  
  ```sql
  ALTER TABLE <TABLE_NAME> REPLICA IDENTITY FULL;
  ```
  
  This configuration affects the information written to the write-ahead log (WAL) and whether it is available
  for RDI to capture. By default, PostgreSQL only records
  modified fields in the log, which means that it might omit the `parent_key`. This can cause incorrect updates to the
  Redis key in the destination database.
  See the
  [Debezium PostgreSQL Connector Documentation](https://debezium.io/documentation/reference/connectors/postgresql.html#postgresql-replica-identity)
  for more information about this.
