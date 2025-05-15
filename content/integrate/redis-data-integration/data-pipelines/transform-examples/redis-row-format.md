---
Title: Row Format
aliases: /integrate/redis-data-integration/ingest/data-pipelines/transform-examples/redis-row-format/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Row Format
summary: Explanation of the row formats supported by Redis Data Integration jobs.
type: integration
weight: 30
---


The RDI pipelines support two separate row formats which can be specified in the `source` section of the job file:

- `basic` - this is the default one, when no `row_format` is specified. It contains only the current value of the row
- `full` - you get a full representation of the row, including the key, the before and after values, the operation code, etc.

The `full` row format is useful when you want to access the metadata associated with the row, such as the operation code, the before and after values, etc.
Based on the used row format, the structure of the data passed to the `transform` and `output` sections is different and the keys should be referenced accordingly to the chosen row format.
The following two examples demonstrate the difference between the two row formats.

## Default row format

With the default row format, the input value is a JSON object containing the current value of the row, and fields can be referenced directly by their name.

Usage example:

```yaml
source:
  table: addresses
transform:
  - uses: add_field
    with:
      field: city_state
      expression: concat([CITY, ', ', STATE])
      language: jmespath
  - uses: add_field
    with:
      field: op_code_value
      # Operation code is not available in standard row format
      # so the following expression will result in `op_code - None`
      expression: concat(['op_code', ' - ', opcode])
      language: jmespath
output:
  - uses: redis.write
    with:
      data_type: hash
      key:
        expression: concat(['addresses', '#', ID])
        language: jmespath
```


## Full row format {#full}

With `row_format: full` the input value is a JSON object with the following structure:

- `key` - An object structure containing the attributes of the primary key. For example, `key.id` will give you the value of it the `id` column as long as it is part of the primary key.
- `before` - An object structure containing the previous value of the row.
- `after` - An object structure containing the current value of the row.
- `opcode` - The operation code. Please note that some databases use different values for the operation code. Please refer to the [operation code values]({{< relref "#operation-codes" >}}) section for more information.
- `db` - The database name.
- `table` - The table name.
- `schema` - The schema name. 
 
Note: The `db` and `schema` are database-specific and may not be available in all databases. For example with MySQL `schema` is not available and `db` is the database name.


Usage example:

```yaml
source:
  table: addresses
  row_format: full
transform:
  - uses: add_field
    with:
      # opcode is only available in full row format and can be used in the transformations
      field: after.op_code_value
      expression: address
      language: jmespath
  - uses: add_field
    with:
      field: after.city_state
      # Note that we need to use the `after` prefix to access the current value of the row
      # or `before` to access the previous value
      expression: concat([after.CITY, ', ', after.STATE])
      language: jmespath
output:
  - uses: redis.write
    with:
      data_type: hash
      key:
        # There are different ways to express the key
        # If the `ID` column is the primary key the following expressions 
        # are equivalent - `key.ID`, `after.ID`, `values(key)[0]`
        expression: concat(['addresses-full', '#', values(key)[0]])
        language: jmespath
```

## Operation code values {#operation-codes}

- r - Read (applies to only snapshots)
- c - Create
- u - Update
- d - Delete
- t = truncate (PostgreSQL specific)
- m = message (PostgreSQL specific)
