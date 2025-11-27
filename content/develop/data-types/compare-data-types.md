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

## Choose a data type

The sections below explore the pros and cons of each data type for
particular tasks. Note that you should regard
the suggestions as "rules-of-thumb" rather than strict prescriptions, since
there are potentially many subtle reasons to prefer one data type over another.

### Documents

You would normally store document data using the string, hash, or JSON
types. JSON generally has the highest requirements for memory and processing,
followed by hashes, and then strings. Use the decision tree below as a guide to
choosing the best data type for your task.

```decision-tree
rootQuestion: root
questions:
    root:
        text: |
            Do you need nested data structures (fields and arrays) or geospatial
            index/query with Redis query engine?
        whyAsk: |
            JSON is the only document type that supports deeply nested structures and integrates with the query engine for those structures
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use JSON"
                    id: jsonOutcome
            no:
                value: "No"
                nextQuestion: hashQuestion
    hashQuestion:
        text: |
            Do you need to index/query using Redis query engine but can live
            without nested data structures and geospatial indexing?
        whyAsk: |
            Hashes support indexing and querying with lower memory overhead and faster field access than JSON
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use hashes"
                    id: hashOutcome
            no:
                value: "No"
                nextQuestion: expirationQuestion
    expirationQuestion:
        text: |
            Do you need to set expiration times on individual pieces of data
            within the document?
        whyAsk: "Only hashes support efficient field-level access and expiration"
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use hashes"
                    id: hashOutcome
            no:
                value: "No"
                nextQuestion: fieldAccessQuestion
    fieldAccessQuestion:
        text: |
            Do you need frequent access to individual data fields within the
            document, but the fields are simple integers or bits that you can easily 
            refer to by an integer index?
        whyAsk: |
            Strings and hashes support efficient field access, but strings are more compact and efficient if you only need bit fields with integer indices
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use strings"
                    id: stringOutcome
            no:
                value: "No"
                nextQuestion: stringQuestion
    stringQuestion:
        text: |
            Do you need frequent access to individual data fields within the
            document that have string or binary data values?
        whyAsk: |
            Hashes support general field access, but strings are more compact and efficient if you don't need it
        answers:
            yes:
                value: "Yes"
                outcome:
                    label: "Use hashes"
                    id: hashOutcome
            no:
                value: "No"
                outcome:
                    label: "Use strings"
                    id: stringOutcome
```

### Collections

You would normally store collection data using the set or sorted set
types and for very simple collections, you can even use strings. They all allow
basic membership tests, but have different additional features and tradeoffs.
Sorted sets have the highest memory overhead and processing requirements, followed
by sets, and then strings.
Use the considerations below as a guide to choosing the best data type for your task.
Note that if you need to store extra information for the keys in a set
or sorted set, you can do so with an auxiliary hash or JSON object that has field
names matching the keys in the collection.

1.  Do you need to store and retrieve the keys in an arbitrary order or in  
    lexicographical order?

    If so, use **sorted sets** since they are the only collection type that supports ordered iteration.

2.  Are the keys always simple integer indices in a known range?

    If so, use the bitmap features of **strings** for minimum memory overhead and efficient random access. String bitmaps also support bitwise operations
    that are equivalent to set operations such as union, intersection, and difference.

3.  For arbitrary string or binary keys, use **sets** for efficient membership tests and  
    set operations. If you *only* need membership tests on the keys, but you
    need to store extra information for each key, consider using **hashes** with
    the keys as field names.

### Sequences

You would normally store sequences of string or binary data using sorted sets,
lists or streams. They each have advantages and disadvantages for particular purposes.  
Use the considerations below as a guide to choosing the best data type for your task.

1.  Do you frequently need to do any of the following?
    
    -   Maintain an arbitrary priority order or lexicographical order of the elements
    -   Access individual elements or ranges of elements by index
    -   Perform basic set operations on the elements

    If so, use **sorted sets** since they are the only sequence type that supports these 
    operations directly.

2.  Do you need to store and retrieve elements primarily in timestamp order or
    manage multiple consumers reading from the sequence?

    If so, use **streams** since they are the only sequence type that supports these
    features natively.

3.  For simple sequences of string or binary data, use **lists** for efficient
    push/pop operations at the head or tail.
