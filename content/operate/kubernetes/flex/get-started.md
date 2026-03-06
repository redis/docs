---
title: Get started with Redis Flex on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure Redis Flex on your Redis Enterprise cluster for Kubernetes.
hideListLinks: true
linkTitle: Get started
weight: 20
---

This guide shows you how to configure Redis Flex on your Redis Enterprise cluster for Kubernetes.

## Prerequisites

Before you begin, verify that you have:

- Redis Enterprise for Kubernetes version 8.0.2-2 or later installed
- A running `RedisEnterpriseCluster` (REC) resource
- Locally attached NVMe SSDs on your worker nodes
- A StorageClass configured for Flash storage

For hardware requirements and sizing guidelines, see [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}).

## Configure the cluster for Redis Flex

To enable Redis Flex, configure your `RedisEnterpriseCluster` (REC) resource with Flash storage settings.

### Step 1: Create a StorageClass for Flash storage

Create a StorageClass that references your locally attached SSDs.

Key fields in the StorageClass:

| Field               | Description                                               |
|---------------------|-----------------------------------------------------------|
| `provisioner`       | Set to `kubernetes.io/no-provisioner` for local storage.  |
| `volumeBindingMode` | Set to `WaitForFirstConsumer` for local volumes.          |

### Step 2: Configure Flash storage in the REC

Add the `redisOnFlashSpec` section to your REC specification.

Key fields in `redisOnFlashSpec`:

| Field                   | Description                                      |
|-------------------------|--------------------------------------------------|
| `enabled`               | Set to `true` to enable Redis Flex.              |
| `flashStorageClassName` | Name of the StorageClass for Flash storage.      |
| `flashDiskSize`         | Size of the Flash storage per node.              |
| `storageEngine`         | Storage engine. Set to `speedb` for Redis Flex.  |

### Step 3: Apply the configuration

1. Apply the updated REC configuration:

    ```sh
    kubectl apply -f rec.yaml
    ```

2. Verify that the cluster is ready:

    ```sh
    kubectl get rec
    ```

## Create a Redis Flex database

After you configure the cluster, create a `RedisEnterpriseDatabase` (REDB) resource with Redis Flex enabled.

### Configure the REDB

Create a database specification with `isRof` set to `true`.

Key fields in the REDB:

| Field        | Description                                            |
|--------------|--------------------------------------------------------|
| `memorySize` | Total database size (RAM + Flash).                     |
| `isRof`      | Set to `true` to enable Redis Flex for this database.  |
| `rofRamSize` | Amount of RAM allocated to the database.               |

### Apply the database configuration

1. Apply the REDB:

    ```sh
    kubectl apply -f redb.yaml
    ```

2. Verify the database status:

    ```sh
    kubectl get redb
    ```

## Verify Redis Flex is active

To confirm that Redis Flex is working:

1. Check the database status:

    ```sh
    kubectl get redb <database-name> -o yaml
    ```

2. Look for `isRof: true` in the status section.

3. Connect to the database and verify that data operations work correctly.

## Next steps

- [Scale your deployment]({{< relref "/operate/kubernetes/flex/scale" >}}): Learn how to scale volume, throughput, and infrastructure.
- [Plan your deployment]({{< relref "/operate/kubernetes/flex/plan" >}}): Review sizing guidelines and best practices.
