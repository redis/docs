---
Title: Use Redis Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy a cluster with Redis Flex on Kubernetes.
linkTitle: Redis Flex
weight: 16
---

{{<note>}}
This page applies to Redis Enterprise for Kubernetes version 8.0.2-2 and later. If you use version 7.22.2-22 or earlier, see [Auto Tiering]({{< relref "/operate/kubernetes/7.22/re-clusters/auto-tiering" >}}).
{{</note>}}

## Overview

[Redis Flex]({{< relref "/operate/rs/databases/flash" >}}) (previously known as Redis on Flash) extends your node memory to use both RAM and flash storage. Solid state drives (SSDs) store infrequently used (warm) values, while RAM stores your keys and frequently used (hot) values. This approach improves performance and lowers costs for large datasets.

Redis Flex provides automatic RAM management and improved performance compared to Auto Tiering.

{{<note>}}
For best performance, use NVMe (non-volatile memory express) SSDs.
{{</note>}}

## Redis Flex vs Auto Tiering

The earlier implementation of Redis Flex is called Auto Tiering, which is available in Redis versions earlier than 8.0. 

The operator automatically selects the appropriate implementation based on your Redis version:

- **Versions 7.22.2-22 and earlier:** Auto Tiering
- **Versions 8.0.2-2 and later:** Redis Flex

Redis Flex differs from Auto Tiering in the following ways:

**Redis Flex (8.0.2-2 and later)**

- Storage engine: Speedb only
- RAM management: Automatic. Redis manages RAM allocation internally.
- Configuration: `rofRamSize` isn't validated with minimum ratio requirements.
- Redis versions: Redis 8.0 and later

**Auto Tiering ( 7.22.2-22 and earlier)**

- Storage engine: RocksDB or Speedb
- RAM management: Manual. Requires explicit `rofRamSize` configuration.
- Validation: `rofRamSize` must be at least 10% of `memorySize` and can't exceed `memorySize`.
- Redis versions: Redis versions earlier than 8.0

The operator doesn't support Redis 7.4 preview for Redis Flex. Redis 7.4 databases use Auto Tiering regardless of cluster policy. To use Redis Flex, upgrade to Redis 8.0 or later.

## Prerequisites

Before you create your Redis clusters or databases, ensure that your SSDs meet the following requirements:

- [Locally attached to worker nodes in your Kubernetes cluster](https://kubernetes.io/docs/concepts/storage/volumes/#local)
- Formatted and mounted on the nodes that run Redis Enterprise pods
- Dedicated to Redis Flex and not shared with other parts of the database (for example, durability or binaries)
- [Provisioned as local persistent volumes](https://kubernetes.io/docs/concepts/storage/volumes/#local)
  - You can use a [local volume provisioner](https://github.com/kubernetes-sigs/sig-storage-local-static-provisioner/blob/master/README.md) to provision volumes [dynamically](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#dynamic).
- Configured with a [StorageClass](https://kubernetes.io/docs/concepts/storage/storage-classes/#local) resource that has a unique name

For more information about node storage, see [Node persistent and ephemeral storage]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}).

## Create a Redis Enterprise cluster

To deploy a Redis Enterprise cluster (REC) with Redis Flex, specify the following fields in the `redisOnFlashSpec` section of your [REC custom resource]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specredisonflashspec" >}}):

- `enabled: true` - Enables Redis Flex
- `bigStoreDriver: speedb` - Sets the flash storage driver
- `storageClassName` - Specifies the storage class name
- `flashDiskSize` - Sets the minimum flash disk size

{{<warning>}}
Redis Flex doesn't support PVC expansion. Do not enable `enablePersistentVolumeResize` in the REC `persistentSpec` if you use `redisOnFlashSpec`. Enabling both will cause conflicts.
{{</warning>}}

The following example shows a Redis Enterprise cluster custom resource with these fields:

```yaml
apiVersion: app.redislabs.com/v1
kind: RedisEnterpriseCluster
metadata:
  name: "rec"
  labels:
    app: redis-enterprise
spec:
  nodes: 3
  redisOnFlashSpec:
    enabled: true
    bigStoreDriver: speedb        # Only 'speedb' is suitable for Redis Flex
    storageClassName: local-scsi
    flashDiskSize: 100G
```

{{<note>}}

- Set the `enabled` field to `true`.
- Use `bigStoreDriver: speedb` for Redis Flex support on Redis 8.0 and later.
- The `flashStorageEngine` field is deprecated. Use `bigStoreDriver` instead.

{{</note>}}

## Create a Redis Enterprise database

By default, new databases use RAM only. To create a Redis Enterprise database (REDB) that uses Redis Flex and takes advantage of locally attached SSDs, set `isRof` to `true`.

Specify the following fields in the REDB custom resource:

- `isRof: true` - Enables Redis Flex
- `redisVersion` - Set to `"8.0"` or later
- `memorySize` - Defines the total combined memory size (RAM + flash)
- `rofRamSize` - (Optional) Defines the RAM capacity for the database

The following example shows a REDB custom resource:

```YAML
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: redis-flex-db
spec:
  redisEnterpriseCluster:
    name: rec
  isRof: true
  redisVersion: "8.0"
  memorySize: 2GB
  rofRamSize: 0.5GB
```

{{< note >}}
Redis Flex automatically manages RAM allocation. You can specify `rofRamSize`, but it isn't subject to the 10% minimum ratio requirement that applies to Auto Tiering. The operator doesn't validate or enforce minimum RAM ratios for Redis 8.0 and later databases.
{{< /note >}}

## Upgrade from Auto Tiering to Redis Flex

When you upgrade a database from a Redis version earlier than 8.0 to Redis 8.0 or later, Redis Server automatically migrates the database from Auto Tiering to Redis Flex. The operator detects this migration and makes the following changes:

1. Stops validating the `rofRamSize` ratio requirement.
2. Stops reconciling the `bigstore_ram_size` field to avoid configuration drift.
3. Continues to preserve the database configuration.

### Example upgrade scenario

The following example shows how to upgrade a database from Auto Tiering to Redis Flex:

1. Create a database on Redis 7.2 with `rofRamSize: 200MB`.
2. Upgrade the database to Redis 8.0 by updating `spec.redisVersion` to `"8.0"`.
3. Redis Server automatically converts the database to Redis Flex.
4. The operator detects the conversion and adapts its reconciliation behavior.
5. Redis now manages the `rofRamSize` field automatically. You can keep the field in the spec for backward compatibility.
