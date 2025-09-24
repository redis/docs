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

- `partial` - (Default) Contains the current value of the row only.
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
- `opcode` - The operation code. See [Using the operation code]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-opcode-example" >}}) for more information about the possible opcode values and how to use them.
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

### Important notes when using `row_format: full`

- The `before` object will be `null` for `insert` and `create` operations, and the `after` object will be `null` for `delete` operations. If you are building the output key manually, you should account for this and ensure that you are not trying to access fields from a `null` object, as shown in the example below:

    ```yaml
    source:
      table: addresses
      row_format: full
    
    output:
      - uses: redis.write
        with:
          key:
            language: jmespath
            # The following pattern will fail for delete operations. In those cases `after` is null, the resulting key will
            # be 'addresses:None' and the key won't be removed from the target
            # expression: concat(['addresses:', after.ID])
          
            # This pattern works for all operations, by using the ID from the `after` object if it is available, 
            # and falling back to the ID from the `before` object if not.
            expression: concat(['addresses:', after.ID || before.ID])
      
            # Another option is to use the ID from the `key` object
            # expression: concat(['addresses:', values(key)[0]])
    ```

    Please note that `key` should not be used in combination with `row_format: full` and more than one output, as the `key` object will be overwritten by the previous output. This is a known limitation of the current implementation and is subject to change in future versions.


- The final result of the processing (which is what will be stored in the output) is the value of the `after` object. This means you must reference the fields using the `after` prefix unless you change the output structure in a transformation step. Also, when you add new fields, you must prefix them with `after.` to ensure that they are added to the correct part of the output:

    ```yaml
    source:
      table: addresses
      row_format: full
    
    transform:
      - uses: add_field
        with:
          field: after.city_state  # use this to add the new field to the final output
          # field: city_state  # use this if you need a temporary field in the transformation steps, but not in the final output
          expression: concat([after.CITY, ', ', after.STATE])
          language: jmespath
    ```
