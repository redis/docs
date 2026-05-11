---
Title: Denormalization with redis.lookup
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Denormalization with redis.lookup
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

You can use the
[`redis.lookup`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/lookup" >}})
transformation to read existing data from Redis during the `transform` stage of a
job. This is useful when you want to denormalize incoming change data by enriching
a record with values that RDI has already written to Redis from another table
(see [Data denormalization]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization" >}}) for more information about this technique).

For example, a pipeline for the Chinook database might write `artist` records to
Redis, then use `redis.lookup` in
an `album` table job to add selected artist details
to each album record before writing it to the target database. This lets you
design the structure of your Redis data to fit the read patterns of your
application while still keeping the source database normalized.

## Denormalizing a hash

The `redis.lookup` transformation works by executing a Redis command and adding the
result to the record. You specify the command and its arguments in the
`transform` configuration with the `cmd` and `args` properties. For example, the
following transformation job uses the
[`HGET`]({{< relref "/commands/hget" >}}) command to read the `name` field from an
artist [hash]({{< relref "/develop/data-types/hashes" >}}) and adds it to the
album record under the `artist` field. A particularly important thing to note
here is that the `args` elements are all interpreted as [JMESPath](https://jmespath.org/)
expressions, but YAML syntax allows for each element to be a quoted string. This means that
you must *double quote* any string arguments that you want to be treated as
literal strings (as with `name` below), otherwise JMESPath will try to interpret
them as field names, which will generally give the wrong result. Specifically, use
a different quote character for the outer quotes and the inner quotes.

```yaml
source:
  table: album
transform:
  - uses: redis.lookup
    with:
      connection: target
      cmd: HGET
      args:
        - concat(['artist:artistid:', artistid])
        - '`name`'
      language: jmespath
      field: artist
output:
  - uses: redis.write
    with:
      connection: target
      data_type: hash
      key:
        expression: concat(['album:albumid:', albumid])
        language: jmespath
```

Without denormalization, the album hash object contains only the `artistid` field to
reference the artist:

```bash
> hgetall album:albumid:1
1) "albumid"
2) "1"
3) "title"
4) "For Those About To Rock We Salute You"
5) "artistid"
6) "1"
```

After running the job specified above, querying one of the album hash objects shows the
extra `artist` field obtained by looking up the artist with the `artistid`:

```bash
> hgetall album:albumid:1
1) "albumid"
2) "1"
3) "title"
4) "For Those About To Rock We Salute You"
5) "artistid"
6) "1"
7) "artist"
8) "AC/DC"
```

## Denormalizing a JSON document

If you are using [JSON]({{< relref "/develop/data-types/json" >}}) objects,
you can denormalize to include the whole of one object
as a field of another. The following example shows how to do this using a temporary field
to hold the result of the `redis.lookup` command. It then uses
[`add_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/add_field" >}})
to insert the new field and
[`remove_field`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/remove_field" >}})
to remove the temporary field and the now-redundant `artistid` field before writing the album object.

```yaml
source:
  table: album
transform:
  - uses: redis.lookup
    with:
      connection: target
      cmd: JSON.GET
      args:
        - concat(['artist:artistid:', artistid])
      language: jmespath
      field: artiststring
  - uses: add_field
    with:
      field: artist
      language: jmespath
      expression: json_parse(artiststring)
  - uses: remove_field
    with:
      fields:
        - field: artistid
        - field: artiststring
output:
  - uses: redis.write
    with:
      connection: target
      data_type: json
      key:
        expression: concat(['album:albumid:', albumid])
        language: jmespath
```

After running this job, the album JSON object includes the artist object
in a new `artist` field:

```json
{
  "albumid": 239,
  "title": "War",
  "artist": {
    "artistid": 150,
    "name": "U2"
  }
}
```
