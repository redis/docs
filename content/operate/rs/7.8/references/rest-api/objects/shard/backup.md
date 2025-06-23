---
Title: Backup object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the backup object used with Redis Enterprise Software REST
  API calls.
linkTitle: backup
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/shard/backup/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| progress  | number, (range: 0-100) | Shard backup progress (percentage) |
| status    | 'exporting'<br />'succeeded'<br />'failed' | Status of scheduled periodic backup process |
