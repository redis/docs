---
Title: Remapping the fields in the output
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Remapping the fields in the output
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 40
---

Sometimes, you may want to remap the fields in the output of a data pipeline. This can be done by defining a `mapping` section in the output configuration.

```yaml
source:
  table: Customer

output:
  - uses: redis.write
    with:
      data_type: hash
      mapping:
        - CustomerId: id
        - FirstName: first_name
        - LastName: last_name
```

The example above remaps the `CustomerId` field to `id`, `FirstName` to `first_name`, and `LastName` to `last_name` in the output. This allows you to customize the field names in the Redis data store according to your application's requirements.
You can also use `mapping` to include only the fields you need in the output and exclude the rest.

Mapping only allows you to rename fields and limit the output to specific fields and define a single level structure. To create nested structures and/or perform operations on the field values you can use the [map transformation]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/map-example" >}}).
