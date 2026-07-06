---
Title: Reading Redis data with redis.lookup
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
linkTitle: Reading Redis data with redis.lookup
summary: Redis Data Integration keeps Redis in sync with a primary database in near
  real time.
type: integration
weight: 40
---

You can use the
[`redis.lookup`]({{< relref "/integrate/redis-data-integration/reference/data-transformation/lookup" >}})
transformation to read existing data from Redis during the `transform` stage of a
job. This lets you enrich an incoming record with values that are already present
in the target database.

For example, a pipeline for the Chinook database might read an `artist` record
that is already stored in Redis and use `redis.lookup` in an `album` table job to
add selected artist details to each album record before writing it to the target
database.

{{< warning >}}
Do not rely on `redis.lookup` to *denormalize* data that RDI writes from another
table in the **same pipeline**. RDI can't guarantee that the looked-up data will be
present or up to date when the lookup runs, for the following reasons:

- **Snapshot order isn't guaranteed.** During the initial snapshot, RDI can't
  guarantee that the table you look up is ingested before the table that depends
  on it. If a dependent job runs before the referenced key has been written, the
  lookup misses.
- **Change (CDC) order isn't guaranteed.** If a parent and child record are
  inserted or updated at around the same time, RDI has no way to order these
  events, so the lookup can still miss.
- **Parent updates don't refresh existing keys.** Even if the lookup succeeds,
  updating the source record later does *not* update the keys that already copied
  its values. The denormalized data becomes stale.

The only case where `redis.lookup` is safe for enrichment is when you can guarantee
that the looked-up data is present in the target database *independently* of the
RDI pipeline (for example, a reference table that is loaded and maintained
separately).

To denormalize data that RDI ingests, use a supported technique instead. See
[Data denormalization]({{< relref "/integrate/redis-data-integration/data-pipelines/data-denormalization" >}})
for one-to-one joins (using `merge`) and one-to-many joins (using nesting).
{{< /warning >}}

## Reading a hash field

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

Before the lookup runs, the album hash object contains only the `artistid` field to
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

## Embedding a JSON document

If you are using [JSON]({{< relref "/develop/data-types/json" >}}) objects,
you can read the whole of one object and embed it
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
