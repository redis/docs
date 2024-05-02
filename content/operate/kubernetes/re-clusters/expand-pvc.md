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

PersistentVolumeClaims (PVC) are created by the Redis Enterprise for Kubernetes operator and use dy the RedisEnterpriseCluster (REC). PVCs are created with a specific size and can be expanded if the underlying storage class supports it.

## Before you start

### StatefulSet

- **Be careful!** This process involves deleting and recreating the REC StatefulSet with a new persistent volume size.
- Do not change any other REC fields related to the StatefulSet while resizing is in progress.
- The pods owned by the StatefulSet are not restarted or affected by the deletion and recreation process, except when they momentarily become "orphaned".

### StorageClass

- PVC expansion must be supported and enabled by the StorageClass and underlying storage driver of the REC PVCs.
-The relevant StorageClass is the one associated with the REC PVCs. The StorageClass for existing PVCs cannot be changed.
- Verify the StorageClass is configured with `allowVolumeExpansion: true`.
- Verify your storage driver supports online expansion.

### Not supported

- Shrinking (reducing the size) of your PVC is not allowed. This process only allows you to expand (size up) your PVC.

### Highly recommended

- We highly recommend you backup your databases before beginning this PV expansion process.

## Expand REC PVC

1. Enable the REC persistent volume resize flag.

    ```YAML
      spec:
        persistentSpec:
          enablePersistentVolumeResize: true
    ```

1. Set the value of `volumeSize` to your desired size.

    ```YAML
      spec:
        persistentSpec:
          enablePersistentVolumeResize: true
          volumeSize: <new-size>
    ```

1. Apply the changes to the REC, replacing `<your-rec.yaml>` with the name of your REC.

  ```sh
  kubectl apply -f <your-rec.yaml>
  ```

After applying the REC changes, the PVCs will begin to resize to the new size.

Once all the PVCs finish the resizing process, the operator will delete and recreate the StatefulSet with the new volume size.

### Track progress

You can track the progress by monitoring the status of the REC and PersistentVolumeClaim objects.

The REC status will correspond to the status of one or more PVCs, and will reflect if they resizing is successful or failed.

While the resizing is in progress, the status will be:

```yaml
status:
  persistenceStatus:
    status: Resizing
    succeeded: 2/3
```

When the resizing is complete, the status becomes "Provisioned" and the new volume size is available for use by the REC pods.

```yaml
status:
  persistenceStatus:
    status: Provisioned
    succeeded: 3/3
```

### Troubleshooting

If an error occurs during this process:

- Examine the status and events of the REC and PVC objects.
- Examine the logs of the operator pods.