---
description: File import and export
linkTitle: Files
title: Files
type: integration
weight: 5
---

RIOT can import from and export to files in various formats:

- Delimited (CSV, TSV, PSV)
- Fixed-length (also known as fixed-width)
- JSON
- XML

## File import

The `file-import` command reads data from files and writes it to Redis.

The basic usage for file imports is:

```
riot -h <host> -p <port> file-import FILE... [REDIS COMMAND...]
```

To show the full usage, run:

```
riot file-import --help
```

### Redis commands

You must specify at least one Redis command as a target.

The keys that will be written are constructed from input records by concatenating the keyspace prefix and key fields.

{{< alert title="Important" >}}
Redis connection options apply to the root command (`riot`) and not to sub-commands.

In the following example, the Redis options will not be taken into account:
{{< /alert >}}

```
riot file-import my.json hset -h myredis.com -p 6380
```

### Examples

**Import into hashes with keyspace `blah:<id>`**

```
riot file-import my.json hset --keyspace blah --keys id
```

**Import into hashes and set TTL on the key**

```
riot file-import my.json hset --keyspace blah --keys id expire --keyspace blah --keys id
```

**Import into hashes in keyspace `blah:<id>` and set TTL and add each `id` to a set named `myset`**

```
riot file-import my.json hset --keyspace blah --keys id expire --keyspace blah --keys id sadd --keyspace myset --members id
```

### Paths

Paths can include [wildcard patterns](https://man7.org/linux/man-pages/man7/glob.7.html).

RIOT will try to determine the file type from its extension (e.g., `.csv` or `.json`), but you can specify it with the `--filetype` option.

Gzipped files are supported and the extension before `.gz` is used (e.g., `myfile.json.gz` -> JSON type).

**Examples**

* `/path/file.csv`
* `/path/file-*.csv`
* `/path/file.json`
* `http://data.com/file.csv`
* `http://data.com/file.json.gz`

{{< tip >}}
Use `-` to read from standard input.
{{< /tip >}}

For AWS S3 buckets you can specify access and secret keys as well as the region for the bucket.

```
riot file-import s3://my-bucket/path/file.json --s3-region us-west-1 --s3-access xxxxxx --s3-secret xxxxxx
```

For Google Cloud Storage you can specify credentials and project id for the bucket:

```
riot file-import gs://my-bucket/path/file.json --gcs-key-file key.json --gcs-project-id my-gcp-project
```

## Formats

### Delimited

The default delimiter character is comma (`,`).
It can be changed with the `--delimiter` option.

If the file has a header, use the `--header` option to automatically extract field names.
Otherwise specify the field names using the `--fields` option.

Consider this CSV file:

**[beers.csv](https://raw.githubusercontent.com/nickhould/craft-beers-dataset/master/data/processed/beers.csv)**
|   | abv   | ibu | id   | name                | style                   | brewery_id | ounces |
|---|-------|-----|------|---------------------|-------------------------|------------|--------|
| 0 | 0.05  |     | 1436 | Pub Beer            | American Pale Lager     | 408        | 12.0   |
| 1 | 0.066 |     | 2265 | Devil's Cup         | American Pale Ale (APA) | 177        | 12.0   |
| 2 | 0.071 |     | 2264 | Rise of the Phoenix | American IPA            | 177        | 12.0   |

The following command imports that CSV file into Redis as hashes using `beer` as the key prefix and `id` as primary key.
This creates hashes with keys `beer:1436`, `beer:2265`, etc.

```
riot file-import https://storage.googleapis.com/jrx/beers.csv --header hset --keyspace beer --keys id
```

This command imports a CSV file into a geospatial set named `airportgeo` with airport IDs as members:

```
riot file-import https://storage.googleapis.com/jrx/airports.csv --header --skip-limit 3 geoadd --keyspace airportgeo --members AirportID --lon Longitude --lat Latitude
```

### Fixed-length

Fixed-length files can be imported by specifying the width of each field using the `--ranges` option.

```
riot file-import https://storage.googleapis.com/jrx/accounts.fw --ranges 1 9 25 41 53 67 83 --header hset --keyspace account --keys Account
```

### JSON

The expected format for JSON files is:

```json
[
  {
    "...": "..."
  },
  {
    "...": "..."
  }
]
```

**JSON import example**

```
riot file-import https://storage.googleapis.com/jrx/beers.json hset --keyspace beer --keys id
```

JSON records are trees with potentially nested values that need to be flattened when the target is, for example, a Redis hash.

RIOT uses a field naming convention to flatten JSON objects and arrays:

**Nested object**

`{ "field": { "sub": "value" } }` -> `field.sub=value`

`{ "field": [1, 2, 3] }` ->  `field[0]=1 field[1]=2 field[2]=3`

### XML

Here is a sample XML file that can be imported by RIOT:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<records>
    <trade>
        <isin>XYZ0001</isin>
        <quantity>5</quantity>
        <price>11.39</price>
        <customer>Customer1</customer>
    </trade>
    <trade>
        <isin>XYZ0002</isin>
        <quantity>2</quantity>
        <price>72.99</price>
        <customer>Customer2c</customer>
    </trade>
    <trade>
        <isin>XYZ0003</isin>
        <quantity>9</quantity>
        <price>99.99</price>
        <customer>Customer3</customer>
    </trade>
</records>
```

**XML import example**

```
riot file-import https://storage.googleapis.com/jrx/trades.xml hset --keyspace trade --keys id
```

## File export

The `file-export` command reads data from a Redis database and writes it to a JSON or XML file, potentially gzip-compressed.

The general usage is:

```
riot -h <host> -p <port> file-export FILE
```

To show the full usage, run:

```
riot file-export --help
```

### Redis reader options

* **`--scan-count`**\
    How many keys to read at once on each call to [SCAN]({{< baseurl >}}/commands/scan#the-count-option)
* **`--scan-match`**\
    Pattern of keys to scan for (default: `*` i.e. all keys)
* **`--scan-type`**\
    Type of keys to scan for (default: all types)  
* **`--key-include`**\
    Regular expressions for keys to whitelist.
    For example `mykey:.*` will only consider keys starting with `mykey:`.
* **`--key-exclude`**\
    Regular expressions for keys to blacklist.
    For example `mykey:.*` will not consider keys starting with `mykey:`.
* **`--key-slots`**\
    Ranges of key slots to consider for processing.
    For example `0:8000` will only consider keys that fall within the range `0` to `8000`.
* **`--read-threads`**\
    How many value reader threads to use in parallel
* **`--read-batch`**\
    Number of values each reader thread should read in a pipelined call
* **`--read-queue`**\
    Max number of items that reader threads can put in the shared queue.
    When the queue is full, reader threads wait for space to become available.
    Queue size should be at least **#threads * batch**, e.g. `--read-threads 4 --read-batch 500` => `--read-queue 2000`
* **`--read-pool`**\
    Size of the connection pool shared by reader threads.
    Can be smaller than the number of threads
* **`--read-from`**\
   Which Redis cluster nodes to read from: `master`, `master_preferred`, `upstream`, `upstream_preferred`, `replica_preferred`, `replica`, `lowest_latency`, `any`, `any_replica`. See [Read-From Settings](https://github.com/lettuce-io/lettuce-core/wiki/ReadFrom-Settings#read-from-settings) for more details.
* **`--mem-limit`**\
    Maximum memory usage in megabytes for a key to be read (default: 0). Use 0 to disable memory usage checks.
* **`--mem-samples`**\
    Number of memory usage samples for a key (default: 5).

### Examples

**Compressed JSON export example**

```
riot file-export /tmp/beers.json.gz --scan-match beer:*
```

**XML export example**

```
riot file-export /tmp/redis.xml
```

**Exported file example**

```json
[
  {
    "key": "string:615",
    "ttl": -1,
    "value": "value:615",
    "type": "STRING"
  },
  {
    "key": "hash:511",
    "ttl": -1,
    "value": {
      "field1": "value511",
      "field2": "value511"
    },
    "type": "HASH"
  },
  {
    "key": "list:1",
    "ttl": -1,
    "value": [
      "member:991",
      "member:981"
    ],
    "type": "LIST"
  },
  {
    "key": "set:2",
    "ttl": -1,
    "value": [
      "member:2",
      "member:3"
    ],
    "type": "SET"
  },
  {
    "key": "zset:0",
    "ttl": -1,
    "value": [
      {
        "value": "member:1",
        "score": 1.0
      }
    ],
    "type": "ZSET"
  },
  {
    "key": "stream:0",
    "ttl": -1,
    "value": [
      {
        "stream": "stream:0",
        "id": "1602190921109-0",
        "body": {
          "field1": "value0",
          "field2": "value0"
        }
      }
    ],
    "type": "STREAM"
  }
]
```

## Dump import

RIOT can import Redis data structure files in JSON or XML formats. See [File Export]({{< relref "/integrate/riot/files#file-export" >}}) section to generate such files.

**Example**

```
riot dump-import /tmp/redis.json
```
