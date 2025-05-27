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
description: Learn how to use approximate calculations with Redis.
linkTitle: Probabilistic data types
title: Probabilistic data types
weight: 45
---

Redis supports several
[probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}})
that let you calculate values approximately rather than exactly.
The types fall into two basic categories:

-   [Set operations](#set-operations): These types let you calculate (approximately)
    the number of items in a set of distinct values, and whether or not a given value is
    a member of a set.
-   [Statistics](#statistics): These types give you an approximation of
    statistics such as the percentile, rank, and frequency of numeric data points in a list.

To see why these approximate calculations would be useful, consider the task of
counting the number of distinct IP addresses that access a website in one day.

Assuming that you already have code that supplies you with each IP
address as a string, you could record the addresses in Redis using
a [set]({{< relref "/develop/data-types/sets" >}}):

```py
r.sadd("ip_tracker", new_ip_address)
```

The set can only contain each key once, so if the same address
appears again during the day, the new instance will not change
the set. At the end of the day, you could get the exact number of
distinct addresses using the `scard()` function:

```py
num_distinct_ips = r.scard("ip_tracker")
```

This approach is simple, effective, and precise but if your website
is very busy, the `ip_tracker` set could become very large and consume
a lot of memory.

The count of distinct IP addresses would probably be rounded to the
nearest thousand or more when the usage statistics are delivered, so
getting it exactly right is not important. It would be useful
if you could trade off some precision in exchange for lower memory
consumption. The probabilistic data types provide exactly this kind of
trade-off. Specifically, you can count the approximate number of items in a
set using the
[HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
data type, as described below.

In general, the probabilistic data types let you perform approximations with a
bounded degree of error that have much lower memory or execution time than
the equivalent precise calculations.

## Set operations

Redis supports the following approximate set operations:

-   [Membership](#set-membership): The Bloom filter and Cuckoo filter data types
    let you track whether or not a given item is a member of a set.
-   [Cardinality](#set-cardinality): The HyperLogLog data type gives you an approximate
    value for the number of items in a set, also known as the *cardinality* of
    the set.

The sections below describe these operations in more detail.

### Set membership

[Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}}) and
[Cuckoo filter]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})
objects provide a set membership operation that lets you track whether or not a
particular item has been added to a set. These two types provide different
trade-offs for memory usage and speed, so you can select the best one for your
use case. Note that for both types, there is an asymmetry between presence and
absence of items in the set. If an item is reported as absent, then it is definitely
absent, but if it is reported as present, then there is a small chance it may really be
absent.

Instead of storing strings directly, like a [set]({{< relref "/develop/data-types/sets" >}}),
a Bloom filter records the presence or absence of the
[hash value](https://en.wikipedia.org/wiki/Hash_function) of a string.
This gives a very compact representation of the
set's membership with a fixed memory size, regardless of how many items you
add. The following example adds some names to a Bloom filter representing
a list of users and checks for the presence or absence of users in the list.
Note that you must use the `bf()` method to access the Bloom filter commands.

<!--
```py
res1 = r.bf().madd("recorded_users", "andy", "cameron", "david", "michelle")
print(res1)  # >>> [1, 1, 1, 1]

res2 = r.bf().exists("recorded_users", "cameron")
print(res2)  # >>> 1

res3 = r.bf().exists("recorded_users", "kaitlyn")
print(res3)  # >>> 0
```
-->
{{< clients-example home_prob_dts bloom Python >}}
{{< /clients-example >}}

A Cuckoo filter has similar features to a Bloom filter, but also supports
a deletion operation to remove hashes from a set, as shown in the example
below. Note that you must use the `cf()` method to access the Cuckoo filter
commands.

<!--
```py
res4 = r.cf().add("other_users", "paolo")
print(res4)  # >>> 1

res5 = r.cf().add("other_users", "kaitlyn")
print(res5)  # >>> 1

res6 = r.cf().add("other_users", "rachel")
print(res6)  # >>> 1

res7 = r.cf().mexists("other_users", "paolo", "rachel", "andy")
print(res7)  # >>> [1, 1, 0]

res8 = r.cf().delete("other_users", "paolo")
print(res8)

res9 = r.cf().exists("other_users", "paolo")
print(res9)  # >>> 0
```
-->
{{< clients-example home_prob_dts cuckoo Python >}}
{{< /clients-example >}}

Which of these two data types you choose depends on your use case.
Bloom filters are generally faster than Cuckoo filters when adding new items,
and also have better memory usage. Cuckoo filters are generally faster
at checking membership and also support the delete operation. See the
[Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}}) and
[Cuckoo filter]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})
reference pages for more information and comparison between the two types.

### Set cardinality

A [HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
object calculates the cardinality of a set. As you add
items, the HyperLogLog tracks the number of distinct set members but
doesn't let you retrieve them or query which items have been added.
You can also merge two or more HyperLogLogs to find the cardinality of the
union of the sets they represent.

<!--
```py
res10 = r.pfadd("group:1", "andy", "cameron", "david")
print(res10)  # >>> 1

res11 = r.pfcount("group:1")
print(res11)  # >>> 3

res12 = r.pfadd("group:2", "kaitlyn", "michelle", "paolo", "rachel")
print(res12)  # >>> 1

res13 = r.pfcount("group:2")
print(res13)  # >>> 4

res14 = r.pfmerge("both_groups", "group:1", "group:2")
print(res14)  # >>> True

res15 = r.pfcount("both_groups")
print(res15)  # >>> 7
```
-->
{{< clients-example home_prob_dts hyperloglog Python >}}
{{< /clients-example >}}

The main benefit that HyperLogLogs offer is their very low
memory usage. They can count up to 2^64 items with less than
1% standard error using a maximum 12KB of memory. This makes
them very useful for counting things like the total of distinct
IP addresses that access a website or the total of distinct
bank card numbers that make purchases within a day.

## Statistics

Redis supports several approximate statistical calculations
on numeric data sets:

-   [Frequency](#frequency): The Count-min sketch data type lets you
    find the approximate frequency of a labeled item in a data stream.
-   Percentiles: The t-digest data type estimates the percentile
    of a supplied value in a data stream.
-   Ranking: The Top-K data type estimates the ranking of items
    by frequency in a data stream.

### Frequency

A [Count-min sketch]({{< relref "/develop/data-types/probabilistic/count-min-sketch" >}})
(CMS) object keeps count of a set of related items represented by
string labels. The count is approximate, but you can specify
how close you want to keep the count to the true value (as a fraction)
and the acceptable probability of failing to keep it in this
desired range. For example, you can request that the count should
stay within 0.1% of the true value and have a 0.05% probability
of going outside this limit.

{{< clients-example home_prob_dts cms Python >}}
{{< /clients-example >}}

The advantage of using a CMS over keeping an exact count with a
[sorted set]({{< relref "/develop/data-types/sorted-sets" >}})
is that that a CMS has very low and fixed memory usage, even for
large numbers of items. Use CMS objects to keep daily counts of
items sold, accesses to individual web pages on your site, and
other similar statistics.

### Percentiles


