---
Title: Add new fields to a key
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Add new fields
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

By default, RDI adds fields to
[hash]({{< relref "/develop/data-types/hashes" >}}) or
[JSON]({{< relref "/develop/data-types/json" >}}) objects in the target
database that match the columns of the source table.
The examples below show how to add extra fields to the target data with the
[`add_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/add_field" >}}) transformation.

## Add a single field

The first example adds a single field to the data.
The `source` section selects the `customer` table of the
[`chinook`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres)
database (the optional `db` value here corresponds to the
`sources.<source-name>.connection.database` value defined in
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#the-configyaml-file" >}})).

In the `transform` section, the `add_field` transformation adds an extra field called `fullname`
to the object, which is created by concatenating the existing `firstname` and `lastname` fields using
an [SQL expression](https://www.simplilearn.com/tutorials/sql-tutorial/concat-function-in-sql).
You can also specify `jmespath` as the `language` if you prefer to create the new
field with a [JMESPath](https://jmespath.org/) expression

The `output` section specifies `hash` as the `data_type` to write to the target, which
overrides the default setting of `target_data_type` defined in `config.yaml`. Also, the
`output.with.key` section specifies a custom key format of the form `cust:<customerid>`.

The full example is shown below:

```yaml
source:
  db: chinook
  table: customer
transform:
  - uses: add_field
    with:
      expression: concat(firstname, ' ', lastname)
      field: fullname
      language: sql
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['cust:', customerid])
        language: jmespath
```

If you queried the generated target data from the default transformation
using [`redis-cli`]({{< relref "/develop/connect/cli" >}}), you would
see something like the following:

```
> hgetall cust:14
 1) "customerid"
 2) "14"
 3) "firstname"
 4) "Mark"
 5) "lastname"
 6) "Philips"
 7) "company"
 8) "Telus"
 9) "address"
10) "8210 111 ST NW"
.
.
```

Using the job file above, the data also includes the new `fullname` field:

```
 1) "customerid"
 2) "14"
 3) "firstname"
 4) "Mark"
 5) "lastname"
 6) "Philips"
 .
 .
27) "fullname"
28) "Mark Philips"
```

## Add multiple fields

The `add_field` transformation can also add multiple fields at the same time
if you specify them under a `fields` subsection. The example below is similar
to the previous one but also adds a `fulladdress` field and uses JSON as the
target datatype, rather than hash: 

```yaml
source:
  db: chinook
  table: customer
transform:
  - uses: add_field
    with:
      fields:
        - expression: concat(firstname, ' ', lastname)
          field: fullname
          language: sql
        - expression: concat(address, ', ', city, ', ', country, ', ', postalcode)
          field: fulladdress
          language: sql
output:
  - uses: redis.write
    with:
      connection: target
      data_type: json
      key:
        expression: concat(['cust:', customerid])
        language: jmespath
```

You can query the target database to see the new `fullname` field in
the JSON object:

```
> JSON.GET cust:14 $.fulladdress
"[\"8210 111 ST NW, Edmonton, Canada, T6G 2C7\"]"
```

## Using `add_field` with `remove_field`

You can use the `add_field` and
[`remove_field`]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/redis-remove-field-example" >}})
transformations together to completely replace fields from the source. For example,
if you add a new `fullname` field, you might not need the separate `firstname` and
`lastname` fields. You can remove them with a job file like the following:

```yaml
source:
  db: chinook
  table: customer
transform:
  - uses: add_field
    with:
      expression: concat(firstname, ' ', lastname)
      field: fullname
      language: sql
  - uses: remove_field
    with:
      fields:
        - field: firstname
        - field: lastname
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['cust:', customerid])
        language: jmespath
```
