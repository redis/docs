---
Title: Row Format
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


The RDI pipelines support two separate row formats which you can specify in the `source` section of the job file:

- `basic` - (Default) Contains the current value of the row only.
- `full` - Contains all information available for the row, including the key, the before and after values, and the operation code.

The `full` row format is useful when you want to access the metadata associated with the row, such as the operation code, and the before and after values.
The structure of the data passed to the `transform` and `output` sections is different depending on the row format you choose. Consider which row format you are using when you reference keys.
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

- `key` - An object containing the attributes of the primary key. For example, `key.id` will give you the value of the `id` column as long as it is part of the primary key.
- `before` - An object containing the previous value of the row.
- `after` - An object containing the current value of the row.
- `opcode` - The operation code. Different databases use different values for the operation code. See [operation code values]({{< relref "#operation-codes" >}}) below for more information.
- `db` - The database name.
- `table` - The table name.
- `schema` - The schema name. 
 
Note: The `db` and `schema` fields are database-specific and may not be available in all databases. For example, MySQL doesn't use `schema` and uses `db` as the database name.


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
