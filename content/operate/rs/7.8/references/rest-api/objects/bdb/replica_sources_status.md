---
Title: BDB replica sources status field
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the bdb replica_sources status field used with Redis Enterprise
  Software REST API calls.
linkTitle: replica_sources status
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/bdb/replica_sources_status/'
---

The `replica_sources` status field relates to the [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of/create.md" >}}) feature, which enables the creation of a Redis database (single- or multi-shard) that synchronizes data from another Redis database (single- or multi-shard).

The status field represents the Replica Of sync status for a specific sync source.

Possible status values:

| Status | Description | Possible next status |
|--------|-------------|----------------------|
| 'out-of-sync' | Sync process is disconnected from source and trying to reconnect | 'syncing' |
| 'syncing' | Sync process is in progress | 'in-sync' <br />'out-of-sync' |
| 'in-sync' | Sync process finished successfully, and new commands are syncing on a regular basis | 'syncing' <br />'out-of-sync'

{{< image filename="/images/rs/rest-api-replica-sources-status.png#no-click" alt="Replica sources status" >}}
