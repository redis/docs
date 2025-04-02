---
Title: Persistent and ephemeral node storage
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Configure paths for persistent storage and ephemeral storage.
linktitle: Persistent node storage
toc: 'true'
weight: 50
url: '/operate/rs/7.4/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage/'
---
For each node in the cluster, you can configure paths for both persistent
storage and ephemeral storage. To do so, the volume must have full permissions for user and group `redislabs` or users:group `redislabs:redislabs`. See the [Customize system user and group]({{< relref "/operate/rs/7.4/installing-upgrading/install/customize-user-and-group" >}}) page for instructions.

{{< note >}}
The persistent storage and ephemeral storage discussed in this document are not related
to Redis persistence or AWS ephemeral drives.
{{< /note >}}

## Persistent storage

Persistent storage is mandatory. The cluster uses persistent storage to store
information that needs to persist if a shard or a node fails,
such as server logs, configurations, and files.

To set the frequency of syncs, you can configure [persistence]({{< relref "/operate/rs/7.4/databases/configure/database-persistence" >}})
options for a database.
    
The persistent volume must be a storage area network (SAN)
using an EXT4 or XFS file system and be connected as an external storage volume.
    
When using append-only file (AOF) persistence, use flash-based storage
for the persistent volume.

## Ephemeral storage

Ephemeral storage is optional. If configured, temporary information that does not need to be persisted is stored by the cluster in the ephemeral storage.
This improves performance and helps reduce the load on the persistent storage.

Ephemeral storage must be a locally attached volume on each node.

## Disk size requirements

For disk size requirements, see:

- [Hardware
    requirements]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/hardware-requirements" >}})
    for general guidelines regarding the ideal disk size for each type of
    storage.
- [Disk size requirements for extreme write
    scenarios]({{< relref "/operate/rs/7.4/clusters/optimize/disk-sizing-heavy-write-scenarios" >}})
    for special considerations when dealing with a high rate of write
    commands.
