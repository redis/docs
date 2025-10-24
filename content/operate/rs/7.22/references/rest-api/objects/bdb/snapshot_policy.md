---
Title: Snapshot policy object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the snapshot_policy object used with Redis Enterprise Software
  REST API calls.
linkTitle: snapshot_policy
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/bdb/snapshot_policy/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| secs   | integer | Interval in seconds between snapshots |
| writes | integer | Number of write changes required to trigger a snapshot |
