---
Title: Storage Worker Metrics
alwaysopen: false
categories:
- docs
- integrate
- korvet
description: Metrics emitted by the leader-locked storage worker.
linkTitle: Storage Worker
weight: 60
---

These metrics are emitted by the leader-locked storage worker, which rolls eligible segments, offloads sealed segments to the remote tier, and enforces local and remote retention.

## Up

Storage worker liveness. `1` while the worker is running in this JVM, `0` otherwise. Because the worker is leader-locked, at most one instance across the cluster reports `1` at a time.

**Name**: `korvet.storage.worker.up` \
**Type**: `gauge`

## Failures

Storage worker failures by lifecycle phase and error type.

**Name**: `korvet.storage.worker.failures` \
**Type**: `counter`

**Tags**

| Key | Description |
|---|---|
| `phase` | Lifecycle phase where the failure occurred (e.g. `start`). |
| `error_type` | Exception class simple name, or `none`. |
