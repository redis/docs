---
Title: BDB group object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that represents a group of databases with a shared memory pool
linkTitle: bdb_group
weight: $weight
---

An API object that represents a group of databases that share a memory pool.

| Name | Type/Value | Description |
|------|------------|-------------|
| uid          | integer          | Cluster unique ID of the database group |
| members      | array of strings | A list of UIDs of member databases (read-only) |
| memory_size  | integer          | The common memory pool size limit for all databases in the group, expressed in bytes |
