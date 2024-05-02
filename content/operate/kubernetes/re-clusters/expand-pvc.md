---
Title: Expand PersistentVolumeClaim (PVC)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: 
linkTitle: Expand PVC
weight: 15
---

PersistentVolumeClaims (PVC) are created by the Redis Enterprise for Kubernetes operator and use dy the RedisEnterpriseCluster (REC). PVCs are created with a specific size and can be resized if the underlying stoarge class supports it.

## Before you start

### StatefulSet

- **Be careful!** This process involves deleting and recreating the REC StatefulSet with a new persistent volume size.

- Do not change any other REC fields related to the StatefulSet while resizing is in progress.

- The pods owned by the StatefulSet are not restarted or affected by the deletion and recreation process, except when they momentarily become "orphaned".

### StorageClass

- PVC expansion must be supported and enabled by the StorageClass and underlying storage driver of the REC PVCs.

- Verify the StorageClass is configured with `allowVolumeExpansion: true`.

- Verify your storage driver supports online expansion.


### Not supported


### Highly recommended

## Expand REC PVC

1. Enable the REC persistent volume resize flag. 
    
    ```YAML
      spec:
    persistentSpec:
      enablePersistentVolumeResize: true
    ```

