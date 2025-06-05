---
Title: Sync object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the sync object used with Redis Enterprise Software REST API
  calls.
linkTitle: sync
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/shard/sync/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| progress  | integer        | Number of bytes remaining in current sync |
| status    | 'in_progress'<br />'idle'<br />'link_down' | Indication of the shard's current sync status |
