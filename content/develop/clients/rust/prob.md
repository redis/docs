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
description: Learn how to use Bloom filter set membership and HyperLogLog approximate cardinality with redis-rs.
linkTitle: Probabilistic data types
title: Probabilistic data types
weight: 45
---

Redis supports several
[probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}})
that let you calculate values approximately rather than exactly.
The `redis-rs` high-level command traits include support for
[Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}})
set membership and
[HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
cardinality estimation.

{{< note >}}
This page covers Bloom filters and HyperLogLog because `redis-rs` provides
dedicated high-level methods for them. Other probabilistic data types,
such as Cuckoo filters, Count-min sketch, t-digest, and Top-K, can still be
called with low-level Redis commands, but they don't currently have dedicated
high-level `redis-rs` methods.
{{< /note >}}

## Set membership

A [Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}})
lets you track whether or not a particular item has been added to a set.
Instead of storing the items themselves, like a
[set]({{< relref "/develop/data-types/sets" >}}), a Bloom filter records the
presence or absence of the
[hash value](https://en.wikipedia.org/wiki/Hash_function) of each item. This
gives a very compact representation of the set's membership with a fixed memory
size, regardless of how many items you add. Note that there is an asymmetry
between presence and absence of items in the set: if an item is reported as
absent, then it is definitely absent, but if it is reported as present, then
there is a small chance it may really be absent.

The `redis-rs` command traits provide high-level `bf_add`, `bf_madd`,
`bf_exists`, and `bf_mexists` methods, among others. The following example adds
some names to a Bloom filter representing a list of users and then checks for
the presence or absence of users in the list.

{{< clients-example set="home_prob_dts" step="bloom" lang_filter="Rust-Sync,Rust-Async" description="Set membership: Use Bloom filter to efficiently track item presence with minimal memory overhead" difficulty="beginner" >}}
{{< /clients-example >}}

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
