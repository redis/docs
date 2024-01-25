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
weight: 35
---

Redis is a data structure server.
At its core, Redis provides a collection of native data types that help you solve a wide variety of problems, from [caching]({{< relref "/develop/use/client-side-caching" >}}) to [queuing]({{< relref "/develop/data-types/lists" >}}) to [event processing]({{< relref "/develop/data-types/streams" >}}).
Below is a short description of each data type, with links to broader overviews and command references.

If you'd like to try a comprehensive tutorial for each data structure, see their overview pages below.


## Core

### Strings 

[Redis strings]({{< relref "/develop/data-types/strings" >}}) are the most basic Redis data type, representing a sequence of bytes.
For more information, see:

* [Overview of Redis strings]({{< relref "/develop/data-types/strings" >}})
* [Redis string command reference]({{< relref "/commands/?group=string" >}})

### Lists

[Redis lists]({{< relref "/develop/data-types/lists" >}}) are lists of strings sorted by insertion order.
For more information, see:

* [Overview of Redis lists]({{< relref "/develop/data-types/lists" >}})
* [Redis list command reference]({{< relref "/commands/?group=list" >}})

### Sets

[Redis sets]({{< relref "/develop/data-types/sets" >}}) are unordered collections of unique strings that act like the sets from your favorite programming language (for example, [Java HashSets](https://docs.oracle.com/javase/7/docs/api/java/util/HashSet.html), [Python sets](https://docs.python.org/3.10/library/stdtypes.html#set-types-set-frozenset), and so on).
With a Redis set, you can add, remove, and test for existence in O(1) time (in other words, regardless of the number of set elements).
For more information, see:

* [Overview of Redis sets]({{< relref "/develop/data-types/sets" >}})
* [Redis set command reference]({{< relref "/commands/?group=set" >}})

### Hashes

[Redis hashes]({{< relref "/develop/data-types/hashes" >}}) are record types modeled as collections of field-value pairs.
As such, Redis hashes resemble [Python dictionaries](https://docs.python.org/3/tutorial/datastructures.html#dictionaries), [Java HashMaps](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html), and [Ruby hashes](https://ruby-doc.org/core-3.1.2/Hash.html).
For more information, see:

* [Overview of Redis hashes]({{< relref "/develop/data-types/hashes" >}})
* [Redis hashes command reference]({{< relref "/commands/?group=hash" >}})

### Sorted sets

[Redis sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) are collections of unique strings that maintain order by each string's associated score.
For more information, see:

* [Overview of Redis sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
* [Redis sorted set command reference]({{< relref "/commands/?group=sorted-set" >}})

### Streams

A [Redis stream]({{< relref "/develop/data-types/streams" >}}) is a data structure that acts like an append-only log.
Streams help record events in the order they occur and then syndicate them for processing.
For more information, see:

* [Overview of Redis Streams]({{< relref "/develop/data-types/streams" >}})
* [Redis Streams command reference]({{< relref "/commands/?group=stream" >}})

### Geospatial indexes

[Redis geospatial indexes]({{< relref "/develop/data-types/geospatial" >}}) are useful for finding locations within a given geographic radius or bounding box.
For more information, see:

* [Overview of Redis geospatial indexes]({{< relref "/develop/data-types/geospatial" >}})
* [Redis geospatial indexes command reference]({{< relref "/commands/?group=geo" >}})

### Bitmaps

[Redis bitmaps]({{< relref "/develop/data-types/bitmaps" >}}) let you perform bitwise operations on strings. 
For more information, see:

* [Overview of Redis bitmaps]({{< relref "/develop/data-types/bitmaps" >}})
* [Redis bitmap command reference]({{< relref "/commands/?group=bitmap" >}})

### Bitfields

[Redis bitfields]({{< relref "/develop/data-types/bitfields" >}}) efficiently encode multiple counters in a string value.
Bitfields provide atomic get, set, and increment operations and support different overflow policies.
For more information, see:

* [Overview of Redis bitfields]({{< relref "/develop/data-types/bitfields" >}})
* The [`BITFIELD`]({{< relref "/commands/bitfield" >}}) command.

### HyperLogLog

The [Redis HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}}) data structures provide probabilistic estimates of the cardinality (i.e., number of elements) of large sets. For more information, see:

* [Overview of Redis HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
* [Redis HyperLogLog command reference]({{< relref "/commands/?group=hyperloglog" >}})

## Extensions

To extend the features provided by the included data types, use one of these options:

1. Write your own custom [server-side functions in Lua]({{< relref "/develop/interact/programmability/" >}}).
1. Write your own Redis module using the [modules API]({{< relref "/develop/reference/modules/" >}}) or check out the [community-supported modules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/" >}}).
1. Use [JSON]({{< relref "/develop/data-types/json/" >}}), [querying]({{< relref "/develop/interact/search-and-query/" >}}), [time series]({{< relref "/develop/data-types/timeseries/" >}}), and other capabilities provided by [Redis Stack]({{< relref "/operate/oss_and_stack/" >}}).

<hr>
