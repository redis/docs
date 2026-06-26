---
title: Get started with Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure Flex on your Redis Enterprise cluster for Kubernetes.
hideListLinks: true
linkTitle: Get started
weight: 20
aliases: /operate/kubernetes/re-clusters/redis-flex/
---

{{<note>}}
This page applies to Redis database version 7.4 and earlier using Auto Tiering. If you use version 8.0 or later, see [Redis Flex](https://redis.io/docs/latest/operate/kubernetes/flex/).
{{</note>}}

Flex extends your database capacity by combining RAM and flash (SSD) storage. This tiered architecture keeps frequently accessed (hot) data in RAM for sub-millisecond latency while storing less active (warm) data on flash to reduce costs and increase capacity.

## Prerequisites

Before you begin, verify that you have:

- Redis Enterprise for Kubernetes version 8.0.2-2 or later installed
- A running `RedisEnterpriseCluster` (REC) resource
- Redis database version 7.4 or later
- Locally attached NVMe SSDs on your worker nodes
- A StorageClass configured for flash storage with a unique name

For hardware requirements and sizing guidelines, see [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}).

## Configure the REC for Flex

To enable Flex, configure your `RedisEnterpriseCluster` (REC) resource with flash storage settings. Add the [`redisOnFlashSpec`]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specredisonflashspec">}}) section to your REC specification.

Key fields in `redisOnFlashSpec`:

| Field                   | Description                                      |
|-------------------------|--------------------------------------------------|
| `enabled`               | Set to `true` to enable Flex.                    |
| `flashStorageClassName` | Name of the StorageClass for flash storage.      |
| `flashDiskSize`         | Size of the flash storage per node.              |
| `storageEngine`         | Storage engine. Set to `speedb` for Flex.        |

For all available fields, see the [REC API reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specredisonflashspec">}}).

{{<warning>}}
PVC expansion is not supported when using Flex. Do not enable `enablePersistentVolumeResize` in the REC `persistentSpec` if you are using `redisOnFlashSpec` as this will result in conflicts.
{{</warning>}}

1. Create a REC specification file with flash storage settings similar to the following example:

    ```yaml
    apiVersion: app.redislabs.com/v1
    kind: RedisEnterpriseCluster
    metadata:
      name: rec
    spec:
      nodes: 3
      redisOnFlashSpec:
        enabled: true
        flashStorageClassName: local-flash
        flashDiskSize: 100Gi
        storageEngine: speedb
    ```

1. Apply the REC configuration:

    ```sh
    kubectl apply -f rec.yaml
    ```

1. Verify that the cluster is ready:

    ```sh
    kubectl get rec
    ```

## Create a Flex database

After you configure the cluster, create a `RedisEnterpriseDatabase` (REDB) resource with Flex enabled.

Key fields in the REDB:

| Field        | Description                                            |
|--------------|--------------------------------------------------------|
| `memorySize` | Total database size (RAM + flash).                     |
| `isRof`      | Set to `true` to enable Flex for this database.        |
| `rofRamSize` | Amount of RAM allocated to the database.               |

For all available fields, see the [REDB API reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api">}}).

1. Create a database specification file with `isRof` set to `true` similar to the following example:

    ```yaml
    apiVersion: app.redislabs.com/v1alpha1
    kind: RedisEnterpriseDatabase
    metadata:
      name: flex-db
    spec:
      memorySize: 10Gi
      isRof: true
      rofRamSize: 2Gi
    ```

1. Apply the REDB:

    ```sh
    kubectl apply -f redb.yaml
    ```

1. Verify the database status:

    ```sh
    kubectl get redb
    ```

## Verify Flex is active

To confirm that Flex is working:

1. Check the database status:

    ```sh
    kubectl get redb <database-name> -o yaml
    ```

2. Look for `isRof: true` in the status section.

3. Connect to the database and verify that data operations work correctly.

## Next steps

- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn how to scale volume, throughput, and infrastructure.
- [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}): Review sizing guidelines and best practices.
