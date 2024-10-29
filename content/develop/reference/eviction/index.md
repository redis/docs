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
description: Overview of Redis key eviction policies (LRU, LFU, etc.)
linkTitle: Eviction
title: Key eviction
weight: 6
---

Redis is commonly used as a cache to speed up read accesses to a slower server
or database. Since cache entries are copies of persistently-stored data, it
is usually safe to evict them when the cache runs out of RAM (they can be
cached again in the future if necessary).

Redis lets you specify an eviction policy to evict keys automatically
when the size of the cache exceeds a set memory limit. The sections below
explain how to [configure this limit](#maxmem) and also describe the available
[eviction policies](#eviction-policies) and when to use them.

## `Maxmemory` configuration directive {#maxmem}

The `maxmemory` configuration directive configures Redis
to use a specified amount of memory for the data set. You can
set `maxmemory` with the `redis.conf` file at startup time, or
with the [`CONFIG SET`]({{< relref "/commands/config-set" >}}) command at runtime.

For example, to configure a memory limit of 100 megabytes, you can use the
following directive inside the `redis.conf` file:

```
maxmemory 100mb
```

Set `maxmemory` to zero to specify that you don't want to limit the memory
for the dataset. This is the default behavior for 64 bit systems, while 32 bit
systems use an implicit memory limit of 3GB.

When the size of your cache reaches the limit set by `maxmemory`, Redis will
enforce your chosen [eviction policy](#eviction-policies) to prevent any
further growth of the cache.

## Eviction policies

Use the `maxmemory-policy` configuration directive to choose the eviction
policy to use when the limit set by `maxmemory` is reached.

The following policies are available:

-   `noeviction`: Keys are not evicted but the server won't execute any commands
    that add new data to the cache. If your database uses replication then this
    condition only applies to the primary database.
-   `allkeys-lru`: Evict the least recently used (LRU) keys.
-   `allkeys-lfu`: Evict the least frequently used (LFU) keys.
-   `allkeys-random`: Evict keys at random.
-   `volatile-lru`: Evict the least recently used keys that have the `expire` field
    set to `true`.
-   `volatile-lfu`: Evict the least frequently used keys that have the `expire` field
    set to `true`.
-   `volatile-random`: Evict keys at random only if they have the `expire` field set
    to `true`.
-   `volatile-ttl`: Evict keys with the `expire` field set to `true` that have the
    shortest remaining time-to-live (TTL) value.

The `volatile-xxx` policies behave like `noeviction` if no keys have the `expire`
field set to true, or if no keys have a time-to-live value set in the case of
`volatile-ttl`.

You should choose an eviction policy that fits the way your app
accesses keys. You may be able to predict the access pattern in advance
but you can also 

Picking the right eviction policy is important depending on the access pattern
of your application, however you can reconfigure the policy at runtime while
the application is running, and monitor the number of cache misses and hits
using the Redis [`INFO`]({{< relref "/commands/info" >}}) output to tune your setup.

In general as a rule of thumb:

-   Use `allkeys-lru` when you expect that a subset of elements will be accessed far
    more often than the rest. This is a very common case according to the
    [Pareto principle](https://en.wikipedia.org/wiki/Pareto_principle), so
    `allkeys-lru` is a good default option if you have no reason to prefer any others.
-   Use `allkeys-random` when you expect all keys to be accessed with roughly equal
    frequency. An examples of this is when your app reads data items in a repeating cycle.
-   Use `volatile-ttl` 
if you want to be able to provide hints to Redis about what are
    good candidate for expiration by using different TTL values when you create your
    cache objects.

The **volatile-lru** and **volatile-random** policies are mainly useful when you want to use a single instance for both caching and to have a set of persistent keys. However it is usually a better idea to run two Redis instances to solve such a problem.

It is also worth noting that setting an `expire` value to a key costs memory, so using a policy like **allkeys-lru** is more memory efficient since there is no need for an `expire` configuration for the key to be evicted under memory pressure.

## How the eviction process works

It is important to understand that the eviction process works like this:

* A client runs a new command, resulting in more data added.
* Redis checks the memory usage, and if it is greater than the `maxmemory` limit , it evicts keys according to the policy.
* A new command is executed, and so forth.

So we continuously cross the boundaries of the memory limit, by going over it, and then by evicting keys to return back under the limits.

If a command results in a lot of memory being used (like a big set intersection stored into a new key) for some time, the memory limit can be surpassed by a noticeable amount.

## Approximated LRU algorithm

Redis LRU algorithm is not an exact implementation. This means that Redis is
not able to pick the *best candidate* for eviction, that is, the key that
was accessed the furthest in the past. Instead it will try to run an approximation
of the LRU algorithm, by sampling a small number of keys, and evicting the
one that is the best (with the oldest access time) among the sampled keys.

However, since Redis 3.0 the algorithm was improved to also take a pool of good
candidates for eviction. This improved the performance of the algorithm, making
it able to approximate more closely the behavior of a real LRU algorithm.

What is important about the Redis LRU algorithm is that you **are able to tune** the precision of the algorithm by changing the number of samples to check for every eviction. This parameter is controlled by the following configuration directive:

    maxmemory-samples 5

The reason Redis does not use a true LRU implementation is because it
costs more memory. However, the approximation is virtually equivalent for an
application using Redis. This figure compares
the LRU approximation used by Redis with true LRU.

![LRU comparison](lru_comparison.png)

The test to generate the above graphs filled a Redis server with a given number of keys. The keys were accessed from the first to the last. The first keys are the best candidates for eviction using an LRU algorithm. Later more 50% of keys are added, in order to force half of the old keys to be evicted.

You can see three kind of dots in the graphs, forming three distinct bands.

* The light gray band are objects that were evicted.
* The gray band are objects that were not evicted.
* The green band are objects that were added.

In a theoretical LRU implementation we expect that, among the old keys, the first half will be expired. The Redis LRU algorithm will instead only *probabilistically* expire the older keys.

As you can see Redis 3.0 does a better job with 5 samples compared to Redis 2.8, however most objects that are among the latest accessed are still retained by Redis 2.8. Using a sample size of 10 in Redis 3.0 the approximation is very close to the theoretical performance of Redis 3.0.

Note that LRU is just a model to predict how likely a given key will be accessed in the future. Moreover, if your data access pattern closely
resembles the power law, most of the accesses will be in the set of keys
the LRU approximated algorithm can handle well.

In simulations we found that using a power law access pattern, the difference between true LRU and Redis approximation were minimal or non-existent.

However you can raise the sample size to 10 at the cost of some additional CPU
usage to closely approximate true LRU, and check if this makes a
difference in your cache misses rate.

To experiment in production with different values for the sample size by using
the `CONFIG SET maxmemory-samples <count>` command, is very simple.

## The new LFU mode

Starting with Redis 4.0, the [Least Frequently Used eviction mode](http://antirez.com/news/109) is available. This mode may work better (provide a better
hits/misses ratio) in certain cases. In LFU mode, Redis will try to track
the frequency of access of items, so the ones used rarely are evicted. This means
the keys used often have a higher chance of remaining in memory.

To configure the LFU mode, the following policies are available:

* `volatile-lfu` Evict using approximated LFU among the keys with an expire set.
* `allkeys-lfu` Evict any key using approximated LFU.

LFU is approximated like LRU: it uses a probabilistic counter, called a [Morris counter](https://en.wikipedia.org/wiki/Approximate_counting_algorithm) to estimate the object access frequency using just a few bits per object, combined with a decay period so that the counter is reduced over time. At some point we no longer want to consider keys as frequently accessed, even if they were in the past, so that the algorithm can adapt to a shift in the access pattern.

That information is sampled similarly to what happens for LRU (as explained in the previous section of this documentation) to select a candidate for eviction.

However unlike LRU, LFU has certain tunable parameters: for example, how fast
should a frequent item lower in rank if it gets no longer accessed? It is also possible to tune the Morris counters range to better adapt the algorithm to specific use cases.

By default Redis is configured to:

* Saturate the counter at, around, one million requests.
* Decay the counter every one minute.

Those should be reasonable values and were tested experimentally, but the user may want to play with these configuration settings to pick optimal values.

Instructions about how to tune these parameters can be found inside the example `redis.conf` file in the source distribution. Briefly, they are:

```
lfu-log-factor 10
lfu-decay-time 1
```

The decay time is the obvious one, it is the amount of minutes a counter should be decayed, when sampled and found to be older than that value. A special value of `0` means: we will never decay the counter.

The counter *logarithm factor* changes how many hits are needed to saturate the frequency counter, which is just in the range 0-255. The higher the factor, the more accesses are needed to reach the maximum. The lower the factor, the better is the resolution of the counter for low accesses, according to the following table:

```
+--------+------------+------------+------------+------------+------------+
| factor | 100 hits   | 1000 hits  | 100K hits  | 1M hits    | 10M hits   |
+--------+------------+------------+------------+------------+------------+
| 0      | 104        | 255        | 255        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 1      | 18         | 49         | 255        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 10     | 10         | 18         | 142        | 255        | 255        |
+--------+------------+------------+------------+------------+------------+
| 100    | 8          | 11         | 49         | 143        | 255        |
+--------+------------+------------+------------+------------+------------+
```

So basically the factor is a trade off between better distinguishing items with low accesses VS distinguishing items with high accesses. More information is available in the example `redis.conf` file.
