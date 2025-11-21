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
description: Choose the best Redis data type for your task.
linkTitle: Compare data types
title: Compare data types
weight: 1
---

Redis provides a wide range of data types to store your data.
The following are highly specialized for precise purposes:

-   [Geospatial]({{< relref "/develop/data-types/geospatial" >}}):
    store strings with associated coordinates for geospatial queries.
-   [Vector sets]({{< relref "/develop/data-types/vector-sets" >}}):
    store strings with associated vector data (and optional metadata)
    for vector similarity queries.
-   [Probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}}):
    keep approximate counts and other statistics for large datasets.
-   [Time series]({{< relref "/develop/data-types/timeseries" >}}):
    store real-valued data points along with the time they were collected.

The remaining data types are more general-purpose:

-   [Strings]({{< relref "/develop/data-types/strings" >}}):
    store text or binary data.
-   [Hashes]({{< relref "/develop/data-types/hashes" >}}):
    store key-value pairs within a single key.
-   [JSON]({{< relref "/develop/data-types/json" >}}):
    store structured, hierarchical arrays and key-value objects that match
    the popular [JSON](https://www.json.org/json-en.html) text file format.
-   [Lists]({{< relref "/develop/data-types/lists" >}}):
    store a simple sequence of strings.
-   [Sets]({{< relref "/develop/data-types/sets" >}}):
    store a collection of unique strings.
-   [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}):
    store a collection of unique strings with associated scores.
-   [Streams]({{< relref "/develop/data-types/streams" >}}):
    store a sequence of entries, each with a set of field-value pairs.

The general-purpose data types have some overlap among their features
and indeed, you could probably emulate any of them using just strings
and a little creativity. However, each data type provides different
tradeoffs in terms of performance, memory usage, and functionality.
This guide helps you choose the best data type for your task.

## Data type features

The sections below summarize the features of each data type.

### Strings

-   **Structure**: unstructured text/binary data or simple counters,
    bit sets, or integer collections.
-   **Operations**: get, set, append, increment, decrement, bitwise operations.
-   **Suitable for**: Unstructured documents, counters, flags, bitmaps.

Strings are mainly useful for storing text or binary data chunks
whose internal structure will be managed by your own application.
However, they also support operations to access ranges of bits
in the string to use as bit sets, integers, or floating-point numbers.


### Hashes

-   **Structure**: collection of key-value pairs.
-   **Operations**: get, set, delete, increment, decrement.
-   **Suitable for**: Simple objects with a small number of fields.

Hashes are mainly useful for storing objects with a small number of fields
that are not nested or intricately structured. However, there is
no real limit to the number of fields you can store in a hash, so you
can use hashes in many different ways inside your application.
The field values are strings, but hashes provide commands to treat
them as integers or floating-point numbers and perform simple arithmetic
operations on them. You can set expirations on individual hash fields
and you can also index and query hash documents using the Redis
[query engine]({{< relref "/develop/ai/search-and-query" >}}).

### JSON

-   **Structure**: hierarchical arrays and key-value objects that match
    the popular [JSON](https://www.json.org/json-en.html) text file format.
-   **Operations**: get, set, update, delete, query.
-   **Suitable for**: Complex, nested objects with many fields.

JSON provides rich data modeling capabilities with nested fields and arrays.
You can use a simple path syntax to access any subset of the data within
a JSON document. JSON also has more powerful and flexible
[query engine]({{< relref "/develop/ai/search-and-query" >}})
features compared to hashes.

### Lists

-   **Structure**: simple sequence of strings.
-   **Operations**: push, pop, get, set, trim.
-   **Suitable for**: Queues, stacks, logs, and other linear data structures.

Lists store sequences of string values. They are optimized for
adding and removing small numbers of elements at the head or tail,
and so they are very efficient for implementing queues, stacks,
and deques.

### Sets

-   **Structure**: collection of unique strings.
-   **Operations**: add, remove, test membership, intersect, union, difference.
-   **Suitable for**: Unique items with no associated data.

Sets store collections of unique strings. They provide efficient
operations for testing membership, adding and removing elements.
They also support set operations like intersection, union, and difference.

### Sorted sets

-   **Structure**: collection of unique strings with associated scores.
-   **Operations**: add, remove, test membership, range by score or rank.
-   **Suitable for**: Unique items with a score, or ordered collections.

Sorted sets store collections of unique strings with associated scores.
They are optimized for efficient range queries based on the score,
and so they are useful for implementing priority queues and other ordered
collections.

### Streams

-   **Structure**: sequence of entries, each with a set of field-value pairs.
-   **Operations**: add, read, trim.
-   **Suitable for**: Log data, time series, and other append-only structures.

Streams store sequences of entries, each with a set of field-value pairs.
They are optimized for appending new entries and reading them in order,
and so they are useful for implementing log data, time series, and other
append-only data structures. They also have built-in support for consumer groups
to manage multiple readers and ensure at-least-once delivery.


