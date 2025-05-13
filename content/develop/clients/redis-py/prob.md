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
description: Learn how to use approximate statistics with Redis.
linkTitle: Probabilistic data types
title: Probabilistic data types
weight: 45
---

Redis supports several
[probabilistic data types]({{< relref "/develop/data-types/probabilistic" >}})
that let you gather approximate statistical information. To see why
this would be useful, consider the task of counting the number
of distinct IP addresses that access a website in one day.

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
consumption and obfuscation of IP address strings. The probabilistic
data types provide exactly this kind of trade-off for statistics.
Specifically, you can count the approximate number of items in a
set using the
[HyperLogLog]({{< relref "/develop/data-types/probabilistic/hyperloglogs" >}})
data type, as described below.

## HyperLogLog

A HyperLogLog object works in a similar way to a [set]({{< relref "/develop/data-types/sets" >}}),
except that it only lets you add items and approximate the number of items
in the set (also known as the *cardinality* of the set). 
