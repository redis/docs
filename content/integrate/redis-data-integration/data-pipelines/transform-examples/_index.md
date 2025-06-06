---
Title: Job files
aliases: /integrate/redis-data-integration/ingest/data-pipelines/transform-examples/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to configure job files for data transformation.
group: di
hideListLinks: false
linkTitle: Job files
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 5
---

You can optionally supply one or more job files that specify how you want to
transform the captured data before writing it to the target.
Each job file contains a YAML
configuration that controls the transformation for a particular table from the source
database. You can also add a `default-job.yaml` file to provide
a default transformation for tables that don't have a specific job file of their own.

The job files have a structure like the following example. This configures a default
job that:

- Writes the data to a Redis hash
- Adds a field `app_code` to the hash with a value of `foo`
- Adds a prefix of `aws` and a suffix of `gcp` to the key

```yaml
source:
  table: "*"
  row_format: full
transform:
  - uses: add_field
    with:
      fields:
        - field: after.app_code
          expression: "`foo`"
          language: jmespath
output:
  - uses: redis.write
    with:
      data_type: hash
      key:
        expression: concat(['aws', '#', table, '#', keys(key)[0], '#', values(key)[0], '#gcp'])
        language: jmespath
```

The main sections of these files are:

- `source`: This is a mandatory section that specifies the data items that you want to 
  use. You can add the following properties here:
  - `server_name`: Logical server name (optional).
  - `db`: Database name (optional)
  - `schema`: Database schema (optional)
  - `table`: Database table name. This refers to a table name you supplied in `config.yaml`. The default
  job doesn't apply to a specific table, so use "*" in place of the table name for this job only.
  - `row_format`: Format of the data to be transformed. This can take the values `data_only` (default) to
  use only the payload data, or `full` to use the complete change record. See the `transform` section below
  for details of the extra data you can access when you use the `full` option.
  - `case_insensitive`: This applies to the `server_name`, `db`, `schema`, and `table` properties
  and is set to `true` by default. Set it to `false` if you need to use case-sensitive values for these
  properties.

- `transform`: This is an optional section describing the transformation that the pipeline
  applies to the data before writing it to the target. The `uses` property specifies a
  *transformation block* that will use the parameters supplied in the `with` section. See the 
  [data transformation reference]({{< relref "/integrate/redis-data-integration/reference/data-transformation" >}})
  for more details about the supported transformation blocks, and also the
  [JMESPath custom functions]({{< relref "/integrate/redis-data-integration/reference/jmespath-custom-functions" >}}) reference. You can test your transformation logic using the [dry run]({{< relref "/integrate/redis-data-integration/reference/api-reference/#tag/secure/operation/job_dry_run_api_v1_pipelines_jobs_dry_run_post" >}}) feature in the API.

  {{< note >}}If you set `row_format` to `full` under the `source` settings, you can access extra data from the
  change record in the transformation:
  - Use the `key` object to access the attributes of the key. For example, `key.id` will give you the value of the `id` column as long as it is part of the primary key.
  - Use `before.<FIELD_NAME>` to get the value of a field *before* it was updated in the source database
  - Use `after.<FIELD_NAME>` to get the value of a field *after* it was updated in the source database
  - Use `after.<FIELD_NAME>` when adding new fields during transformations
  
  See [Row Format]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-row-format#full" >}}) for a more detailed explanation of the full format.
  {{< /note >}}
 
- `output`: This is a mandatory section to specify the data structure(s) that
  RDI will write to
  the target along with the text pattern for the key(s) that will access it.
  Note that you can map one record to more than one key in Redis or nest
  a record as a field of a JSON structure (see
  [Data denormalization]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization" >}})
  for more information about nesting). You can add the following properties in the `output` section:
  - `uses`: This must have the value `redis.write` to specify writing to a Redis data
  structure. You can add more than one block of this type in the same job.
  - `with`:
    - `connection`: Connection name as defined in `config.yaml` (by default, the connection named `target` is used).
    - `data_type`: Target data structure when writing data to Redis. The supported types are `hash`, `json`, `set`,
   `sorted_set`, `stream` and `string`.
    - `key`: This lets you override the default key for the data structure with custom logic:
      - `expression`: Expression to generate the key.
      - `language`: Expression language, which must be `jmespath` or `sql`.
    - `expire`: Positive integer value indicating a number of seconds for the key to expire.
    If you don't specify this property, the key will never expire.

{{< note >}}In a job file, the `transform` section is optional, but if you don't specify
a `transform`, you must specify custom key logic in `output.with.key`. You can include
both of these sections if you want both a custom transform and a custom key.{{< /note >}}

Another example below shows how you can rename the `fname` field to `first_name` in the table `emp`
using the
[`rename_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/rename_field" >}}) block. It also demonstrates how you can set the key of this record instead of relying on
the default logic.

```yaml
source:
  server_name: redislabs
  schema: dbo
  table: emp
transform:
  - uses: rename_field
    with:
      from_field: fname
      to_field: first_name
output:
  - uses: redis.write
    with:
      connection: target
      key:
        expression: concat(['emp:fname:',fname,':lname:',lname])
        language: jmespath
```

See the
[RDI configuration file]({{< relref "/integrate/redis-data-integration/reference/config-yaml-reference" >}})
reference for full details about the
available source, transform, and target configuration options and see
also the
[data transformation reference]({{< relref "/integrate/redis-data-integration/reference/data-transformation" >}})
for details of all the available transformation blocks.

## Examples

The pages listed below show examples of typical job files for different use cases.
