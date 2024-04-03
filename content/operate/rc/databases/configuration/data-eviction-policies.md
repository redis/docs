---
Title: Data eviction
alwaysopen: false
categories:
- docs
- operate
- rc
description: Data eviction policies control what happens when new data exceeds the
  memory limits of a database.  Here, you'll learn the available policies and how
  to change which one is used for a database.
linkTitle: Data eviction
weight: $weight
aliases: 
  - /operate/rc/concepts/data-eviction-policies
---

The data eviction policy of a database controls what happens when new data exceeds the memory size of a database.  Typically, such situations require _evicting_ (or deleting) data previously added to the database.  

You can [edit database details]({{< relref "/operate/rc/databases/view-edit-database.md" >}}) to change the **Data eviction policy** setting at the database level.

## Available policies

For each database, you can choose from these data eviction policies:

| **Available&nbsp;policies** | **Description** |
|:------------|:-----------------|
| allkeys-lru | Keeps most recently used keys; removes least recently used (LRU) keys |
| allkeys-lfu | Keeps frequently used keys; removes least frequently used (LFU) keys |
| allkeys-random | Randomly removes keys |
| volatile-lru | Removes least recently used keys with `expire` field set to true (*Default*) |
| volatile-lfu | Removes least frequently used keys with `expire` field set to true |
| volatile-random | Randomly removes keys with `expire` field set to true |
| volatile-ttl | Removes keys with expire field set to true and the shortest remaining time-to-live (TTL) value |
| no eviction | New values aren't saved when memory limit is reached<br/><br/>When a database uses replication, this applies to the primary database |

## Prevent data eviction

Redis Cloud supports [Auto Tiering]({{< relref "/operate/rs/databases/auto-tiering/" >}}) 
to prevent data eviction but maintain high performance.

Auto Tiering can extend your database across RAM and Flash Memory and intelligently manage "hot" (active) data in RAM and "cold" (less active) data in Flash memory (SSD).
