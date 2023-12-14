---
Title: Loading object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the loading object used with Redis Enterprise Software REST
  API calls.
linkTitle: loading
weight: $weight
---

| Name | Type/Value | Description |
|------|------------|-------------|
| progress  | number, (range: 0-100) | Percentage of bytes already loaded |
| status    | 'in_progress'<br />'idle' | Status of the load of a dump file (read-only) |
