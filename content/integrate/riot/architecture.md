---
description: RIOT architecture
linkTitle: Architecture
title: Architecture
type: integration
weight: 4
---

{{< image filename="/integrate/riot/images/architecture.svg" >}}

RIOT processes data in batch fashion: a fixed number of records (a batch or a chunk) is read, processed, and written at a time.
Then the cycle is repeated until there is no more data on the source.

## Keys

Import commands ([`file-import`]({{< relref "/integrate/riot/files#file_import" >}}), [`faker-import`]({{< relref "/integrate/riot/generators#faker" >}}), [`db-import`]({{< relref "/integrate/riot/databases#database-import" >}})) construct keys from input records by concatenating a keyspace prefix with the field names.

{{< image filename="/integrate/riot/images/mapping.png" >}}

## Batching

The default batch size is 50, which means that an execution step reads 50 items at a time from the source, processes them, and writes them to the target.
If the target is Redis, writing is done in a single command (see [Redis Pipelining](https://redis.io/topics/pipelining)) to minimize the number of roundtrips to the server.

You can change the batch size (and hence the pipeline size) using the `--batch` option.
The optimal batch size in terms of throughput depends on many factors like record size and command types. See [Redis Pipeline Tuning](https://stackoverflow.com/a/32165090) for details.

**Batching example**

```
riot faker-import value="random.nextDouble" --count 10 --batch 1 --sleep 1
    --skip-policy never ts.add --keyspace ts:gen --value value
```

## Multi-threading

It is possible to parallelize processing by using multiple threads.
In this configuration, each chunk of items is read, processed, and written in a separate thread of execution.
This is different from partitioning where items would be read by multiple readers.
Here, only one reader is being accessed from multiple threads.

To set the number of threads, use the `--threads` option.

**Multi-threading example**

```
riot db-import "SELECT * FROM orders" --url "jdbc:postgresql://host:port/database"
    --username appuser --password passwd --threads 3 hset --keyspace order
    --keys order_id
```

## Processing

Processors are applied to records in the following order:

* Transforms
* Regular expressions
* Filters

### Transforms

Transforms allow you to create, update, and delete fields using the [Spring Expression Language](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#expressions) (SpEL):

* `field1='foo'` -> generate a field named `field1` containing the string `foo`
* `temp=(temp-32)*5/9` -> convert temperature from Fahrenheit to Celsius
* `name=remove(first).concat(remove(last))` -> concatenate `first` and `last` fields and delete them
* `field2=null` -> delete `field2`

Input fields are accessed by name (e.g., `field3=field1+field2`).

The transform processor also exposes functions and variables that can be accessed using the `#` prefix:

* `date`: Date parser/formatter ([Java date format](https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html)).
* `geo`: Convenience method that takes a longitude and a latitude to produce a RediSearch geo-location string in the form `longitude,latitude`.
* `index`: Sequence number of the item being generated.
* `redis`: Handle to invoke Redis commands ([Lettuce API](https://lettuce.io/core/release/api/io/lettuce/core/api/sync/RedisCommands.html)).

**Transform processor example**

```
riot file-import --process epoch="#date.parse(mydate).getTime()" location="#geo(lon,lat)" id="#index" name="#redis.hget('person1','lastName')" ...
```

### Regular expressions

Extract patterns from source fields using regular expressions:
```
riot file-import --regex name="(?<first>\w+)\/(?<last>\w+)" ...
```

### Filters

Filters allow you to exclude records that don’t match a SpEL boolean expression.

For example this filter will only keep records where the `value` field is a series of digits:

```
riot file-import --filter "value matches '\\d+'" ...
```
