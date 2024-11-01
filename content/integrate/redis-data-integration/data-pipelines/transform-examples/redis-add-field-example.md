---
Title: Add a new field to a hash/JSON key
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Add a new hash/JSON field
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 30
---

By default, RDI adds fields to
[hash]({{< relref "/develop/data-types/hashes" >}}) or
[JSON]({{< relref "/develop/data-types/json" >}}) objects in the target
database that closely correspond to the columns of the source table.
This example shows how to add extra fields to the target data with the
[`add_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/add_field" >}}) transformation.

The `source` section selects the `customer` table of the
[`chinook`](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres)
database (the optional `db` field here corresponds to the
`sources.<source-name>.connection.database` field defined in
[`config.yaml`]({{< relref "/integrate/redis-data-integration/data-pipelines/data-pipelines#the-configyaml-file" >}})).

In the `transform` section, the `add_field` transformation adds an extra field called `fullname`,
which is created by concatenating the existing `firstname` and `lastname` fields using
an [SQL expression](https://www.simplilearn.com/tutorials/sql-tutorial/concat-function-in-sql).

The `output` section specifies `hash` as the `data_type` to write to the target, which
overrides the default setting of `target_data_type` defined in `config.yaml`. Also, the
`output.key` section specifies a custom key format of the form `cust:<customerid>`.

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

If you queried the generated target data from the default transformation, you would
see something like the following:

```bash
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

```bash
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

```bash
> JSON.GET cust:14 $.fulladdress
"[\"8210 111 ST NW, Edmonton, Canada, T6G 2C7\"]"
```

You can use the `add_field` and `remove_field` transformations together
to completely replace fields from the source. For example, if you add
a new `fullname` field, you might not need the separate `firstname` and `lastname`
fields. You can remove them with a job file like the following:

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
