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
description: The primary accepts writes only when enough replicas are connected, and there aren't enough.
linkTitle: NOREPLICAS
title: NOREPLICAS error
weight: 52
error:
  prefix: NOREPLICAS
  message: NOREPLICAS Not enough good replicas to write.
  match:
  - Not enough good replicas to write
---

A primary returns this error when you send a write, but fewer replicas are connected than its `min-replicas-to-write` setting requires. This setting limits how much data you can lose if the primary fails. Reads still work. Writes start working again when enough replicas are connected.

A replica only counts if it's up to date. Each replica reports to its primary every second. If a replica hasn't reported for more than `min-replicas-max-lag` seconds, the primary doesn't count it.

```
NOREPLICAS Not enough good replicas to write.
```

## How to fix it

1. On the primary, run [`INFO replication`](/content/commands/info.md). `connected_slaves` shows how many replicas are connected. Each `slave0`, `slave1`, and so on line shows a replica's address and its `lag` in seconds.
1. Fix the replicas that are missing or lagging. Check that they're running and can reach the primary. On a replica, `INFO replication` shows the state of its link to the primary.
1. If writes must work with fewer replicas, lower `min-replicas-to-write`. Set it to `0` to turn the check off.

See [Allow writes only with N attached replicas](/content/operate/oss_and_stack/management/replication.md#allow-writes-only-with-n-attached-replicas).
