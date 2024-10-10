---
Title: Redis Enterprise for Kubernetes architecture
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Overview of the architecture and components of Redis Enterprise for Kubernetes.
hideListLinks: true
linkTitle: Architecture
weight: 1
---

Redis Enterprise for Kubernetes gives you the speed and durability of [Redis Enterprise](https://redis.io/redis-enterprise/advantages/), with the flexibility and ease of use Kubernetes (K8s) provides. Redis Enterprise for Kubernetes uses a custom operator and custom controllers to bring the best of Redis Enterprise to Kubernetes platforms.

The image below illustrates the components of a single namespace, three node deployment.

{{< image filename="/images/k8s/k8s-arch-v4.png" >}}

## Operator

An operator is a custom extension of the Kubernetes API designed to manage complex, stateful processes and resources. The Redis Enterprise operator uses controllers to manage Redis Enterprise’s custom resources (CRs), ensuring that these resources are continuously monitored and maintained.

## Namespace

The Redis Enterprise operator is deployed within a namespace. Each namespace can host only one operator and one RedisEnterpriseCluster instance. Namespaces create a logical boundaries between resources, allowing organization and security. Some resources in your deployment are limited to a namespace, while others are cluster-wide.

Redis Enterprise for Kubernetes supports multi-namespace deployments, meaning databases in multiple namespaces can be monitored by a single operator.

## Custom resources

Custom resources (CRs) extend the Kubernetes API, enabling users to manage Redis databases the Kubernetes way. Custom resources are created and managed using YAML configuration files.

This [declarative configuration approach](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/) allows you to specify the desired state for your resources, and the operator makes the necessary changes to achieve that state. This simplifies installation, upgrades, and scaling both vertically and horizontally.

The operator continuously monitors CRs for changes, automatically reconciling any differences between the desired state you specified in your YAML configuration file and the actual state of your resources.

## Custom resource definitions

A custom resource definition (CRD) is a cluster-wide resource that specifies which settings can be configured via custom resource files. Any setting not defined by the CRD is not managed by the operator. Changes to these unmanaged settings can still be made using standard Redis Enterprise Software methods.

For settings managed by the operator, any changes made outside of the CR YAML files (e.g., through the management UI) will be overwritten by the operator. Ensure that all operator-managed settings are updated using the CR YAML files to prevent conflicts.

## RedisEnterpriseCluster REC

A Redis Enterprise cluster is a set of Redis Enterprise nodes pooling resources. Each node is capable of running multiple Redis instances (shards).

{{< image filename="/images/k8s/k8s-node-arch.png">}}

A Redis cluster is created an managed by the RedisEnterpriseCluster (REC) custom resource. Changes to the REC YAML configuration prompt the operator to make changes to the cluster.The REC is required for both standard databases (REDB) and Active-Active databases (REAADB).

See the [RedisEnterpriseCluster (REC) API Reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api">}}) for a full list of fields and settings.

## RedisEnterpriseDatabase REDB

A Redis Enterprise database is a logical entity that manages your entire dataset across multiple Redis instances (shards). A Redis instance is a single-threaded database process (commonly referred to as a shard).

Redis databases are created and managed by the RedisEnterpriseDatabase (REDB) custom resource. Changes to the REDB YAML configuration file prompt the operator to make changes to the database. See the [RedisEnterpriseDatabase (REDB) API Reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api">}}) for a full list of fields and settings.

A database can be managed by an operator in the same namespace, or a different namespace. See []"Flexible deployment"]({{<relref "/operate/kubernetes/architecture/deployment-options">}}) options and []"Manage databases in multiple namespaces"]({{<relref "/operate/kubernetes/re-clusters/multi-namespace">}}) for more information.

## Active-Active databases

## RedisEnterpriseRemoteCluster RERC

## RedisEnterpriseActiveActiveDatabase REAADB

## Services Rigger

## Security

secrets

## Storage

PVCs, network attached

## Networking

ingress and ingressorRoutes

## Metrics

Promethius service