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
description: Learn how to use HyperLogLog approximate cardinality with redis-rs.
linkTitle: Probabilistic data types
title: Probabilistic data types
weight: 45
---

Redis supports several
[probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}})
that let you calculate values approximately rather than exactly.
The `redis-rs` high-level command traits include support for
[HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
cardinality estimation.

{{< note >}}
This page covers HyperLogLog because `redis-rs` provides high-level
`pfadd`, `pfcount`, and `pfmerge` methods. Other probabilistic data types,
such as Bloom filters, Count-min sketch, t-digest, and Top-K, can still be
called with low-level Redis commands, but they don't currently have dedicated
high-level `redis-rs` methods.
{{< /note >}}

## Set cardinality

A HyperLogLog object calculates the approximate cardinality of a set. As you add
items, the HyperLogLog tracks the number of distinct set members, but it doesn't
let you retrieve those members or test whether a specific item was added.

You can also merge two or more HyperLogLogs to find the approximate cardinality
of the [union](https://en.wikipedia.org/wiki/Union_(set_theory)) of the sets
they represent.

{{< clients-example set="home_prob_dts" step="hyperloglog" lang_filter="Rust-Sync,Rust-Async" description="Set cardinality: Estimate distinct item count using HyperLogLog with minimal memory usage" difficulty="beginner" >}}
{{< /clients-example >}}

The main benefit that HyperLogLogs offer is their very low memory usage. They
can count up to 2^64 items with less than 1% standard error using a maximum
12KB of memory.

## More information

See the following pages to learn more:

- [HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
- [`redis-rs` command trait](https://docs.rs/redis/latest/redis/trait.Commands.html)
- [`redis-rs` async command trait](https://docs.rs/redis/latest/redis/trait.AsyncCommands.html)
