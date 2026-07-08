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
description: Scan go-redis command results into Go values and use buffers for large string payloads.
linkTitle: Efficient result handling
title: Handle command results efficiently
weight: 37
---

`go-redis` can convert command results directly into Go values. This is useful
when you want to keep application code close to your domain types instead of
working with strings and maps everywhere. You can scan [hash]({{< relref "/develop/data-types/hashes" >}})
results into structs, scan list-style command results into slices, and use
byte buffers for large [string]({{< relref "/develop/data-types/strings" >}})
values.

## Initialize

Import the packages you need:

{{< clients-example set="go_scan_buffer" step="import" lang_filter="Go" description="Foundational: Import go-redis and supporting packages for scanning and buffer examples" difficulty="beginner" >}}
{{< /clients-example >}}

Connect to Redis:

{{< clients-example set="go_scan_buffer" step="connect" lang_filter="Go" description="Foundational: Connect to Redis before running scan and buffer examples" difficulty="beginner" >}}
{{< /clients-example >}}

## Scan hashes into structs

Use struct tags of the form `redis:"field"` to map Redis hash fields to Go
struct fields. The `Scan()` method converts matching fields to the destination
types and returns an error if a conversion fails.

The following example stores a hash with [`HSET`]({{< relref "/commands/hset" >}})
and then scans the result of [`HGETALL`]({{< relref "/commands/hgetall" >}})
into a `Bike` struct:

{{< clients-example set="go_scan_buffer" step="scan_hash" lang_filter="Go" description="Structured results: Scan all hash fields into a Go struct using redis field tags" difficulty="beginner" >}}
{{< /clients-example >}}

You can also scan a subset of fields with [`HMGET`]({{< relref "/commands/hmget" >}}).
Fields that are not returned keep their Go zero values:

{{< clients-example set="go_scan_buffer" step="scan_hash_subset" lang_filter="Go" description="Structured results: Scan selected hash fields and leave missing fields at their zero values" difficulty="intermediate" buildsUpon="scan_hash" >}}
{{< /clients-example >}}

## Scan lists into slices

Commands that return a list of strings, such as [`LRANGE`]({{< relref "/commands/lrange" >}}),
can use `ScanSlice()` to convert the result into a typed Go slice:

{{< clients-example set="go_scan_buffer" step="scan_list" lang_filter="Go" description="Structured results: Convert a list command result into a typed Go slice with ScanSlice" difficulty="beginner" >}}
{{< /clients-example >}}

## Use byte buffers

For large string payloads, you can avoid creating a new string for every read by
providing a caller-owned byte buffer. Use `SetFromBuffer()` to write a `[]byte`
value and `GetToBuffer()` to read the value into an existing buffer.

{{< note >}}
The buffer APIs require `github.com/redis/go-redis/v9` v9.21.0
or later.
{{< /note >}}
&nbsp;

{{< clients-example set="go_scan_buffer" step="buffer_round_trip" lang_filter="Go" description="Buffer optimization: Write and read Redis string values using caller-owned byte buffers" difficulty="intermediate" >}}
{{< /clients-example >}}

`GetToBuffer()` returns a `*redis.ZeroCopyStringCmd`. Use `Val()` or `Result()`
to get the number of bytes read, `Bytes()` to access the populated slice
(`buf[:n]`), and `Err()` to check for errors such as `redis.Nil` when the key
does not exist.

{{< note >}}
`GetToBuffer()` requires a buffer large enough to hold the whole value. It also
opts out of automatic retries because a failed read might already have written
partial data into your buffer. If a buffer is too small, `Err()` reports a
`buffer too small` error.
{{< /note >}}

The following example shows how to detect a buffer that is too small:

{{< clients-example set="go_scan_buffer" step="buffer_too_small" lang_filter="Go" description="Buffer sizing: Detect and handle a buffer that is too small for the Redis value" difficulty="intermediate" buildsUpon="buffer_round_trip" >}}
{{< /clients-example >}}

`SetFromBuffer()` does not set an expiration. If you need a TTL, call
[`EXPIRE`]({{< relref "/commands/expire" >}}) separately with `Expire()`, or use
`Set()` with an expiration when the extra allocation is acceptable.

## More information

See the [`go-redis`](https://github.com/redis/go-redis) repository for more
examples and API details.
