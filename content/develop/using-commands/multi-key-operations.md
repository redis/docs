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
description: Multi-key command behavior across Redis configurations and clustering setups
linkTitle: Multi-key operations
title: Multi-key operations
weight: 35
---

Multi-key operations in Redis allow you to work with multiple keys in a single command, but their behavior varies significantly depending on your Redis configuration and clustering setup. This page provides a quick reference for developers working with multi-key operations across different Redis configurations.

## Configurations

Redis supports five distinct configurations, each with different multi-key command behaviors:

1. **ROS/RS clustering disabled** - Single Redis instance
2. **ROS, clustering enabled** - Redis Open Source cluster
3. **RS, clustering enabled, OSS cluster API enabled** - Redis Software with ROS cluster compatibility
4. **RS, clustering enabled, OSS cluster API disabled** - Redis Software proprietary clustering
5. **RS, Active-Active** - Redis Software Active-Active (considered clustered even with a single shard)

ROS stands for Redis Open Source and RS stands for Redis Software.

## Command behaviors

For each configuration, commands exhibit one of three behaviors:

- **single-slot**: Commands must operate on keys within the same hash slot
- **cross-slot (all shards)**: Commands can operate across all shards in the cluster
- **cross-slot (within a single shard)**: Commands can operate across slots but only within a single shard

## Read-only commands

| Behavior | Commands |
|----------|----------|
| **ROS/RS clustering disabled:**<br>&ndash; the whole DB (single shard)<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled):**<br>&ndash; the current shard<br><br>**RS clustering enabled (OSS cluster API disabled):**<br>&ndash; all shards | DBSIZE, KEYS, SCAN |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled):**<br>&ndash; single-slot<br><br>**RS clustering enabled (OSS cluster API disabled):**<br>&ndash; cross-slot (all shards) | EXISTS, MGET |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; single-slot | PFCOUNT, SDIFF, SINTER, SINTERCARD, SUNION, WATCH, XREAD, XREADGROUP, ZDIFF, ZINTER, ZINTERCARD, ZUNION |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; single-shard | JSON.MGET<br><br>Users won't get a CROSSSLOT error. However, when clustering is enabled, and not all specified keys are in the same slot, users will get partial results for all the slots on the current shard. |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot (all shards)<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; cross-slot (all shards), cannot be part of a transaction | TS.MGET, TS.MRANGE, TS.MREVRANGE, TS.QUERYINDEX |

## Read-write commands

| Behavior | Commands |
|----------|----------|
| **ROS/RS clustering disabled:**<br>&ndash; the whole DB (single shard)<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled):**<br>&ndash; the current shard<br><br>**RS clustering enabled (OSS cluster API disabled):**<br>&ndash; all shards | FLUSHALL, FLUSHDB |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled):**<br>&ndash; single-slot<br><br>**RS clustering enabled (OSS cluster API disabled):**<br>&ndash; cross-slot (all shards) | DEL, MSET, TOUCH, UNLINK<br><br>Note: on Active-Active, DEL, MSET, and UNLINK are single-slot |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; single-slot | BITOP, BLMOVE, BLMPOP, BLPOP, BRPOP, BRPOPLPUSH, BZMPOP, BZPOPMAX, BZPOPMIN, CMS.MERGE, COPY, GEORADIUS or GEORADIUSBYMEMBER (with STORE or STOREDIST), GEOSEARCHSTORE, JSON.MSET, LMOVE, LMPOP, MSETNX, PFMERGE, RENAME, RENAMENX, RPOPLPUSH, SDIFFSTORE, SINTERSTORE, SMOVE, SUNIONSTORE, TDIGEST.MERGE, TS.MADD, ZDIFFSTORE, ZINTERSTORE, ZMPOP, ZRANGESTORE, ZUNIONSTORE |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br><br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; single-shard | TS.CREATERULE, TS.DELETERULE<br><br>Users won't get a CROSSSLOT error. However, when clustering is enabled and the two specified keys are not in the same slot, users will get `(error) ERR TSDB: the key does not exist`. |

## Pipelines, transactions, and scripts

| Behavior | Operations |
|----------|------------|
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled):**<br>&ndash; single-slot<br>**RS clustering enabled (OSS cluster API disabled):**<br>&ndash; cross-slot (all shards) | Pipelines |
| **ROS/RS clustering disabled:**<br>&ndash; cross-slot<br>**ROS clustering enabled, RS clustering enabled (OSS cluster API enabled), RS clustering enabled (OSS cluster API disabled):**<br>&ndash; single-slot | Keys in a `MULTI/EXEC` transaction<br>Keys in a Lua script executed using EVAL or EVALSHA |

## Examples by Configuration

### Single Instance (No Clustering)

In a single Redis instance, all multi-key operations work without restrictions:

```redis
# Pipeline operations work across any keys
PIPELINE
SET user:1 "Alice"
SET product:100 "Widget"
GET user:1
GET product:100
EXEC

# Transactions work with any keys
MULTI
SET counter:a 1
SET counter:b 2
INCR counter:a
INCR counter:b
EXEC
```

### Clustered Environments

In clustered setups, you need to consider slot distribution:

```redis
# This may fail if keys are in different slots
MSET user:1 "Alice" user:2 "Bob"

# Use hash tags to ensure same slot
MSET {users}:1 "Alice" {users}:2 "Bob"

# Check which slot a key belongs to
CLUSTER KEYSLOT user:1
CLUSTER KEYSLOT {users}:1
```

### Active-Active Databases

Active-Active databases have additional restrictions for write operations:

```redis
# Read operations can work across slots
MGET user:1 user:2 product:100

# Write operations must be in same slot
MSET {data}:user:1 "Alice" {data}:user:2 "Bob"
```

## Troubleshooting Multi-Key Operations

### Common Error Messages

- **CROSSSLOT**: Keys in request don't hash to the same slot
- **MOVED**: Key has moved to a different node (during resharding)
- **TRYAGAIN**: Operation temporarily unavailable (during migration)

### Solutions

1. **Use hash tags** to group related keys
2. **Redesign data model** to minimize cross-slot operations  
3. **Check cluster state** during errors
4. **Implement retry logic** for temporary failures

## Performance Considerations

- **Single-slot operations** are fastest as they don't require coordination
- **Cross-slot operations** may have higher latency due to internal routing
- **Pattern commands** (KEYS, FLUSHALL) scan all shards and can be expensive
- **Module operations** may have optimized cross-slot implementations

Choose your Redis configuration and design your data model based on your multi-key operation requirements.
