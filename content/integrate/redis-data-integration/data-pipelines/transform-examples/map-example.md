---
Title: Restructure JSON or hash objects
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Restructure objects
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

By default, RDI adds fields to
[hash]({{< relref "/develop/data-types/hashes" >}}) or
[JSON]({{< relref "/develop/data-types/json" >}}) objects in the target
database that closely match the columns of the source table.
If you just want to limit the set fields in the output and/or rename some of them, you can use the
[`output mapping`]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples/remapping-the-output" >}}) configuration option.

For situations where you want to create a new object structure with multiple levels or use calculations for the field values, you can use the
[`map`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/map" >}})
transformation. Take a look at the following examples to see how to use the `map` transformation:

## Creating multilevel JSON objects

You can use the `map` transformation to create a new structure for the output data, which can include nested objects and calculated fields. The `map` transformation allows you to define a new structure using an expression language, such as SQL or JavaScript.

```yaml
source:
  db: chinook
  table: employee

transform:
  - uses: map
    with:
      expression: |
        {
          "id": employeeid,
          "name": concat([firstname, ' ', upper(lastname)]),
          "address": {
            "street": address,
            "city": city,
            "state": state,
            "postalCode": postalcode,
            "country": country
          },
          "contact": {
            "phone": phone,
            "safeEmail": replace(replace(email, '@', '_at_'), '.', '_dot_')
          }
        }
      language: jmespath

output:
  - uses: redis.write
    with:
      data_type: json
      key:
        expression: concat(['emp:', id])
        language: jmespath
```


The example above creates a new JSON object with the following structure:
 - A top-level `id` field that is the same as the `employeeid` field in the source table.
 - A `name` field that is a concatenation of the `firstname` and `lastname` fields, with the `lastname` converted to uppercase.
 - An `address` subobject that contains the `address`, `city`, `state`, `postalcode`, and `country` fields.
 - A `contact` subobject that contains the `phone` field and a modified version of the `email` field, where the '@' sign and dots are replaced with '_at_' and '_dot_' respectively.

In the `output` section of the job file, we specify that we want to write
to a JSON object with a custom key. Note that in the `output` section, you must refer to
fields defined in the `map` transformation, so we use the new name `id`
for the key instead of `employeeid`.



If you query one of the new JSON objects, you see output like the following:

```bash
> JSON.GET emp:1 $
"[{\"id\":1,\"name\":\"Andrew ADAMS\",\"address\":{\"street\":\"11120 Jasper Ave NW\",\"city\":\"Edmonton\",\"state\":\"AB\",\"postalCode\":\"T5K 2N1\",\"country\":\"Canada\"},\"contact\":{\"phone\":\"+1 (780) 428-9482\",\"safeEmail\":\"andrew_at_chinookcorp_dot_com\"}}]"
```

Formatted in the usual JSON style, the output looks like the sample below:

```json
{
  "id": 1,
  "name": "Andrew ADAMS",
  "address": {
    "street": "11120 Jasper Ave NW",
    "city": "Edmonton",
    "state": "AB",
    "postalCode": "T5K 2N1",
    "country": "Canada"
  },
  "contact": {
    "phone": "+1 (780) 428-9482",
    "safeEmail": "andrew_at_chinookcorp_dot_com"
  }
}
```

## Creating hash structure

This example creates a new [hash]({{< relref "/develop/data-types/hashes" >}})
object structure for items from the `track` table. Here, the `map` transformation uses
[SQL](https://en.wikipedia.org/wiki/SQL) for the expression because this is often
more suitable for hashes or "flat"
JSON objects without subobjects or arrays. The expression renames some of the fields.
It also calculates more human-friendly representations for the track duration (originally
stored in the `milliseconds` field) and the storage size (originally stored in the
`bytes` field).

The full example is shown below:

```yaml
source:
  db: chinook
  table: track
transform:
  - uses: map
    with:
      expression:
          id: trackid
          name: name
          duration: concat(floor(milliseconds / 60000), ':', floor(mod(milliseconds / 1000, 60)))
          storagesize: concat(round(bytes / 1048576.0, 2), 'MB')
      language: sql
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat('track:', id)
        language: sql
```

If you query the data for one of the `track` hash objects, you see output
like the following:

```bash
> hgetall track:16
1) "id"
2) "16"
3) "name"
4) "Dog Eat Dog"
5) "duration"
6) "3:35.0"
7) "storagesize"
8) "6.71MB"
```
