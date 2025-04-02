---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Overview of data types supported by Redis
linkTitle: Understand data types
title: Understand Redis data types
hideListLinks: true
weight: 35
---

Redis is a data structure server.
At its core, Redis provides a collection of native data types that help you solve a wide variety of problems, from [caching]({{< relref "/develop/data-types/strings" >}}) to
[queuing]({{< relref "/develop/data-types/lists" >}}) to
[event processing]({{< relref "/develop/data-types/streams" >}}).
Below is a short description of each data type, with links to broader overviews and command references.
Each overview includes a comprehensive tutorial with code samples.

## Data types

[Redis Open Source]({{< relref "/operate/oss_and_stack" >}})
implements the following data types:

- [String](#strings)
- [Hash](#hashes)
- [List](#lists)
- [Set](#sets)
- [Sorted set](#sorted-sets)
- [Stream](#streams)
- [Bitmap](#bitmaps)
- [Bitfield](#bitfields)
- [Geospatial](#geospatial-indexes)
- [JSON](#json)
- [Probabilistic data types](#probabilistic-data-types)
- [Time series](#time-series)

### Strings 

[Redis strings]({{< relref "/develop/data-types/strings" >}}) are the most basic Redis data type, representing a sequence of bytes.
For more information, see:

* [Overview of Redis strings]({{< relref "/develop/data-types/strings" >}})
* [Redis string command reference]({{< relref "/commands/" >}}?group=string)

### Lists

[Redis lists]({{< relref "/develop/data-types/lists" >}}) are lists of strings sorted by insertion order.
For more information, see:

* [Overview of Redis lists]({{< relref "/develop/data-types/lists" >}})
* [Redis list command reference]({{< relref "/commands/" >}}?group=list)

### Sets

[Redis sets]({{< relref "/develop/data-types/sets" >}}) are unordered collections of unique strings that act like the sets from your favorite programming language (for example, [Java HashSets](https://docs.oracle.com/javase/7/docs/api/java/util/HashSet.html), [Python sets](https://docs.python.org/3.10/library/stdtypes.html#set-types-set-frozenset), and so on).
With a Redis set, you can add, remove, and test for existence in O(1) time (in other words, regardless of the number of set elements).
For more information, see:

* [Overview of Redis sets]({{< relref "/develop/data-types/sets" >}})
* [Redis set command reference]({{< relref "/commands/" >}}?group=set)

### Hashes

[Redis hashes]({{< relref "/develop/data-types/hashes" >}}) are record types modeled as collections of field-value pairs.
As such, Redis hashes resemble [Python dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [Java HashMaps](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html), and [Ruby hashes](https://ruby-doc.org/core-3.1.2/Hash.html).
For more information, see:

* [Overview of Redis hashes]({{< relref "/develop/data-types/hashes" >}})
* [Redis hashes command reference]({{< relref "/commands/" >}}?group=hash)

### Sorted sets

[Redis sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) are collections of unique strings that maintain order by each string's associated score.
For more information, see:

* [Overview of Redis sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
* [Redis sorted set command reference]({{< relref "/commands/" >}}?group=sorted-set)

### Streams

A [Redis stream]({{< relref "/develop/data-types/streams" >}}) is a data structure that acts like an append-only log.
Streams help record events in the order they occur and then syndicate them for processing.
For more information, see:

* [Overview of Redis Streams]({{< relref "/develop/data-types/streams" >}})
* [Redis Streams command reference]({{< relref "/commands/" >}}?group=stream)

### Geospatial indexes

[Redis geospatial indexes]({{< relref "/develop/data-types/geospatial" >}}) are useful for finding locations within a given geographic radius or bounding box.
For more information, see:

* [Overview of Redis geospatial indexes]({{< relref "/develop/data-types/geospatial" >}})
* [Redis geospatial indexes command reference]({{< relref "/commands/" >}}?group=geo)

### Bitmaps

[Redis bitmaps]({{< relref "/develop/data-types/bitmaps" >}}) let you perform bitwise operations on strings. 
For more information, see:

* [Overview of Redis bitmaps]({{< relref "/develop/data-types/bitmaps" >}})
* [Redis bitmap command reference]({{< relref "/commands/" >}}?group=bitmap)

### Bitfields

[Redis bitfields]({{< relref "/develop/data-types/bitfields" >}}) efficiently encode multiple counters in a string value.
Bitfields provide atomic get, set, and increment operations and support different overflow policies.
For more information, see:

* [Overview of Redis bitfields]({{< relref "/develop/data-types/bitfields" >}})
* The [`BITFIELD`]({{< relref "/commands/bitfield" >}}) command.

### JSON

[Redis JSON]({{< relref "/develop/data-types/json" >}}) provides
structured, hierarchical arrays and key-value objects that match
the popular [JSON](https://www.json.org/json-en.html) text file
format. You can import JSON text into Redis objects and access,
modify, and query individual data elements.
For more information, see:

- [Overview of Redis JSON]({{< relref "/develop/data-types/json" >}})
- [JSON command reference]({{< relref "/commands" >}}?group=json)

### Probabilistic data types

These data types let you gather and calculate statistics in a way
that is approximate but highly efficient. The following types are
available:

- [HyperLogLog](#hyperloglog)
- [Bloom filter](#bloom-filter)
- [Cuckoo filter](#cuckoo-filter)
- [t-digest](#t-digest)
- [Top-K](#top-k)
- [Count-min sketch](#count-min-sketch)

### HyperLogLog

The [Redis HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}}) data structures provide probabilistic estimates of the cardinality (i.e., number of elements) of large sets. For more information, see:

* [Overview of Redis HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
* [Redis HyperLogLog command reference]({{< relref "/commands/" >}}?group=hyperloglog)

### Bloom filter

[Redis Bloom filters]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}})
let you check for the presence or absence of an element in a set. For more
information, see:

- [Overview of Redis Bloom filters]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}})
- [Bloom filter command reference]({{< relref "/commands" >}}?group=bf)

### Cuckoo filter

[Redis Cuckoo filters]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})
let you check for the presence or absence of an element in a set. They are similar to
[Bloom filters](#bloom-filter) but with slightly different trade-offs between features
and performance. For more information, see:

- [Overview of Redis Cuckoo filters]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})
- [Cuckoo filter command reference]({{< relref "/commands" >}}?group=cf)

### t-digest

[Redis t-digest]({{< relref "/develop/data-types/probabilistic/t-digest" >}})
structures estimate percentiles from a stream of data values. For more
information, see:

- [Redis t-digest overview]({{< relref "/develop/data-types/probabilistic/t-digest" >}})
- [t-digest command reference]({{< relref "/commands" >}}?group=tdigest)

### Top-K

[Redis Top-K]({{< relref "/develop/data-types/probabilistic/top-k" >}})
structures estimate the ranking of a data point within a stream of values.
For more information, see:

- [Redis Top-K overview]({{< relref "/develop/data-types/probabilistic/top-k" >}})
- [Top-K command reference]({{< relref "/commands" >}}?group=topk)

### Count-min sketch

[Redis Count-min sketch]({{< relref "/develop/data-types/probabilistic/count-min-sketch" >}})
estimate the frequency of a data point within a stream of values.
For more information, see:

- [Redis Count-min sketch overview]({{< relref "/develop/data-types/probabilistic/count-min-sketch" >}})
- [Count-min sketch command reference]({{< relref "/commands" >}}?group=cms)

## Time series

[Redis time series]({{< relref "/develop/data-types/timeseries" >}})
structures let you store and query timestamped data points.
For more information, see:

- [Redis time series overview]({{< relref "/develop/data-types/timeseries" >}})
- [Count-min sketch command reference]({{< relref "/commands" >}}?group=timeseries)

## Adding extensions

To extend the features provided by the included data types, use one of these options:

1. Write your own custom [server-side functions in Lua]({{< relref "/develop/interact/programmability/" >}}).
1. Write your own Redis module using the [modules API]({{< relref "/develop/reference/modules/" >}}) or check out the [community-supported modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/" >}}).
