---
Title: Remove fields from a key
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Remove fields
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

By default, RDI adds fields to
[hash]({{< relref "/develop/data-types/hashes" >}}) or
[JSON]({{< relref "/develop/data-types/json" >}}) objects in the target
database for each of the columns of the source table.
The examples below show how to omit some of those fields from the target data with the
[`remove_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/remove_field" >}}) transformation.

## Remove a single field

The first example removes a single field from the data.
The `source` section selects the `employee` table of the
[`chinook`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres)
database (the optional `db` field here corresponds to the
`sources.<source-name>.connection.database` field defined in
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})).

In the `transform` section, the `remove_field` transformation removes the
`hiredate` field.

The `output` section specifies `hash` as the `data_type` to write to the target, which
overrides the default setting of `target_data_type` defined in `config.yaml`. Also, the
`output.with.key` section specifies a custom key format of the form `emp:<employeeid>`.
Note that any fields you remove in the `transform` section are not available for
the key calculation in the `output` section.

The full example is shown below:

```yaml
source:
  db: chinook
  table: employee
transform:
  - uses: remove_field
    with:
      field: hiredate
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['emp:', employeeid])
        language: jmespath
```

If you queried the generated target data from the default transformation
using [`redis-cli`]({{< relref "/develop/tools/cli" >}}), you would
see something like the following:

```bash
> hgetall emp:8
 1) "employeeid"
 2) "8"
 3) "lastname"
 4) "Callahan"
 5) "firstname"
 6) "Laura"
 7) "title"
 8) "IT Staff"
 9) "reportsto"
10) "6"
11) "birthdate"
12) "-62467200000000"
13) "hiredate"
14) "1078358400000000"
15) "address"
16) "923 7 ST NW"
.
.
```

Using the job file above, the data omits the `hiredate` field:

```bash
 > hgetall emp:8
 1) "employeeid"
 2) "8"
 3) "lastname"
 4) "Callahan"
 5) "firstname"
 6) "Laura"
 7) "title"
 8) "IT Staff"
 9) "reportsto"
10) "6"
11) "birthdate"
12) "-62467200000000"
13) "address"
14) "923 7 ST NW"
.
.
```

## Remove multiple fields

The `remove_field` transformation can also remove multiple fields at the same time
if you specify them under a `fields` subsection. The example below is similar
to the previous one but also removes the `birthdate` field: 

```yaml
source:
  db: chinook
  table: employee
transform:
  - uses: remove_field
    with:
      fields:
        - field: hiredate
        - field: birthdate
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['emp:', employeeid])
        language: jmespath
```

If you query the data, you can see that it also omits the
`birthdate` field:

```bash
> hgetall emp:8
 1) "employeeid"
 2) "8"
 3) "lastname"
 4) "Callahan"
 5) "firstname"
 6) "Laura"
 7) "title"
 8) "IT Staff"
 9) "reportsto"
10) "6"
11) "address"
12) "923 7 ST NW"
.
.
```

## Using `remove_field` with `add_field`

The `remove_field` transformation is very useful in combination with
[`add_field`]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-add-field-example" >}}).
For example, if you use `add_field` to concatenate a person's first
and last names, you may not need separate `firstname` and `lastname`
fields, so you can use `remove_field` to omit them.
See [Using `add_field` with `remove_field`]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-add-field-example#using-add_field-with-remove_field" >}})
for an example of how to do this.
