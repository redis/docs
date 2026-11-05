---
Title: Migrating a Single-Stream Topic to Segmented Storage
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Migrate a legacy single-stream topic to the segmented storage layout in
  place by adding a segment roll policy.
linkTitle: Migrating to Segmented Storage
weight: 30
---

Topics created by older Korvet releases (before segmentation became the default), or
created with an unlimited `segment.bytes=-1` and no `segment.ms`, use the backward-compatible
**single-stream layout**: the whole partition lives in one Redis Stream with no roll policy. Adding a
segment roll policy migrates such a topic to the **segmented layout** in place — no data is copied,
moved, or re-keyed, and the topic stays online and readable throughout.

{{< note >}}
Topics created by current releases are already segmented (they default to `segment.bytes=134217728` (128 MiB)),
so this migration applies only to legacy single-stream topics. Compacted topics (`cleanup.policy=compact`)
always keep the single-stream layout and cannot be migrated.
{{< /note >}}

## Trigger the migration

Add a `segment.bytes` (and/or `segment.ms`) roll policy to the topic:

```bash
kafka-configs --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name my-topic --alter \
  --add-config segment.bytes=536870912
```

{{< warning >}}
`segment.ms` must be smaller than the topic's effective retention (a segment has to roll before its
data expires), so on a topic with short retention prefer `segment.bytes` alone. `segment.bytes` itself
has no such constraint and can be added to any non-compacted topic.

`segment.bytes` is enforced by the storage worker on each tick (`storage.worker.tick-interval`), by
comparing the open segment's real `MEMORY USAGE` against the budget — not on every append. It is thus
a tick-cadence bound rather than a hard per-append cap: a burst that writes several multiples of the
budget within a single tick interval seals as one oversized segment. Steady and slow producers stay
near the configured size; if you need a tighter bound under bursty load, lower the tick interval.
{{< /warning >}}

## What happens

The migration is **lazy**: it is performed on the next produce to or consume from the topic, not at the
moment the config is altered. An idle topic stays single-stream until it is next accessed. On that first
access:

1. **Adopt in place** — the existing single stream becomes **open segment 0**. Its Redis key is left
   unchanged (the segment keeps addressing the original stream key), so adoption is an O(1) metadata
   operation with no `RENAME`, `COPY`, or re-write — safe even for very large partitions and on Redis
   Cluster.
2. **Seal** — once the adopted segment exceeds the new roll policy (which the pre-existing data
   typically already does), the background storage worker seals it. New writes then roll into freshly
   keyed segments (`my-topic:0:1`, `:2`, …).
3. **Reclaim** — retention is applied per segment from the head of the log. With remote storage enabled,
   sealed segments are offloaded to the remote tier and their local copy is then dropped. In a
   Redis-only deployment the storage worker trims the oldest sealed segment's head progressively as
   entries age past `retention.ms`, reclaiming memory continuously rather than only when the whole
   (initially very large) adopted segment finally expires; the segment is dropped whole once its newest
   entry also expires.

The end state is a fully segmented topic: the original single stream is gone and all data is addressed
through per-segment streams. No consumer offsets are invalidated by the layout change itself — only the
normal retention rules apply.

{{< tip >}}
Memory from the adopted segment is reclaimed one head-trim per storage-worker tick
(`korvet.storage.worker.tick-interval`, default 1 minute). Lower the tick interval if you need finer-grained
reclamation during a migration of a large topic.
{{< /tip >}}
