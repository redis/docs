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
weight: 5
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

```js
await client.sAdd("ip_tracker", new_ip_address);
```

The set can only contain each key once, so if the same address
appears again during the day, the new instance will not change
the set. At the end of the day, you could get the exact number of
distinct addresses using the `sCard()` function:

```js
const num_distinct_ips = await client.sCard("ip_tracker");
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
Note that you must use the `bf` property to access the Bloom filter commands.

```js
const res1 = await client.bf.mAdd(
    "recorded_users",
    ["andy", "cameron", "david", "michelle"]
);
console.log(res1);  // >>> [true, true, true, true]

const res2 = await client.bf.exists("recorded_users", "cameron");
console.log(res2);  // >>> true

const res3 = await client.bf.exists("recorded_users", "kaitlyn");
console.log(res3);  // >>> false
```

A Cuckoo filter has similar features to a Bloom filter, but also supports
a deletion operation to remove hashes from a set, as shown in the example
below. Note that you must use the `cf` property to access the Cuckoo filter
commands.

```js
const res4 = await client.cf.add("other_users", "paolo");
console.log(res4);  // >>> true

const res5 = await client.cf.add("other_users", "kaitlyn");
console.log(res5);  // >>> true

const res6 = await client.cf.add("other_users", "rachel");
console.log(res6);  // >>> true

const res7 = await client.cf.exists("other_users", "paolo");
const res7a = await client.cf.exists("other_users", "kaitlyn");
const res7b = await client.cf.exists("other_users", "rachel");
const res7c = await client.cf.exists("other_users", "andy");
console.log([res7, res7a, res7b, res7c]);  // >>> [true, true, true, false]

const res8 = await client.cf.del("other_users", "paolo");
console.log(res8);  // >>> true

const res9 = await client.cf.exists("other_users", "paolo");
console.log(res9);  // >>> false
```

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

```js
const res10 = await client.pfAdd("group:1", ["andy", "cameron", "david"]);
console.log(res10);  // >>> true

const res11 = await client.pfCount("group:1");
console.log(res11);  // >>> 3

const res12 = await client.pfAdd("group:2", ["kaitlyn", "michelle", "paolo", "rachel"]);
console.log(res12);  // >>> true

const res13 = await client.pfCount("group:2");
console.log(res13);  // >>> 4

const res14 = await client.pfMerge("both_groups", ["group:1", "group:2"]);
console.log(res14);  // >>> OK

const res15 = await client.pfCount("both_groups");
console.log(res15);  // >>> 7
```

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
Note that you must use the `cms` property to access the Count-min
sketch commands.

```js
// Specify that you want to keep the counts within 0.01
// (1%) of the true value with a 0.005 (0.5%) chance
// of going outside this limit.
const res16 = await client.cms.initByProb("items_sold", 0.01, 0.005);
console.log(res16);  // >>> OK

// The parameters for `incrBy()` are passed as an array of objects
// each containing an `item` and `incrementBy` property.
const res17 = await client.cms.incrBy(
    "items_sold",
    [
        { item: "bread", incrementBy: 300},
        { item: "tea", incrementBy: 200},
        { item: "coffee", incrementBy: 200},
        { item: "beer", incrementBy: 100}
    ]
);
console.log(res17);  // >>> [300, 200, 200, 100]

const res18 = await client.cms.incrBy(
    "items_sold",    
    [
        { item: "bread", incrementBy: 100},
        { item: "coffee", incrementBy: 150}
    ]
);
console.log(res18);  // >>> [400, 350]

const res19 = await client.cms.query(
    "items_sold",
    ["bread", "tea", "coffee", "beer"]
);
console.log(res19);  // >>> [400, 200, 350, 100]
```

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
data set. Note that you must use the `tDigest` property to access the
t-digest commands.

```js
const res20 = await client.tDigest.create("male_heights");
console.log(res20);  // >>> OK

const res21 = await client.tDigest.add(
    "male_heights",
    [175.5, 181, 160.8, 152, 177, 196, 164]
);
console.log(res21);  // >>> OK

const res22 = await client.tDigest.min("male_heights");
console.log(res22);  // >>> 152

const res23 = await client.tDigest.max("male_heights");
console.log(res23);  // >>> 196

const res24 = await client.tDigest.quantile("male_heights", [0.75]);
console.log(res24);  // >>> [181]

// Note that the CDF value for 181 is not exactly
// 0.75. Both values are estimates.
const res25 = await client.tDigest.cdf("male_heights", [181]);
console.log(res25);  // >>> [0.7857142857142857]

const res26 = await client.tDigest.create("female_heights");
console.log(res26);  // >>> OK

const res27 = await client.tDigest.add(
    "female_heights",
    [155.5, 161, 168.5, 170, 157.5, 163, 171]
);
console.log(res27);  // >>> OK

const res28 = await client.tDigest.quantile("female_heights", [0.75]);
console.log(res28);  // >>> [170]

const res29 = await client.tDigest.merge(
    "all_heights", ["male_heights", "female_heights"]
);
console.log(res29);  // >>> OK

const res30 = await client.tDigest.quantile("all_heights", [0.75]);
console.log(res30);  // >>> [175.5]
```

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
the `topK.reserve()` method). It also shows how to list the
top *k* items and query whether or not a given item is in the
list. Note that you must use the `topK` property to access the
Top-K commands.

```js
// The `reserve()` method creates the Top-K object with
// the given key. The parameters are the number of items
// in the ranking and values for `width`, `depth`, and
// `decay`, described in the Top-K reference page.
const res31 = await client.topK.reserve(
    "top_3_songs", 3,
    { width: 7, depth: 8, decay: 0.9 }
);
console.log(res31);  // >>> OK

// The parameters for `incrBy()` are passed as an array of objects
// each containing an `item` and `incrementBy` property.
const res32 = await client.topK.incrBy(
    "top_3_songs",
    [
        { item: "Starfish Trooper", incrementBy: 3000},
        { item: "Only one more time", incrementBy: 1850},
        { item: "Rock me, Handel", incrementBy: 1325},
        { item: "How will anyone know?", incrementBy: 3890},
        { item: "Average lover", incrementBy: 4098},
        { item: "Road to everywhere", incrementBy: 770}
    ]
);
console.log(res32);
// >>> [null, null, null, 'Rock me, Handel', 'Only one more time', null]

const res33 = await client.topK.list("top_3_songs");
console.log(res33);
// >>> ['Average lover', 'How will anyone know?', 'Starfish Trooper']

const res34 = await client.topK.query(
    "top_3_songs", ["Starfish Trooper", "Road to everywhere"]
);
console.log(res34);  // >>> [true, false]
```
