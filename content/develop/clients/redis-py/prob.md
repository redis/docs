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
    statistics such as the quantiles, ranks, and frequencies of numeric data points in
    a list.

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

You would probably round the count of distinct IP addresses to the
nearest thousand or more to deliver the usage statistics, so
getting it exactly right is not important. It would be useful
if you could trade off some accuracy in exchange for lower memory
consumption. The probabilistic data types provide exactly this kind of
trade-off. Specifically, you can count the approximate number of items in a
set using the [HyperLogLog](#set-cardinality) data type, as described below.

In general, the probabilistic data types let you perform approximations with a
bounded degree of error that have much lower memory consumption or execution
time than the equivalent precise calculations.

## Set operations

Redis supports the following approximate set operations:

-   [Membership](#set-membership): The
    [Bloom filter]({{< relref "/develop/data-types/probabilistic/bloom-filter" >}}) and
    [Cuckoo filter]({{< relref "/develop/data-types/probabilistic/cuckoo-filter" >}})
    data types let you track whether or not a given item is a member of a set.
-   [Cardinality](#set-cardinality): The
    [HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
    data type gives you an approximate value for the number of items in a set, also
    known as the *cardinality* of the set.

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

```py
res1 = r.bf().madd("recorded_users", "andy", "cameron", "david", "michelle")
print(res1)  # >>> [1, 1, 1, 1]

res2 = r.bf().exists("recorded_users", "cameron")
print(res2)  # >>> 1

res3 = r.bf().exists("recorded_users", "kaitlyn")
print(res3)  # >>> 0
```

<!-- < clients-example home_prob_dts bloom Python >}}
< /clients-example >}} -->

A Cuckoo filter has similar features to a Bloom filter, but also supports
a deletion operation to remove hashes from a set, as shown in the example
below. Note that you must use the `cf()` method to access the Cuckoo filter
commands.

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
print(res8)  # >>> 1

res9 = r.cf().exists("other_users", "paolo")
print(res9)  # >>> 0
```

<!-- < clients-example home_prob_dts cuckoo Python >}}
< /clients-example >}} -->

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
[union](https://en.wikipedia.org/wiki/Union_(set_theory)) of the sets they
represent.

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

<!-- < clients-example home_prob_dts hyperloglog Python >}}
< /clients-example >}} -->

The main benefit that HyperLogLogs offer is their very low
memory usage. They can count up to 2^64 items with less than
1% standard error using a maximum 12KB of memory. This makes
them very useful for counting things like the total of distinct
IP addresses that access a website or the total of distinct
bank card numbers that make purchases within a day.

## Statistics

Redis supports several approximate statistical calculations
on numeric data sets:

-   [Frequency](#frequency): The
    [Count-min sketch]({{< relref "/develop/data-types/probabilistic/count-min-sketch" >}})
    data type lets you find the approximate frequency of a labeled item in a data stream.
-   [Quantiles](#quantiles): The
    [t-digest]({{< relref "/develop/data-types/probabilistic/t-digest" >}})
    data type estimates the quantile of a query value in a data stream.
-   [Ranking](#ranking): The
    [Top-K]({{< relref "/develop/data-types/probabilistic/top-k" >}}) data type
    estimates the ranking of labeled items by frequency in a data stream.

The sections below describe these operations in more detail.

### Frequency

A [Count-min sketch]({{< relref "/develop/data-types/probabilistic/count-min-sketch" >}})
(CMS) object keeps count of a set of related items represented by
string labels. The count is approximate, but you can specify
how close you want to keep the count to the true value (as a fraction)
and the acceptable probability of failing to keep it in this
desired range. For example, you can request that the count should
stay within 0.1% of the true value and have a 0.05% probability
of going outside this limit. The example below shows how to create
a Count-min sketch object, add data to it, and then query it.
Note that you must use the `cms()` method to access the Count-min
sketch commands.

```py
# Specify that you want to keep the counts within 0.01
# (0.1%) of the true value with a 0.005 (0.05%) chance
# of going outside this limit.
res16 = r.cms().initbyprob("items_sold", 0.01, 0.005)
print(res16)  # >>> True

# The parameters for `incrby()` are two lists. The count
# for each item in the first list is incremented by the
# value at the same index in the second list.
res17 = r.cms().incrby(
    "items_sold",
    ["bread", "tea", "coffee", "beer"],  # Items sold
    [300, 200, 200, 100]
)
print(res17)  # >>> [300, 200, 200, 100]

res18 = r.cms().incrby(
    "items_sold",
    ["bread", "coffee"],
    [100, 150]
)
print(res18)  # >>> [400, 350]

res19 = r.cms().query("items_sold", "bread", "tea", "coffee", "beer")
print(res19)  # >>> [400, 200, 350, 100]
```

<!-- < clients-example home_prob_dts cms Python >}}
< /clients-example >}} -->

The advantage of using a CMS over keeping an exact count with a
[sorted set]({{< relref "/develop/data-types/sorted-sets" >}})
is that that a CMS has very low and fixed memory usage, even for
large numbers of items. Use CMS objects to keep daily counts of
items sold, accesses to individual web pages on your site, and
other similar statistics.

### Quantiles

A [quantile](https://en.wikipedia.org/wiki/Quantile) is the value
below which a certain fraction of samples lie. For example, with
a set of measurements of people's heights, the quantile of 0.75 is
the value of height below which 75% of all people's heights lie.
[Percentiles](https://en.wikipedia.org/wiki/Percentile) are equivalent
to quantiles, except that the fraction is expressed as a percentage.

A [t-digest]({{< relref "/develop/data-types/probabilistic/t-digest" >}})
object can estimate quantiles from a set of values added to it
without having to store each value in the set explicitly. This can
save a lot of memory when you have a large number of samples.

The example below shows how to add data samples to a t-digest
object and obtain some basic statistics, such as the minimum and
maximum values, the quantile of 0.75, and the 
[cumulative distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function)
(CDF), which is effectively the inverse of the quantile function. It also
shows how to merge two or more t-digest objects to query the combined
data set. Note that you must use the `tdigest()` method to access the
t-digest commands.

```py
res20 = r.tdigest().create("male_heights")
print(res20)  # >>> True

res21 = r.tdigest().add(
    "male_heights",
    [175.5, 181, 160.8, 152, 177, 196, 164]
)
print(res21)  # >>> OK

res22 = r.tdigest().min("male_heights")
print(res22)  # >>> 152.0

res23 = r.tdigest().max("male_heights")
print(res23)  # >>> 196.0

res24 = r.tdigest().quantile("male_heights", 0.75)
print(res24)  # >>> 181

# Note that the CDF value for 181 is not exactly
# 0.75. Both values are estimates.
res25 = r.tdigest().cdf("male_heights", 181)
print(res25)  # >>> [0.7857142857142857]

res26 = r.tdigest().create("female_heights")
print(res26)  # >>> True

res27 = r.tdigest().add(
    "female_heights",
    [155.5, 161, 168.5, 170, 157.5, 163, 171]
)
print(res27)  # >>> OK

res28 = r.tdigest().quantile("female_heights", 0.75)
print(res28)  # >>> [170]

res29 = r.tdigest().merge(
    "all_heights", 2, "male_heights", "female_heights"
)
print(res29)  # >>> OK

res30 = r.tdigest().quantile("all_heights", 0.75)
print(res30)  # >>> [175.5]
```

<!-- < clients-example home_prob_dts tdigest Python >}}
< /clients-example >}} -->

A t-digest object also supports several other related commands, such
as querying by rank. See the
[t-digest]({{< relref "/develop/data-types/probabilistic/t-digest" >}})
reference for more information.

### Ranking

A [Top-K]({{< relref "/develop/data-types/probabilistic/top-k" >}})
object estimates the rankings of different labeled items in a data
stream according to frequency. For example, you could use this to
track the top ten most frequently-accessed pages on a website, or the
top five most popular items sold.

The example below adds several different items to a Top-K object
that tracks the top three items (this is the second parameter to
the `topk().reserve()` method). It also shows how to list the
top *k* items and query whether or not a given item is in the
list. Note that you must use the `topk()` method to access the
Top-K commands.

```py
# The `reserve()` method creates the Top-K object with
# the given key. The parameters are the number of items
# in the ranking and values for `width`, `depth`, and
# `decay`, described in the Top-K reference page.
res31 = r.topk().reserve("top_3_songs", 3, 7, 8, 0.9)
print(res31)  # >>> True

# The parameters for `incrby()` are two lists. The count
# for each item in the first list is incremented by the
# value at the same index in the second list.
res32 = r.topk().incrby(
    "top_3_songs",
    [
        "Starfish Trooper",
        "Only one more time",
        "Rock me, Handel",
        "How will anyone know?",
        "Average lover",
        "Road to everywhere"
    ],
    [
        3000,
        1850,
        1325,
        3890,
        4098,
        770
    ]
)
print(res32)
# >>> [None, None, None, 'Rock me, Handel', 'Only one more time', None]

res33 = r.topk().list("top_3_songs")
print(res33)
# >>> ['Average lover', 'How will anyone know?', 'Starfish Trooper']

res34 = r.topk().query(
    "top_3_songs", "Starfish Trooper", "Road to everywhere"
)
print(res34)  # >>> [1, 0]
```

<!-- < clients-example home_prob_dts topk Python >}}
< /clients-example >}} -->
