---
Title: Add the opcode to the Redis output
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Add the opcode to the Redis output
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 100
---

In the example below, the data is captured from the source table named `employee` and is written to the Redis database as a JSON document. When you specify the `data_type` parameter for the job, it overrides the system-wide setting `target_data_type` defined in `config.yaml`. 

Here, the result will be Redis JSON documents with fields captured from the source table
(`employeeid`, `firstname`, `lastname`) and also with
an extra field `my_opcode` added using the `merge` update strategy (see the
[JSON job example]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-json-example" >}})
for more information). The `opcode` expression refers to the operation code captured from
the source. This is a database-specific value that indicates which type of operation generated
the change (insert, update, etc).

```yaml
source:
  schema: public
  table: employee
  row_format: full
transform:
  - uses: add_field
    with:
      field: after.my_opcode
      expression: opcode
      language: jmespath
output:
  - uses: redis.write
    with:
      data_type: json
      mapping:
        - employeeid
        - firstname
        - lastname
        - my_opcode
      connection: target
      on_update: merge
```