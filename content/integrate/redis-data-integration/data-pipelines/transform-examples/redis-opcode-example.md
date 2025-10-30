---
Title: Using the operation code
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Using the operation code
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 100
---

The operation code (`opcode`) is a metadata field that indicates the type of operation that generated the change in the source database. It can be useful for tracking changes and understanding the context of the data being processed.

The opcode is only available in the [full row format]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-row-format#full" >}}), and can be accessed in the `transform` and `output` sections of the job file.

It has one of the following values:

- r - Read (applies to only snapshots)
- c - Create
- u - Update
- d - Delete
- t = Truncate (PostgreSQL specific)
- m = Message (PostgreSQL specific)


You can add the value of the operation code to the output, and also use it in a conditional expression to modify the behavior of the job. The following examples demonstrate the different use-cases.

### Adding the operation code to the output

Use the `add_field` transformation to add a new field that contains the value of the `opcode` field from the source data. Note that the fields must be prefixed with `after` to be included in the output.


```yaml
source:
  schema: public
  table: employee
  row_format: full

transform:
  # add the operation code to the data
  - uses: add_field
    with:
      field: after.operation_code
      expression: opcode
      language: jmespath
```


### Filtering operation by output code.

In some cases you may want to ignore certain operations (for example, you may not be interested in deletions). Use the `filter` transformation to filter out any operations you don't need to process.

```yaml
source:
  schema: public
  table: employee
  row_format: full

transform:
  - uses: filter
    with:
      expression: opcode != 'd'
      language: jmespath
```

### Modifying the output based on the operation code

The previous example filters out specific operations, but you can also modify the output based on the operation code. For example, you can add a new field that tracks the status of the record based on the operation code.

Note that when a source record is deleted, you must modify the value of the `opcode` field if you want to prevent the corresponding record in the target database from being removed automatically.

```yaml
source:
  schema: public
  table: employee
  row_format: full

transform:
  - uses: add_field
    with:
      fields:
        # Here you set the value of the field based on the value of the opcode field
        - field: after.status
          expression: opcode == 'd' && 'inactive' || 'active'
          language: jmespath

        # You have to change the value of the opcode field to prevent deletion
        - field: opcode
          expression: opcode == 'd' && 'u' || opcode
          language: jmespath
```
