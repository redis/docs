---
Title: Expand PersistentVolumeClaim (PVC)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Expand your persistent volume claim by editing the REC.
linkTitle: Expand PVC
weight: 82
---

This article outlines steps to increase the size of the persistent volume claim for your Redis Enterprise cluster (REC).

[PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) are created by the Redis Enterprise operator and used by the RedisEnterpriseCluster (REC). PVCs are created with a specific size and [can be expanded](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) with the following steps, if the underlying [storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) supports it.

This process involves deleting and recreating the REC StatefulSet with a larger persistent volume size. The pods owned by the StatefulSet are not restarted or affected by the deletion and recreation process, except when they are left without an owner momentarily.

{{<note>}}Shrinking (reducing the size) of your PVC is not allowed. This process only allows you to expand (size up) your PVC.{{</note>}}

## Prerequisites

{{<warning>}}Do not change any other REC fields related to the StatefulSet while resizing is in progress.
{{</warning>}}

- PVC expansion must be supported and enabled by the StorageClass and underlying storage driver of the REC PVCs.
  - The relevant StorageClass is the one associated with the REC PVCs. The StorageClass for existing PVCs cannot be changed.
- The StorageClass must be configured with `allowVolumeExpansion: true`.
- Your storage driver must support online expansion.
- We highly recommend you backup your databases before beginning this PVC expansion process.

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
          volumeSize: <new-size>Gi
    ```

1. Apply the changes to the REC, replacing `<your-rec.yaml>` with the name of your REC.

  ```sh
  kubectl apply -f <your-rec.yaml>
  ```

After applying the REC changes, the PVCs will begin to expand to the new size.

Once all the PVCs finish the resizing process, the operator will delete and recreate the StatefulSet with the new volume size.

### Track progress

You can track the progress by monitoring the status of the REC and PersistentVolumeClaim objects.

The REC status will correspond to the status of one or more PVCs, and will reflect if the resizing is successful or failed.

While the resizing is in progress, the status will be:

```yaml
status:
  persistenceStatus:
    status: Resizing
    succeeded: 2/3
```

When the resizing is complete, the status becomes Provisioned and the new volume size is available for use by the REC pods.

```yaml
status:
  persistenceStatus:
    status: Provisioned
    succeeded: 3/3
```

### Troubleshooting

If an error occurs during this process:

- Examine the status and events of the REC and PVC objects.

  ```sh
  kubectl describe pvc
  ```

  ```sh
  kubectl get events
  ```

- Examine the logs of the operator pods.

  ```sh
  kubectl logs <operator_pod_name>
  ```
