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

## Active-Passive replication considerations

When using Active-Passive replication with [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}), data eviction and expiration policies have important implications for data consistency.

{{< warning >}}
**Do not write to the destination (passive) replica database.** Writing to the destination replica can cause serious data consistency issues and replication failures.
{{< /warning >}}

### Problems caused by writing to passive replicas

In Active-Passive setups, eviction and expiration only operate on the active (source) database. When you write to the passive replica:

- **Memory management conflicts**: The passive replica cannot rely on eviction or expiration to manage local writes, requiring sufficient memory to handle both replicated data and local writes.
- **Data inconsistency**: Local writes create differences between the source and destination databases, causing replicated commands to behave differently on each database.
- **Replication failures**: Inconsistent data can cause replicated commands to fail with errors, which will cause the synchronization process to exit and break replication.

### Transitioning from passive to active

To properly transition a passive replica to become an active, writable database:

1. **Stop replication** using the Redis Cloud console interface
2. **Remove the replicaOf source** by running the `REPLICAOF NO ONE` command on the database

Both steps are required to ensure the database can safely accept writes and manage its own eviction and expiration policies.


