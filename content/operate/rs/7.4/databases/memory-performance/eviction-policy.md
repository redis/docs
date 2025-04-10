---
Title: Eviction policy
alwaysOpen: false
categories:
- docs
- operate
- rs
- kubernetes
description: The eviction policy determines what happens when a database reaches its
  memory limit.
linkTitle: Eviction policy
weight: 10
url: '/operate/rs/7.4/databases/memory-performance/eviction-policy/'
---

The eviction policy determines what happens when a database reaches its memory limit.  

To make room for new data, older data is _evicted_ (removed) according to the selected policy.

To prevent this from happening, make sure your database is large enough to hold all desired keys.  

| **Eviction&nbsp;Policy** | **Description** |
|------------|-----------------|
|  noeviction | New values aren't saved when memory limit is reached<br/><br/>When a database uses replication, this applies to the primary database |
|  allkeys-lru | Keeps most recently used keys; removes least recently used (LRU) keys |
|  allkeys-lfu | Keeps frequently used keys; removes least frequently used (LFU) keys |
|  allkeys-random | Randomly removes keys |
|  volatile-lru | Removes least recently used keys with `expire` field set to true |
|  volatile-lfu | Removes least frequently used keys with `expire` field set to true |
|  volatile-random | Randomly removes keys with `expire` field set to true |
|  volatile-ttl | Removes least frequently used keys with `expire` field set to true and the shortest remaining time-to-live (TTL) value |

## Eviction policy defaults

`volatile-lru` is the default eviction policy for most databases.

The default policy for [Active-Active databases]({{< relref "/operate/rs/7.4/databases/active-active" >}}) is _noeviction_ policy.

## Active-Active database eviction

The eviction policy mechanism for Active-Active databases kicks in earlier than for standalone databases because it requires propagation to all participating clusters. 
The eviction policy starts to evict keys when one of the Active-Active instances reaches 80% of its memory limit. If memory usage continues to rise while the keys are being evicted, the rate of eviction will increase to prevent reaching the Out-of-Memory state.
As with standalone Redis Enterprise databases, Active-Active eviction is calculated per shard.
To prevent over eviction, internal heuristics might prevent keys from being evicted when the shard reaches the 80% memory limit.  In such cases, keys will get evicted only when shard memory reaches 100%.

In case of network issues between Active-Active instances, memory can be freed only when all instances are in sync. If there is no communication between participating clusters, it can result in eviction of all keys and the instance reaching an Out-of-Memory state.

{{< note >}}
Data eviction policies are not supported for Active-Active databases with Auto Tiering .
{{< /note >}}

## Avoid data eviction

To avoid data eviction, make sure your database is large enough to hold required values.  

For larger databases, consider using [Auto Tiering ]({{< relref "/operate/rs/7.4/databases/auto-tiering/" >}}).

Auto Tiering stores actively-used data (also known as _hot data_) in RAM and the remaining data in flash memory (SSD).
This lets you retain more data while ensuring the fastest access to the most critical data.
