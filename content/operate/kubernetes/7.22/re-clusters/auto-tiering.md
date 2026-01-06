---
Title: Use Auto Tiering on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy a cluster with Auto Tiering on Kubernetes.
linkTitle: Auto Tiering
weight: 16
url: '/operate/kubernetes/7.22/re-clusters/auto-tiering/'
---

{{<note>}}
This page applies to Redis Enterprise for Kubernetes version 7.22.2-22. If you use version 8.0.2-2 or later, see [Redis Flex](https://redis.io/docs/latest/operate/kubernetes/re-clusters/redis-flex).
{{</note>}}

## Prerequisites

Redis Enterprise Software for Kubernetes supports using Auto Tiering (previously known as Redis on Flash), which extends your node memory to use both RAM and flash storage. SSDs (solid state drives) can store infrequently used (warm) values while your keys and frequently used (hot) values are still stored in RAM. This improves performance and lowers costs for large datasets.

{{<note>}}
NVMe (non-volatile memory express) SSDs are strongly recommended to achieve the best performance.
{{</note>}}

Before creating your Redis clusters or databases, these SSDs must be:

- [locally attached to worker nodes in your Kubernetes cluster](https://kubernetes.io/docs/concepts/storage/volumes/#local)
- formatted and mounted on the nodes that will run Redis Enterprise pods
- dedicated to Auto Tiering and not shared with other parts of the database, (e.g. durability, binaries)
- [provisioned as local persistent volumes](https://kubernetes.io/docs/concepts/storage/volumes/#local)
  - You can use a [local volume provisioner](https://github.com/kubernetes-sigs/sig-storage-local-static-provisioner/blob/master/README.md) to do this [dynamically](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#dynamic)
- a [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/#local) resource with a unique name

For more information on node storage, see [Node persistent and ephemeral storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

## Create a Redis Enterprise cluster

To deploy a Redis Enterprise cluster (REC) with Auto Tiering, you'll need to specify the following in the `redisOnFlashSpec` section of your [REC custom resource]({{< relref "/operate/kubernetes/7.22/reference/api/redis_enterprise_cluster_api" >}}):

- enable Auto Tiering (`enabled: true`)
- flash storage driver (`bigStoreDriver`)
  - `rocksdb` or `speedb`(default)
- storage class name (`storageClassName`)
- minimal flash disk size (`flashDiskSize`)

{{<note>}} Clusters upgraded to version 7.2.4-2 from an earlier version will change the `bigStoreDriver` (previously called `flashStorageEngine`) to the new default `speedb`, regardless of previous configuration. {{</note>}}

{{<warning>}}Switching between storage engines (`speedb` and `rocksdb`) requires guidance by Redis Support or your Account Manager.{{</warning>}}

{{<warning>}}PVC expansion is not supported when using Auto Tiering. Do not enable `enablePersistentVolumeResize` in the REC `persistentSpec` if you are using `redisOnFlashSpec` as this will result in conflicts. {{</warning>}}

Here is an example of an REC custom resource with these attributes:

```YAML
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: "rec"
spec:
  
  nodes: 3
  redisOnFlashSpec:
    enabled: true
    bigStoreDriver: speedb
    storageClassName: local-scsi
    flashDiskSize: 100G
```

### Create a Redis Enterprise database

By default, any new database will use RAM only. To create a Redis Enterprise database (REDB) that can use flash storage, specify the following in the `redisEnterpriseCluster` section of the REDB custom resource definition:

- `isRof: true` enables Auto Tiering
- `rofRamSize` defines the RAM capacity for the database

Below is an example REDB custom resource:

```YAML
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: autoteiring-redb
spec:
  redisEnterpriseCluster:
    name: rec
  isRof: true
  memorySize: 2GB
  rofRamSize: 0.5GB
```

{{< note >}}
This example defines both `memorySize` and `rofRamSize`. When using Auto Tiering, `memorySize` refers to the total combined memory size (RAM + flash) allocated for the database. `rofRamSize` specifies only the RAM capacity for the database. `rofRamSize` must be at least 10% of `memorySize`.
{{< /note >}}
