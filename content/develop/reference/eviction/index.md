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
is usually safe to evict them when the cache runs out of memory (they can be
cached again in the future if necessary).

Redis lets you specify an eviction policy to evict keys automatically
when the size of the cache exceeds a set memory limit. Whenever a client
runs a new command that adds more data to the cache, Redis checks the memory usage.
If it is greater than the limit, Redis evicts keys according to the chosen
eviction policy until the total memory used is back below the limit.

Note that when a command adds a lot of data to the cache (for example, a big set
intersection stored into a new key), this might temporarily exceed the limit by
a large amount.

The sections below explain how to [configure the memory limit](#maxmem) for the cache
and also describe the available [eviction policies](#eviction-policies) and when to
use them.

## Using the `maxmemory` configuration directive {#maxmem}

The `maxmemory` configuration directive specifies
the maximum amount of memory to use for the cache data. You can
set `maxmemory` with the [`redis.conf`](https://github.com/redis/redis/blob/7.4.0/redis.conf)
file at startup time. For example, to configure a memory limit of 100 megabytes,
you can use the following directive inside `redis.conf`:

```
maxmemory 100mb
```

You can also use [`CONFIG SET`]({{< relref "/commands/config-set" >}}) to
set `maxmemory` at runtime using [`redis-cli`]({{< relref "/develop/tools/cli" >}}):

```bash
> CONFIG SET maxmemory 100mb
```

Set `maxmemory` to zero to specify that you don't want to limit the memory
for the dataset. This is the default behavior for 64-bit systems, while 32-bit
systems use an implicit memory limit of 3GB.

When the size of your cache exceeds the limit set by `maxmemory`, Redis will
enforce your chosen [eviction policy](#eviction-policies) to prevent any
further growth of the cache.

### Setting `maxmemory` for a replicated or persisted instance

If you are using
[replication]({{< relref "/operate/rs/databases/durability-ha/replication" >}})
or [persistence]({{< relref "/operate/rs/databases/configure/database-persistence" >}})
for a server, Redis will use some RAM as a buffer to store the set of updates waiting
to be written to the replicas or AOF files.
The memory used by this buffer is not included in the total that
is compared to `maxmemory` to see if eviction is required.

This is because the key evictions themselves generate updates that must be added
to the buffer. If the updates were counted among the used
memory then in some circumstances, the memory saved by
evicting keys would be immediately used up by the update data added to the buffer.
This, in turn, would trigger even more evictions and the resulting feedback loop
could evict many items from the cache unnecessarily.

If you are using replication or persistence, we recommend that you set
`maxmemory` to leave a little RAM free to store the buffers. Note that this is not
necessary for the `noeviction` policy (see [the section below](#eviction-policies)
for more information about eviction policies).

The [`INFO`]({{< relref "/commands/info" >}}) command returns a
`mem_not_counted_for_evict` value in the `memory` section (you can use
the `INFO memory` option to see just this section). This is the amount of
memory currently used by the buffers. Although the exact amount will vary,
you can use it to estimate how much to subtract from the total available RAM
before setting `maxmemory`.

## Eviction policies

Use the `maxmemory-policy` configuration directive to select the eviction
policy you want to use when the limit set by `maxmemory` is reached.

The following policies are available:

-   `noeviction`: Keys are not evicted but the server will return an error
    when you try to execute commands that cache new data. If your database uses replication
    then this condition only applies to the primary database. Note that commands that only
    read existing data still work as normal.
-   `allkeys-lru`: Evict the [least recently used](#apx-lru) (LRU) keys.
-   `allkeys-lrm`: Evict the [least recently modified](#lrm-eviction) (LRM) keys.
-   `allkeys-lfu`: Evict the [least frequently used](#lfu-eviction) (LFU) keys.
-   `allkeys-random`: Evict keys at random.
-   `volatile-lru`: Evict the least recently used keys that have the `expire` field
    set to `true`.
-   `volatile-lrm`: Evict the least recently modified keys that have the `expire` field
    set to `true`.
-   `volatile-lfu`: Evict the least frequently used keys that have the `expire` field
    set to `true`.
-   `volatile-random`: Evict keys at random only if they have the `expire` field set
    to `true`.
-   `volatile-ttl`: Evict keys with the `expire` field set to `true` that have the
    shortest remaining time-to-live (TTL) value.

The `volatile-xxx` policies behave like `noeviction` if no keys have the `expire`
field set to true, or for `volatile-ttl`, if no keys have a time-to-live value set.

You should choose an eviction policy that fits the way your app
accesses keys. You may be able to predict the access pattern in advance
but you can also use information from the `INFO` command at runtime to
check or improve your choice of policy (see
[Using the `INFO` command](#using-the-info-command) below for more information).

As a rule of thumb:

-   Use `allkeys-lru` when you expect that a subset of elements will be accessed far
    more often than the rest. This is a very common case according to the
    [Pareto principle](https://en.wikipedia.org/wiki/Pareto_principle), so
    `allkeys-lru` is a good default option if you have no reason to prefer any others.
-   Use `allkeys-lrm` when you want to preserve frequently read data but evict data
    that hasn't been modified recently. This is useful for read-heavy workloads where
    you want to distinguish between data that's actively being updated versus data
    that's only being read.
-   Use `allkeys-random` when you expect all keys to be accessed with roughly equal
    frequency. An example of this is when your app reads data items in a repeating cycle.
-   Use `volatile-ttl` if your code can estimate which keys are good candidates for eviction
    and assign short TTLs to them. Note also that if you make good use of
    key expiration, then you are less likely to run into the cache memory limit because keys
    will often expire before they need to be evicted.

The `volatile-lru`, `volatile-lrm`, and `volatile-random` policies are mainly useful when you want to use
a single Redis instance for both caching and for a set of persistent keys. However,
you should consider running two separate Redis instances in a case like this, if possible.

Also note that setting an `expire` value for a key costs memory, so a
policy like `allkeys-lru` is more memory efficient since it doesn't need an
`expire` value to operate.

### Using the `INFO` command

The [`INFO`]({{< relref "/commands/info" >}}) command provides several pieces
of data that are useful for checking the performance of your cache. In particular,
the `INFO stats` section includes two important entries, `keyspace_hits` (the number of
times keys were successfully found in the cache) and `keyspace_misses` (the number
of times a key was requested but was not in the cache). The calculation below gives
the percentage of attempted accesses that were satisfied from the cache:

```
keyspace_hits / (keyspace_hits + keyspace_misses) * 100
```

Check that this is roughly equal to what you would expect for your app
(naturally, a higher percentage indicates better cache performance).

{{< note >}} When the [`EXISTS`]({{< relref "/commands/exists" >}})
command reports that a key is absent then this is counted as a keyspace miss.
{{< /note >}}

If the percentage of hits is lower than expected, then this might
mean you are not using the best eviction policy. For example, if
you believe that a small subset of "hot" data (that will easily fit into the
cache) should account for about 75% of accesses, you could reasonably
expect the percentage of keyspace hits to be around 75%. If the actual
percentage is lower, check the value of `evicted_keys` (also returned by
`INFO stats`). A high proportion of evictions would suggest that the
wrong keys are being evicted too often by your chosen policy
(so `allkeys-lru` might be a good option here). If the
value of `evicted_keys` is low and you are using key expiration, check
`expired_keys` to see how many keys have expired. If this number is high,
you might be using a TTL that is too low or you are choosing the wrong
keys to expire and this is causing keys to disappear from the cache
before they should.

Other useful pieces of information returned by `INFO` include:

-   `used_memory_dataset`: (`memory` section) The amount of memory used for
    cached data. If this is greater than `maxmemory`, then the difference
    is the amount by which `maxmemory` has been exceeded.
-   `current_eviction_exceeded_time`: (`stats` section) The time since
    the cache last started to exceed `maxmemory`.
-   `commandstats` section: Among other things, this reports the number of
    times each command issued to the server has been rejected. If you are
    using `noeviction` or one of the `volatile_xxx` policies, you can use
    this to find which commands are being stopped by the `maxmemory` limit
    and how often it is happening.

## Approximated LRU algorithm {#apx-lru}

The Redis LRU algorithm uses an approximation of the least recently used
keys rather than calculating them exactly. It samples a small number of keys
at random and then evicts the ones with the longest time since last access.

From Redis 3.0 onwards, the algorithm also tracks a pool of good
candidates for eviction. This improves the performance of the algorithm, making
it a close approximation to a true LRU algorithm.

You can tune the performance of the algorithm by changing the number of samples to check
before every eviction with the `maxmemory-samples` configuration directive:

```
maxmemory-samples 5
```

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

## LFU eviction

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

## LRM eviction {#lrm-eviction}

Starting with Redis 8.6, the Least Recently Modified (LRM) eviction mode is available. LRM is similar to LRU but only updates the timestamp on write operations, not read operations. This makes it useful for evicting keys that haven't been modified recently, regardless of how frequently they are read.

The key difference between LRU and LRM is:

- **LRU (Least Recently Used)**: Updates the access timestamp on both read and write operations
- **LRM (Least Recently Modified)**: Updates the access timestamp only on write operations

This distinction makes LRM particularly useful in scenarios where:

- You want to preserve frequently read data, even if it's not being modified
- Your application has a clear distinction between read-heavy and write-heavy workloads
- You want to evict stale data that hasn't been updated, regardless of read activity

To configure the LRM mode, the following policies are available:

* `volatile-lrm` Evict using LRM among the keys with an expire set.
* `allkeys-lrm` Evict any key using LRM.

Like LRU, LRM uses an approximation algorithm that samples a small number of keys at random and evicts the ones with the longest time since last modification. The same `maxmemory-samples` configuration directive that affects LRU performance also applies to LRM.
