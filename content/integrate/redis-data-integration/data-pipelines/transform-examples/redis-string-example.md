---
Title: Write to a Redis string
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Write to a Redis string
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

The string data type is useful for capturing a string representation of a single column from
a source table.

In the example job below, the `title` column is captured from the `invoice` table in the source.
The `title` is then written to the Redis target database as a string under a custom key of the
form `AlbumTitle:42`, where the `42` is the primary key value of the table (the `albumid` column).

The `connection` is an optional parameter that refers to the corresponding connection name defined in
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}}). 
When you specify the `data_type` parameter for the job, it overrides the system-wide setting `target_data_type` defined in `config.yaml`. Here, the `string` data type also requires an `args` subsection
with a `value` argument that specifies the column you want to capture from the source table.

The optional `expire` parameter sets the length of time, in seconds, that a new key will
persist for after it is created (here, it is 86400 seconds, which equals one day).
After this time, the key will be deleted automatically.
If you don't supply an `expire` parameter, the keys will never expire. 

```yaml
source:
  table: album
  row_format: full
output:
  - uses: redis.write
    with:
      connection: target
      data_type: string
      key:
        expression: concat(['AlbumTitle:', values(key)[0]])
        language: jmespath
      args:
        value: title
      expire: 86400
```
