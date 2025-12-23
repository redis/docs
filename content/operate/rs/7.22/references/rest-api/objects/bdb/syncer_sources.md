---
Title: Syncer sources object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the syncer_sources object used with Redis Enterprise Software
  REST API calls.
linkTitle: syncer_sources
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/bdb/syncer_sources/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| uid | integer | Unique ID of this source |
| client_cert | string | Client certificate to use if encryption is enabled |
| client_key | string | Client key to use if encryption is enabled |
| compression | integer, <nobr>(range: 0-6)</nobr> | Compression level for the replication link |
| encryption | boolean | Encryption enabled/disabled |
| lag | integer | Lag in milliseconds between source and destination (while synced) |
| last_error | string | Last error encountered when syncing from the source |
| last_update | string | Time when we last received an update from the source |
| rdb_size | integer | The source's RDB size to be transferred during the syncing phase |
| rdb_transferred | integer | Number of bytes transferred from the source's RDB during the syncing phase |
| replication_tls_sni | string | Replication TLS server name indication |
| server_cert | string | Server certificate to use if encryption is enabled |
| status | string | Sync status of this source |
| uri | string | Source Redis URI |
