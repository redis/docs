---
aliases:
- /develop/data-types/array/
bannerText: Array is a new data type that is currently in preview and may be subject to change.
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Introduction to Redis arrays
linkTitle: Arrays
title: Redis arrays
weight: 15
---

{{< command-group group="array" title="Array command summary" show_link=true >}}

Redis arrays are sparse, index-addressable data structures that map integer indexes (in the range 0 to 2⁶⁴−1) to string values. Unlike lists, elements are accessed directly by index rather than by position in a sequence, and you can set any index without allocating the gaps between occupied slots. This makes arrays well-suited for timestamped event logs, ring buffers over streaming measurements, sliding-window analytics, and other workloads that involve sparse or high-index access patterns.

## Basic usage

Use [`ARSET`]({{< relref "/commands/arset" >}}) to write one or more contiguous values starting at a given index, and [`ARGET`]({{< relref "/commands/arget" >}}) to read the value at an index. Accessing an unset index returns a nil reply.

{{< clients-example set="arrays_tutorial" step="arset_arget" description="Write contiguous values with ARSET and read a single index with ARGET; an unset index returns nil" >}}
> ARSET events:1 0 "login" "click" "purchase"
(integer) 3
> ARGET events:1 0
"login"
> ARGET events:1 999
(nil)
{{< /clients-example >}}

To write values at arbitrary, non-contiguous indexes, use [`ARMSET`]({{< relref "/commands/armset" >}}). To read several indexes in one round trip, use [`ARMGET`]({{< relref "/commands/armget" >}}):

{{< clients-example set="arrays_tutorial" step="armset_armget" description="Write to arbitrary, non-contiguous indexes with ARMSET and read several indexes in one round trip with ARMGET" >}}
> ARMSET metrics 0 "10" 5 "20" 100 "30"
(integer) 3
> ARMGET metrics 0 5 100 999
1) "10"
2) "20"
3) "30"
4) (nil)
{{< /clients-example >}}

## Array length vs. element count

Redis arrays expose two distinct size measurements:

- [`ARLEN`]({{< relref "/commands/arlen" >}}) returns the *logical length*: the highest set index plus one.
- [`ARCOUNT`]({{< relref "/commands/arcount" >}}) returns the number of *non-empty* elements.

For a sparse array, these values can differ substantially:

{{< clients-example set="arrays_tutorial" step="len_count" description="Compare the logical length (ARLEN) with the number of non-empty elements (ARCOUNT) for a sparse array" >}}
> ARSET sparse 0 "a"
(integer) 1
> ARSET sparse 1000000 "b"
(integer) 1
> ARLEN sparse
(integer) 1000001
> ARCOUNT sparse
(integer) 2
{{< /clients-example >}}

## Reading ranges

[`ARGETRANGE`]({{< relref "/commands/argetrange" >}}) returns every position in a range—including empty slots as nil—in index order. Reversing `start` and `end` reverses the direction:

{{< clients-example set="arrays_tutorial" step="argetrange" description="Read every position in a range with ARGETRANGE, including empty slots returned as nil" >}}
> ARMSET seq 0 "a" 1 "b" 3 "d"
(integer) 3
> ARGETRANGE seq 0 3
1) "a"
2) "b"
3) (nil)
4) "d"
{{< /clients-example >}}

To iterate only the elements that exist and retrieve their indexes alongside their values, use [`ARSCAN`]({{< relref "/commands/arscan" >}}). It skips empty slots and returns a flat list of alternating index-value pairs, with an optional `LIMIT` to cap the result size:

{{< clients-example set="arrays_tutorial" step="arscan" description="Iterate only the elements that exist with ARSCAN, retrieving each index alongside its value" buildsUpon="argetrange" >}}
> ARSCAN seq 0 3
1) (integer) 0
2) "a"
3) (integer) 1
4) "b"
5) (integer) 3
6) "d"
{{< /clients-example >}}

## Sequential insertion

[`ARINSERT`]({{< relref "/commands/arinsert" >}}) appends values using an internal cursor that advances automatically after each call. Use [`ARNEXT`]({{< relref "/commands/arnext" >}}) to inspect where the next insert would land, and [`ARSEEK`]({{< relref "/commands/arseek" >}}) to reposition the cursor:

{{< clients-example set="arrays_tutorial" step="arinsert" description="Append values with ARINSERT using an auto-advancing cursor, inspect it with ARNEXT, and reposition it with ARSEEK" >}}
> ARINSERT log "event1"
(integer) 0
> ARINSERT log "event2"
(integer) 1
> ARNEXT log
(integer) 2
> ARSEEK log 10
(integer) 1
> ARINSERT log "event3"
(integer) 10
{{< /clients-example >}}

## Ring buffer mode

[`ARRING`]({{< relref "/commands/arring" >}}) turns an array into a fixed-size circular buffer. Each call inserts a value at `insert_idx % size`, wrapping back to index `0` once the window is full and overwriting the oldest entry:

{{< clients-example set="arrays_tutorial" step="arring" description="Use ARRING to maintain a fixed-size circular buffer that wraps and overwrites the oldest entry once full" >}}
> ARRING readings 3 "v0"
(integer) 0
> ARRING readings 3 "v1"
(integer) 1
> ARRING readings 3 "v2"
(integer) 2
> ARRING readings 3 "v3"
(integer) 0
> ARGET readings 0
"v3"
{{< /clients-example >}}

[`ARLASTITEMS`]({{< relref "/commands/arlastitems" >}}) retrieves the *N* most recently inserted elements in chronological order. Pass the `REV` flag to reverse the order:

{{< clients-example set="arrays_tutorial" step="arlastitems" description="Retrieve the N most recently inserted elements with ARLASTITEMS, optionally reversing the order with REV" buildsUpon="arring" >}}
> ARLASTITEMS readings 3
1) "v1"
2) "v2"
3) "v3"
> ARLASTITEMS readings 3 REV
1) "v3"
2) "v2"
3) "v1"
{{< /clients-example >}}

## Aggregate operations

[`AROP`]({{< relref "/commands/arop" >}}) performs a single-pass aggregate over a contiguous range of elements:

| Operation | Description |
|-----------|-------------|
| `SUM` | Sum of numeric values |
| `MIN` | Minimum numeric value |
| `MAX` | Maximum numeric value |
| `AND` / `OR` / `XOR` | Bitwise operation on integer values |
| `MATCH value` | Count of elements equal to `value` |
| `USED` | Count of non-empty elements in the range |

{{< clients-example set="arrays_tutorial" step="arop" description="Run a single-pass aggregate over a contiguous range with AROP, such as SUM, MAX, or a MATCH count" >}}
> ARMSET scores 0 "10" 1 "20" 2 "30"
(integer) 3
> AROP scores 0 2 SUM
"60"
> AROP scores 0 2 MAX
"30"
> AROP scores 0 2 MATCH "10"
(integer) 1
{{< /clients-example >}}

## Searching elements

[`ARGREP`]({{< relref "/commands/argrep" >}}) finds elements in a range whose values match one or more textual predicates and returns their indexes. Empty slots are skipped. Four predicate forms are supported: `EXACT` (full equality), `MATCH` (substring), `GLOB` (the same wildcard syntax as [`SCAN`]({{< relref "/commands/scan" >}}) `MATCH`), and `RE` (regular expression). Multiple predicates are combined with `OR` by default, or with `AND` when the option is given. Pass `NOCASE` for case-insensitive comparisons, `WITHVALUES` to return matching values alongside their indexes, and `LIMIT` to cap the number of matches.

This is particularly useful when an array stores line-indexed text such as a log file, where each element holds one line:

{{< clients-example set="arrays_tutorial" step="argrep" description="Find elements matching textual predicates (EXACT, MATCH, GLOB, RE) with ARGREP, combined with AND or OR" >}}
> ARMSET log 0 "boot: ok" 1 "warn: disk" 2 "ERROR: cpu" 3 "info: ready" 4 "error: net"
(integer) 5
> ARGREP log - + MATCH "error" NOCASE
1) (integer) 2
2) (integer) 4
> ARGREP log 0 4 GLOB "warn:*" OR GLOB "error:*" WITHVALUES
1) (integer) 1
2) "warn: disk"
3) (integer) 4
4) "error: net"
{{< /clients-example >}}

The special values `-` and `+` denote the first and last index of the array. Combined with [ring buffer mode](#ring-buffer-mode), this lets a fixed-size array hold the most recent *N* log lines and be searched in place.

## Deleting elements

[`ARDEL`]({{< relref "/commands/ardel" >}}) deletes one or more elements by index and returns the count of elements actually removed. [`ARDELRANGE`]({{< relref "/commands/ardelrange" >}}) removes all elements within an index range; reversing `start` and `end` is supported:

{{< clients-example set="arrays_tutorial" step="ardel" description="Delete elements by index with ARDEL or remove a whole index range with ARDELRANGE" buildsUpon="arop" >}}
> ARDEL scores 1
(integer) 1
> ARDELRANGE scores 0 2
(integer) 2
{{< /clients-example >}}

Deleting the last remaining element removes the key entirely.

## Introspection

[`ARINFO`]({{< relref "/commands/arinfo" >}}) returns metadata about an array's internal structure, including its logical length, element count, and next insert index. Pass the `FULL` option to include per-slice statistics such as fill rates and counts of dense versus sparse slices:

```
> ARINFO readings
 1) "len"
 2) (integer) 3
 3) "count"
 4) (integer) 3
 5) "next-insert-index"
 6) (integer) 0
...
```

## Configuration

The following configuration parameters affect array behavior:
- `array-slice-size`
- `array-sparse-kmax`
- `array-sparse-kmin`

See the [Redis configuration page]({{< relref "/operate/oss_and_stack/management/config" >}}) for details.

## Performance

Most array commands are O(1), including [`ARSET`]({{< relref "/commands/arset" >}}), [`ARGET`]({{< relref "/commands/arget" >}}), [`ARDEL`]({{< relref "/commands/ardel" >}}), [`ARINSERT`]({{< relref "/commands/arinsert" >}}), [`ARNEXT`]({{< relref "/commands/arnext" >}}), [`ARSEEK`]({{< relref "/commands/arseek" >}}), [`ARCOUNT`]({{< relref "/commands/arcount" >}}), and [`ARLEN`]({{< relref "/commands/arlen" >}}). Operations that touch N elements—such as [`ARGETRANGE`]({{< relref "/commands/argetrange" >}}), [`ARSCAN`]({{< relref "/commands/arscan" >}}), [`ARDELRANGE`]({{< relref "/commands/ardelrange" >}}), [`AROP`]({{< relref "/commands/arop" >}}), and [`ARLASTITEMS`]({{< relref "/commands/arlastitems" >}})—are O(N). The underlying sliced-array encoding handles both dense and sparse access patterns efficiently, so large index gaps consume very little memory.

## Alternatives

Arrays complement rather than replace the other Redis collection types:

- Use [Redis lists]({{< relref "/develop/data-types/lists" >}}) when you need push/pop operations at either end, or when you need to insert elements between existing ones.
- Use [Redis hashes]({{< relref "/develop/data-types/hashes" >}}) when values are addressed by field name rather than by numeric index.
- Use [Redis streams]({{< relref "/develop/data-types/streams" >}}) when you need an append-only event log with consumer groups and acknowledgements.

## Limits

[`ARGETRANGE`]({{< relref "/commands/argetrange" >}}) enforces a hard limit of 1,000,000 elements per call to guard against accidentally large range reads.
