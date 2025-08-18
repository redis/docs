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

{{<note>}} This feature is only supported in versions 7.4.2-12 and above. {{</note>}}

[PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) are created by the Redis Enterprise operator and used by the RedisEnterpriseCluster (REC). PVCs are created with a specific size and [can be expanded](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) with the following steps, if the underlying [storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) supports it.

This process involves deleting and recreating the REC StatefulSet with a larger persistent volume size. The pods owned by the StatefulSet are not restarted or affected by the deletion and recreation process, except when they are left without an owner momentarily.

{{<note>}}Shrinking (reducing the size) of your PVC is not allowed. This process only allows you to expand (size up) your PVC.{{</note>}}

### Default PVC size

By default, if you omit [`spec.persistentSpec.volumeSize`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specpersistentspec" >}}), the operator allocates a persistent volume that is five times (5x) the Redis Enterprise node memory request defined in [`spec.redisEnterpriseNodeResources.requests.memory`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specredisenterprisenoderesources" >}}) (per node). This 5x ratio is the recommended minimum capacity.

- If you set [`spec.persistentSpec.volumeSize`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specpersistentspec" >}}) explicitly, that exact size is used and the 5x default does not apply.
- Changing node memory requests does not automatically resize existing PVCs. Use the procedure below to expand the PVC if you want to maintain the 5x ratio after changing memory.
- If you omit [`spec.redisEnterpriseNodeResources.requests.memory`]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specredisenterprisenoderesources" >}}), the operator uses its default memory request (4Gi). With `volumeSize` omitted, this results in a default PVC size of approximately 20Gi per node (5 × 4Gi). See [sizing on Kubernetes]({{< relref "/operate/kubernetes/recommendations/sizing-on-kubernetes" >}}) for defaults.

- See the [volume size recommendations]({{< relref "/operate/kubernetes/recommendations/persistent-volumes#volume-size" >}}) and [hardware requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}) for guidance.

## Prerequisites

{{<warning>}}Do not change any other REC fields related to the StatefulSet while resizing is in progress.
{{</warning>}}

- PVC expansion must be supported and enabled by the StorageClass and underlying storage driver of the REC PVCs.
  - The relevant StorageClass is the one associated with the REC PVCs. The StorageClass for existing PVCs cannot be changed.
- The StorageClass must be configured with `allowVolumeExpansion: true`.
- Your storage driver must support online expansion.
- We highly recommend you backup your databases before beginning this PVC expansion process.

{{<warning>}} OpenShift users should be aware that (`ClusterResourceQuota`) can limit the PVC expansion. Check your quota before resizing using `oc describe clusterresourcequota <quota-name>`.{{</warning>}}

{{<warning>}} PVC expansion is not supported when using Auto Tiering (Redis on Flash). Do not enable `enablePersistentVolumeResize` if your REC uses `redisOnFlashSpec` as this will result in conflicts. {{</warning>}}

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
